// Global variables
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentTaskId = localStorage.getItem('currentTaskId') || null;
let timeBlocks = JSON.parse(localStorage.getItem('timeBlocks')) || [];
let focusTime = parseInt(localStorage.getItem('focusTime')) || 0;
let lastTimestamp = null;
let pauseTimestamp = null;
let isPaused = localStorage.getItem('isPaused') === 'true';
let pauseReason = null;
let breakTimerInterval = null;
let breakDuration = 0;

// Priority names
const PRIORITIES = {
    1: 'Lowest',
    2: 'Low',
    3: 'Medium',
    4: 'High',
    5: 'Urgent'
};

// Add a custom tooltip element to the DOM
const tooltipElement = document.createElement('div');
tooltipElement.className = 'custom-tooltip';
document.body.appendChild(tooltipElement);

// Variables to track tooltip state
let tooltipVisible = false;
let tooltipTimeout = null;

// Function to show tooltip
function showTooltip(content, event) {
    // Clear any existing timeout
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    
    // Set tooltip content
    tooltipElement.innerHTML = content;
    
    // Position tooltip near the mouse
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    
    // Ensure tooltip stays within viewport
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust position if needed
    const adjustedX = Math.min(x, viewportWidth - tooltipRect.width - 20);
    const adjustedY = Math.min(y, viewportHeight - tooltipRect.height - 20);
    
    // Set position
    tooltipElement.style.left = `${adjustedX}px`;
    tooltipElement.style.top = `${adjustedY}px`;
    
    // Show tooltip
    tooltipElement.classList.add('visible');
    tooltipVisible = true;
}

// Function to hide tooltip
function hideTooltip() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    
    tooltipTimeout = setTimeout(() => {
        tooltipElement.classList.remove('visible');
        tooltipVisible = false;
    }, 200);
}

// Initialize the app
function init() {
    // Set current date
    updateDateDisplay();
    
    // Setup event listeners
    document.getElementById('add-task-btn').addEventListener('click', showAddTaskModal);
    document.getElementById('cancel-task-btn').addEventListener('click', hideAddTaskModal);
    document.getElementById('save-task-btn').addEventListener('click', saveTask);
    document.getElementById('pause-btn').addEventListener('click', handlePause);
    document.getElementById('complete-btn').addEventListener('click', completeCurrentTask);
    document.getElementById('reschedule-btn').addEventListener('click', rescheduleCurrentTask);
    document.getElementById('distracted-btn').addEventListener('click', markDistracted);
    document.getElementById('resume-break-btn').addEventListener('click', resumeTask);
    document.getElementById('save-break-notes-btn').addEventListener('click', saveBreakNotes);
    document.getElementById('skip-break-notes-btn').addEventListener('click', skipBreakNotes);
    document.getElementById('confirm-switch-btn').addEventListener('click', function() {
        const action = this.dataset.action || 'switch';
        
        if (action === 'switch') {
            const switchToId = this.dataset.switchToId;
            if (switchToId) {
                switchToTask(switchToId);
            }
        } else if (action === 'reschedule') {
            const taskId = this.dataset.taskId;
            if (taskId) {
                completeReschedule(taskId);
            }
        }
    });
    document.getElementById('cancel-switch-btn').addEventListener('click', cancelTaskSwitch);
    
    // Progress slider
    document.getElementById('progress-slider').addEventListener('input', function() {
        document.getElementById('progress-value').textContent = `${this.value}%`;
    });
    
    // Tab navigation
    setupTabs();
    
    // Priority slider
    setupPrioritySlider();
    
    // Duration buttons
    setupDurationButtons();
    
    // Pause reason modal
    setupPauseReasonModal();
    
    // Import/Export
    document.getElementById('import-btn').addEventListener('click', importTasks);
    document.getElementById('export-btn').addEventListener('click', exportTasks);
    document.getElementById('timesheet-btn').addEventListener('click', generateTimesheet);
    document.getElementById('copy-export-btn').addEventListener('click', copyExportText);
    document.getElementById('close-timesheet-btn').addEventListener('click', hideTimesheetModal);
    document.getElementById('download-timesheet-btn').addEventListener('click', downloadTimesheet);
    
    // Setup time tracking
    setInterval(updateTimeTracking, 1000);
    
    // Initialize the schedule
    initializeSchedule();
    
    // Render tasks
    renderTasks();
    
    // Update current time
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Update every minute
    
    // Start tracking current task if one exists
    if (currentTaskId && !isPaused) {
        startTaskTracking(currentTaskId);
    }
}

// Update the date display
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('en-US', options);
    const currentDateElement = document.getElementById('current-date'); if (currentDateElement) { currentDateElement.textContent = dateString; }
}

