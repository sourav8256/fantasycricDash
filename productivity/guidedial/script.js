// localStorage.clear();

const STORAGE_KEYS = {
    TASKS: 'guidedial_tasks',
    TIME_LEFT: 'guidedial_timeLeft',
    LAST_UPDATE: 'guidedial_lastUpdateTime',
    CURRENT_TASK: 'guidedial_currentTask'
};

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || [
    { name: 'Work', duration: 3600, color: '#FFFFFF' },
    { name: 'Break', duration: 300, color: '#FF9800' }
];
let totalTime = tasks.reduce((sum, task) => sum + task.duration, 0);
let timeLeft = parseInt(localStorage.getItem(STORAGE_KEYS.TIME_LEFT)) || totalTime;
let currentTaskIndex = parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_TASK)) || 0;
let timerInterval;
let lastUpdateTime = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)) || Date.now();

function parseTimeString(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
}

function formatTimeString(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTasks() {
    const taskText = document.getElementById('task-list').value;
    const taskLines = taskText.trim().split('\n');
    
    let nonBreakIndex = 0; // Counter for non-break tasks to handle alternating colors
    
    tasks = taskLines.map((line, index) => {
        const [name, time] = line.split('-').map(str => str.trim());
        const isBreak = name.toLowerCase().includes('break');
        let color;
        
        if (isBreak) {
            color = '#FF9800'; // Orange for break
        } else {
            color = nonBreakIndex % 2 === 0 ? '#FFFFFF' : '#E6F3FF'; // White or Light Sky Blue
            nonBreakIndex++; // Only increment for non-break tasks
        }
        
        return {
            name,
            duration: parseTimeString(time),
            color: color
        };
    });

    totalTime = tasks.reduce((sum, task) => sum + task.duration, 0);
    timeLeft = totalTime;
    currentTaskIndex = 0;
    
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    updateTaskVisuals();
    updateTaskSequence();
    updateTimer();
}

function updateTaskVisuals() {
    // Update task colors gradient
    const taskGradient = tasks.reduce((acc, task, index) => {
        const startAngle = tasks.slice(0, index).reduce((sum, t) => sum + t.duration, 0) / totalTime * 360;
        const endAngle = startAngle + (task.duration / totalTime * 360);
        return `${acc}${task.color} ${startAngle}deg ${endAngle}deg, `;
    }, '');
    
    document.documentElement.style.setProperty(
        '--task-colors', 
        taskGradient.slice(0, -2) // remove last comma and space
    );

    // Update task labels
    const labelsContainer = document.querySelector('.task-labels');
    labelsContainer.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const angle = (tasks.slice(0, index).reduce((sum, t) => sum + t.duration, 0) + task.duration/2) / totalTime * 360;
        const label = document.createElement('div');
        label.className = 'task-label';
        label.textContent = `${task.name} (${formatTimeString(task.duration)})`;
        label.style.transform = `rotate(${angle}deg) translateX(60px)`;
        labelsContainer.appendChild(label);
    });

    // Update textarea with current tasks
    document.getElementById('task-list').value = tasks.map(task => 
        `${task.name} - ${formatTimeString(task.duration)}`
    ).join('\n');
}

function updateTaskSequence() {
    const prevIndex = (currentTaskIndex - 1 + tasks.length) % tasks.length;
    const nextIndex = (currentTaskIndex + 1) % tasks.length;

    const prevElement = document.querySelector('.sequence-item.previous .task-name');
    const currentElement = document.querySelector('.sequence-item.current .task-name');
    const nextElement = document.querySelector('.sequence-item.next .task-name');

    prevElement.textContent = tasks[prevIndex].name;
    currentElement.textContent = tasks[currentTaskIndex].name;
    nextElement.textContent = tasks[nextIndex].name;

    // Set data attributes for break tasks
    prevElement.dataset.isBreak = tasks[prevIndex].name.toLowerCase().includes('break');
    currentElement.dataset.isBreak = tasks[currentTaskIndex].name.toLowerCase().includes('break');
    nextElement.dataset.isBreak = tasks[nextIndex].name.toLowerCase().includes('break');
}

function updateTimer() {
    const currentTime = Date.now();
    const timePassed = Math.floor((currentTime - lastUpdateTime) / 1000);
    
    if (timePassed > 0) {
        timeLeft = Math.max(0, timeLeft - timePassed);
        lastUpdateTime = currentTime;
    }

    if (timeLeft <= 0) {
        currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
        timeLeft = totalTime;
        localStorage.setItem(STORAGE_KEYS.CURRENT_TASK, currentTaskIndex);
        updateTaskSequence();
    }

    localStorage.setItem(STORAGE_KEYS.TIME_LEFT, timeLeft);
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, lastUpdateTime);

    // Format time display as HH:MM:SS
    document.querySelector('.time-display').textContent = formatTimeString(timeLeft);
    
    // Calculate angle for second hand
    const secondDegrees = ((totalTime - timeLeft) / totalTime) * 360;
    document.querySelector('.second-hand').style.transform = `rotate(${secondDegrees}deg)`;
}

function adjustTime(seconds) {
    // Calculate new time
    const newTime = Math.min(totalTime, Math.max(0, timeLeft + seconds));
    
    // Only update if the time actually changed
    if (newTime !== timeLeft) {
        timeLeft = newTime;
        lastUpdateTime = Date.now();
        
        // Store the new state
        localStorage.setItem(STORAGE_KEYS.TIME_LEFT, timeLeft);
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, lastUpdateTime);
        
        // Update the display immediately
        updateTimer();
    }
}

// Initialize
updateTaskVisuals();
updateTaskSequence();
updateTimer();
timerInterval = setInterval(updateTimer, 1000);

// Save state before page unload
window.addEventListener('beforeunload', () => {
    localStorage.setItem(STORAGE_KEYS.TIME_LEFT, timeLeft);
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, lastUpdateTime);
    localStorage.setItem(STORAGE_KEYS.CURRENT_TASK, currentTaskIndex);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}); 