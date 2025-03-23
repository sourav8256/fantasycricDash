document.addEventListener('DOMContentLoaded', () => {
    // Utility functions for date handling
    const dateUtils = {
        // Format date in YYYY-MM-DD format for storage
        formatForStorage: function(date) {
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        },
        
        // Format date for display (e.g., "18 Mar")
        formatForDisplay: function(date) {
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' });
            return `${day} ${month}`;
        },
        
        // Get an array of date strings for a week
        getWeekDates: function(startDate) {
            const dates = [];
            const weekStart = new Date(startDate);
            
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(currentDate.getDate() + i);
                dates.push(this.formatForStorage(currentDate));
            }
            
            return dates;
        },
        
        // Get the start of the current week (Sunday)
        getCurrentWeekStart: function() {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
            return startDate;
        }
    };

    // Storage handler
    const storage = {
        KEY: 'habitTrackerData',
        
        // Check if localStorage is available and working
        isAvailable: function() {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                console.error('localStorage is not available:', e);
                return false;
            }
        },
        
        // Remove emoji from section title
        _stripEmoji: function(title) {
            // This regex will match emoji and the space after it
            // Common emoji patterns in our app: 🏢, 🏠, 💪, 📋
            return title.replace(/^[^\w\s]+ /, '');
        },
        
        // Save data to localStorage
        save: function(data) {
            try {
                // Create a copy of the data with the new structure
                const formattedData = {
                    currentWeekStart: data.currentWeekStart,
                    sections: data.sections.map(section => ({
                        name: this._stripEmoji(section.title),
                        tasks: section.habits.map(habit => ({
                            name: habit.name,
                            progress: { ...habit.status }
                        }))
                    }))
                };
                
                const jsonData = JSON.stringify(formattedData);
                localStorage.setItem(this.KEY, jsonData);
                return true;
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                return false;
            }
        },
        
        // Load data from localStorage
        load: function() {
            try {
                const rawData = localStorage.getItem(this.KEY);
                if (!rawData) return null;
                
                const parsedData = JSON.parse(rawData);
                
                // Convert the data back to the internal format
                if (parsedData.sections) {
                    // Check if data is in the new format (with 'name' and 'tasks')
                    const isNewFormat = parsedData.sections.length > 0 && 
                                       'name' in parsedData.sections[0] && 
                                       'tasks' in parsedData.sections[0];
                    
                    if (isNewFormat) {
                        // Convert from the new storage format to our internal format
                        return {
                            currentWeekStart: new Date(parsedData.currentWeekStart),
                            sections: parsedData.sections.map((section, sIndex) => ({
                                id: `section_${sIndex}`,
                                title: this._getIconForSection(section.name) + ' ' + section.name,
                                habits: section.tasks.map((task, tIndex) => ({
                                    id: `habit_${sIndex}_${tIndex}`,
                                    name: task.name,
                                    status: task.progress || {}
                                }))
                            }))
                        };
                    }
                }
                
                // For the old format, make sure we're not adding duplicate emojis
                if (parsedData.sections) {
                    parsedData.sections.forEach(section => {
                        // If the title doesn't start with an emoji, add one
                        if (!/^[^\w\s]/.test(section.title)) {
                            const sectionName = section.title;
                            section.title = this._getIconForSection(sectionName) + ' ' + sectionName;
                        }
                    });
                }
                
                // Convert string date to Date object if needed
                if (parsedData.currentWeekStart) {
                    parsedData.currentWeekStart = new Date(parsedData.currentWeekStart);
                }
                
                return parsedData;
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                return null;
            }
        },
        
        // Helper to get the appropriate icon for a section based on name
        _getIconForSection: function(name) {
            name = name.toLowerCase();
            if (name.includes('work')) return '🏢';
            if (name.includes('home')) return '🏠';
            if (name.includes('health') || name.includes('fitness')) return '💪';
            return '📋'; // Default icon
        }
    };

    // Alert user if localStorage is not available
    if (!storage.isAvailable()) {
        alert('Warning: LocalStorage is not working. Your data will not be saved between sessions.');
    }

    // Create initial data structure
    function createInitialData() {
        const currentWeekStart = dateUtils.getCurrentWeekStart();
        
        const initialData = {
            currentWeekStart: currentWeekStart,
            sections: [
                {
                    id: 'work',
                    title: '🏢 Work',
                    habits: [
                        { id: 'work1', name: 'Code for 2 hours', status: {} },
                        { id: 'work2', name: 'Team meeting', status: {} },
                        { id: 'work3', name: 'Learn new tech', status: {} }
                    ]
                },
                {
                    id: 'home',
                    title: '🏠 Home',
                    habits: [
                        { id: 'home1', name: 'Clean 15 mins', status: {} },
                        { id: 'home2', name: 'Family time', status: {} },
                        { id: 'home3', name: 'Read 10 pages', status: {} }
                    ]
                },
                {
                    id: 'health',
                    title: '💪 Health & Fitness',
                    habits: [
                        { id: 'health1', name: 'Exercise', status: {} },
                        { id: 'health2', name: 'Drink 2L water', status: {} },
                        { id: 'health3', name: 'Sleep 7+ hours', status: {} }
                    ]
                }
            ]
        };

        // Sample data patterns for initial state
        const samplePatterns = {
            'work1': [true, true, false, true, true, false, true],
            'work2': [true, true, true, true, true, true, true],
            'work3': [false, true, true, false, true, true, true],
            'home1': [true, true, false, true, true, false, true],
            'home2': [true, true, true, false, true, true, true],
            'home3': [false, true, true, true, true, false, true],
            'health1': [true, true, false, true, true, false, true],
            'health2': [false, true, true, true, true, false, true],
            'health3': [true, false, true, true, true, false, true]
        };
        
        // Initialize with example data
        const initialWeekDates = dateUtils.getWeekDates(initialData.currentWeekStart);
        initialData.sections.forEach(section => {
            section.habits.forEach(habit => {
                initialWeekDates.forEach((dateStr, index) => {
                    const pattern = samplePatterns[habit.id] || Array(7).fill(false);
                    habit.status[dateStr] = pattern[index];
                });
            });
        });
        
        return initialData;
    }

    // Load existing data or create new data
    let data = storage.load();
    if (!data) {
        data = createInitialData();
        storage.save(data);
    }

    // DOM elements
    const elements = {
        habitSections: document.getElementById('habit-sections'),
        addSectionBtn: document.getElementById('add-section-btn'),
        dateRange: document.getElementById('date-range'),
        prevWeekBtn: document.getElementById('prev-week'),
        nextWeekBtn: document.getElementById('next-week'),
        modal: document.getElementById('modal'),
        closeModalBtn: document.querySelector('.close-modal'),
        modalTitle: document.getElementById('modal-title'),
        inputName: document.getElementById('input-name'),
        modalSaveBtn: document.getElementById('modal-save'),
        sectionTemplate: document.getElementById('section-template'),
        habitRowTemplate: document.getElementById('habit-row-template')
    };

    // Edit state
    const editState = {
        mode: null,
        sectionId: null,
        habitId: null
    };

    // UI Functions
    const ui = {
        // Update the date range display
        updateDateRange: function() {
            const weekStart = new Date(data.currentWeekStart);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const startDay = weekStart.getDate();
            const startMonth = weekStart.toLocaleString('default', { month: 'short' });
            const endDay = weekEnd.getDate();
            const endMonth = weekEnd.toLocaleString('default', { month: 'short' });
            
            elements.dateRange.textContent = `Daily Habit Tracker (${startDay} ${startMonth} - ${endDay} ${endMonth})`;
        },
        
        // Generate day headers and dates for the current week
        generateDayHeadersAndDates: function() {
            const headers = [];
            const dates = [];
            const weekStart = new Date(data.currentWeekStart);
            
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(currentDate.getDate() + i);
                headers.push(dateUtils.formatForDisplay(currentDate));
                dates.push(dateUtils.formatForStorage(currentDate));
            }
            
            return { headers, dates };
        },
        
        // Create edit and delete buttons for a habit row
        createActionButtons: function(sectionId, habitId) {
            const actionsCell = document.createElement('td');
            actionsCell.className = 'task-actions';
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-task-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit Task';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                this.showModal('edit-task', sectionId, habitId);
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-task-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete Task';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                if (confirm('Are you sure you want to delete this task?')) {
                    this.deleteTask(sectionId, habitId);
                }
            });
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            
            return actionsCell;
        },
        
        // Render all sections
        renderSections: function() {
            elements.habitSections.innerHTML = '';
            const { headers, dates } = this.generateDayHeadersAndDates();
            
            data.sections.forEach(section => {
                const sectionElement = elements.sectionTemplate.content.cloneNode(true);
                
                // Set section title
                sectionElement.querySelector('.section-title').textContent = section.title;
                
                // Set unique ID for the section
                const sectionContainer = sectionElement.querySelector('.habit-section');
                sectionContainer.dataset.sectionId = section.id;
                
                // Add delete section button to section header
                const sectionHeader = sectionElement.querySelector('.section-header');
                const deleteSectionBtn = document.createElement('button');
                deleteSectionBtn.className = 'delete-section-btn';
                deleteSectionBtn.innerHTML = '🗑️';
                deleteSectionBtn.title = 'Delete Section';
                deleteSectionBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    if (confirm('Are you sure you want to delete this section and all its tasks?')) {
                        this.deleteSection(section.id);
                    }
                });
                
                // Insert delete button before the add task button
                sectionHeader.insertBefore(deleteSectionBtn, sectionHeader.querySelector('.add-task-btn'));
                
                // Add day headers
                const headerRow = sectionElement.querySelector('thead tr');
                headerRow.innerHTML = ''; // Clear any existing cells
                
                // Add task header
                const taskHeader = document.createElement('th');
                taskHeader.className = 'task-header';
                taskHeader.textContent = 'Task';
                headerRow.appendChild(taskHeader);
                
                // Add day headers
                headers.forEach(day => {
                    const th = document.createElement('th');
                    th.textContent = day;
                    headerRow.appendChild(th);
                });
                
                // Add actions header
                const actionsHeader = document.createElement('th');
                actionsHeader.className = 'actions-header';
                actionsHeader.textContent = 'Actions';
                headerRow.appendChild(actionsHeader);
                
                // Add habit rows
                const tbody = sectionElement.querySelector('tbody');
                section.habits.forEach(habit => {
                    const habitRow = elements.habitRowTemplate.content.cloneNode(true);
                    const tr = habitRow.querySelector('tr');
                    tr.dataset.habitId = habit.id;
                    
                    // Set habit name
                    habitRow.querySelector('.task-name').textContent = habit.name;
                    
                    // Add status cells for each date in the current week
                    dates.forEach((dateStr) => {
                        const td = document.createElement('td');
                        td.classList.add('status-cell');
                        td.dataset.date = dateStr;
                        
                        // Get status for this specific date (default to false if not set)
                        const status = habit.status[dateStr] === true;
                        td.textContent = status ? '✅' : '❌';
                        
                        td.addEventListener('click', () => {
                            this.toggleStatus(section.id, habit.id, dateStr);
                        });
                        tr.appendChild(td);
                    });
                    
                    // Add action buttons
                    const actionsCell = this.createActionButtons(section.id, habit.id);
                    tr.appendChild(actionsCell);
                    
                    tbody.appendChild(habitRow);
                });
                
                // Set up add task button
                const addTaskBtn = sectionElement.querySelector('.add-task-btn');
                addTaskBtn.addEventListener('click', () => {
                    this.showModal('task', section.id);
                });
                
                // Add scroll hint for mobile users
                const tableContainer = sectionElement.querySelector('.habit-table-container');
                const scrollHint = document.createElement('div');
                scrollHint.className = 'scroll-hint';
                scrollHint.textContent = 'Swipe left/right to see more dates';
                sectionContainer.insertBefore(scrollHint, tableContainer.nextSibling);
                
                elements.habitSections.appendChild(sectionElement);
            });
        },
        
        // Toggle habit status
        toggleStatus: function(sectionId, habitId, dateStr) {
            const section = data.sections.find(s => s.id === sectionId);
            if (!section) return;
            
            const habit = section.habits.find(h => h.id === habitId);
            if (!habit) return;
            
            // Toggle status for this specific date
            habit.status[dateStr] = !habit.status[dateStr];
            storage.save(data);
            
            // Update UI
            const cell = document.querySelector(`.habit-section[data-section-id="${sectionId}"] tr[data-habit-id="${habitId}"] .status-cell[data-date="${dateStr}"]`);
            if (cell) {
                cell.textContent = habit.status[dateStr] ? '✅' : '❌';
            }
        },
        
        // Show modal for adding/editing task or section
        showModal: function(type, sectionId = null, habitId = null) {
            editState.mode = type;
            editState.sectionId = sectionId;
            editState.habitId = habitId;
            
            // Set modal title based on mode
            let title, initialValue = '';
            
            if (type === 'task') {
                title = 'Add New Task';
            } else if (type === 'edit-task') {
                title = 'Edit Task';
                const section = data.sections.find(s => s.id === sectionId);
                if (section) {
                    const habit = section.habits.find(h => h.id === habitId);
                    if (habit) {
                        initialValue = habit.name;
                    }
                }
            } else { // section
                title = 'Add New Section';
            }
            
            elements.modalTitle.textContent = title;
            elements.inputName.value = initialValue;
            elements.inputName.placeholder = `Enter ${type === 'section' ? 'section' : 'task'} name`;
            elements.modal.style.display = 'block';
            
            // Focus on the input field
            setTimeout(() => elements.inputName.focus(), 100);
        },
        
        // Handle modal save action
        handleModalSave: function() {
            const name = elements.inputName.value.trim();
            if (name === '') return;
            
            if (editState.mode === 'task' && editState.sectionId) {
                this.addTask(editState.sectionId, name);
            } else if (editState.mode === 'edit-task' && editState.sectionId && editState.habitId) {
                this.editTask(editState.sectionId, editState.habitId, name);
            } else if (editState.mode === 'section') {
                this.addSection(name);
            }
            
            elements.modal.style.display = 'none';
        },
        
        // Add a new task
        addTask: function(sectionId, taskName) {
            const section = data.sections.find(s => s.id === sectionId);
            if (!section) return;
            
            const newHabit = {
                id: 'habit_' + Date.now(),
                name: taskName,
                status: {}
            };
            
            section.habits.push(newHabit);
            storage.save(data);
            this.renderSections();
        },
        
        // Edit an existing task
        editTask: function(sectionId, habitId, newName) {
            const section = data.sections.find(s => s.id === sectionId);
            if (!section) return;
            
            const habit = section.habits.find(h => h.id === habitId);
            if (!habit) return;
            
            habit.name = newName;
            storage.save(data);
            this.renderSections();
        },
        
        // Delete a task
        deleteTask: function(sectionId, habitId) {
            const section = data.sections.find(s => s.id === sectionId);
            if (!section) return;
            
            const habitIndex = section.habits.findIndex(h => h.id === habitId);
            if (habitIndex === -1) return;
            
            section.habits.splice(habitIndex, 1);
            storage.save(data);
            this.renderSections();
        },
        
        // Delete a section
        deleteSection: function(sectionId) {
            const sectionIndex = data.sections.findIndex(s => s.id === sectionId);
            if (sectionIndex === -1) return;
            
            data.sections.splice(sectionIndex, 1);
            storage.save(data);
            this.renderSections();
        },
        
        // Add a new section
        addSection: function(sectionName) {
            // Determine appropriate icon
            let icon = '📋';
            const nameLower = sectionName.toLowerCase();
            if (nameLower.includes('work')) icon = '🏢';
            else if (nameLower.includes('home')) icon = '🏠';
            else if (nameLower.includes('health') || nameLower.includes('fitness')) icon = '💪';
            
            const newSection = {
                id: 'section_' + Date.now(),
                title: `${icon} ${sectionName}`,
                habits: []
            };
            
            data.sections.push(newSection);
            storage.save(data);
            this.renderSections();
        },
        
        // Navigate to previous week
        goToPreviousWeek: function() {
            const prevWeek = new Date(data.currentWeekStart);
            prevWeek.setDate(prevWeek.getDate() - 7);
            data.currentWeekStart = prevWeek;
            storage.save(data);
            this.updateDateRange();
            this.renderSections();
        },
        
        // Navigate to next week
        goToNextWeek: function() {
            const nextWeek = new Date(data.currentWeekStart);
            nextWeek.setDate(nextWeek.getDate() + 7);
            data.currentWeekStart = nextWeek;
            storage.save(data);
            this.updateDateRange();
            this.renderSections();
        }
    };

    // Set up event listeners
    function setupEventListeners() {
        // Navigation buttons
        elements.prevWeekBtn.addEventListener('click', () => ui.goToPreviousWeek());
        elements.nextWeekBtn.addEventListener('click', () => ui.goToNextWeek());
        
        // Add section button
        elements.addSectionBtn.addEventListener('click', () => ui.showModal('section'));
        
        // Modal events
        elements.closeModalBtn.addEventListener('click', () => {
            elements.modal.style.display = 'none';
        });
        
        elements.modalSaveBtn.addEventListener('click', () => ui.handleModalSave());
        
        elements.inputName.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                ui.handleModalSave();
            }
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === elements.modal) {
                elements.modal.style.display = 'none';
            }
        });
        
        // Save data before page unload
        window.addEventListener('beforeunload', () => {
            storage.save(data);
        });
    }

    // Initialize the application
    function init() {
        setupEventListeners();
        ui.updateDateRange();
        ui.renderSections();
    }

    // Start the app
    init();
}); 