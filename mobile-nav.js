// Mobile Navigation Module
// Initialize mobile navigation
function initMobileNavigation() {
    const mobileTabs = document.querySelectorAll('.mobile-tab');
    const mobilePanels = document.querySelectorAll('.mobile-panel-overlay');
    const closeBtns = document.querySelectorAll('.mobile-panel-close');
    
    // Mobile tab click handlers
    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const panelId = tab.id.replace('-tab', '-panel');
            const panel = document.getElementById(panelId);
            
            if (panel) {
                // Update ARIA states
                mobileTabs.forEach(t => t.setAttribute('aria-selected', 'false'));
                tab.setAttribute('aria-selected', 'true');
                
                // Clone content to mobile panel
                if (panelId === 'mobile-tasks-panel') {
                    cloneTaskManagerContent();
                } else if (panelId === 'mobile-schedule-panel') {
                    cloneScheduleContent();
                }
                
                // Show panel
                panel.classList.add('is-open');
                
                // Prevent body scroll
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close button handlers
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeMobilePanel);
    });
    
    // Close panel when clicking overlay
    mobilePanels.forEach(panel => {
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                closeMobilePanel();
            }
        });
    });
    
    // Close panel on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobilePanel();
        }
    });
}

// Close mobile panel
function closeMobilePanel() {
    const openPanel = document.querySelector('.mobile-panel-overlay.is-open');
    if (openPanel) {
        openPanel.classList.remove('is-open');
        
        // Reset ARIA states
        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.setAttribute('aria-selected', 'false');
        });
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Clone Task Manager content to mobile panel
function cloneTaskManagerContent() {
    const taskManager = document.getElementById('task-manager');
    const mobileContent = document.getElementById('mobile-tasks-content');
    
    if (taskManager && mobileContent) {
        // Clear existing content
        mobileContent.innerHTML = '';
        
        // Clone the task manager content
        const clone = taskManager.cloneNode(true);
        clone.id = 'mobile-task-manager'; // Change ID to avoid conflicts
        
        // Update any IDs in the cloned content to avoid conflicts
        const elementsWithIds = clone.querySelectorAll('[id]');
        elementsWithIds.forEach(el => {
            if (el.id) {
                el.id = 'mobile-' + el.id;
            }
        });
        
        mobileContent.appendChild(clone);
        
        // Ensure the first tab is active by default
        const firstTab = clone.querySelector('.card-tab');
        const firstTabContent = clone.querySelector('.tab-content');
        if (firstTab && firstTabContent) {
            firstTab.classList.add('active');
            firstTabContent.classList.add('active');
        }
        
        // Re-render task list in mobile view
        refreshMobileTaskList(clone);
        
        // Re-bind event listeners for the mobile version
        bindMobileTaskManagerEvents();
    }
}

// Refresh task list in mobile view
function refreshMobileTaskList(container) {
    const taskList = container.querySelector('#mobile-task-list');
    if (taskList && typeof window.renderTasks === 'function') {
        // Clear existing tasks
        taskList.innerHTML = '';
        
        // Get tasks from global state
        const tasks = window.tasks || [];
        
        // Render tasks in mobile container
        tasks.forEach(task => {
            if (!task.completed) {
                const taskElement = createMobileTaskElement(task);
                taskList.appendChild(taskElement);
            }
        });
    }
}

// Create mobile task element
function createMobileTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.taskId = task.id;
    
    const priorityClass = `priority-${task.priority || 3}`;
    const timeString = task.scheduledTime ? 
        new Date(task.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
        'No time set';
    
    taskItem.innerHTML = `
        <div class="task-checkbox-container">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        </div>
        <div class="task-content">
            <div class="task-header">
                <span class="task-title">${task.name}</span>
                <span class="task-time">${timeString}</span>
            </div>
            <div class="task-meta">
                <span class="task-priority ${priorityClass}">Priority ${task.priority || 3}</span>
                <span class="task-duration">${task.duration || 30}min</span>
            </div>
        </div>
    `;
    
    return taskItem;
}

// Clone Schedule content to mobile panel
function cloneScheduleContent() {
    const schedule = document.getElementById('todays-schedule');
    const mobileContent = document.getElementById('mobile-schedule-content');
    
    if (schedule && mobileContent) {
        // Clear existing content
        mobileContent.innerHTML = '';
        
        // Clone the schedule content
        const clone = schedule.cloneNode(true);
        clone.id = 'mobile-todays-schedule'; // Change ID to avoid conflicts
        
        // Update any IDs in the cloned content to avoid conflicts
        const elementsWithIds = clone.querySelectorAll('[id]');
        elementsWithIds.forEach(el => {
            if (el.id) {
                el.id = 'mobile-' + el.id;
            }
        });
        
        mobileContent.appendChild(clone);
        
        // Initialize the mobile schedule properly
        const mobileTimeColumn = clone.querySelector('.time-column');
        const mobileScheduleContent = clone.querySelector('.schedule-content');
        
        if (mobileTimeColumn && mobileScheduleContent) {
            // Clear existing content
            mobileTimeColumn.innerHTML = '';
            mobileScheduleContent.innerHTML = '';
            
            // Initialize time column (copy from main script logic)
            initializeMobileScheduleTimeColumn(mobileTimeColumn);
            
            // Re-render schedule items
            renderMobileSchedule(mobileScheduleContent);
            
            // Update current time display
            const mobileCurrentTime = clone.querySelector('#mobile-current-time');
            if (mobileCurrentTime) {
                const now = new Date();
                const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                mobileCurrentTime.textContent = timeString;
            }
        }
    }
}

