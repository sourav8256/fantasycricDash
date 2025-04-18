// Data structure to store projects and tasks
let boardData = {
    projects: [],
    tasks: [],
    lastUpdated: new Date().toISOString()
};

// Theme state
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// DOM Elements
const projectsContainer = document.querySelector('.projects-container');
const newProjectBtn = document.getElementById('newProjectBtn');
const projectModal = document.getElementById('projectModal');
const projectNameInput = document.getElementById('projectName');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const taskModal = document.getElementById('taskModal');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const toggleDarkModeBtn = document.getElementById('toggleDarkMode');

// Initialize the app
function init() {
    loadData();
    setupEventListeners();
    setupDragAndDrop();
    renderProjects();
    applyTheme();
}

// Load data from localStorage
function loadData() {
    console.log('Starting loadData...');
    const savedData = localStorage.getItem('boardData');
    console.log('Saved data from localStorage:', savedData);
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            console.log('Parsed data:', parsedData);
            
            // Initialize boardData with proper structure
            boardData = {
                projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
                tasks: Array.isArray(parsedData.tasks) ? parsedData.tasks.map(task => ({
                    ...task,
                    subtaskIds: Array.isArray(task.subtaskIds) ? task.subtaskIds : [],
                    isSubtask: task.isSubtask || false,
                    parentTaskId: task.parentTaskId || null
                })) : [],
                lastUpdated: parsedData.lastUpdated || new Date().toISOString()
            };
            
            console.log('Initialized boardData:', boardData);
            
            // Ensure all tasks have valid statuses
            boardData.tasks.forEach(task => {
                if (!['ready', 'todo', 'in-progress', 'done'].includes(task.status)) {
                    console.log(`Setting default status for task ${task.id}`);
                    task.status = 'ready';
                }
            });
            
            console.log('Final boardData state:', boardData);
            saveData(); // Save back to localStorage with valid data
        } catch (error) {
            console.error('Error loading data:', error);
            boardData = {
                projects: [],
                tasks: [],
                lastUpdated: new Date().toISOString()
            };
        }
    } else {
        console.log('No saved data found, initializing empty board data');
        boardData = {
            projects: [],
            tasks: [],
            lastUpdated: new Date().toISOString()
        };
    }
}

// Save data to localStorage
function saveData() {
    console.log('Saving data:', boardData);
    boardData.lastUpdated = new Date().toISOString();
    localStorage.setItem('boardData', JSON.stringify(boardData));
}

// Apply theme based on stored preference
function applyTheme() {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    toggleDarkModeBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Render all projects
function renderProjects() {
    console.log('Rendering projects:', boardData.projects);
    projectsContainer.innerHTML = '';
    
    boardData.projects.forEach(project => {
        const projectElement = createProjectElement(project);
        projectsContainer.appendChild(projectElement);
        renderTasks(project.id);
    });
}

// Create a project element
function createProjectElement(project) {
    const div = document.createElement('div');
    div.className = 'project-card';
    div.dataset.projectId = project.id;
    
    div.innerHTML = `
        <div class="project-header">
            <h3 class="project-title">${project.name}</h3>
            <div class="project-actions">
                <button class="edit-project" data-id="${project.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-project" data-id="${project.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="board-container">
            <div class="column" data-column="ready">
                <div class="column-header">
                    <h4>Ready</h4>
                    <button class="add-task-btn" data-project-id="${project.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="task-list" data-project-id="${project.id}" data-column="ready"></div>
            </div>
            <div class="column" data-column="todo">
                <div class="column-header">
                    <h4>To Do</h4>
                    <button class="add-task-btn" data-project-id="${project.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="task-list" data-project-id="${project.id}" data-column="todo"></div>
            </div>
            <div class="column" data-column="in-progress">
                <div class="column-header">
                    <h4>In Progress</h4>
                    <button class="add-task-btn" data-project-id="${project.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="task-list" data-project-id="${project.id}" data-column="in-progress"></div>
            </div>
            <div class="column" data-column="done">
                <div class="column-header">
                    <h4>Done</h4>
                    <button class="add-task-btn" data-project-id="${project.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="task-list" data-project-id="${project.id}" data-column="done"></div>
            </div>
        </div>
    `;

    return div;
}

// Create a project
function createProject(name) {
    const project = {
        id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString()
    };
    boardData.projects.push(project);
    saveData();
    return project;
}

// Create a task
function createTask(projectId, title, description, isSubtask = false, parentTaskId = null) {
    const task = {
        id: Date.now().toString(),
        projectId,
        title,
        description,
        status: 'ready',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        subtaskIds: [],
        isSubtask: isSubtask,
        parentTaskId: parentTaskId
    };
    boardData.tasks.push(task);
    
    // If this is a subtask, add it to parent task's subtaskIds
    if (isSubtask && parentTaskId) {
        const parentTask = boardData.tasks.find(t => t.id === parentTaskId);
        if (parentTask) {
            parentTask.subtaskIds.push(task.id);
            parentTask.lastUpdated = new Date().toISOString();
        }
    }
    
    saveData();
    return task;
}

// Update task status
function updateTaskStatus(taskId, newStatus) {
    const task = boardData.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        task.lastUpdated = new Date().toISOString();
        saveData();
    }
}

