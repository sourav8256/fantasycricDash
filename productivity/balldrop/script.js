const upperChamber = document.getElementById('upperChamber');
const lowerChamber = document.getElementById('lowerChamber');
const resetBtn = document.getElementById('resetBtn');
const timeDisplay = document.getElementById('timeLeft');
const settingsBtn = document.getElementById('settingsBtn');

let balls = [];
let totalBalls = 20;
let interval;
let timeLeft = getInitialInterval();
let isRunning = false;
let ballSize = 40;
let ballSpacing = 60;
let lastUpdateTime = null;

function getInitialInterval() {
    const savedSettings = localStorage.getItem('ballDropSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.dropInterval;
    }
    return 1;
}

function loadSettings() {
    const savedSettings = localStorage.getItem('ballDropSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        totalBalls = settings.totalBalls;
        timeLeft = settings.dropInterval;
        ballSize = settings.ballSize;
        ballSpacing = ballSize * 1.5;
        
        // Update ball styles
        const style = document.createElement('style');
        style.textContent = `
            .ball {
                width: ${ballSize}px;
                height: ${ballSize}px;
                background-color: ${settings.ballColor};
            }
        `;
        document.head.appendChild(style);
    }
}

function findEmptyPosition(chamber) {
    const columns = Math.floor(chamber.offsetWidth / ballSpacing);
    const maxRows = Math.floor(chamber.offsetHeight / ballSpacing);
    const positions = new Array(maxRows * columns).fill(false);
    
    // Mark occupied positions
    const balls = chamber.getElementsByClassName('ball');
    for (const ball of balls) {
        const left = parseInt(ball.style.left);
        const top = parseInt(ball.style.top);
        const col = Math.round((left - ballSize/2) / ballSpacing);
        const row = Math.round((top - (chamber === upperChamber ? 70 : 0)) / ballSpacing);
        const index = row * columns + col;
        if (index >= 0 && index < positions.length) {
            positions[index] = true;
        }
    }
    
    // Find first empty position from bottom-up
    for (let row = maxRows - 1; row >= 0; row--) {
        for (let col = 0; col < columns; col++) {
            const index = row * columns + col;
            if (!positions[index]) {
                return { row, col };
            }
        }
    }
    
    return null;
}

function createBall(chamber, index, isUpper = true) {
    const ball = document.createElement('div');
    ball.className = 'ball';
    const columns = Math.floor(chamber.offsetWidth / ballSpacing);
    
    if (isUpper) {
        const row = Math.floor(index / columns);
        const col = index % columns;
        ball.style.left = (col * ballSpacing + ballSize/2) + 'px';
        ball.style.top = (row * ballSpacing + 70) + 'px';
    } else {
        const emptyPos = findEmptyPosition(chamber);
        if (emptyPos) {
            ball.style.left = (emptyPos.col * ballSpacing + ballSize/2) + 'px';
            ball.style.top = (emptyPos.row * ballSpacing + ballSize/2) + 'px';
        } else {
            const row = Math.floor(index / columns);
            const col = index % columns;
            ball.style.left = (col * ballSpacing + ballSize/2) + 'px';
            ball.style.top = (row * ballSpacing + ballSize/2) + 'px';
        }
        
        ball.addEventListener('click', function() {
            returnBallToUpper(this);
        });
    }
    
    chamber.appendChild(ball);
    return ball;
}

function returnBallToUpper(ball) {
    const wasEmpty = balls.length === 0;
    const currentIndex = balls.length;
    ball.remove();
    const newBall = createBall(upperChamber, currentIndex);
    balls.push(newBall);
    
    const currentState = JSON.parse(localStorage.getItem('ballDropState') || '{}');
    const state = {
        remainingBalls: balls.length,
        timeLeft: getInitialInterval(),
        lastDropTime: wasEmpty ? Date.now() : currentState.lastDropTime,
        dropInterval: getInitialInterval()
    };
    localStorage.setItem('ballDropState', JSON.stringify(state));
    console.log('State updated in returnBallToUpper() - line 120:', state);
    
    timeLeft = getInitialInterval();
    timeDisplay.textContent = formatTime(timeLeft);
    startTimer();
}

