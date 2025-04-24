// timeTracker.js - Time tracking functionality

import AppState from '../core/state.js';
import { getTaskById, updateTask } from '../tasks/taskManager.js';
import { updateCurrentTaskDisplay } from '../tasks/taskUI.js';

// Start tracking a task
function startTaskTracking(taskId) {
    const task = getTaskById(taskId);
    
    if (!task) return;
    
    // Set current task ID
    AppState.currentTaskId = taskId;
    
    // Set tracking state
    AppState.isPaused = false;
    AppState.lastTimestamp = Date.now();
    AppState.pauseTimestamp = null;
    
    // Create a new time block
    const timeBlock = {
        id: Date.now().toString(36),
        taskId: taskId,
        startTime: new Date().toISOString(),
        endTime: null,
        type: 'work'
    };
    
    AppState.timeBlocks.push(timeBlock);
    AppState.saveToLocalStorage();
}

// Pause task tracking
function pauseTaskTracking(reason = null) {
    if (!AppState.currentTaskId || AppState.isPaused) return;
    
    // Set pause state
    AppState.isPaused = true;
    AppState.pauseTimestamp = Date.now();
    AppState.pauseReason = reason;
    
    // End the current time block
    const currentBlockIndex = AppState.timeBlocks.findIndex(block => 
        block.taskId === AppState.currentTaskId && !block.endTime
    );
    
    if (currentBlockIndex !== -1) {
        AppState.timeBlocks[currentBlockIndex].endTime = new Date().toISOString();
        
        // Calculate time spent
        const startTime = new Date(AppState.timeBlocks[currentBlockIndex].startTime).getTime();
        const endTime = Date.now();
        const timeSpent = endTime - startTime;
        
        // Update task time spent
        const task = getTaskById(AppState.currentTaskId);
        if (task) {
            task.timeSpent = (task.timeSpent || 0) + timeSpent;
            updateTask(task.id, { timeSpent: task.timeSpent });
        }
    }
    
    // If there's a reason, create a break time block
    if (reason) {
        const breakBlock = {
            id: Date.now().toString(36),
            taskId: null,
            startTime: new Date().toISOString(),
            endTime: null,
            type: 'break',
            reason: reason
        };
        
        AppState.timeBlocks.push(breakBlock);
        
        // Start break timer
        startBreakTimer();
    }
    
    AppState.saveToLocalStorage();
}

// Start break timer
function startBreakTimer() {
    // Show break timer overlay
    const breakTimerOverlay = document.getElementById('break-timer-overlay');
    breakTimerOverlay.style.display = 'flex';
    
    // Set reason text
    document.getElementById('break-timer-reason').textContent = AppState.pauseReason || 'Break';
    
    // Hide break notes initially
    document.getElementById('break-notes-container').style.display = 'none';
    
    // Reset break duration
    AppState.breakDuration = 0;
    
    // Start timer
    if (AppState.breakTimerInterval) {
        clearInterval(AppState.breakTimerInterval);
    }
    
    AppState.breakTimerInterval = setInterval(updateBreakTimer, 1000);
}

// Update break timer display
function updateBreakTimer() {
    AppState.breakDuration++;
    
    // Format time
    const minutes = Math.floor(AppState.breakDuration / 60);
    const seconds = AppState.breakDuration % 60;
    
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    // Update display
    document.getElementById('break-timer-display').textContent = `${formattedMinutes}:${formattedSeconds}`;
}

// Update time tracking
function updateTimeTracking() {
    if (AppState.currentTaskId && !AppState.isPaused && AppState.lastTimestamp) {
        const now = Date.now();
        const elapsed = now - AppState.lastTimestamp;
        
        // Update focus time
        AppState.focusTime += elapsed;
        
        // Update last timestamp
        AppState.lastTimestamp = now;
        
        // Save to localStorage periodically (every 10 seconds)
        if (Math.floor(AppState.focusTime / 1000) % 10 === 0) {
            AppState.saveToLocalStorage();
        }
        
        // Update current task display
        updateCurrentTaskDisplay();
    }
}

export {
    startTaskTracking,
    pauseTaskTracking,
    updateTimeTracking
};
