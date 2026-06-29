const checkQuiz = () => {
    let score = 0;
    const answers = { q1: "b", q2: "c", q3: "a" };

    ['q1', 'q2', 'q3'].forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        const container = document.getElementById(`${q}-container`);
        
        if (selected) {
            if (selected.value === answers[q]) {
                score++;
                container.style.borderColor = "#22c55e"; // Green 
            } else {
                container.style.borderColor = "#ef4444"; // Red 
            }
        } else {
            container.style.borderColor = "#ef4444"; // Red if skipped
        }
    });

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `You scored ${score} out of 3! 🎉`;
    resultDiv.style.color = score === 3 ? "#22c55e" : (score > 0 ? "#f59e0b" : "#ef4444");
};