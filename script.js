// Theme Toggle Logic
const themeBtn = document.getElementById('theme-toggle');
const html = document.documentElement;

themeBtn.addEventListener('click', () => {
    if (html.getAttribute('data-theme') === 'light') {
        html.setAttribute('data-theme', 'dark');
        themeBtn.textContent = '☀️';
    } else {
        html.setAttribute('data-theme', 'light');
        themeBtn.textContent = '🌙';
    }
});

// Modal Logic and Data
const notesData = {
    "Variables": "Variables are containers for storing data values. In Java, every variable must be declared with a specific data type (e.g., <code>int score = 100;</code>).",
    "Data Types": "Java is statically typed. Primitive types include: <ul><li><code>int</code> (integers)</li><li><code>double</code> (decimals)</li><li><code>boolean</code> (true/false)</li><li><code>char</code> (single characters)</li></ul>",
    "Loops": "Loops execute a block of code as long as a specified condition is reached. <br><br>Types: <code>for</code> loop, <code>while</code> loop, and <code>do-while</code> loop.",
    "OOP Concepts": "Object-Oriented Programming principles: <ul><li><b>Encapsulation:</b> Hiding internal state.</li><li><b>Inheritance:</b> Creating new classes from existing ones.</li><li><b>Polymorphism:</b> One interface, multiple implementations.</li><li><b>Abstraction:</b> Hiding complex implementation details.</li></ul>",
    "Arrays": "An array is a container object that holds a fixed number of values of a single type. Example: <code>int[] numbers = {1, 2, 3};</code>",
    "Exceptions": "An exception is an unwanted event that disrupts the normal flow of the program. Handled using <code>try</code>, <code>catch</code>, and <code>finally</code> blocks.",
    "Methods": "A method is a block of code which only runs when it is called. You can pass data (parameters) into a method. Methods must be declared within a class.",
    "Collections": "The Collection framework provides an architecture to store and manipulate a group of objects. Includes Interfaces like Set, List, Queue, and Deque.",
    "Multithreading": "Multithreading is a Java feature that allows concurrent execution of two or more parts of a program for maximum utilization of CPU."
};

const modal = document.getElementById('note-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

function openModal(topic) {
    modalTitle.textContent = topic;
    modalBody.innerHTML = notesData[topic] || "Notes coming soon!";
    modal.style.display = "flex";
}

function closeModal() {
    modal.style.display = "none";
}

// Close modal when clicking outside of the box
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Quiz Evaluation Logic
const checkQuiz = () => {
    let score = 0;
    const answers = { q1: "b", q2: "c", q3: "a", q4: "b", q5: "c" };
    const totalQuestions = Object.keys(answers).length;

    Object.keys(answers).forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        const container = document.getElementById(`${q}-container`);
        
        if (selected) {
            if (selected.value === answers[q]) {
                score++;
                container.style.borderColor = "#22c55e"; 
            } else {
                container.style.borderColor = "#ef4444"; 
            }
        } else {
            container.style.borderColor = "#ef4444"; 
        }
    });

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `You scored ${score} out of ${totalQuestions}! 🎉`;
    
    if (score === totalQuestions) {
        resultDiv.style.color = "#22c55e";
    } else if (score >= 3) {
        resultDiv.style.color = "#f59e0b";
    } else {
        resultDiv.style.color = "#ef4444";
    }
};