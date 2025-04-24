// scheduler.js - Task scheduling functionality

import AppState from '../core/state.js';
import { getIncompleteTasks } from '../tasks/taskManager.js';
import { updateCurrentTimeIndicator } from '../utils/uiUtils.js';

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

// Render schedule items
function renderSchedule() {
    const scheduleContent = document.getElementById('schedule-content');
    const tasks = getIncompleteTasks();
    
    // Remove existing schedule items
    const existingItems = scheduleContent.querySelectorAll('.schedule-item');
    existingItems.forEach(item => item.remove());
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add schedule items for tasks with deadlines
    tasks.forEach(task => {
        if (task.deadline) {
            const deadline = new Date(task.deadline);
            
            // Check if deadline is today
            if (deadline.getTime() === today.getTime()) {
                // Create schedule item
                const scheduleItem = document.createElement('div');
                scheduleItem.className = 'schedule-item';
                scheduleItem.dataset.taskId = task.id;
                
                // Set position based on priority (higher priority = higher on the schedule)
                const priorityOffset = (5 - task.priority) * 2; // 0-8% offset based on priority
                scheduleItem.style.top = `${priorityOffset}%`;
                
                // Set height based on duration
                const durationHeight = (task.duration / 60) * (100/24); // % of day
                scheduleItem.style.height = `${durationHeight}%`;
                
                // Set content
                scheduleItem.innerHTML = `
                    <div class="schedule-item-content">
                        <div class="schedule-item-name">${task.name}</div>
                        <div class="schedule-item-duration">${task.duration} min</div>
                    </div>
                `;
                
                // Add to schedule
                scheduleContent.appendChild(scheduleItem);
            }
        }
    });
    
    // Add time blocks for today
    renderTimeBlocks();
}

// Render time blocks on the schedule
function renderTimeBlocks() {
    const scheduleContent = document.getElementById('schedule-content');
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter time blocks for today
    const todayBlocks = AppState.timeBlocks.filter(block => {
        const blockDate = new Date(block.startTime);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === today.getTime();
    });
    
    // Add time block items
    todayBlocks.forEach(block => {
        const startTime = new Date(block.startTime);
        const startHour = startTime.getHours();
        const startMinute = startTime.getMinutes();
        
        // Calculate top position (% of day)
        const dayPercentage = (startHour + startMinute / 60) / 24 * 100;
        
        // Calculate height (duration)
        let height = 2; // Default minimum height
        
        if (block.endTime) {
            const endTime = new Date(block.endTime);
            const durationMinutes = (endTime - startTime) / 1000 / 60;
            height = (durationMinutes / 60) * (100/24); // % of day
        }
        
        // Create time block element
        const timeBlockElement = document.createElement('div');
        timeBlockElement.className = `time-block ${block.type}`;
        timeBlockElement.style.top = `${dayPercentage}%`;
        timeBlockElement.style.height = `${Math.max(2, height)}%`; // Minimum 2% height
        
        // Add task name if it's a work block
        let blockContent = '';
        if (block.type === 'work' && block.taskId) {
            const task = AppState.tasks.find(t => t.id === block.taskId);
            if (task) {
                blockContent = `<div class="time-block-name">${task.name}</div>`;
            }
        } else if (block.type === 'break') {
            blockContent = `<div class="time-block-name">Break: ${block.reason || 'Unspecified'}</div>`;
        }
        
        timeBlockElement.innerHTML = blockContent;
        
        // Add to schedule
        scheduleContent.appendChild(timeBlockElement);
    });
}

export {
    initializeSchedule,
    renderSchedule
};
