function setupPauseReasonModal() {
    const reasonBtns = document.querySelectorAll('.pause-reason-btn');
    const otherReasonGroup = document.getElementById('other-reason-group');
    reasonBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            reasonBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.reason === 'other') {
                otherReasonGroup.style.display = 'block';
            } else {
                otherReasonGroup.style.display = 'none';
            }
        });
    });
    document.getElementById('cancel-pause-btn').addEventListener('click', () => {
        document.getElementById('pause-reason-modal').style.display = 'none';
    });
}

function confirmPause() {
    const activeReasonBtn = document.querySelector('.pause-reason-btn.active');
    if (!activeReasonBtn) {
        alert('Please select a reason for pausing.');
        return;
    }
    const reason = activeReasonBtn.dataset.reason;
    let reasonText = reason;
    if (reason === 'other') {
        const otherInput = document.getElementById('other-reason-input');
        if (!otherInput.value.trim()) {
            alert('Please specify your reason.');
            return;
        }
        reasonText = otherInput.value.trim();
    }
    if (currentTaskId) {
        endTaskTracking(currentTaskId, 'paused');
    }
    isPaused = true;
    pauseReason = reasonText;
    pauseTimestamp = Date.now();
    const now = new Date();
    const breakBlock = {
        id: Date.now().toString(),
        taskId: null,
        reason: reasonText,
        startTime: now.toISOString(),
        endTime: null,
        type: 'break'
    };
    timeBlocks.push(breakBlock);
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        Resume
    `;
    renderSchedule();
    document.getElementById('pause-reason-modal').style.display = 'none';
    document.getElementById('break-timer-overlay').style.display = 'flex';
    document.getElementById('break-timer-reason').textContent = reasonText;
    document.getElementById('break-timer-display').textContent = '00:00';
    document.body.classList.add('break-mode');
    breakDuration = 0;
    breakTimerInterval = setInterval(updateBreakTimer, 1000);
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
    clearInterval(breakTimerInterval);
    document.getElementById('resume-break-btn').style.display = 'none';
    document.getElementById('break-notes-container').style.display = 'block';
}

function saveBreakNotes() {
    const notes = document.getElementById('break-notes-input').value.trim();
    const breakBlockIndex = timeBlocks.findIndex(block => 
        block.type === 'break' && block.endTime === null
    );
    if (breakBlockIndex !== -1 && notes) {
        timeBlocks[breakBlockIndex].notes = notes;
    }
    completeResume();
}

function skipBreakNotes() {
    completeResume();
}

function completeResume() {
    const breakBlockIndex = timeBlocks.findIndex(block => 
        block.type === 'break' && block.endTime === null
    );
    if (breakBlockIndex !== -1) {
        timeBlocks[breakBlockIndex].endTime = new Date().toISOString();
    }
    isPaused = false;
    pauseReason = null;
    pauseTimestamp = null;
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
        Pause
    `;
    document.getElementById('break-timer-overlay').style.display = 'none';
    document.getElementById('break-notes-container').style.display = 'none';
    document.getElementById('resume-break-btn').style.display = 'block';
    document.getElementById('break-notes-input').value = '';
    document.body.classList.remove('break-mode');
    if (currentTaskId) {
        startTaskTracking(currentTaskId);
    }
    renderSchedule();
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    localStorage.removeItem('pauses');
}

function rescheduleCurrentTask() {
    if (!currentTaskId) return;
    const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
    if (taskIndex === -1) return;
    const currentTask = tasks[taskIndex];
    document.getElementById('task-switch-modal').style

.display = 'flex';
    document.getElementById('switch-modal-title').textContent = 'Reschedule Task?';
    document.getElementById('switch-modal-question').textContent = `Are you sure you want to reschedule "${currentTask.name}"?`;
    document.getElementById('progress-slider-container').style.display = 'block';
    const progressSlider = document.getElementById('progress-slider');
    progressSlider.value = currentTask.progress;
    document.getElementById('progress-value').textContent = `${currentTask.progress}%`;
    const confirmButton = document.getElementById('confirm-switch-btn');
    confirmButton.textContent = 'Reschedule';
    confirmButton.dataset.action = 'reschedule';
    confirmButton.dataset.taskId = currentTaskId;
    document.getElementById('new-task-section').style.display = 'none';
}

function completeReschedule(taskId) {
    const progressSlider = document.getElementById('progress-slider');
    const newProgress = parseInt(progressSlider.value);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    tasks[taskIndex].progress = newProgress;
    if (newProgress > 0) {
        const totalTimeSpent = calculateTotalTimeSpent(taskId);
        const estimatedTotalTime = totalTimeSpent / (newProgress / 100);
        tasks[taskIndex].timeRemaining = Math.max(0, estimatedTotalTime - totalTimeSpent);
    }
    endTaskTracking(taskId, 'rescheduled');
    tasks[taskIndex].rescheduleCount += 1;
    const oldTaskId = currentTaskId;
    setNextCurrentTask();
    if (currentTaskId && currentTaskId !== oldTaskId && !isPaused) {
        startTaskTracking(currentTaskId);
    }
    saveToLocalStorage();
    renderTasks();
    document.getElementById('task-switch-modal').style.display = 'none';
}

function cancelTaskSwitch() {
    document.getElementById('task-switch-modal').style.display = 'none';
    document.getElementById('switch-modal-title').textContent = 'Switch Tasks?';
    document.getElementById('confirm-switch-btn').textContent = 'Switch Tasks';
    document.getElementById('confirm-switch-btn').dataset.action = 'switch';
    document.getElementById('progress-slider-container').style.display = 'none';
    document.getElementById('new-task-section').style.display = 'block';
}