// taskUI.js - Task-related UI components and interactions

import AppState from '../core/state.js';
import { 
    addTask, 
    getTaskById, 
    updateTask, 
    deleteTask, 
    completeTask, 
    setCurrentTask, 
    getCurrentTask,
    getIncompleteTasks,
    getCompletedTasks
} from './taskManager.js';
import { startTaskTracking, pauseTaskTracking } from '../timeTracking/timeTracker.js';
import { showTooltip, hideTooltip } from '../utils/uiUtils.js';

// Show add task modal
function showAddTaskModal() {
    document.getElementById('add-task-modal').style.display = 'flex';
    document.getElementById('task-name-input').focus();
}

// Hide add task modal
function hideAddTaskModal() {
    document.getElementById('add-task-modal').style.display = 'none';
    document.getElementById('task-form').reset();
}

// Save a new task
function saveTask() {
    const taskName = document.getElementById('task-name-input').value.trim();
    
    if (!taskName) {
        alert('Please enter a task name');
        return;
    }
    
    const taskData = {
        name: taskName,
        description: document.getElementById('task-description-input').value.trim(),
        duration: document.getElementById('task-duration-input').value,
        priority: document.getElementById('task-priority-input').value,
        tags: document.getElementById('task-tags-input').value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0),
        deadline: document.getElementById('task-deadline-input').value || null
    };
    
    addTask(taskData);
    
    hideAddTaskModal();
    renderTasks();
}

// Render all tasks
function renderTasks() {
    const incompleteTasks = getIncompleteTasks();
    const completedTasks = getCompletedTasks();
    
    // Show/hide appropriate containers
    const noTasksMessage = document.getElementById('no-tasks-message');
    const tasksContainer = document.getElementById('tasks-container');
    
    if (incompleteTasks.length === 0 && completedTasks.length === 0) {
        noTasksMessage.style.display = 'flex';
        tasksContainer.style.display = 'none';
    } else {
        noTasksMessage.style.display = 'none';
        tasksContainer.style.display = 'block';
    }
    
    // Render incomplete tasks
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';
    
    incompleteTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
    
    // Render completed tasks
    const completedTasksList = document.getElementById('completed-tasks-list');
    completedTasksList.innerHTML = '';
    
    completedTasks.forEach(task => {
        const taskElement = createTaskElement(task, true);
        completedTasksList.appendChild(taskElement);
    });
    
    // Update current task display
    updateCurrentTaskDisplay();
}