function calculateStateAfterReopen() {
    const savedState = localStorage.getItem('ballDropState');
    if (savedState) {
        const state = JSON.parse(savedState);
        if (state.lastDropTime) {
            const dropInterval = state.dropInterval;
            
            // Calculate time since last drop
            const elapsedMs = Date.now() - state.lastDropTime;
            
            // Calculate time until next drop
            const msInInterval = elapsedMs % (dropInterval * 1000);
            const msUntilNextDrop = (dropInterval * 1000) - msInInterval;
            const secondsUntilNextDrop = Math.ceil(msUntilNextDrop / 1000);
            
            // Calculate drops that should have occurred
            const dropCount = Math.floor(elapsedMs / (dropInterval * 1000));
            const remainingBalls = Math.max(0, state.remainingBalls - dropCount);
            
            return {
                remainingBalls: remainingBalls,
                timeLeft: secondsUntilNextDrop,
                lastDropTime: state.lastDropTime,  // Keep the original lastDropTime
                dropInterval: dropInterval
            };
        }
    }
    return null;
}

function saveState() {
    const state = {
        remainingBalls: balls.length,
        timeLeft: timeLeft,
        lastDropTime: Date.now(),
        dropInterval: getInitialInterval()
    };
    localStorage.setItem('ballDropState', JSON.stringify(state));
    console.log('State updated in saveState() - line 200:', state);
}

function loadState() {
    const calculatedState = calculateStateAfterReopen();
    const savedState = calculatedState || JSON.parse(localStorage.getItem('ballDropState') || '{}');
    
    balls = [];
    upperChamber.innerHTML = '';
    lowerChamber.innerHTML = '';
    
    // Create balls in upper chamber
    for (let i = 0; i < (savedState.remainingBalls || totalBalls); i++) {
        const ball = createBall(upperChamber, i);
        balls.push(ball);
    }
    
    // Create balls in lower chamber
    for (let i = 0; i < (totalBalls - (savedState.remainingBalls || totalBalls)); i++) {
        createBall(lowerChamber, i, false);
    }

    timeLeft = savedState.timeLeft || getInitialInterval();
    timeDisplay.textContent = formatTime(timeLeft);

    if (balls.length > 0) {
        startTimer();
    }
}

function initializeBalls() {
    balls = [];
    upperChamber.innerHTML = '';
    lowerChamber.innerHTML = '';
    
    for (let i = 0; i < totalBalls; i++) {
        const ball = createBall(upperChamber, i);
        balls.push(ball);
    }
    startTimer();
}

function dropBall() {
    if (balls.length > 0) {
        const ball = balls.pop();
        ball.remove();
        const newBall = createBall(lowerChamber, totalBalls - balls.length - 1, false);
        saveState();
        console.log('State updated in dropBall() - line 220 after ball drop');
    }
    
    if (balls.length === 0) {
        clearInterval(interval);
        isRunning = false;
        saveState();
        console.log('State updated in dropBall() - line 227 when balls empty');
    }
}

function updateTimer() {
    timeLeft--;
    timeDisplay.textContent = formatTime(timeLeft);
    
    if (timeLeft === 0) {
        dropBall();
        timeLeft = getInitialInterval();
    }
}

function startTimer() {
    clearInterval(interval);
    if (balls.length > 0) {
        if (!localStorage.getItem('ballDropState')) {
            const initialState = {
                remainingBalls: balls.length,
                timeLeft: getInitialInterval(),
                lastDropTime: Date.now(),
                dropInterval: getInitialInterval()
            };
            localStorage.setItem('ballDropState', JSON.stringify(initialState));
            console.log('Initial state set in startTimer() - line 250:', initialState);
        }
        interval = setInterval(updateTimer, 1000);
    }
}

// Event Listeners
resetBtn.addEventListener('click', () => {
    clearInterval(interval);
    isRunning = false;
    timeLeft = getInitialInterval();
    timeDisplay.textContent = formatTime(timeLeft);
    localStorage.removeItem('ballDropState');
    console.log('State removed in reset button click - line 280');
    initializeBalls();
});

settingsBtn.addEventListener('click', () => {
    window.location.href = 'settings.html';
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (!isRunning) {
            loadState();
        }
    }, 250);
});

window.addEventListener('beforeunload', () => {
    saveState();
    console.log('State updated in beforeunload event - line 300');
});

// Load settings before initializing balls
window.addEventListener('load', () => {
    loadSettings();
    loadState();
});

// Add this helper function to format time
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} 