// Setup tab navigation
function setupTabs() {
    const tabs = document.querySelectorAll('.card-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Setup priority slider
function setupPrioritySlider() {
    const slider = document.getElementById('task-priority-input');
    const label = document.getElementById('priority-label');
    
    // Update label on slider change
    slider.addEventListener('input', () => {
        const value = parseInt(slider.value);
        label.textContent = PRIORITIES[value];
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
    document.getElementById('confirm-pause-btn').addEventListener('click', confirmPause);
}

// Initialize the schedule with hour dividers and time labels
function initializeSchedule() {
    const timeColumn = document.querySelector('.time-column');
    const scheduleContent = document.getElementById('schedule-content');
    
    // Clear previous content
    timeColumn.innerHTML = '';
    scheduleContent.innerHTML = '';
    
    // Add time labels and hour dividers
    for (let hour = 0; hour <= 23; hour++) {
        // Add time label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.style.top = `${(hour) * (100/24)}%`; // Distribute evenly across 24 hours
        timeLabel.textContent = hour > 12 ? `${hour-12}pm` : hour === 12 ? '12pm' : hour === 0 ? '12am' : `${hour}am`;
        timeColumn.appendChild(timeLabel);
        
        // Add hour divider
        const hourDivider = document.createElement('div');
        hourDivider.className = 'hour-divider';
        hourDivider.style.top = `${(hour) * (100/24)}%`;
        scheduleContent.appendChild(hourDivider);
    }
    
    // Add current time indicator
    updateCurrentTimeIndicator();
    
    // Update schedule items
    renderSchedule();
}

// Update the current time indicator on the schedule
function updateCurrentTimeIndicator() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Create or update current time indicator
    let indicator = document.querySelector('.current-time-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'current-time-indicator';
        
        const label = document.createElement('div');
        label.className = 'current-time-label';
        label.textContent = 'Now';
        
        indicator.appendChild(label);
        document.getElementById('schedule-content').appendChild(indicator);
    }
    
    // Position the indicator based on 24-hour schedule
    const position = (hours + minutes / 60) * (100/24);
    indicator.style.top = `${position}%`;
}

// Update the current time display
function updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert to 12-hour format
    
    document.getElementById('current-time').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${displayHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}
    `;
    
    // Also update the time indicator
    updateCurrentTimeIndicator();
}

// Start tracking time for a task
function startTaskTracking(taskId) {
    const now = new Date();
    
    // Create a new time block
    const timeBlock = {
        id: Date.now().toString(),
        taskId: taskId,
        startTime: now.toISOString(),
        originalStartTime: now.toISOString(), // Store original start time
        endTime: null,
        type: 'task'
    };
    
    // Add to timeBlocks array
    timeBlocks.push(timeBlock);
    
    // Set lastTimestamp for continuous tracking
    lastTimestamp = Date.now();
    
    // Save to localStorage
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
}

// End tracking time for a task
function endTaskTracking(taskId, reason = 'completed') {
    const now = new Date();
    
    // Find the open time block for this task
    const timeBlockIndex = timeBlocks.findIndex(block => 
        block.taskId === taskId && block.endTime === null
    );
    
    if (timeBlockIndex !== -1) {
        // Update end time
        timeBlocks[timeBlockIndex].endTime = now.toISOString();
        timeBlocks[timeBlockIndex].reason = reason;
        
        // Save to localStorage
        localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    }
}

// Show the add task modal
function showAddTaskModal() {
    document.getElementById('add-task-modal').style.display = 'flex';
    document.getElementById('task-name-input').focus();
}

// Hide the add task modal
function hideAddTaskModal() {
    document.getElementById('add-task-modal').style.display = 'none';
    document.getElementById('task-form').reset();
    
    // Reset duration buttons
    document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.duration-btn[data-duration="30"]').classList.add('active');
    document.getElementById('task-duration-input').value = '30';
    
    // Reset priority slider
    document.getElementById('task-priority-input').value = '3';
    document.getElementById('priority-label').textContent = 'Medium';
}

// Save a new task
function saveTask() {
    const nameInput = document.getElementById('task-name-input');
    const descriptionInput = document.getElementById('task-description-input');
    const durationInput = document.getElementById('task-duration-input');
    const priorityInput = document.getElementById('task-priority-input');
    const tagsInput = document.getElementById('task-tags-input');
    const deadlineInput = document.getElementById('task-deadline-input');
    
    if (!nameInput.value.trim()) {
        alert('Task name is required!');
        return;
    }
    
    const task = {
        id: Date.now().toString(),
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        duration: parseInt(durationInput.value),
        timeRemaining: parseInt(durationInput.value),
        priority: parseInt(priorityInput.value),
        tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
        deadline: deadlineInput.value || null,
        createdAt: new Date().toISOString(),
        completed: false,
        progress: 0,
        rescheduleCount: 0
    };
    
    // Add the task to our array
    tasks.push(task);
    
    // If this is the first task, make it the current task
    if (!currentTaskId && tasks.length === 1) {
        currentTaskId = task.id;
        startTaskTracking(currentTaskId);
    }
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Rerender
    renderTasks();
    
    // Hide the modal
    hideAddTaskModal();
}

// Handle pause button click
function handlePause() {
    if (!isPaused) {
        // Show pause reason modal
        document.getElementById('pause-reason-modal').style.display = 'flex';
        
        // Reset active state and other input
        document.querySelectorAll('.pause-reason-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('other-reason-group').style.display = 'none';
        document.getElementById('other-reason-input').value = '';
    } else {
        // Resume directly if already paused
        resumeTask();
    }
}

// Confirm pause after selecting reason
function confirmPause() {
    const activeReasonBtn = document.querySelector('.pause-reason-btn.active');
    
    if (!activeReasonBtn) {
        alert('Please select a reason for pausing.');
        return;
    }
    
    const reason = activeReasonBtn.dataset.reason;
    let reasonText = reason;
    
    // Get custom reason text if "other" is selected
    if (reason === 'other') {
        const otherInput = document.getElementById('other-reason-input');
        if (!otherInput.value.trim()) {
            alert('Please specify your reason.');
            return;
        }
        reasonText = otherInput.value.trim();
    }
    
    // End tracking for current task
    if (currentTaskId) {
        endTaskTracking(currentTaskId, 'paused');
    }
    
    // Record pause
    isPaused = true;
    pauseReason = reasonText;
    pauseTimestamp = Date.now();
    
    // Create a new time block for the break
    const now = new Date();
    const breakBlock = {
        id: Date.now().toString(),
        taskId: null,
        reason: reasonText,
        startTime: now.toISOString(),
        endTime: null,
        type: 'break'
    };
    
    // Add to timeBlocks array
    timeBlocks.push(breakBlock);
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    
    // Update UI
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        Resume
    `;
    
    // Re-render the schedule to show the break
    renderSchedule();
    
    // Hide the modal
    document.getElementById('pause-reason-modal').style.display = 'none';

    // Show break timer overlay
    document.getElementById('break-timer-overlay').style.display = 'flex';
    document.getElementById('break-timer-reason').textContent = reasonText;
    document.getElementById('break-timer-display').textContent = '00:00';

    // Add body class for styling
    document.body.classList.add('break-mode');

    // Start the break timer
    breakDuration = 0;
    breakTimerInterval = setInterval(updateBreakTimer, 1000);

    // Hide the modal
    document.getElementById('pause-reason-modal').style.display = 'none';
}

function updateBreakTimer() {
    breakDuration++;
    const minutes = Math.floor(breakDuration / 60);
    const seconds = breakDuration % 60;
      
    document.getElementById('break-timer-display').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function resumeTask() {
    if (!isPaused) return;
    
    // First show the notes prompt
    const breakTimerContainer = document.getElementById('break-timer-overlay');
    const breakNotesContainer = document.getElementById('break-notes-container');
    
    // Clear the timer interval
    clearInterval(breakTimerInterval);
    
    // Show notes input, hide resume button
    document.getElementById('resume-break-btn').style.display = 'none';
    breakNotesContainer.style.display = 'block';
}

// Add these new functions
function saveBreakNotes() {
    const notes = document.getElementById('break-notes-input').value.trim();
    
    // Find the open break block
    const breakBlockIndex = timeBlocks.findIndex(block => 
        block.type === 'break' && block.endTime === null
    );
    
    if (breakBlockIndex !== -1 && notes) {
        timeBlocks[breakBlockIndex].notes = notes;
    }
    
    // Complete the resume process
    completeResume();
}

function skipBreakNotes() {
    // Complete the resume process without saving notes
    completeResume();
}

function completeResume() {
    // Find and end the break time block
    const breakBlockIndex = timeBlocks.findIndex(block => 
        block.type === 'break' && block.endTime === null
    );
    
    if (breakBlockIndex !== -1) {
        timeBlocks[breakBlockIndex].endTime = new Date().toISOString();
    }

    // Reset pause state
    isPaused = false;
    pauseReason = null;
    pauseTimestamp = null;

    // Update UI
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
        Pause
    `;

    // Hide overlay
    document.getElementById('break-timer-overlay').style.display = 'none';
    document.getElementById('break-notes-container').style.display = 'none';
    document.getElementById('resume-break-btn').style.display = 'block';
    document.getElementById('break-notes-input').value = '';

    document.body.classList.remove('break-mode');

    // Resume task tracking
    if (currentTaskId) {
        startTaskTracking(currentTaskId);
    }

    // Update UI and storage
    renderSchedule();
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    localStorage.removeItem('pauses'); // Clean up
}

// Complete the current task
function completeCurrentTask() {
    if (!currentTaskId) return;
    
    // End tracking for current task
    endTaskTracking(currentTaskId, 'completed');
    
    const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = true;
        tasks[taskIndex].progress = 100;
        tasks[taskIndex].completedAt = new Date().toISOString();
        
        // Find the next incomplete task
        const oldTaskId = currentTaskId;
        setNextCurrentTask();
        
        // Start tracking new task if one was selected
        if (currentTaskId && currentTaskId !== oldTaskId && !isPaused) {
            startTaskTracking(currentTaskId);
        }
        
        // Save changes
        saveToLocalStorage();
        
        // Rerender
        renderTasks();
    }
}

// Reschedule the current task
function rescheduleCurrentTask() {
    if (!currentTaskId) return;

    // Find the current task
    const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
    if (taskIndex === -1) return;
    
    const currentTask = tasks[taskIndex];
    
    // Show the task switch confirmation modal with progress slider
    document.getElementById('task-switch-modal').style.display = 'flex';
    document.getElementById('switch-modal-title').textContent = 'Reschedule Task?';
    document.getElementById('switch-modal-question').textContent = `Are you sure you want to reschedule "${currentTask.name}"?`;
    
    // Show the progress slider section
    document.getElementById('progress-slider-container').style.display = 'block';
    
    // Set the initial value of the progress slider to the current task progress
    const progressSlider = document.getElementById('progress-slider');
    progressSlider.value = currentTask.progress;
    document.getElementById('progress-value').textContent = `${currentTask.progress}%`;
    
    // Set the action for the confirm button
    const confirmButton = document.getElementById('confirm-switch-btn');
    confirmButton.textContent = 'Reschedule';
    confirmButton.dataset.action = 'reschedule';
    confirmButton.dataset.taskId = currentTaskId;
    
    // Hide the new task name section
    document.getElementById('new-task-section').style.display = 'none';
}

// Update the confirm switch button event listener to handle both switch and reschedule
document.getElementById('confirm-switch-btn').addEventListener('click', function() {
    const action = this.dataset.action || 'switch';
    
    if (action === 'switch') {
        const switchToId = this.dataset.switchToId;
        if (switchToId) {
            switchToTask(switchToId);
        }
    } else if (action === 'reschedule') {
        const taskId = this.dataset.taskId;
        if (taskId) {
            completeReschedule(taskId);
        }
    }
});

// Function to complete the reschedule action with the updated progress
function completeReschedule(taskId) {
    const progressSlider = document.getElementById('progress-slider');
    const newProgress = parseInt(progressSlider.value);
    
    // Find the task
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    // Update the task progress
    tasks[taskIndex].progress = newProgress;
    
    // Calculate new time remaining based on progress
    if (newProgress > 0) {
        const totalTimeSpent = calculateTotalTimeSpent(taskId);
        const estimatedTotalTime = totalTimeSpent / (newProgress / 100);
        tasks[taskIndex].timeRemaining = Math.max(0, estimatedTotalTime - totalTimeSpent);
    }
    
    // End tracking for current task
    endTaskTracking(taskId, 'rescheduled');
    
    // Increment reschedule count
    tasks[taskIndex].rescheduleCount += 1;
    
    // Set the next task as current
    const oldTaskId = currentTaskId;
    setNextCurrentTask();
    
    // Start tracking new task if one was selected
    if (currentTaskId && currentTaskId !== oldTaskId && !isPaused) {
        startTaskTracking(currentTaskId);
    }
    
    // Save changes
    saveToLocalStorage();
    renderTasks();
    
    // Hide the modal
    document.getElementById('task-switch-modal').style.display = 'none';
}

// Calculate total time spent on a task
function calculateTotalTimeSpent(taskId) {
    let totalTimeSpent = 0;
    
    // Sum up all time blocks for this task
    timeBlocks.forEach(block => {
        if (block.taskId === taskId && block.endTime) {
            const startTime = new Date(block.startTime);
            const endTime = new Date(block.endTime);
            const duration = (endTime - startTime) / (1000 * 60); // Convert to minutes
            totalTimeSpent += duration;
        }
    });
    
    return totalTimeSpent;
}

// Handle distraction button click
function markDistracted() {
    alert('Focus lost! Take a moment to regain your concentration.');
    
    // In a real app, you might track distractions, show a motivational quote, etc.
}

// Set the next incomplete task as the current task
function setNextCurrentTask() {
    const incompleteTasks = sortTasks(tasks.filter(t => !t.completed));
    currentTaskId = incompleteTasks.length > 0 ? incompleteTasks[0].id : null;
    localStorage.setItem('currentTaskId', currentTaskId);
}

// Update time tracking
function updateTimeTracking() {
    if (!currentTaskId || isPaused) {
        lastTimestamp = null;
        return;
    }
    
    const now = Date.now();
    
    // If we have a last timestamp, calculate the time difference
    if (lastTimestamp) {
        const elapsed = (now - lastTimestamp) / 1000 / 60; // Convert to minutes
        
        // Update the current task's time remaining
        const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            task.timeRemaining = Math.max(0, task.timeRemaining - elapsed);
            
            // Calculate progress based on time
            task.progress = Math.min(100, Math.round(100 - (task.timeRemaining / task.duration * 100)));
            
            // If time is up, auto-complete the task
            if (task.timeRemaining <= 0) {
                completeCurrentTask();
            }
            
            // Update the UI
            updateCurrentTaskDisplay();
        }
        
        // Add to the total focus time
        focusTime += elapsed;
        localStorage.setItem('focusTime', focusTime.toString());
        
        // Update the focus time display
        updateStatsDisplay();
    }
    
    // Set the current timestamp for the next iteration
    lastTimestamp = now;
}

// Render all tasks
function renderTasks() {
    renderCurrentTask();
    renderTasksList();
    renderSchedule();
    updateStatsDisplay();
}

// Render the current task
function renderCurrentTask() {
    const currentTaskCard = document.getElementById('current-task-card');
    const noTasksMessage = document.getElementById('no-tasks-message');
    const tasksContainer = document.getElementById('tasks-container');
    
    if (!currentTaskId || tasks.length === 0) {
        currentTaskCard.style.display = 'none';
        
        if (tasks.length === 0) {
            noTasksMessage.style.display = 'flex';
            tasksContainer.style.display = 'none';
        } else {
            noTasksMessage.style.display = 'none';
            tasksContainer.style.display = 'block';
        }
        return;
    }
    
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) {
        currentTaskCard.style.display = 'none';
        
        if (tasks.length === 0) {
            noTasksMessage.style.display = 'flex';
            tasksContainer.style.display = 'none';
        } else {
            noTasksMessage.style.display = 'none';
            tasksContainer.style.display = 'block';
        }
        return;
    }
    
    // Hide the no tasks message and show the current task card and tasks container
    noTasksMessage.style.display = 'none';
    currentTaskCard.style.display = 'block';
    tasksContainer.style.display = 'block';
    
    // Update the display
    updateCurrentTaskDisplay();
}

// Update the current task display without completely re-rendering
function updateCurrentTaskDisplay() {
    if (!currentTaskId) return;
    
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    
    // Update task details
    document.getElementById('current-task-name').textContent = task.name;
    document.getElementById('current-task-description').textContent = task.description || 'No description provided.';
    document.getElementById('current-task-progress').textContent = `${task.progress}%`;
    document.getElementById('current-task-progress-bar').style.width = `${task.progress}%`;
    
    // Format the time remaining
    const hours = Math.floor(task.timeRemaining / 60);
    const minutes = Math.round(task.timeRemaining % 60);
    let timeString = '';
    if (hours > 0) {
        timeString += `${hours} hr${hours > 1 ? 's' : ''} `;
    }
    timeString += `${minutes} min${minutes !== 1 ? 's' : ''}`;
    document.getElementById('current-task-time-remaining').textContent = `${timeString} remaining`;
    
    // Render tags
    const tagsContainer = document.getElementById('current-task-tags');
    tagsContainer.innerHTML = '';
    task.tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            ${tag}
        `;
        tagsContainer.appendChild(tagElement);
    });
    
    // Display deadline if available
    if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        const deadlineString = deadlineDate.toLocaleDateString('en-US', options);
        
        // Calculate days remaining
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDay = new Date(deadlineDate);
        deadlineDay.setHours(0, 0, 0, 0);
        
        const diffTime = deadlineDay - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const daysText = diffDays === 0 ? 'Today' : 
                        diffDays === 1 ? 'Tomorrow' : 
                        `(${diffDays} days)`;
        
        document.getElementById('current-task-deadline').textContent = `${deadlineString} ${daysText}`;
    } else {
        document.getElementById('current-task-deadline').textContent = 'No deadline set';
    }
    
    // Update priority
    const priorityContainer = document.getElementById('current-task-priority');
    const priorityClass = task.priority === 1 ? 'lowest' : 
                          task.priority === 2 ? 'low' : 
                          task.priority === 3 ? 'medium' : 
                          task.priority === 4 ? 'high' : 'urgent';
    
    priorityContainer.innerHTML = `
        <div class="priority-indicator ${priorityClass}"></div>
        <span class="detail-value-text">${PRIORITIES[task.priority]}</span>
    `;
}

