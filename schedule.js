function initializeSchedule() {
    const timeColumn = document.querySelector('.time-column');
    const scheduleContent = document.getElementById('schedule-content');
    timeColumn.innerHTML = '';
    scheduleContent.innerHTML = '';
    for (let hour = 0; hour <= 23; hour++) {
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.style.top = `${(hour) * (100/24)}%`;
        timeLabel.textContent = hour > 12 ? `${hour-12}pm` : hour === 12 ? '12pm' : hour === 0 ? '12am' : `${hour}am`;
        timeColumn.appendChild(timeLabel);
        const hourDivider = document.createElement('div');
        hourDivider.className = 'hour-divider';
        hourDivider.style.top = `${(hour) * (100/24)}%`;
        scheduleContent.appendChild(hourDivider);
    }
    updateCurrentTimeIndicator();
    renderSchedule();
}

function renderSchedule() {
    const scheduleContent = document.getElementById('schedule-content');
    const items = scheduleContent.querySelectorAll('.schedule-item');
    items.forEach(item => item.remove());
    const totalHours = 24;
    const completedBlocks = timeBlocks.filter(block => block.endTime !== null);
    completedBlocks.forEach(block => {
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const blockDate = new Date(startTime);
        blockDate.setHours(0, 0, 0, 0);
        if (blockDate.getTime() !== today.getTime()) {
            return;
        }
        const startHourFraction = startTime.getHours() + (startTime.getMinutes() / 60);
        const endHourFraction = endTime.getHours() + (endTime.getMinutes() / 60);
        if (endHourFraction <= 0 || startHourFraction >= totalHours) {
            return;
        }
        const adjustedStart = Math.max(0, startHourFraction);
        const adjustedEnd = Math.min(totalHours, endHourFraction);
        const duration = adjustedEnd - adjustedStart;
        const topPosition = adjustedStart * (100/totalHours);
        const height = duration * (100/totalHours);
        if (block.type === 'break') {
            createScheduleItem(scheduleContent, { name: `Break: ${block.reason}` }, topPosition, height, 'break-task');
        } else {
            const task = tasks.find(t => t.id === block.taskId);
            if (task) {
                createScheduleItem(scheduleContent, task, topPosition, height, 'completed-task');
            }
        }
    });
    const activeBlock = timeBlocks.find(block => block.endTime === null);
    if (activeBlock) {
        const startTime = new Date(activeBlock.startTime);
        const now = new Date();
        const startHourFraction = startTime.getHours() + (startTime.getMinutes() / 60);
        if (startHourFraction < totalHours) {
            const adjustedStart = Math.max(0, startHourFraction);
            if (activeBlock.type === 'break') {
                const currentHourFraction = now.getHours() + (now.getMinutes() / 60);
                const adjustedEnd = Math.min(totalHours, currentHourFraction);
                const duration = adjustedEnd - adjustedStart;
                const topPosition = adjustedStart * (100/totalHours);
                const height = Math.max(0.5, duration * (100/totalHours));
                createScheduleItem(scheduleContent, { name: `Break: ${activeBlock.reason}` }, topPosition, height, 'break-task');
            } else if (activeBlock.taskId === currentTaskId) {
                const task = tasks.find(t => t.id === activeBlock.taskId);
                if (task) {
                    const taskDuration = task.duration / 60;
                    if (!activeBlock.originalStartTime) {
                        activeBlock.originalStartTime = activeBlock.startTime;
                        localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
                    }
                    const originalStartTime = new Date(activeBlock.originalStartTime || activeBlock.startTime);
                    const originalStartHourFraction = originalStartTime.getHours() + (originalStartTime.getMinutes() / 60);
                    const adjustedOriginalStart = Math.max(0, originalStartHourFraction);
                    const topPosition = adjustedOriginalStart * (100/totalHours);
                    const height = taskDuration * (100/totalHours);
                    createScheduleItem(scheduleContent, task, topPosition, height, 'current-task');
                }
            }
        }
    }
    if (!isPaused) {
        let currentPosition = 0;
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        currentPosition = Math.max(0, currentHour + currentMinute / 60);
        if (activeBlock && activeBlock.taskId === currentTaskId) {
            const task = tasks.find(t => t.id === currentTaskId);
            if (task) {
                const activeStartTime = new Date(activeBlock.originalStartTime || activeBlock.startTime);
                const taskDuration = task.duration / 60;
                currentPosition = Math.max(currentPosition, activeStartTime.getHours() + activeStartTime.getMinutes() / 60 + taskDuration);
            }
        }
        let activeTasks = sortTasks(tasks.filter(t => !t.completed && t.id !== currentTaskId));
        activeTasks.forEach(task => {
            const taskDuration = task.timeRemaining / 60;
            if (currentPosition + taskDuration <= totalHours) {
                createScheduleItem(scheduleContent, task, currentPosition * (100/totalHours), taskDuration * (100/totalHours), 'future-task');
                currentPosition += taskDuration;
            }
        });
    }
}

function createScheduleItem(container, task, topPosition, height, className) {
    const item = document.createElement('div');
    item.className = `schedule-item ${className} priority-${task.priority || '3'}`;
    item.style.top = `${topPosition}%`;
    const MIN_HEIGHT_FOR_DETAILS = 3;
    let tooltipContent = '';
    tooltipContent += `<div class="tooltip-title">${task.name}`;
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
    if (className === 'break-task' && task.breakReason) {
        tooltipContent += `<div class="tooltip-reason">${task.breakReason}</div>`;
    }
    if (className !== 'current-task' && className !== 'completed-task' && className !== 'break-task') {
        const hours = Math.floor(task.timeRemaining / 60);
        const minutes = Math.round(task.timeRemaining % 60);
        tooltipContent += `<div class="tooltip-time">Duration: `;
        if (hours > 0) {
            tooltipContent += `${hours}h `;
        }
        tooltipContent += `${minutes}m</div>`;
    }
    const priorityLabels = ['Lowest', 'Low', 'Medium', 'High', 'Urgent'];
    if (task.priority && task.priority >= 1 && task.priority <= 5) {
        tooltipContent += `<div class="tooltip-priority">Priority: ${priorityLabels[task.priority - 1]}</div>`;
    }
    if (task.description) {
        tooltipContent += `<div class="tooltip-description">${task.description}</div>`;
    }
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
        item.style.height = `${Math.max(height, 0.5)}%`;
        item.style.minHeight = 'auto';
        item.style.padding = '2px';
        item.innerHTML = '';
    } else {
        item.style.height = `${height}%`;
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