// Update task order
function updateTaskOrder(projectId, status, taskOrder) {
    const tasks = boardData.tasks.filter(t => t.projectId === projectId && t.status === status);
    tasks.sort((a, b) => {
        const aIndex = taskOrder.indexOf(a.id);
        const bIndex = taskOrder.indexOf(b.id);
        return aIndex - bIndex;
    });
    saveData();
}

// Get tasks for a project and status
function getTasks(projectId, status) {
    console.log('Getting tasks for project:', projectId, 'status:', status);
    const tasks = boardData.tasks.filter(t => 
        t.projectId === projectId && 
        t.status === status && 
        !t.isSubtask
    );
    console.log('Found tasks:', tasks);
    return tasks;
}

// Get subtasks for a task
function getSubtasks(taskId) {
    console.log('Getting subtasks for task:', taskId);
    const task = boardData.tasks.find(t => t.id === taskId);
    if (!task) return [];
    
    const subtasks = boardData.tasks.filter(t => 
        t.parentTaskId === taskId && 
        t.isSubtask
    );
    console.log('Found subtasks:', subtasks);
    return subtasks;
}

// Update subtask completion status
function updateSubtaskStatus(subtaskId, completed) {
    const subtask = boardData.tasks.find(t => t.id === subtaskId);
    if (subtask) {
        subtask.completed = completed;
        subtask.lastUpdated = new Date().toISOString();
        
        // Update parent task's lastUpdated
        if (subtask.parentTaskId) {
            const parentTask = boardData.tasks.find(t => t.id === subtask.parentTaskId);
            if (parentTask) {
                parentTask.lastUpdated = new Date().toISOString();
            }
        }
        
        saveData();
    }
}

// Render tasks for a specific project
function renderTasks(projectId) {
    console.log('Rendering tasks for project:', projectId);
    const project = boardData.projects.find(p => p.id === projectId);
    if (!project) return;

    // Clear all task lists first
    const taskLists = document.querySelectorAll(`.task-list[data-project-id="${projectId}"]`);
    taskLists.forEach(list => {
        list.innerHTML = '';
    });

    // Render tasks in their respective columns
    ['ready', 'todo', 'in-progress', 'done'].forEach(status => {
        const taskList = document.querySelector(`.task-list[data-project-id="${projectId}"][data-column="${status}"]`);
        if (taskList) {
            const tasks = getTasks(projectId, status);
            console.log(`Tasks for ${status}:`, tasks);
            tasks.forEach(task => {
                const taskElement = createTaskElement(task, projectId);
                taskList.appendChild(taskElement);
            });
        }
    });
}