// Render the tasks list
function renderTasksList() {
    const tasksList = document.getElementById('tasks-list');
    
    // Clear the list
    tasksList.innerHTML = '';
    
    // Filter out the current task and completed tasks
    const remainingTasks = sortTasks(tasks.filter(t => t.id !== currentTaskId && !t.completed));

    if (remainingTasks.length === 0) {
        return;
    }
    
    // Add each task to the list
    remainingTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.dataset.id = task.id;
        
        // Format time remaining
        const hours = Math.floor(task.timeRemaining / 60);
        const minutes = Math.round(task.timeRemaining % 60);
        let timeString = '';
        if (hours > 0) {
            timeString += `${hours}h `;
        }
        timeString += `${minutes}m`;
        
        // Get priority class
        const priorityClass = task.priority === 1 ? 'lowest' : 
                              task.priority === 2 ? 'low' : 
                              task.priority === 3 ? 'medium' : 
                              task.priority === 4 ? 'high' : 'urgent';
        
        taskElement.innerHTML = `
            <div class="task-item-left">
                <div class="task-checkbox"></div>
                <div class="task-item-info">
                    <div class="task-item-title">${task.name}</div>
                    <div class="task-item-subtitle">
                        <div class="priority-indicator ${priorityClass}"></div>
                        ${task.description ? task.description.substring(0, 50) + (task.description.length > 50 ? '...' : '') : 'No description'}
                    </div>
                </div>
            </div>
            <div class="task-item-right">
                <div class="task-item-badge">${timeString}</div>
            </div>
        `;
        
        // Add click event to show switch confirmation
        taskElement.addEventListener('click', () => {
            if (isPaused) {
                alert("Please resume your current task before switching to a new one.");
                return;
            }
            
            // Store the task ID for potential switch
            taskElement.dataset.switchId = task.id;
            
            // Get task names for confirmation
            const currentTask = tasks.find(t => t.id === currentTaskId);
            if (currentTask) {
                document.getElementById('current-task-name-confirm').textContent = currentTask.name;
                document.getElementById('new-task-name-confirm').textContent = task.name;
                
                // Show confirmation modal
                document.getElementById('task-switch-modal').style.display = 'flex';
                
                // Set up the confirm button with the right task ID
                document.getElementById('confirm-switch-btn').dataset.switchToId = task.id;
            } else {
                // If no current task, just switch directly
                switchToTask(task.id);
            }
        });
        
        tasksList.appendChild(taskElement);
    });
}

