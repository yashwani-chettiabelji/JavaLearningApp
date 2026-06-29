// Theme Toggle Logic
const themeBtn = document.getElementById('theme-toggle');
const html = document.documentElement;

themeBtn.addEventListener('click', () => {
    if (html.getAttribute('data-theme') === 'light') {
        html.setAttribute('data-theme', 'dark');
        themeBtn.textContent = '☀️ Light Mode';
    } else {
        html.setAttribute('data-theme', 'light');
        themeBtn.textContent = '🌙 Dark Mode';
    }
});

// Quiz Evaluation Logic
const checkQuiz = () => {
    let score = 0;
    // Added answers for q4 (String is not primitive) and q5 (int is 32-bit)
    const answers = { q1: "b", q2: "c", q3: "a", q4: "b", q5: "c" };
    const totalQuestions = Object.keys(answers).length;

    Object.keys(answers).forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        const container = document.getElementById(`${q}-container`);
        
        if (selected) {
            if (selected.value === answers[q]) {
                score++;
                container.style.borderColor = "#22c55e"; // Green for correct
            } else {
                container.style.borderColor = "#ef4444"; // Red for incorrect
            }
        } else {
            container.style.borderColor = "#ef4444"; // Red if skipped
        }
    });

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `You scored ${score} out of ${totalQuestions}! 🎉`;
    
    // Dynamic color based on score
    if (score === totalQuestions) {
        resultDiv.style.color = "#22c55e";
    } else if (score >= 3) {
        resultDiv.style.color = "#f59e0b";
    } else {
        resultDiv.style.color = "#ef4444";
    }
};