// Create a task element with subtasks
function createTaskElement(task, projectId) {
    console.log('Creating task element:', task);
    const div = document.createElement('div');
    div.className = 'task-card';
    div.draggable = true;
    div.dataset.taskId = task.id;
    div.dataset.projectId = projectId;
    
    // Get subtasks for this task
    const subtasks = getSubtasks(task.id);
    console.log('Subtasks for task:', subtasks);
    
    div.innerHTML = `
        <div class="task-header">
            <h4 contenteditable="true">${task.title}</h4>
            <div class="task-actions">
                <button class="add-subtask-btn" data-task-id="${task.id}">
                    <i class="fas fa-plus"></i> Add Subtask
                </button>
                <button class="delete-task" data-id="${task.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <p contenteditable="true">${task.description}</p>
        <div class="subtasks-container">
            ${subtasks.map(subtask => `
                <div class="subtask" data-subtask-id="${subtask.id}">
                    <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                           data-subtask-id="${subtask.id}">
                    <span contenteditable="true">${subtask.title}</span>
                    <button class="delete-subtask" data-id="${subtask.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('')}
        </div>
        <div class="task-meta">
            <span>ID: ${task.id}</span>
            <span>${new Date(task.lastUpdated).toLocaleString()}</span>
        </div>
    `;

    // Add subtask event listeners
    const addSubtaskBtn = div.querySelector('.add-subtask-btn');
    addSubtaskBtn.addEventListener('click', () => {
        const subtaskTitle = prompt('Enter subtask title:');
        if (subtaskTitle) {
            createTask(projectId, subtaskTitle, '', true, task.id);
            renderTasks(projectId);
        }
    });

    // Add subtask completion toggle
    div.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const subtaskId = e.target.dataset.subtaskId;
            updateSubtaskStatus(subtaskId, e.target.checked);
        });
    });

    // Add delete subtask functionality
    div.querySelectorAll('.delete-subtask').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const subtaskId = e.target.closest('.delete-subtask').dataset.id;
            boardData.tasks = boardData.tasks.filter(t => t.id !== subtaskId);
            
            // Remove subtask ID from parent task
            const task = boardData.tasks.find(t => t.id === task.id);
            if (task) {
                task.subtaskIds = task.subtaskIds.filter(id => id !== subtaskId);
                task.lastUpdated = new Date().toISOString();
            }
            
            saveData();
            renderTasks(projectId);
        });
    });

    // Add inline editing functionality
    const titleElement = div.querySelector('h4');
    const descriptionElement = div.querySelector('p');

    titleElement.addEventListener('blur', () => {
        const newTitle = titleElement.textContent;
        if (newTitle !== task.title) {
            task.title = newTitle;
            task.lastUpdated = new Date().toISOString();
            saveData();
        }
    });

    descriptionElement.addEventListener('blur', () => {
        const newDescription = descriptionElement.textContent;
        if (newDescription !== task.description) {
            task.description = newDescription;
            task.lastUpdated = new Date().toISOString();
            saveData();
        }
    });

    return div;
}

// Setup event listeners
function setupEventListeners() {
    // Project modal
    newProjectBtn.addEventListener('click', () => {
        projectModal.style.display = 'block';
        projectNameInput.value = '';
    });

    saveProjectBtn.addEventListener('click', () => {
        const name = projectNameInput.value.trim();
        if (name) {
            const project = createProject(name);
            renderProjects();
            projectModal.style.display = 'none';
        }
    });

    cancelProjectBtn.addEventListener('click', () => {
        projectModal.style.display = 'none';
    });

    // Task modal
    document.addEventListener('click', (e) => {
        if (e.target.closest('.add-task-btn')) {
            const projectId = e.target.closest('.add-task-btn').dataset.projectId;
            taskModal.style.display = 'block';
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
            taskModal.dataset.projectId = projectId;
        }
    });

    // Task save button
    saveTaskBtn.addEventListener('click', () => {
        const projectId = taskModal.dataset.projectId;
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        
        if (title && projectId) {
            const task = createTask(projectId, title, description);
            renderTasks(projectId);
            taskModal.style.display = 'none';
        }
    });

    cancelTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });

    // Delete project
    document.addEventListener('click', (e) => {
        if (e.target.closest('.delete-project')) {
            const projectId = e.target.closest('.delete-project').dataset.id;
            boardData.projects = boardData.projects.filter(p => p.id !== projectId);
            saveData();
            renderProjects();
        }
    });

    // Delete task
    document.addEventListener('click', (e) => {
        if (e.target.closest('.delete-task')) {
            const taskId = e.target.closest('.delete-task').dataset.id;
            const projectId = e.target.closest('.task-card').dataset.projectId;
            
            // Remove the task from boardData.tasks
            boardData.tasks = boardData.tasks.filter(t => t.id !== taskId);
            
            // Remove any subtasks associated with this task
            const subtasks = boardData.tasks.filter(t => t.parentTaskId === taskId);
            subtasks.forEach(subtask => {
                boardData.tasks = boardData.tasks.filter(t => t.id !== subtask.id);
            });
            
            saveData();
            renderTasks(projectId);
        }
    });

    // Delete subtask
    document.addEventListener('click', (e) => {
        if (e.target.closest('.delete-subtask')) {
            const subtaskId = e.target.closest('.delete-subtask').dataset.id;
            const projectId = e.target.closest('.task-card').dataset.projectId;
            
            // Remove the subtask from boardData.tasks
            boardData.tasks = boardData.tasks.filter(t => t.id !== subtaskId);
            
            // Remove subtask ID from parent task's subtaskIds
            const parentTask = boardData.tasks.find(t => t.subtaskIds.includes(subtaskId));
            if (parentTask) {
                parentTask.subtaskIds = parentTask.subtaskIds.filter(id => id !== subtaskId);
                parentTask.lastUpdated = new Date().toISOString();
            }
            
            saveData();
            renderTasks(projectId);
        }
    });

    // Dark mode toggle
    toggleDarkModeBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        applyTheme();
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === projectModal) projectModal.style.display = 'none';
        if (e.target === taskModal) taskModal.style.display = 'none';
    });
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('task-card')) {
            console.log('Drag Start:', {
                taskId: e.target.dataset.taskId,
                projectId: e.target.dataset.projectId,
                currentStatus: e.target.closest('.task-list').dataset.column
            });
            e.target.classList.add('dragging');
            e.dataTransfer.setData('taskId', e.target.dataset.taskId);
            e.dataTransfer.setData('projectId', e.target.dataset.projectId);
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('task-card')) {
            console.log('Drag End:', {
                taskId: e.target.dataset.taskId,
                projectId: e.target.dataset.projectId,
                finalStatus: e.target.closest('.task-list').dataset.column
            });
            e.target.classList.remove('dragging');
        }
    });

    document.addEventListener('dragover', (e) => {
        const taskList = e.target.closest('.task-list');
        const column = e.target.closest('.column');
        if (taskList || column) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const draggingCard = document.querySelector('.task-card.dragging');
            if (draggingCard) {
                const targetList = taskList || column.querySelector('.task-list');
                const afterElement = getDragAfterElement(targetList, e.clientY);
                if (afterElement) {
                    targetList.insertBefore(draggingCard, afterElement);
                } else {
                    targetList.appendChild(draggingCard);
                }
            }
        }
    });

    document.addEventListener('dragenter', (e) => {
        const taskList = e.target.closest('.task-list');
        const column = e.target.closest('.column');
        if (taskList || column) {
            e.preventDefault();
            const targetList = taskList || column.querySelector('.task-list');
            targetList.classList.add('drag-over');
        }
    });

    document.addEventListener('dragleave', (e) => {
        const taskList = e.target.closest('.task-list');
        const column = e.target.closest('.column');
        if (taskList || column) {
            e.preventDefault();
            const targetList = taskList || column.querySelector('.task-list');
            targetList.classList.remove('drag-over');
        }
    });

    document.addEventListener('drop', (e) => {
        const taskList = e.target.closest('.task-list');
        const column = e.target.closest('.column');
        if (taskList || column) {
            e.preventDefault();
            const targetList = taskList || column.querySelector('.task-list');
            targetList.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('taskId');
            const projectId = e.dataTransfer.getData('projectId');
            const newStatus = targetList.dataset.column;
            
            console.log('Drop Event:', {
                taskId,
                projectId,
                newStatus,
                targetColumn: targetList.dataset.column
            });

            // Find the task in boardData.tasks
            const task = boardData.tasks.find(t => t.id === taskId);
            if (task) {
                console.log('Task Found:', {
                    oldStatus: task.status,
                    newStatus: newStatus
                });
                
                // Update task status and position
                task.status = newStatus;
                task.lastUpdated = new Date().toISOString();
                
                // Reorder tasks based on their new positions
                const tasks = Array.from(targetList.children);
                const taskOrder = tasks.map(task => task.dataset.taskId);
                
                console.log('Task Order:', taskOrder);
                
                // Update task order in boardData.tasks
                const projectTasks = boardData.tasks.filter(t => 
                    t.projectId === projectId && 
                    t.status === newStatus &&
                    !t.isSubtask
                );
                
                projectTasks.sort((a, b) => {
                    const aIndex = taskOrder.indexOf(a.id);
                    const bIndex = taskOrder.indexOf(b.id);
                    return aIndex - bIndex;
                });
                
                saveData();
                renderTasks(projectId);
            } else {
                console.error('Task not found:', { taskId, projectId });
            }
        }
    });
}

// Helper function for drag and drop
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Initialize the app
init(); 