function switchToTask(taskId) {
    // If there's a current task, end tracking for it
    if (currentTaskId && !isPaused) {
        endTaskTracking(currentTaskId, 'switched');
    }
    
    // Update current task ID
    currentTaskId = taskId;
    
    // Start tracking the new task
    if (!isPaused) {
        startTaskTracking(currentTaskId);
    }
    
    saveToLocalStorage();
    renderTasks();
    
    // Hide modal if open and reset its state
    document.getElementById('task-switch-modal').style.display = 'none';
    document.getElementById('switch-modal-title').textContent = 'Switch Tasks?';
    document.getElementById('confirm-switch-btn').textContent = 'Switch Tasks';
    document.getElementById('confirm-switch-btn').dataset.action = 'switch';
    document.getElementById('progress-slider-container').style.display = 'none';
    document.getElementById('new-task-section').style.display = 'block';
}

function cancelTaskSwitch() {
    // Hide modal
    document.getElementById('task-switch-modal').style.display = 'none';
    
    // Reset the modal state
    document.getElementById('switch-modal-title').textContent = 'Switch Tasks?';
    document.getElementById('confirm-switch-btn').textContent = 'Switch Tasks';
    document.getElementById('confirm-switch-btn').dataset.action = 'switch';
    document.getElementById('progress-slider-container').style.display = 'none';
    document.getElementById('new-task-section').style.display = 'block';
}