// Create a task element
function createTaskElement(task, isCompleted = false) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.dataset.taskId = task.id;
    
    // Priority indicator
    const priorityClass = getPriorityClass(task.priority);
    
    // Task content
    taskElement.innerHTML = `
        <div class="task-item-content">
            <div class="task-item-left">
                <div class="priority-indicator ${priorityClass}"></div>
                <div class="task-item-details">
                    <div class="task-item-name">${task.name}</div>
                    <div class="task-item-meta">
                        <span class="task-duration">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${task.duration} min
                        </span>
                        ${task.deadline ? `
                        <span class="task-deadline">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formatDeadline(task.deadline)}
                        </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="task-item-right">
                ${isCompleted ? `
                <div class="task-completed-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Completed
                </div>
                ` : `
                <button class="btn btn-sm btn-primary start-task-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Start
                </button>
                `}
            </div>
        </div>
    `;
    
    // Add tags if present
    if (task.tags && task.tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'task-tags';
        
        task.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'task-tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
        
        taskElement.appendChild(tagsContainer);
    }
    
    // Add event listeners
    if (!isCompleted) {
        const startBtn = taskElement.querySelector('.start-task-btn');
        startBtn.addEventListener('click', () => {
            startTask(task.id);
        });
    }
    
    // Add tooltip with description if available
    if (task.description) {
        taskElement.addEventListener('mouseenter', (event) => {
            showTooltip(task.description, event);
        });
        
        taskElement.addEventListener('mouseleave', () => {
            hideTooltip();
        });
    }
    
    return taskElement;
}

// Get priority class for CSS
function getPriorityClass(priority) {
    switch (parseInt(priority)) {
        case 1: return 'lowest';
        case 2: return 'low';
        case 3: return 'medium';
        case 4: return 'high';
        case 5: return 'urgent';
        default: return 'medium';
    }
}

// Format deadline for display
function formatDeadline(deadlineStr) {
    if (!deadlineStr) return '';
    
    const deadline = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Format date
    const options = { month: 'short', day: 'numeric' };
    const dateStr = deadline.toLocaleDateString('en-US', options);
    
    // Add relative time
    let relativeTime = '';
    if (deadline.getTime() === today.getTime()) {
        relativeTime = ' (Today)';
    } else if (deadline.getTime() === tomorrow.getTime()) {
        relativeTime = ' (Tomorrow)';
    } else if (diffDays > 0 && diffDays < 7) {
        relativeTime = ` (${diffDays} days)`;
    }
    
    return dateStr + relativeTime;
}

// Start a task
function startTask(taskId) {
    // If there's a current task, confirm switch
    if (AppState.currentTaskId && AppState.currentTaskId !== taskId) {
        confirmTaskSwitch(taskId);
        return;
    }
    
    // Otherwise, start the task directly
    switchToTask(taskId);
}

// Confirm task switch
function confirmTaskSwitch(newTaskId) {
    const currentTask = getCurrentTask();
    const newTask = getTaskById(newTaskId);
    
    if (currentTask && newTask) {
        // Set up the confirmation modal
        document.getElementById('current-task-name-confirm').textContent = currentTask.name;
        document.getElementById('new-task-name-confirm').textContent = newTask.name;
        
        // Set the action for the confirm button
        const confirmBtn = document.getElementById('confirm-switch-btn');
        confirmBtn.dataset.action = 'switch';
        confirmBtn.dataset.switchToId = newTaskId;
        confirmBtn.textContent = 'Switch Tasks';
        
        // Show the modal
        document.getElementById('task-switch-modal').style.display = 'flex';
    }
}

// Cancel task switch
function cancelTaskSwitch() {
    document.getElementById('task-switch-modal').style.display = 'none';
}

// Switch to a task
function switchToTask(taskId) {
    // End current task if there is one
    if (AppState.currentTaskId && AppState.currentTaskId !== taskId) {
        pauseTaskTracking();
    }
    
    // Set new current task
    setCurrentTask(taskId);
    
    // Start tracking the new task
    startTaskTracking(taskId);
    
    // Update UI
    updateCurrentTaskDisplay();
    renderTasks();
    
    // Hide the confirmation modal if it was open
    document.getElementById('task-switch-modal').style.display = 'none';
}

// Update current task display
function updateCurrentTaskDisplay() {
    const currentTask = getCurrentTask();
    const currentTaskCard = document.getElementById('current-task-card');
    
    if (currentTask) {
        // Show current task card
        currentTaskCard.style.display = 'block';
        
        // Update task details
        document.getElementById('current-task-name').textContent = currentTask.name;
        document.getElementById('current-task-description').textContent = currentTask.description || 'No description provided';
        
        // Update progress
        const progressValue = currentTask.progress || 0;
        document.getElementById('current-task-progress').textContent = `${progressValue}%`;
        document.getElementById('current-task-progress-bar').style.width = `${progressValue}%`;
        
        // Update time remaining
        updateTimeRemaining(currentTask);
        
        // Update priority
        const priorityElement = document.getElementById('current-task-priority');
        const priorityClass = getPriorityClass(currentTask.priority);
        const priorityText = AppState.PRIORITIES[currentTask.priority];
        
        priorityElement.innerHTML = `
            <div class="priority-indicator ${priorityClass}"></div>
            <span class="detail-value-text">${priorityText}</span>
        `;
        
        // Update deadline
        if (currentTask.deadline) {
            document.getElementById('current-task-deadline').textContent = formatDeadline(currentTask.deadline);
        } else {
            document.getElementById('current-task-deadline').textContent = 'No deadline';
        }
        
        // Update tags
        const tagsContainer = document.getElementById('current-task-tags');
        tagsContainer.innerHTML = '';
        
        if (currentTask.tags && currentTask.tags.length > 0) {
            currentTask.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'task-tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        }
        
        // Update pause button text based on state
        const pauseBtn = document.getElementById('pause-btn');
        if (AppState.isPaused) {
            pauseBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Resume
            `;
        } else {
            pauseBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                Pause
            `;
        }
    } else {
        // Hide current task card if no current task
        currentTaskCard.style.display = 'none';
    }
}

// Update time remaining display
function updateTimeRemaining(task) {
    if (!task) return;
    
    const timeSpentMinutes = Math.floor(task.timeSpent / 60000);
    const durationMinutes = task.duration;
    const remainingMinutes = Math.max(0, durationMinutes - timeSpentMinutes);
    
    let timeText = '';
    if (remainingMinutes > 60) {
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;
        timeText = `${hours}h ${minutes}m remaining`;
    } else {
        timeText = `${remainingMinutes} mins remaining`;
    }
    
    document.getElementById('current-task-time-remaining').textContent = timeText;
}

// Complete current task
function completeCurrentTask() {
    if (AppState.currentTaskId) {
        // Get progress value if needed
        const progress = 100; // Default to 100% for completed tasks
        
        completeTask(AppState.currentTaskId, progress);
        pauseTaskTracking();
        
        renderTasks();
    }
}

// Reschedule current task
function rescheduleCurrentTask() {
    if (AppState.currentTaskId) {
        // Show progress slider
        document.getElementById('progress-slider-container').style.display = 'block';
        
        // Set up the confirmation modal
        const currentTask = getCurrentTask();
        document.getElementById('switch-modal-title').textContent = 'Reschedule Task';
        document.getElementById('switch-modal-question').textContent = `How much progress have you made on "${currentTask.name}"?`;
        
        // Set the action for the confirm button
        const confirmBtn = document.getElementById('confirm-switch-btn');
        confirmBtn.dataset.action = 'reschedule';
        confirmBtn.dataset.taskId = AppState.currentTaskId;
        confirmBtn.textContent = 'Reschedule Task';
        
        // Show the modal
        document.getElementById('task-switch-modal').style.display = 'flex';
    }
}

// Complete reschedule
function completeReschedule(taskId) {
    const progressValue = parseInt(document.getElementById('progress-slider').value);
    
    // Update task progress
    updateTask(taskId, { progress: progressValue });
    
    // End current task tracking
    pauseTaskTracking();
    
    // Clear current task
    AppState.currentTaskId = null;
    AppState.saveToLocalStorage();
    
    // Update UI
    renderTasks();
    
    // Hide the modal
    document.getElementById('task-switch-modal').style.display = 'none';
    document.getElementById('progress-slider-container').style.display = 'none';
}

// Mark current task as distracted
function markDistracted() {
    if (AppState.currentTaskId) {
        // Pause the current task
        handlePause('distracted');
    }
}

// Setup priority slider
function setupPrioritySlider() {
    const slider = document.getElementById('task-priority-input');
    const label = document.getElementById('priority-label');
    
    // Update label on slider change
    slider.addEventListener('input', () => {
        const value = parseInt(slider.value);
        label.textContent = AppState.PRIORITIES[value];
    });
}

// Setup duration buttons
function setupDurationButtons() {
    const durationBtns = document.querySelectorAll('.duration-btn');
    const durationInput = document.getElementById('task-duration-input');
    
    durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            durationBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Set duration value
            durationInput.value = btn.dataset.duration;
        });
    });
    
    // Set default active button (30 min)
    document.querySelector('.duration-btn[data-duration="30"]').classList.add('active');
}

// Handle pause button click
function handlePause(reason = null) {
    if (reason) {
        // If reason is provided, pause immediately with that reason
        confirmPause(reason);
    } else {
        // Otherwise show the pause reason modal
        document.getElementById('pause-reason-modal').style.display = 'flex';
    }
}

// Confirm pause with reason
function confirmPause(reason) {
    // Get reason from UI if not provided
    if (!reason) {
        const activeReasonBtn = document.querySelector('.pause-reason-btn.active');
        
        if (activeReasonBtn) {
            reason = activeReasonBtn.dataset.reason;
            
            // If reason is "other", get the custom reason
            if (reason === 'other') {
                const otherReason = document.getElementById('other-reason-input').value.trim();
                if (otherReason) {
                    reason = otherReason;
                }
            }
        }
    }
    
    // Store the reason
    AppState.pauseReason = reason;
    
    // Pause the task tracking
    pauseTaskTracking(reason);
    
    // Update UI
    updateCurrentTaskDisplay();
    
    // Hide the pause reason modal
    document.getElementById('pause-reason-modal').style.display = 'none';
    
    // Reset the form
    document.querySelectorAll('.pause-reason-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('other-reason-group').style.display = 'none';
    document.getElementById('other-reason-input').value = '';
}

// Setup pause reason modal
function setupPauseReasonModal() {
    const reasonBtns = document.querySelectorAll('.pause-reason-btn');
    const otherReasonGroup = document.getElementById('other-reason-group');
    
    // Setup reason buttons
    reasonBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            reasonBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Show other reason input if "Other" is selected
            if (btn.dataset.reason === 'other') {
                otherReasonGroup.style.display = 'block';
            } else {
                otherReasonGroup.style.display = 'none';
            }
        });
    });
    
    // Setup cancel button
    document.getElementById('cancel-pause-btn').addEventListener('click', () => {
        document.getElementById('pause-reason-modal').style.display = 'none';
    });
    
    // Setup confirm button
    document.getElementById('confirm-pause-btn').addEventListener('click', () => confirmPause());
}

// Resume task after break
function resumeTask() {
    // Hide break timer overlay
    document.getElementById('break-timer-overlay').style.display = 'none';
    
    // Show break notes if needed
    const breakNotesContainer = document.getElementById('break-notes-container');
    breakNotesContainer.style.display = 'block';
}

// Save break notes
function saveBreakNotes() {
    const notes = document.getElementById('break-notes-input').value.trim();
    
    // Store notes if provided
    if (notes) {
        // Find the last break time block
        const lastBreakIndex = AppState.timeBlocks.findIndex(block => 
            block.type === 'break' && !block.endTime
        );
        
        if (lastBreakIndex !== -1) {
            AppState.timeBlocks[lastBreakIndex].notes = notes;
            AppState.saveToLocalStorage();
        }
    }
    
    // Resume the current task
    if (AppState.currentTaskId) {
        AppState.isPaused = false;
        AppState.pauseReason = null;
        AppState.saveToLocalStorage();
        
        // Start tracking again
        startTaskTracking(AppState.currentTaskId);
        
        // Update UI
        updateCurrentTaskDisplay();
    }
    
    // Hide break timer overlay
    document.getElementById('break-timer-overlay').style.display = 'none';
    
    // Reset break notes
    document.getElementById('break-notes-input').value = '';
    document.getElementById('break-notes-container').style.display = 'none';
}

// Skip break notes
function skipBreakNotes() {
    // Resume the current task without saving notes
    if (AppState.currentTaskId) {
        AppState.isPaused = false;
        AppState.pauseReason = null;
        AppState.saveToLocalStorage();
        
        // Start tracking again
        startTaskTracking(AppState.currentTaskId);
        
        // Update UI
        updateCurrentTaskDisplay();
    }
    
    // Hide break timer overlay
    document.getElementById('break-timer-overlay').style.display = 'none';
    
    // Reset break notes
    document.getElementById('break-notes-input').value = '';
    document.getElementById('break-notes-container').style.display = 'none';
}

export {
    showAddTaskModal,
    hideAddTaskModal,
    saveTask,
    renderTasks,
    startTask,
    confirmTaskSwitch,
    cancelTaskSwitch,
    switchToTask,
    updateCurrentTaskDisplay,
    completeCurrentTask,
    rescheduleCurrentTask,
    completeReschedule,
    markDistracted,
    setupPrioritySlider,
    setupDurationButtons,
    handlePause,
    confirmPause,
    setupPauseReasonModal,
    resumeTask,
    saveBreakNotes,
    skipBreakNotes
};
