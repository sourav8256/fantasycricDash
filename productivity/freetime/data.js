const interviewQuestions = {
    javascript: [
        {
            question: "What is closure in JavaScript?",
            answer: "A closure is the combination of a function and the lexical environment within which that function was declared. This environment consists of any local variables that were in-scope at the time the closure was created."
        },
        {
            question: "Explain event delegation",
            answer: "Event delegation is a technique where you attach an event listener to a parent element to handle events on its children, even those added dynamically. It's based on event bubbling and can improve performance."
        }
    ],
    react: [
        {
            question: "What is the Virtual DOM?",
            answer: "The Virtual DOM is a lightweight copy of the actual DOM. React uses it to improve performance by minimizing direct manipulation of the DOM. It compares the virtual DOM with the real DOM and updates only what's necessary."
        },
        {
            question: "Explain React hooks",
            answer: "Hooks are functions that allow you to use state and other React features in functional components. Common hooks include useState, useEffect, useContext, and useRef."
        }
    ],
    general: [
        {
            question: "What is REST?",
            answer: "REST (Representational State Transfer) is an architectural style for designing networked applications. It relies on stateless, client-server communication protocol, and is most commonly implemented using HTTP."
        }
    ],
    behavioral: [
        {
            question: "Tell me about a challenging project you worked on",
            answer: "When answering this, focus on: 1) The specific challenge, 2) Your approach to solving it, 3) The actions you took, 4) The outcome and what you learned."
        }
    ]
}; 