let interviewQuestions = {};

async function loadQuestionData() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Failed to load questions');
        }
        interviewQuestions = await response.json();
        loadQuestions();
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('questionsContainer').innerHTML = 
            '<div class="alert alert-danger">Failed to load interview questions. Please try refreshing the page.</div>';
    }
}

function createQuestionCard(question, answer, category) {
    return `
        <div class="question-card card p-3" data-category="${category}">
            <div class="question">
                <h5>${question}</h5>
                <button class="btn btn-primary btn-sm toggle-answer">Show Answer</button>
            </div>
            <div class="answer">
                ${answer}
            </div>
        </div>
    `;
}

function loadQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    Object.entries(interviewQuestions).forEach(([category, questions]) => {
        questions.forEach(q => {
            container.innerHTML += createQuestionCard(q.question, q.answer, category);
        });
    });

    // Add event listeners to toggle buttons
    document.querySelectorAll('.toggle-answer').forEach(button => {
        button.addEventListener('click', function() {
            const answer = this.parentElement.nextElementSibling;
            answer.classList.toggle('show-answer');
            this.textContent = answer.classList.contains('show-answer') ? 'Hide Answer' : 'Show Answer';
        });
    });
}

// Filter questions by category
document.getElementById('categoryFilter').addEventListener('change', function() {
    const selectedCategory = this.value;
    const cards = document.querySelectorAll('.question-card');
    
    cards.forEach(card => {
        if (selectedCategory === 'all' || card.dataset.category === selectedCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Search functionality
document.getElementById('searchInput').addEventListener('input', function() {
    const searchText = this.value.toLowerCase();
    const cards = document.querySelectorAll('.question-card');
    
    cards.forEach(card => {
        const question = card.querySelector('h5').textContent.toLowerCase();
        if (question.includes(searchText)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Initial load
document.addEventListener('DOMContentLoaded', loadQuestionData); 