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