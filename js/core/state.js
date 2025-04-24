// state.js - Manages application state and global variables

// Global state object
const AppState = {
    // Task-related state
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    currentTaskId: localStorage.getItem('currentTaskId') || null,
    
    // Time tracking state
    timeBlocks: JSON.parse(localStorage.getItem('timeBlocks')) || [],
    focusTime: parseInt(localStorage.getItem('focusTime')) || 0,
    lastTimestamp: null,
    pauseTimestamp: null,
    isPaused: localStorage.getItem('isPaused') === 'true',
    pauseReason: null,
    breakTimerInterval: null,
    breakDuration: 0,
    
    // Constants
    PRIORITIES: {
        1: 'Lowest',
        2: 'Low',
        3: 'Medium',
        4: 'High',
        5: 'Urgent'
    },
    
    // Save all data to localStorage
    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('currentTaskId', this.currentTaskId);
        localStorage.setItem('timeBlocks', JSON.stringify(this.timeBlocks));
        localStorage.setItem('focusTime', this.focusTime);
        localStorage.setItem('isPaused', this.isPaused);
    }
};

export default AppState;
