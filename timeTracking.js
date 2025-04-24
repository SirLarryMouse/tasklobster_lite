function startTaskTracking(taskId) {
    const now = new Date();
    const timeBlock = {
        id: Date.now().toString(),
        taskId: taskId,
        startTime: now.toISOString(),
        originalStartTime: now.toISOString(),
        endTime: null,
        type: 'task'
    };
    timeBlocks.push(timeBlock);
    lastTimestamp = Date.now();
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
}

function endTaskTracking(taskId, reason = 'completed') {
    const now = new Date();
    const timeBlockIndex = timeBlocks.findIndex(block => 
        block.taskId === taskId && block.endTime === null
    );
    if (timeBlockIndex !== -1) {
        timeBlocks[timeBlockIndex].endTime = now.toISOString();
        timeBlocks[timeBlockIndex].reason = reason;
        localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    }
}

function updateTimeTracking() {
    if (!currentTaskId || isPaused) {
        lastTimestamp = null;
        return;
    }
    const now = Date.now();
    if (lastTimestamp) {
        const elapsed = (now - lastTimestamp) / 1000 / 60;
        const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            task.timeRemaining = Math.max(0, task.timeRemaining - elapsed);
            task.progress = Math.min(100, Math.round(100 - (task.timeRemaining / task.duration * 100)));
            if (task.timeRemaining <= 0) {
                completeCurrentTask();
            }
            updateCurrentTaskDisplay();
        }
        focusTime += elapsed;
        localStorage.setItem('focusTime', focusTime.toString());
        updateStatsDisplay();
    }
    lastTimestamp = now;
}

function calculateTotalTimeSpent(taskId) {
    let totalTimeSpent = 0;
    timeBlocks.forEach(block => {
        if (block.taskId === taskId && block.endTime) {
            const startTime = new Date(block.startTime);
            const endTime = new Date(block.endTime);
            const duration = (endTime - startTime) / (1000 * 60);
            totalTimeSpent += duration;
        }
    });
    return totalTimeSpent;
}

function completeCurrentTask() {
    if (!currentTaskId) return;
    endTaskTracking(currentTaskId, 'completed');
    const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = true;
        tasks[taskIndex].progress = 100;
        tasks[taskIndex].completedAt = new Date().toISOString();
        const oldTaskId = currentTaskId;
        setNextCurrentTask();
        if (currentTaskId && currentTaskId !== oldTaskId && !isPaused) {
            startTaskTracking(currentTaskId);
        }
        saveToLocalStorage();
        renderTasks();
    }
}