function sortTasks(tasksArray) {
    return tasksArray.sort((a, b) => {
        // Priority descending (5 to 1)
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        // Deadline ascending (earlier first, nulls last)
        if (a.deadline && b.deadline) {
            return new Date(a.deadline) - new Date(b.deadline);
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        // Reschedule count ascending (fewer reschedules first)
        if (a.rescheduleCount !== b.rescheduleCount) {
            return a.rescheduleCount - b.rescheduleCount;
        }
        // Creation date ascending (older first)
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

// Render the schedule
function renderSchedule() {
    const scheduleContent = document.getElementById('schedule-content');
    
    // Remove old schedule items but keep the hour dividers
    const items = scheduleContent.querySelectorAll('.schedule-item');
    items.forEach(item => item.remove());
    
    // Use 24-hour schedule
    const totalHours = 24;
    
    // First, render all historical time blocks (completed tasks and breaks)
    const completedBlocks = timeBlocks.filter(block => block.endTime !== null);
    completedBlocks.forEach(block => {
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);
        
        // Only show blocks for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const blockDate = new Date(startTime);
        blockDate.setHours(0, 0, 0, 0);
        
        if (blockDate.getTime() !== today.getTime()) {
            return;
        }
        
        // Calculate position on schedule
        const startHourFraction = startTime.getHours() + (startTime.getMinutes() / 60);
        const endHourFraction = endTime.getHours() + (endTime.getMinutes() / 60);
        
        // Skip if outside display range
        if (endHourFraction <= 0 || startHourFraction >= totalHours) {
            return;
        }
        
        // Adjust to fit within display
        const adjustedStart = Math.max(0, startHourFraction);
        const adjustedEnd = Math.min(totalHours, endHourFraction);
        const duration = adjustedEnd - adjustedStart;
        
        // Calculate top and height as percentage
        const topPosition = adjustedStart * (100/totalHours); // Percentage based on 24 hours
        const height = duration * (100/totalHours); // Percentage based on 24 hours
        
        if (block.type === 'break') {
            // Render break block
            createScheduleItem(
                scheduleContent,
                { name: `Break: ${block.reason}` },
                topPosition,
                height,
                'break-task'
            );
        } else {
            // Find the task
            const task = tasks.find(t => t.id === block.taskId);
            if (task) {
                // Render completed task block
                createScheduleItem(
                    scheduleContent,
                    task,
                    topPosition,
                    height,
                    'completed-task'
                );
            }
        }
    });
    
    // Next, render the current active block (if any)
    const activeBlock = timeBlocks.find(block => block.endTime === null);
    if (activeBlock) {
        const startTime = new Date(activeBlock.startTime);
        const now = new Date();
        
        // Calculate position on schedule
        const startHourFraction = startTime.getHours() + (startTime.getMinutes() / 60);
        
        // Skip if outside display range
        if (startHourFraction >= totalHours) {
            // Do nothing
        } else {
            // Adjust to fit within display
            const adjustedStart = Math.max(0, startHourFraction);
            
            if (activeBlock.type === 'break') {
                // For breaks, show the actual elapsed time
                const currentHourFraction = now.getHours() + (now.getMinutes() / 60);
                const adjustedEnd = Math.min(totalHours, currentHourFraction);
                const duration = adjustedEnd - adjustedStart;
                
                // Calculate top and height as percentage
                const topPosition = adjustedStart * (100/totalHours);
                const height = Math.max(0.5, duration * (100/totalHours));
                
                // Render active break block
                createScheduleItem(
                    scheduleContent,
                    { name: `Break: ${activeBlock.reason}` },
                    topPosition,
                    height,
                    'break-task'
                );
            } else if (activeBlock.taskId === currentTaskId) {
                // Find the task
                const task = tasks.find(t => t.id === activeBlock.taskId);
                if (task) {
                    // For in-progress tasks, use the original estimated duration
                    // instead of compressing it as it's worked on
                    const taskDuration = task.duration / 60; // Convert minutes to hours
                    
                    // Store the original start time to ensure consistency
                    if (!activeBlock.originalStartTime) {
                        activeBlock.originalStartTime = activeBlock.startTime;
                        // Save to localStorage to persist this information
                        localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
                    }
                    
                    // Use the original start time for positioning
                    const originalStartTime = new Date(activeBlock.originalStartTime || activeBlock.startTime);
                    const originalStartHourFraction = originalStartTime.getHours() + (originalStartTime.getMinutes() / 60);
                    const adjustedOriginalStart = Math.max(0, originalStartHourFraction);
                    
                    // Calculate top and height as percentage
                    const topPosition = adjustedOriginalStart * (100/totalHours);
                    const height = taskDuration * (100/totalHours);
                    
                    // Render current task block with original estimated size
                    createScheduleItem(
                        scheduleContent,
                        task,
                        topPosition,
                        height,
                        'current-task'
                    );
                }
            }
        }
    }
    
    // Finally, render future tasks (if not paused)
    if (!isPaused) {
        let currentPosition = 0;
        
        // Get current time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Update current position based on now
        currentPosition = Math.max(0, currentHour + currentMinute / 60);
        
        // If we have an active block, position should be after it ends
        if (activeBlock && activeBlock.taskId === currentTaskId) {
            // Calculate expected end time for current task
            const task = tasks.find(t => t.id === currentTaskId);
            if (task) {
                // Use the original start time for consistency
                const activeStartTime = new Date(activeBlock.originalStartTime || activeBlock.startTime);
                const taskDuration = task.duration / 60; // Original duration in hours
                
                // Current position is start time plus original duration
                currentPosition = Math.max(currentPosition, 
                    activeStartTime.getHours() + activeStartTime.getMinutes() / 60 + taskDuration);
            }
        }
        
        // Get all active tasks (excluding current task)
        let activeTasks = sortTasks(tasks.filter(t => !t.completed && t.id !== currentTaskId));
        
        // Place upcoming tasks
        activeTasks.forEach(task => {
            const taskDuration = task.timeRemaining / 60; // Convert minutes to hours
            
            // Don't place tasks that would end after the end of the day
            if (currentPosition + taskDuration <= totalHours) {
                // Create schedule item
                createScheduleItem(
                    scheduleContent,
                    task,
                    currentPosition * (100/totalHours), // Convert to percentage
                    taskDuration * (100/totalHours), // Convert to percentage
                    'future-task'
                );
                
                // Update position for next task
                currentPosition += taskDuration;
            }
        });
    }
}

// Create a schedule item
function createScheduleItem(container, task, topPosition, height, className) {
    const item = document.createElement('div');
    item.className = `schedule-item ${className} priority-${task.priority || '3'}`;
    item.style.top = `${topPosition}%`;
    
    // Check if the height is too small for showing details
    const MIN_HEIGHT_FOR_DETAILS = 3; // 3% of the schedule height
    
    // Create tooltip content with task details
    let tooltipContent = '';
    
    // Add title with badge
    tooltipContent += `<div class="tooltip-title">${task.name}`;
    
    // Add badge based on task type
    if (className === 'current-task') {
        tooltipContent += `<span class="tooltip-badge current">Current Task</span>`;
    } else if (className === 'completed-task') {
        tooltipContent += `<span class="tooltip-badge completed">Completed</span>`;
    } else if (className === 'break-task') {
        tooltipContent += `<span class="tooltip-badge break">Break</span>`;
    } else {
        tooltipContent += `<span class="tooltip-badge future">Upcoming</span>`;
    }
    
    tooltipContent += `</div>`;
    
    // Add break reason if applicable
    if (className === 'break-task' && task.breakReason) {
        tooltipContent += `<div class="tooltip-reason">${task.breakReason}</div>`;
    }
    
    // Add time information
    if (className !== 'current-task' && className !== 'completed-task' && className !== 'break-task') {
        // For future tasks, add time remaining
        const hours = Math.floor(task.timeRemaining / 60);
        const minutes = Math.round(task.timeRemaining % 60);
        tooltipContent += `<div class="tooltip-time">Duration: `;
        if (hours > 0) {
            tooltipContent += `${hours}h `;
        }
        tooltipContent += `${minutes}m</div>`;
    }
    
    // Add priority information
    const priorityLabels = ['Lowest', 'Low', 'Medium', 'High', 'Urgent'];
    if (task.priority && task.priority >= 1 && task.priority <= 5) {
        tooltipContent += `<div class="tooltip-priority">Priority: ${priorityLabels[task.priority - 1]}</div>`;
    }
    
    // Add description if available
    if (task.description) {
        tooltipContent += `<div class="tooltip-description">${task.description}</div>`;
    }
    
    // Add mouse events for custom tooltip
    item.addEventListener('mouseenter', (event) => {
        showTooltip(tooltipContent, event);
    });
    
    item.addEventListener('mousemove', (event) => {
        if (tooltipVisible) {
            showTooltip(tooltipContent, event);
        }
    });
    
    item.addEventListener('mouseleave', () => {
        hideTooltip();
    });
    
    if (height < MIN_HEIGHT_FOR_DETAILS) {
        // For very small blocks, create a minimal representation without details
        item.style.height = `${Math.max(height, 0.5)}%`; // Ensure at least 0.5% height for visibility
        item.style.minHeight = 'auto'; // Override the CSS min-height
        item.style.padding = '2px'; // Smaller padding
        
        // Empty content or minimal indicator
        item.innerHTML = '';
    } else {
        // For normal sized blocks, show full details
        item.style.height = `${height}%`;
        
        // Format time for badge
        let badgeText = "";
        if (className === 'current-task') {
            badgeText = "Now";
        } else if (className === 'completed-task') {
            badgeText = "Done";
        } else if (className === 'break-task') {
            badgeText = "Break";
        } else {
            const hours = Math.floor(task.timeRemaining / 60);
            const minutes = Math.round(task.timeRemaining % 60);
            if (hours > 0) {
                badgeText += `${hours}h `;
            }
            badgeText += `${minutes}m`;
        }
        
        // Icon based on status
        let icon = '';
        if (className === 'current-task') {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>`;
        } else if (className === 'break-task') {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>`;
        } else if (className === 'completed-task') {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`;
        } else {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>`;
        }
        
        item.innerHTML = `
            <div class="schedule-item-header">
                <div class="schedule-item-title">
                    ${icon}
                    ${task.name}
                </div>
                <div class="item-badge">${badgeText}</div>
            </div>
        `;
    }
    
    container.appendChild(item);
}

// Update the stats display
function updateStatsDisplay() {
    // Count completed tasks
    const completedCount = tasks.filter(t => t.completed).length;
    
    // Format focus time
    const focusHours = Math.floor(focusTime / 60);
    const focusMinutes = Math.round(focusTime % 60);
    let focusTimeString = '';
    if (focusHours > 0) {
        focusTimeString += `${focusHours} hr${focusHours > 1 ? 's' : ''} `;
    }
    if (focusMinutes > 0 || focusHours === 0) {
        focusTimeString += `${focusMinutes} min${focusMinutes !== 1 ? 's' : ''}`;
    }
    
    // Update the display
    document.getElementById('completed-count').textContent = `${completedCount} / ${tasks.length}`;
    document.getElementById('focus-time').textContent = focusTimeString;
}

// Import tasks from todo.txt format
function importTasks() {
    const importText = document.getElementById('import-text').value.trim();
    
    if (!importText) {
        alert('Please paste todo.txt content to import.');
        return;
    }
    
    const lines = importText.split('\n').filter(line => line.trim());
    const importedTasks = [];
    
    lines.forEach(line => {
        // Basic todo.txt parsing
        // Format: (A) 2023-04-23 Task description @context +project due:2023-05-01
        let priority = 3; // Default to medium
        let name = line.trim();
        let tags = [];
        let deadline = null;
        
        // Extract priority
        const priorityMatch = name.match(/^\(([A-Z])\)\s+/);
        if (priorityMatch) {
            // Convert A-Z priority to 1-5
            const priorityLetter = priorityMatch[1];
            if (priorityLetter === 'A') priority = 5; // Urgent
            else if (priorityLetter === 'B') priority = 4; // High
            else if (priorityLetter === 'C') priority = 3; // Medium
            else if (priorityLetter === 'D') priority = 2; // Low
            else priority = 1; // Lowest
            
            name = name.substring(priorityMatch[0].length);
        }
        
        // Extract creation date (if it exists)
        const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})\s+/);
        if (dateMatch) {
            name = name.substring(dateMatch[0].length);
        }
        
        // Extract contexts and projects as tags
        const contextMatches = name.match(/@\w+/g) || [];
        const projectMatches = name.match(/\+\w+/g) || [];
        
        contextMatches.forEach(context => {
            tags.push(context.substring(1)); // Remove @
            name = name.replace(context, '').trim();
        });
        
        projectMatches.forEach(project => {
            tags.push(project.substring(1)); // Remove +
            name = name.replace(project, '').trim();
        });
        
        // Extract due date
        const dueMatch = name.match(/due:(\d{4}-\d{2}-\d{2})/);
        if (dueMatch) {
            deadline = dueMatch[1];
            name = name.replace(dueMatch[0], '').trim();
        }
        
        // Create task object
        const task = {
            id: Date.now().toString() + importedTasks.length, // Ensure unique IDs
            name: name,
            description: '',
            duration: 30, // Default 30 minutes
            timeRemaining: 30,
            priority: priority,
            tags: tags,
            deadline: deadline,
            createdAt: new Date().toISOString(),
            completed: false,
            progress: 0
        };
        
        importedTasks.push(task);
    });
    
    if (importedTasks.length === 0) {
        alert('No valid tasks found in the imported content.');
        return;
    }
    
    // Add imported tasks to existing tasks
    tasks = tasks.concat(importedTasks);
    
    // If no current task, set the first imported task as current
    if (!currentTaskId && importedTasks.length > 0) {
        currentTaskId = importedTasks[0].id;
        if (!isPaused) {
            startTaskTracking(currentTaskId);
        }
    }
    
    // Save to localStorage and rerender
    saveToLocalStorage();
    renderTasks();
    
    // Clear import text and show success message
    document.getElementById('import-text').value = '';
    alert(`Successfully imported ${importedTasks.length} tasks.`);
}