// Initialize time column for mobile schedule
function initializeMobileScheduleTimeColumn(timeColumn) {
    // Create hour labels (same as main script)
    for (let hour = 0; hour < 24; hour++) {
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.style.top = `${(hour / 24) * 100}%`;
        
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        timeLabel.textContent = `${displayHour}:00 ${ampm}`;
        
        timeColumn.appendChild(timeLabel);
        
        // Add hour divider
        const hourDivider = document.createElement('div');
        hourDivider.className = 'hour-divider';
        hourDivider.style.top = `${(hour / 24) * 100}%`;
        timeColumn.appendChild(hourDivider);
    }
}

// Bind event listeners for mobile task manager
function bindMobileTaskManagerEvents() {
    // Re-bind tab functionality for mobile
    const mobileTabs = document.querySelectorAll('#mobile-tasks-content .card-tab');
    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all mobile tabs
            mobileTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabId = tab.dataset.tab;
            const mobileTabContents = document.querySelectorAll('#mobile-tasks-content .tab-content');
            mobileTabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.querySelector(`#mobile-tasks-content #${tabId}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // Re-bind task item click handlers
    const mobileTaskItems = document.querySelectorAll('#mobile-tasks-content .task-item');
    mobileTaskItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('task-checkbox')) return;
            
            const taskId = item.dataset.taskId;
            if (taskId && taskId !== window.currentTaskId) {
                // Close mobile panel first
                closeMobilePanel();
                // Then switch to task
                setTimeout(() => {
                    if (typeof window.switchToTask === 'function') {
                        window.switchToTask(taskId);
                    }
                }, 300);
            }
        });
    });
    
    // Re-bind import/export buttons with more robust selectors
    const mobileImportBtn = document.querySelector('#mobile-tasks-content [id*="import-btn"]');
    const mobileExportBtn = document.querySelector('#mobile-tasks-content [id*="export-btn"]');
    const mobileTimesheetBtn = document.querySelector('#mobile-tasks-content [id*="timesheet-btn"]');
    
    if (mobileImportBtn) {
        mobileImportBtn.addEventListener('click', function() {
            if (typeof window.importTasks === 'function') {
                window.importTasks();
            }
        });
    }
    if (mobileExportBtn) {
        mobileExportBtn.addEventListener('click', function() {
            if (typeof window.exportTasks === 'function') {
                window.exportTasks();
            }
        });
    }
    if (mobileTimesheetBtn) {
        mobileTimesheetBtn.addEventListener('click', function() {
            if (typeof window.generateTimesheet === 'function') {
                window.generateTimesheet();
            }
        });
    }
    
    // Also bind any file input for import
    const mobileFileInput = document.querySelector('#mobile-tasks-content input[type="file"]');
    if (mobileFileInput) {
        mobileFileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0 && typeof window.handleFileImport === 'function') {
                window.handleFileImport(e);
            }
        });
    }
}

// Render schedule in mobile view
function renderMobileSchedule(container) {
    if (!container) return;
    
    // Use the same logic as the main renderSchedule function
    // but target the mobile container
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Get tasks for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Access global tasks array
    const tasks = window.tasks || [];
    const currentTaskId = window.currentTaskId;
    
    const todayTasks = tasks.filter(task => {
        if (!task.scheduledTime) return false;
        const taskDate = new Date(task.scheduledTime);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
    });
    
    // Sort tasks by scheduled time
    todayTasks.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
    
    // Render each task
    todayTasks.forEach(task => {
        const taskTime = new Date(task.scheduledTime);
        const taskHour = taskTime.getHours();
        const taskMinute = taskTime.getMinutes();
        
        // Calculate position (simplified for mobile)
        const topPosition = ((taskHour * 60 + taskMinute) / (24 * 60)) * 100;
        const height = (task.duration / (24 * 60)) * 100;
        
        let className = 'future-task';
        if (task.id === currentTaskId) {
            className = 'current-task';
        } else if (task.completed) {
            className = 'completed-task';
        }
        
        // Use global createScheduleItem function if available
        if (typeof window.createScheduleItem === 'function') {
            window.createScheduleItem(container, task, topPosition, Math.max(height, 2), className);
        } else {
            // Fallback: create a simple schedule item
            createSimpleScheduleItem(container, task, topPosition, Math.max(height, 2), className);
        }
    });
}

// Fallback function to create simple schedule items
function createSimpleScheduleItem(container, task, topPosition, height, className) {
    const scheduleItem = document.createElement('div');
    scheduleItem.className = `schedule-item ${className}`;
    scheduleItem.style.top = `${topPosition}%`;
    scheduleItem.style.height = `${height}%`;
    scheduleItem.dataset.taskId = task.id;
    
    const taskTime = new Date(task.scheduledTime);
    const timeString = taskTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    scheduleItem.innerHTML = `
        <div class="schedule-item-time">${timeString}</div>
        <div class="schedule-item-name">${task.name}</div>
        <div class="schedule-item-duration">${task.duration}min</div>
    `;
    
    container.appendChild(scheduleItem);
}
