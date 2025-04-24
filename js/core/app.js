// app.js - Main application initialization

import AppState from './state.js';
import { 
    showAddTaskModal, 
    hideAddTaskModal, 
    saveTask, 
    renderTasks,
    completeCurrentTask,
    rescheduleCurrentTask,
    markDistracted,
    setupPrioritySlider,
    setupDurationButtons,
    handlePause,
    setupPauseReasonModal,
    resumeTask,
    saveBreakNotes,
    skipBreakNotes,
    cancelTaskSwitch
} from '../tasks/taskUI.js';
import { updateTimeTracking } from '../timeTracking/timeTracker.js';
import { initializeSchedule } from '../scheduling/scheduler.js';
import { 
    generateTimesheet, 
    hideTimesheetModal, 
    downloadTimesheet 
} from '../reporting/timesheetGenerator.js';
import { 
    importTasks, 
    exportTasks, 
    exportToTodoTxt, 
    copyExportText 
} from '../data/importExport.js';
import { 
    updateDateDisplay, 
    updateCurrentTime 
} from '../utils/uiUtils.js';

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
                import { switchToTask } from "../tasks/taskUI.js";
switchToTask(switchToId);
            }
        } else if (action === 'reschedule') {
            const taskId = this.dataset.taskId;
            if (taskId) {
                import { completeReschedule } from "../tasks/taskUI.js";
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
    if (AppState.currentTaskId && !AppState.isPaused) {
        import { startTaskTracking } from "../timeTracking/timeTracker.js";
startTaskTracking(AppState.currentTaskId);
    }
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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add event listener for progress slider
document.getElementById('progress-slider').addEventListener('input', function() {
    document.getElementById('progress-value').textContent = `${this.value}%`;
});