// Export tasks to todo.txt format
function exportTasks() {
    if (tasks.length === 0) {
        alert('No tasks to export.');
        return;
    }
    
    let exportText = '';
    
    tasks.forEach(task => {
        // Build todo.txt format line
        
        // Priority
        let line = '';
        if (task.priority === 5) line += '(A) ';
        else if (task.priority === 4) line += '(B) ';
        else if (task.priority === 3) line += '(C) ';
        else if (task.priority === 2) line += '(D) ';
        else if (task.priority === 1) line += '(E) ';
        
        // Creation date
        const creationDate = new Date(task.createdAt);
        line += `${creationDate.getFullYear()}-${String(creationDate.getMonth() + 1).padStart(2, '0')}-${String(creationDate.getDate()).padStart(2, '0')} `;
        
        // Task name
        line += task.name;
        
        // Tags (as contexts and projects)
        task.tags.forEach(tag => {
            line += ` @${tag}`;
        });
        
        // Due date
        if (task.deadline) {
            line += ` due:${task.deadline}`;
        }
        
        // Add completion status
        if (task.completed) {
            line = 'x ' + line;
        }
        
        exportText += line + '\n';
    });
    
    // Show export output
    document.getElementById('export-text').value = exportText;
    document.getElementById('export-output').style.display = 'block';
}

