const upperChamber = document.getElementById('upperChamber');
const lowerChamber = document.getElementById('lowerChamber');
const resetBtn = document.getElementById('resetBtn');
const timeDisplay = document.getElementById('timeLeft');
const settingsBtn = document.getElementById('settingsBtn');
const addBallBtn = document.getElementById('addBallBtn');
const removeBallBtn = document.getElementById('removeBallBtn');

let balls = [];
let totalBalls = 20;
let interval;
let timeLeft = getInitialInterval();
let isRunning = false;
let ballSize = 40;
let ballSpacing = 60;
let lastUpdateTime = null;
let remainingBalls = totalBalls;

function getInitialInterval() {
    return getState().dropInterval;
}

function loadFromSettings() {
    const settings = getState();
    
    // Load settings
    totalBalls = settings.totalBalls;
    
    // Calculate remaining balls based on elapsed time
    if (settings.lastDropTime) {
        const elapsedMs = Date.now() - settings.lastDropTime;
        const dropInterval = settings.dropInterval * 1000; // convert to ms
        const dropsOccurred = Math.floor(elapsedMs / dropInterval);
        remainingBalls = Math.max(0, settings.remainingBalls - dropsOccurred);
    } else {
        remainingBalls = settings.remainingBalls ?? totalBalls;
    }

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
    
    // Calculate time until next drop
    if (settings.lastDropTime && remainingBalls > 0) {
        const elapsedMs = Date.now() - settings.lastDropTime;
        const dropInterval = settings.dropInterval * 1000;
        const msInCurrentInterval = elapsedMs % dropInterval;
        const msUntilNextDrop = dropInterval - msInCurrentInterval;
        timeLeft = Math.ceil(msUntilNextDrop / 1000);
    }
    
    // Render balls
    logRenderBalls('0002', remainingBalls, totalBalls);
    renderBalls(remainingBalls, totalBalls);

    // Save the new state
    setState({
        ...settings,
        remainingBalls,
        timeLeft,
        lastDropTime: remainingBalls === 0 ? null : settings.lastDropTime
    });
    
    timeDisplay.textContent = formatTime(timeLeft);

    if (remainingBalls > 0) {
        startTimer();
    }
    
    updateButtonStates();
}


function returnBallToUpper() {
    const wasEmpty = remainingBalls === 0;
    remainingBalls++;
    logRenderBalls('0001', remainingBalls, totalBalls);
    renderBalls(remainingBalls, totalBalls);
    
    const currentState = getState();
    const state = {
        remainingBalls: remainingBalls,
        timeLeft: getInitialInterval(),
        lastDropTime: wasEmpty ? Date.now() : currentState.lastDropTime,
        dropInterval: getInitialInterval()
    };
    setState(state);
    
    timeLeft = getInitialInterval();
    timeDisplay.textContent = formatTime(timeLeft);
    startTimer();
}

function dropBall() {
    if (remainingBalls > 0) {
        remainingBalls--;
        logRenderBalls('0003', remainingBalls, totalBalls);
        renderBalls(remainingBalls, totalBalls);
        setState({
            remainingBalls: remainingBalls,
            timeLeft: timeLeft,
            lastDropTime: timeLeft === getInitialInterval() ? Date.now() : getState().lastDropTime,
            dropInterval: getInitialInterval()
        });
    }
    
    if (remainingBalls === 0) {
        clearInterval(interval);
        isRunning = false;
        setState({
            remainingBalls: remainingBalls,
            timeLeft: timeLeft,
            lastDropTime: timeLeft === getInitialInterval() ? Date.now() : getState().lastDropTime,
            dropInterval: getInitialInterval()
        });
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
        const settings = getState();
        if (!settings.lastDropTime) {
            const initialState = {
                ...settings,
                timeLeft: getInitialInterval(),
                lastDropTime: Date.now(),
                dropInterval: getInitialInterval()
            };
            setState(initialState);
        }

        const dropInterval = getInitialInterval();
        const elapsedMs = Date.now() - settings.lastDropTime;
        const msInInterval = elapsedMs % (dropInterval * 1000);
        const msUntilNextDrop = (dropInterval * 1000) - msInInterval;
        timeLeft = Math.ceil(msUntilNextDrop / 1000);
        timeDisplay.textContent = formatTime(timeLeft);
        
        interval = setInterval(updateTimer, 1000);
    }
}

// Event Listeners
resetBtn.addEventListener('click', () => {
    clearInterval(interval);
    isRunning = false;
    timeLeft = getInitialInterval();
    timeDisplay.textContent = formatTime(timeLeft);
    setState(null);
    remainingBalls = totalBalls;
    logRenderBalls('0004', remainingBalls, totalBalls);
    renderBalls(remainingBalls, totalBalls);
    startTimer();
});

