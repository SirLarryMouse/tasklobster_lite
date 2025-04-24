// taskManager.js - Core task CRUD operations

import AppState from '../core/state.js';

// Generate a unique ID for tasks
function generateTaskId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Add a new task
function addTask(taskData) {
    const newTask = {
        id: generateTaskId(),
        name: taskData.name,
        description: taskData.description || '',
        duration: parseInt(taskData.duration) || 30,
        priority: parseInt(taskData.priority) || 3,
        tags: taskData.tags || [],
        deadline: taskData.deadline || null,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        progress: 0,
        timeSpent: 0
    };
    
    AppState.tasks.push(newTask);
    AppState.saveToLocalStorage();
    
    return newTask;
}

// Get a task by ID
function getTaskById(taskId) {
    return AppState.tasks.find(task => task.id === taskId);
}

// Update a task
function updateTask(taskId, updates) {
    const taskIndex = AppState.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        AppState.tasks[taskIndex] = {
            ...AppState.tasks[taskIndex],
            ...updates
        };
        
        AppState.saveToLocalStorage();
        return AppState.tasks[taskIndex];
    }
    
    return null;
}

// Delete a task
function deleteTask(taskId) {
    const taskIndex = AppState.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        AppState.tasks.splice(taskIndex, 1);
        
        // If this was the current task, clear current task
        if (AppState.currentTaskId === taskId) {
            AppState.currentTaskId = null;
        }
        
        AppState.saveToLocalStorage();
        return true;
    }
    
    return false;
}

// Complete a task
function completeTask(taskId, progress = 100) {
    const task = getTaskById(taskId);
    
    if (task) {
        task.completed = true;
        task.completedAt = new Date().toISOString();
        task.progress = progress;
        
        // If this was the current task, clear current task
        if (AppState.currentTaskId === taskId) {
            AppState.currentTaskId = null;
        }
        
        AppState.saveToLocalStorage();
        return task;
    }
    
    return null;
}

// Set current task
function setCurrentTask(taskId) {
    const task = getTaskById(taskId);
    
    if (task) {
        AppState.currentTaskId = taskId;
        AppState.saveToLocalStorage();
        return task;
    }
    
    return null;
}

// Get current task
function getCurrentTask() {
    if (AppState.currentTaskId) {
        return getTaskById(AppState.currentTaskId);
    }
    
    return null;
}

// Get all tasks
function getAllTasks() {
    return [...AppState.tasks];
}

// Get incomplete tasks
function getIncompleteTasks() {
    return AppState.tasks.filter(task => !task.completed);
}

// Get completed tasks
function getCompletedTasks() {
    return AppState.tasks.filter(task => task.completed);
}

export {
    addTask,
    getTaskById,
    updateTask,
    deleteTask,
    completeTask,
    setCurrentTask,
    getCurrentTask,
    getAllTasks,
    getIncompleteTasks,
    getCompletedTasks
};
