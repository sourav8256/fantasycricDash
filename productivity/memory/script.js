document.addEventListener('DOMContentLoaded', () => {
    const timelinesContainer = document.getElementById('timelines-container');
    const addTimelineBtn = document.getElementById('add-timeline-btn');
    const updateAppBtn = document.getElementById('update-app-btn');

    let timelines = JSON.parse(localStorage.getItem('timelines')) || [];
    let newWorker;

    const saveTimelines = () => {
        localStorage.setItem('timelines', JSON.stringify(timelines));
    };

    const renderTimelines = () => {
        timelinesContainer.innerHTML = '';
        timelines.forEach(timeline => {
            const timelineEl = document.createElement('div');
            timelineEl.classList.add('timeline');
            timelineEl.dataset.id = timeline.id;

            const nextTaskTime = new Date(timeline.nextTaskTime);
            const timeUntilNext = Math.max(0, timeline.nextTaskTime - Date.now());
            const minutesUntilNext = Math.floor(timeUntilNext / 60000);
            const secondsUntilNext = Math.floor((timeUntilNext % 60000) / 1000);

            timelineEl.innerHTML = `
                <div class="timeline-header">
                    <h2>Timeline ${timeline.id}</h2>
                    <button class="remove-timeline-btn">Remove</button>
                </div>
                <div class="timeline-info">
                    Next task in: ${minutesUntilNext}m ${secondsUntilNext}s (at ${nextTaskTime.toLocaleTimeString()})
                </div>
            `;

            const tasksContainer = document.createElement('div');
            tasksContainer.classList.add('tasks-container');
            
            // Show active and completed tasks
            timeline.tasks.forEach(task => {
                const taskEl = createTaskElement(task);
                tasksContainer.appendChild(taskEl);
            });
            
            // Show multiple upcoming tasks (next 5)
            const upcomingTasks = generateUpcomingTasks(timeline.nextTaskTime, 5);
            upcomingTasks.forEach(taskTime => {
                const upcomingTaskEl = createUpcomingTaskElement(taskTime);
                tasksContainer.appendChild(upcomingTaskEl);
            });

            timelineEl.appendChild(tasksContainer);
            timelinesContainer.appendChild(timelineEl);
        });
    };

    const createTaskElement = (task) => {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task');
        taskEl.dataset.id = task.id;

        const taskStartTime = new Date(task.startTime);
        const taskEndTime = new Date(task.startTime + 300000); // 5 minutes later
        const taskTimeRange = `${taskStartTime.toLocaleTimeString()} - ${taskEndTime.toLocaleTimeString()}`;

        if (task.status === 'active') {
            taskEl.classList.add('active');
            const remainingTime = 300000 - (Date.now() - task.startTime);
            const remainingMinutes = Math.floor(remainingTime / 60000);
            const remainingSeconds = Math.floor((remainingTime % 60000) / 1000);
            
            taskEl.innerHTML = `
                <div>
                    <span>Task (active)</span>
                    <span class="task-time">Window: ${taskTimeRange}</span>
                    <span class="task-time">Time left: ${remainingMinutes}m ${remainingSeconds}s</span>
                </div>
                <button class="complete-btn">Complete</button>
                <div class="countdown-bar" style="animation-duration: ${Math.max(0, remainingTime / 1000)}s"></div>
            `;
        } else if (task.status === 'completed') {
            taskEl.classList.add('completed');
            taskEl.innerHTML = `
                <div>
                    <span>Task (completed)</span>
                    <span class="task-time">Window: ${taskTimeRange}</span>
                </div>
            `;
        } else if (task.status === 'missed') {
            taskEl.classList.add('missed');
            taskEl.innerHTML = `
                <div>
                    <span>Task (missed)</span>
                    <span class="task-time">Window: ${taskTimeRange}</span>
                </div>
            `;
        }

        return taskEl;
    };

    const createUpcomingTaskElement = (scheduledTime) => {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task', 'upcoming-task');
        
        const startTime = new Date(scheduledTime);
        const endTime = new Date(scheduledTime + 300000); // 5 minutes later
        const taskTimeRange = `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`;
        
        const timeUntil = scheduledTime - Date.now();
        const hoursUntil = Math.floor(timeUntil / 3600000);
        const minutesUntil = Math.floor((timeUntil % 3600000) / 60000);
        const secondsUntil = Math.floor((timeUntil % 60000) / 1000);
        
        let timeUntilStr = '';
        if (hoursUntil > 0) {
            timeUntilStr = `${hoursUntil}h ${minutesUntil}m`;
        } else {
            timeUntilStr = `${minutesUntil}m ${secondsUntil}s`;
        }
        
        taskEl.innerHTML = `
            <div>
                <span>Upcoming Task</span>
                <span class="task-time">5-min window: ${taskTimeRange}</span>
                <span class="task-time">Starts in: ${timeUntilStr}</span>
            </div>
        `;
        
        return taskEl;
    };

    const generateUpcomingTasks = (startTime, count) => {
        const upcomingTasks = [];
        let currentTime = startTime;
        
        for (let i = 0; i < count; i++) {
            upcomingTasks.push(currentTime);
            currentTime += getRandomInterval();
        }
        
        return upcomingTasks;
    };

    const addTimeline = () => {
        const newTimeline = {
            id: Date.now(),
            tasks: [],
            nextTaskTime: Date.now() + getRandomInterval()
        };
        timelines.push(newTimeline);
        saveAndRender();
    };

    const removeTimeline = (id) => {
        timelines = timelines.filter(timeline => timeline.id !== id);
        saveAndRender();
    };

    const completeTask = (timelineId, taskId) => {
        const timeline = timelines.find(t => t.id === timelineId);
        if (timeline) {
            const task = timeline.tasks.find(t => t.id === taskId);
            if (task && task.status === 'active') {
                task.status = 'completed';
                saveAndRender();
            }
        }
    };

    const getRandomInterval = () => {
        // Minimum 1.5 hours (90 minutes) + random additional time up to 1.5 hours more
        // This gives a range of 1.5 to 3 hours between tasks
        const minimumInterval = 1.5 * 60 * 60 * 1000; // 1.5 hours in milliseconds
        const randomAdditional = Math.random() * (1.5 * 60 * 60 * 1000); // 0 to 1.5 hours additional
        return minimumInterval + randomAdditional;
    };

    const updateTasks = () => {
        timelines.forEach(timeline => {
            if (Date.now() >= timeline.nextTaskTime) {
                const newTask = {
                    id: Date.now(),
                    startTime: Date.now(),
                    status: 'active'
                };
                timeline.tasks.push(newTask);
                timeline.nextTaskTime = Date.now() + getRandomInterval();
            }

            timeline.tasks.forEach(task => {
                if (task.status === 'active' && Date.now() - task.startTime > 300000) {
                    task.status = 'missed';
                }
            });
        });
        saveAndRender();
    };

    const saveAndRender = () => {
        saveTimelines();
        renderTimelines();
    };
    
    addTimelineBtn.addEventListener('click', addTimeline);

    updateAppBtn.addEventListener('click', () => {
        if (newWorker) {
            newWorker.postMessage({ action: 'skipWaiting' });
        }
    });

    timelinesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-timeline-btn')) {
            const timelineEl = e.target.closest('.timeline');
            removeTimeline(parseInt(timelineEl.dataset.id));
        } else if (e.target.classList.contains('complete-btn')) {
            const taskEl = e.target.closest('.task');
            const timelineEl = e.target.closest('.timeline');
            completeTask(parseInt(timelineEl.dataset.id), parseInt(taskEl.dataset.id));
        }
    });

    if (timelines.length === 0) {
        addTimeline();
    }

    setInterval(updateTasks, 1000);
    renderTimelines();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New update available
                                updateAppBtn.style.display = 'inline-block';
                            }
                        });
                    });
                }, err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
                
            // Listen for controlling service worker changes
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        });
    }
}); 