settingsBtn.addEventListener('click', () => {
    window.location.href = 'settings.html';
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (!isRunning) {
            loadFromSettings();
        }
    }, 250);
});

// Add near the top with other event listeners
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // App has become visible again
        loadFromSettings();
    }
});

// Load settings before initializing balls
window.addEventListener('load', () => {
    loadFromSettings();
});

// Add this helper function to format time
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function addBall() {
    const lowerBalls = lowerChamber.getElementsByClassName('ball');
    if (lowerBalls.length > 0 && remainingBalls < totalBalls) {
        remainingBalls++;
        logRenderBalls('0005', remainingBalls, totalBalls);
        renderBalls(remainingBalls, totalBalls);
        setState({
            remainingBalls: remainingBalls,
            timeLeft: timeLeft,
            lastDropTime: timeLeft === getInitialInterval() ? Date.now() : getState().lastDropTime,
            dropInterval: getInitialInterval()
        });
        
        if (!interval && remainingBalls === 1) {
            startTimer();
        }
    }
}

function removeBall() {
    if (remainingBalls > 0) {
        remainingBalls--;
        logRenderBalls('0006', remainingBalls, totalBalls);
        renderBalls(remainingBalls, totalBalls);
        setState({
            remainingBalls: remainingBalls,
            timeLeft: timeLeft,
            lastDropTime: timeLeft === getInitialInterval() ? Date.now() : getState().lastDropTime,
            dropInterval: getInitialInterval()
        });
        
        if (remainingBalls === 0) {
            clearInterval(interval);
            interval = null;
        }
    }
}

// Add event listeners
addBallBtn.addEventListener('click', addBall);
removeBallBtn.addEventListener('click', removeBall);

// Update the loadState function to enable/disable buttons based on ball count
function updateButtonStates() {
    const lowerBalls = lowerChamber.getElementsByClassName('ball');
    addBallBtn.disabled = lowerBalls.length === 0;
    removeBallBtn.disabled = remainingBalls === 0;
}

// Modify loadState function to include button state updates
const originalLoadState = loadFromSettings;
loadFromSettings = function() {
    originalLoadState.apply(this, arguments);
    updateButtonStates();
}

// Modify dropBall function to include button state updates
const originalDropBall = dropBall;
dropBall = function() {
    originalDropBall.apply(this, arguments);
    updateButtonStates();
}

// Add near the top with other state-related functions
function getState() {
    const savedSettings = localStorage.getItem('ballDropSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
        totalBalls: 20,
        remainingBalls: 20,
        timeLeft: 1,
        lastDropTime: Date.now(),
        dropInterval: 1,
        ballSize: 40,
        ballColor: '#2196F3'
    };
}

function setState(state) {
    if (state === null) {
        // Reset to defaults
        setState(getState());
        return;
    }
    
    // Preserve all settings when updating state
    const currentSettings = getState();
    const newSettings = {
        ...currentSettings,
        ...state
    };
    localStorage.setItem('ballDropSettings', JSON.stringify(newSettings));
}

// Update renderBalls function to handle all ball creation and positioning
function renderBalls(remainingBalls, totalBalls) {
    // Clear both chambers
    upperChamber.innerHTML = '';
    lowerChamber.innerHTML = '';
    balls = [];
    
    const createAndPositionBall = (chamber, index, isUpper) => {
        const ball = document.createElement('div');
        ball.className = 'ball';
        const columns = Math.floor(chamber.offsetWidth / ballSpacing);
        
        if (isUpper) {
            const row = Math.floor(index / columns);
            const col = index % columns;
            ball.style.left = (col * ballSpacing + ballSize/2) + 'px';
            ball.style.top = (row * ballSpacing + 70) + 'px';
        } else {
            const row = Math.floor(index / columns);
            const col = index % columns;
            ball.style.left = (col * ballSpacing + ballSize/2) + 'px';
            ball.style.top = (row * ballSpacing + ballSize/2) + 'px';
            ball.addEventListener('click', () => {
                returnBallToUpper();
            });
        }
        
        chamber.appendChild(ball);
        return ball;
    };
    
    // Create balls in upper chamber
    for (let i = 0; i < remainingBalls; i++) {
        const ball = createAndPositionBall(upperChamber, i, true);
        balls.push(ball);
    }
    
    // Create balls in lower chamber
    for (let i = 0; i < (totalBalls - remainingBalls); i++) {
        createAndPositionBall(lowerChamber, i, false);
    }
    
    updateButtonStates();
}

// Add at the top with other functions
function logRenderBalls(id, remainingBalls, totalBalls) {
    console.log(`[RB${id.toString().padStart(4, '0')}] renderBalls(${remainingBalls}, ${totalBalls})`);
} 