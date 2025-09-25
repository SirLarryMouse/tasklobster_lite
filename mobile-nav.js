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
        
        // Re-bind event listeners for the mobile version
        bindMobileTaskManagerEvents();
    }
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
        
        // Re-render schedule in mobile view
        const mobileScheduleContent = clone.querySelector('.schedule-content');
        if (mobileScheduleContent) {
            // Clear and re-render schedule items
            const items = mobileScheduleContent.querySelectorAll('.schedule-item');
            items.forEach(item => item.remove());
            
            // Re-render schedule items (reuse existing render logic)
            renderMobileSchedule(mobileScheduleContent);
        }
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
    
    // Re-bind import/export buttons
    const mobileImportBtn = document.querySelector('#mobile-tasks-content #mobile-import-btn');
    const mobileExportBtn = document.querySelector('#mobile-tasks-content #mobile-export-btn');
    const mobileTimesheetBtn = document.querySelector('#mobile-tasks-content #mobile-timesheet-btn');
    
    if (mobileImportBtn && typeof window.importTasks === 'function') {
        mobileImportBtn.addEventListener('click', window.importTasks);
    }
    if (mobileExportBtn && typeof window.exportTasks === 'function') {
        mobileExportBtn.addEventListener('click', window.exportTasks);
    }
    if (mobileTimesheetBtn && typeof window.generateTimesheet === 'function') {
        mobileTimesheetBtn.addEventListener('click', window.generateTimesheet);
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