// Copy export text to clipboard
function copyExportText() {
    const exportText = document.getElementById('export-text');
    exportText.select();
    document.execCommand('copy');
    alert('Exported tasks copied to clipboard!');
}

// Generate timesheet
function generateTimesheet() {
    // Open the timesheet modal
    document.getElementById('timesheet-modal').style.display = 'flex';
    
    const timesheetContent = document.getElementById('timesheet-content');
    timesheetContent.innerHTML = '';
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all time blocks for today
    const todayBlocks = timeBlocks.filter(block => {
        const blockDate = new Date(block.startTime);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === today.getTime();
    });
    
    // Calculate total work time and break time
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    
    todayBlocks.forEach(block => {
        if (!block.endTime) return; // Skip active blocks
        
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);
        const durationMinutes = (endTime - startTime) / 1000 / 60;
        
        if (block.type === 'break') {
            totalBreakMinutes += durationMinutes;
        } else {
            totalWorkMinutes += durationMinutes;
        }
    });
    
    // Create timesheet HTML
    let timesheetHTML = `
        <div class="timesheet-section">
            <h4 class="timesheet-section-title">Time Log</h4>
            <table class="timesheet-table">
                <thead>
                    <tr>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                        <th>Activity</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (todayBlocks.length === 0) {
        timesheetHTML += `
            <tr>
                <td colspan="5" style="text-align: center;">No activity recorded today</td>
            </tr>
        `;
    } else {
        // Sort blocks by start time
        const sortedBlocks = [...todayBlocks].sort((a, b) => 
            new Date(a.startTime) - new Date(b.startTime)
        );
        
        sortedBlocks.forEach(block => {
            const startTime = new Date(block.startTime);
            const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let endTimeStr = 'Active';
            let durationStr = 'Ongoing';
            let status = 'Active';
            
            if (block.endTime) {
                const endTime = new Date(block.endTime);
                endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);
                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;
                
                durationStr = '';
                if (hours > 0) durationStr += `${hours}h `;
                durationStr += `${minutes}m`;
                
                status = block.reason || 'Completed';
            }
            
            let activity = 'Break';
            if (block.type !== 'break' && block.taskId) {
                const task = tasks.find(t => t.id === block.taskId);
                if (task) {
                    activity = task.name;
                } else {
                    activity = 'Unknown Task';
                }
            } else if (block.reason) {
                activity = `Break: ${block.reason}`;
            }
            
            timesheetHTML += `
                <tr>
                    <td>${startTimeStr}</td>
                    <td>${endTimeStr}</td>
                    <td>${durationStr}</td>
                    <td>${activity}</td>
                    <td>${status}</td>
                </tr>
            `;
        });
    }
    
    // Format total times
    const totalWorkHours = Math.floor(totalWorkMinutes / 60);
    const totalWorkMinutesRemainder = totalWorkMinutes % 60;
    let totalWorkText = '';
    if (totalWorkHours > 0) totalWorkText += `${totalWorkHours}h `;
    totalWorkText += `${totalWorkMinutesRemainder}m`;
    
    const totalBreakHours = Math.floor(totalBreakMinutes / 60);
    const totalBreakMinutesRemainder = Math.round(totalBreakMinutes % 60);
    let totalBreakText = '';
    if (totalBreakHours > 0) totalBreakText += `${totalBreakHours}h `;
    totalBreakText += `${totalBreakMinutesRemainder}m`;
    
    // Net working time
    const netMinutes = Math.max(0, totalWorkMinutes);
    const netHours = Math.floor(netMinutes / 60);
    const netMinutesRemainder = Math.round(netMinutes % 60);
    let netText = '';
    if (netHours > 0) netText += `${netHours}h `;
    netText += `${netMinutesRemainder}m`;
    
    timesheetHTML += `
                </tbody>
            </table>
        </div>
        
        <div class="timesheet-total">
            <p>Total Work Time: ${totalWorkText}</p>
            <p>Total Break Time: ${totalBreakText}</p>
            <p>Net Working Time: ${netText}</p>
        </div>
    `;
    
    timesheetContent.innerHTML = timesheetHTML;
}

// Hide timesheet modal
function hideTimesheetModal() {
    document.getElementById('timesheet-modal').style.display = 'none';
}

// Download timesheet as CSV file
function downloadTimesheet() {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString().split('T')[0];
    
    // Get all time blocks for today
    const todayBlocks = timeBlocks.filter(block => {
        const blockDate = new Date(block.startTime);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === today.getTime();
    });
    
    // Sort blocks by start time
    const sortedBlocks = [...todayBlocks].sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
    );
    
    // Create CSV content
    let csvContent = 'Start Time,End Time,Duration (minutes),Activity,Status\n';
    
    sortedBlocks.forEach(block => {
        const startTime = new Date(block.startTime);
        const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let endTimeStr = 'Active';
        let durationMinutes = 'Ongoing';
        let status = 'Active';
        
        if (block.endTime) {
            const endTime = new Date(block.endTime);
            endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            durationMinutes = Math.round((endTime - startTime) / 1000 / 60);
            status = block.reason || 'Completed';
        }
        
        let activity = 'Break';
        if (block.type !== 'break' && block.taskId) {
            const task = tasks.find(t => t.id === block.taskId);
            if (task) {
                activity = task.name;
            } else {
                activity = 'Unknown Task';
            }
        } else if (block.reason) {
            activity = `Break: ${block.reason}`;
        }
        
        // Escape any commas in the text fields
        activity = activity.replace(/,/g, ';');
        status = status.replace(/,/g, ';');
        
        csvContent += `${startTimeStr},${endTimeStr},${durationMinutes},"${activity}","${status}"\n`;
    });
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `TaskLobster_Timesheet_${dateString}.csv`);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Save all data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('currentTaskId', currentTaskId);
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    localStorage.setItem('focusTime', focusTime);
    localStorage.setItem('isPaused', isPaused);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add event listener for progress slider
document.getElementById('progress-slider').addEventListener('input', function() {
    document.getElementById('progress-value').textContent = `${this.value}%`;
});
