'use strict';

(function () {
    const STORAGE_KEYS = {
        theme: 'javaAppTheme',
        visited: 'javaAppVisitedTopics'
    };

    const PASS_THRESHOLD = 0.6;
    const SEARCH_DEBOUNCE_MS = 150;

    const { topics, quiz, version } = window.APP_DATA;

    const dom = {
        html: document.documentElement,
        body: document.body,
        main: document.getElementById('main-content'),
        themeBtn: document.getElementById('theme-toggle'),
        themeColorMeta: document.querySelector('meta[name="theme-color"]'),
        topicsGrid: document.getElementById('topics-grid'),
        topicSearch: document.getElementById('topic-search'),
        searchEmpty: document.getElementById('search-empty'),
        progressText: document.getElementById('progress-text'),
        progressFill: document.getElementById('progress-fill'),
        progressBar: document.getElementById('progress-bar'),
        resetProgressBtn: document.getElementById('reset-progress'),
        modal: document.getElementById('note-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        closeBtn: document.getElementById('modal-close'),
        quizForm: document.getElementById('quiz-form'),
        quizQuestions: document.getElementById('quiz-questions'),
        resultDiv: document.getElementById('result'),
        retakeBtn: document.getElementById('retake-btn'),
        topicCountLabel: document.getElementById('topic-count-label'),
        quizCountLabel: document.getElementById('quiz-count-label'),
        appVersion: document.getElementById('app-version')
    };

    let lastFocusedCard = null;
    let searchTimer = null;
    let cardElements = [];

    const storage = {
        getString(key) {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        },
        setString(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch {
                return false;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch {
                return false;
            }
        },
        getJSON(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch {
                return fallback;
            }
        },
        setJSON(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        }
    };

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getVisitedTopics() {
        const stored = storage.getJSON(STORAGE_KEYS.visited, []);
        return Array.isArray(stored) ? stored : [];
    }

    function saveVisitedTopics(list) {
        storage.setJSON(STORAGE_KEYS.visited, list);
    }

    function getCardById(topicId) {
        return cardElements.find((card) => card.dataset.topic === topicId) || null;
    }

    function updateThemeMeta(theme) {
        if (dom.themeColorMeta) {
            dom.themeColorMeta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f89820');
        }
    }

    function applyTheme(theme, persist) {
        dom.html.setAttribute('data-theme', theme);
        dom.themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        dom.themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        updateThemeMeta(theme);
        if (persist) {
            storage.setString(STORAGE_KEYS.theme, theme);
        }
    }

    function initTheme() {
        const saved = storage.getString(STORAGE_KEYS.theme);
        if (saved === 'light' || saved === 'dark') {
            applyTheme(saved, false);
            return;
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light', false);
    }

    function updateProgress() {
        const total = topics.length;
        const visited = new Set(getVisitedTopics());
        const viewed = topics.filter((topic) => visited.has(topic.id)).length;
        const percent = total ? (viewed / total) * 100 : 0;

        dom.progressText.textContent = `${viewed} of ${total} topics viewed`;
        dom.progressFill.style.width = `${percent}%`;
        dom.progressBar.setAttribute('aria-valuemax', String(total));
        dom.progressBar.setAttribute('aria-valuenow', String(viewed));
    }

    function markTopicVisited(topicId) {
        const visited = getVisitedTopics();
        if (!visited.includes(topicId)) {
            visited.push(topicId);
            saveVisitedTopics(visited);
        }
        const card = getCardById(topicId);
        if (card) {
            card.classList.add('visited');
            card.setAttribute('aria-label', `${card.querySelector('h3').textContent} — viewed`);
        }
        updateProgress();
    }

    function restoreVisitedState() {
        const visited = new Set(getVisitedTopics());
        topics.forEach((topic) => {
            if (visited.has(topic.id)) {
                const card = getCardById(topic.id);
                if (card) {
                    card.classList.add('visited');
                    card.setAttribute('aria-label', `${topic.title} — viewed`);
                }
            }
        });
        updateProgress();
    }

    function resetProgress() {
        if (!window.confirm('Reset all topic progress? This cannot be undone.')) {
            return;
        }
        storage.remove(STORAGE_KEYS.visited);
        cardElements.forEach((card) => {
            card.classList.remove('visited');
            const title = card.querySelector('h3').textContent;
            card.setAttribute('aria-label', `Open notes: ${title}`);
        });
        updateProgress();
    }

    function enhanceCodeBlocks(container) {
        container.querySelectorAll('.code-example').forEach((block) => {
            if (block.querySelector('.copy-btn')) {
                return;
            }
            const codeText = block.textContent.trim();
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.setAttribute('aria-label', 'Copy code to clipboard');
            btn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(codeText);
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                    }, 2000);
                } catch {
                    btn.textContent = 'Failed';
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                    }, 2000);
                }
            });
            block.appendChild(btn);
        });
    }

    function setModalOpen(isOpen) {
        dom.modal.classList.toggle('modal--open', isOpen);
        dom.modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        dom.body.classList.toggle('modal-open', isOpen);
        if (dom.main) {
            dom.main.inert = isOpen;
        }
    }

    function openModal(topicId, triggerCard) {
        const topic = topics.find((item) => item.id === topicId);
        if (!topic) {
            return;
        }

        lastFocusedCard = triggerCard || getCardById(topicId);
        dom.modalTitle.textContent = topic.title;
        dom.modalBody.innerHTML = topic.content || '<p>Notes coming soon.</p>';
        enhanceCodeBlocks(dom.modalBody);
        setModalOpen(true);
        markTopicVisited(topicId);
        dom.closeBtn.focus();
    }

    function closeModal() {
        setModalOpen(false);
        if (lastFocusedCard) {
            lastFocusedCard.focus();
        }
    }

    function trapFocus(event) {
        if (!dom.modal.classList.contains('modal--open') || event.key !== 'Tab') {
            return;
        }
        const focusable = dom.modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const elements = Array.from(focusable).filter((el) => !el.disabled);
        if (elements.length === 0) {
            return;
        }
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function renderTopics() {
        const fragment = document.createDocumentFragment();

        topics.forEach((topic) => {
            const card = document.createElement('article');
            card.className = 'card';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.dataset.topic = topic.id;
            card.setAttribute('aria-label', `Open notes: ${topic.title}`);

            const heading = document.createElement('h3');
            heading.textContent = topic.title;

            const summary = document.createElement('p');
            summary.textContent = topic.summary;

            card.append(heading, summary);
            fragment.appendChild(card);
        });

        dom.topicsGrid.appendChild(fragment);
        cardElements = Array.from(dom.topicsGrid.querySelectorAll('.card'));

        cardElements.forEach((card) => {
            const topicId = card.dataset.topic;

            card.addEventListener('click', () => openModal(topicId, card));
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openModal(topicId, card);
                }
            });
        });
    }

    function filterTopics() {
        const query = dom.topicSearch.value.trim().toLowerCase();
        let visibleCount = 0;

        cardElements.forEach((card) => {
            const topic = topics.find((item) => item.id === card.dataset.topic);
            const haystack = `${topic.title} ${topic.summary}`.toLowerCase();
            const matches = query === '' || haystack.includes(query);
            card.classList.toggle('hidden', !matches);
            if (matches) {
                visibleCount += 1;
            }
        });

        dom.searchEmpty.hidden = visibleCount > 0 || query === '';
        dom.searchEmpty.textContent = query
            ? `No topics match "${dom.topicSearch.value.trim()}".`
            : '';
    }

    function onSearchInput() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(filterTopics, SEARCH_DEBOUNCE_MS);
    }

    function renderQuiz() {
        const fragment = document.createDocumentFragment();

        quiz.forEach((question, index) => {
            const fieldset = document.createElement('fieldset');
            fieldset.className = 'question';
            fieldset.id = `${question.id}-container`;

            const legend = document.createElement('legend');
            legend.className = 'question-text';
            if (question.html) {
                legend.innerHTML = `${index + 1}. ${question.text}`;
            } else {
                legend.textContent = `${index + 1}. ${question.text}`;
            }

            fieldset.appendChild(legend);

            question.options.forEach((option, optionIndex) => {
                const inputId = `${question.id}-opt-${optionIndex}`;
                const label = document.createElement('label');
                label.className = 'option-label';
                label.htmlFor = inputId;

                const input = document.createElement('input');
                input.type = 'radio';
                input.name = question.id;
                input.id = inputId;
                input.value = option.value;
                input.required = false;

                label.append(input, document.createTextNode(` ${option.label}`));
                fieldset.appendChild(label);
            });

            fragment.appendChild(fieldset);
        });

        dom.quizQuestions.appendChild(fragment);
    }

    function clearQuestionFeedback() {
        dom.quizQuestions.querySelectorAll('.question-feedback').forEach((el) => el.remove());
    }

    function resetQuizStyles() {
        dom.quizQuestions.querySelectorAll('.question').forEach((container) => {
            container.classList.remove('question--correct', 'question--incorrect', 'question--unanswered');
        });
    }

    function retakeQuiz() {
        dom.quizForm.reset();
        clearQuestionFeedback();
        resetQuizStyles();
        dom.resultDiv.textContent = '';
        dom.resultDiv.className = 'result-box';
        dom.retakeBtn.hidden = true;
        dom.quizForm.querySelector('button[type="submit"]').focus();
    }

    function checkQuiz() {
        clearQuestionFeedback();
        resetQuizStyles();

        const unanswered = quiz.filter((question) => !dom.quizForm.querySelector(`input[name="${question.id}"]:checked`));
        if (unanswered.length > 0) {
            dom.resultDiv.textContent = `Please answer all ${quiz.length} questions before submitting.`;
            dom.resultDiv.className = 'result-box result-box--error';
            unanswered.forEach((question) => {
                document.getElementById(`${question.id}-container`).classList.add('question--unanswered');
            });
            dom.retakeBtn.hidden = true;
            return;
        }

        let score = 0;

        quiz.forEach((question) => {
            const selected = dom.quizForm.querySelector(`input[name="${question.id}"]:checked`);
            const container = document.getElementById(`${question.id}-container`);

            if (selected.value === question.answer) {
                score += 1;
                container.classList.add('question--correct');
            } else {
                container.classList.add('question--incorrect');
                const feedback = document.createElement('div');
                feedback.className = 'question-feedback';
                feedback.innerHTML = `<strong>Correct answer:</strong> ${escapeHtml(question.correctText)}<br>${escapeHtml(question.explanation)}`;
                container.appendChild(feedback);
            }
        });

        dom.resultDiv.textContent = `You scored ${score} out of ${quiz.length}!`;
        dom.resultDiv.className = 'result-box';

        if (score === quiz.length) {
            dom.resultDiv.classList.add('result-box--success');
        } else if (score >= Math.ceil(quiz.length * PASS_THRESHOLD)) {
            dom.resultDiv.classList.add('result-box--warning');
        } else {
            dom.resultDiv.classList.add('result-box--error');
        }

        dom.retakeBtn.hidden = false;
    }

    function updateStaticLabels() {
        if (dom.topicCountLabel) {
            dom.topicCountLabel.textContent = String(topics.length);
        }
        if (dom.quizCountLabel) {
            dom.quizCountLabel.textContent = String(quiz.length);
        }
        if (dom.appVersion) {
            dom.appVersion.textContent = `v${version}`;
        }
    }

    function bindEvents() {
        dom.themeBtn.addEventListener('click', () => {
            const next = dom.html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            applyTheme(next, true);
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
            if (!storage.getString(STORAGE_KEYS.theme)) {
                applyTheme(event.matches ? 'dark' : 'light', false);
            }
        });

        dom.closeBtn.addEventListener('click', closeModal);
        dom.modal.addEventListener('click', (event) => {
            if (event.target === dom.modal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && dom.modal.classList.contains('modal--open')) {
                event.preventDefault();
                closeModal();
            }
            trapFocus(event);
        });

        dom.topicSearch.addEventListener('input', onSearchInput);
        dom.topicSearch.addEventListener('search', filterTopics);

        if (dom.resetProgressBtn) {
            dom.resetProgressBtn.addEventListener('click', resetProgress);
        }

        dom.quizForm.addEventListener('submit', (event) => {
            event.preventDefault();
            checkQuiz();
        });

        dom.retakeBtn.addEventListener('click', retakeQuiz);
    }

    function init() {
        if (!window.APP_DATA) {
            console.error('APP_DATA not loaded.');
            return;
        }

        updateStaticLabels();
        renderTopics();
        renderQuiz();
        restoreVisitedState();
        initTheme();
        bindEvents();
        setModalOpen(false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
