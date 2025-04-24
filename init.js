const tooltipElement = document.createElement('div');
tooltipElement.className = 'custom-tooltip';
document.body.appendChild(tooltipElement);
let tooltipVisible = false;
let tooltipTimeout = null;

function init() {
    updateDateDisplay();
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
    document.getElementById('progress-slider').addEventListener('input', function() {
        document.getElementById('progress-value').textContent = `${this.value}%`;
    });
    setupTabs();
    setupPrioritySlider();
    setupDurationButtons();
    setupPauseReasonModal();
    document.getElementById('import-btn').addEventListener('click', importTasks);
    document.getElementById('export-btn').addEventListener('click', exportTasks);
    document.getElementById('timesheet-btn').addEventListener('click', generateTimesheet);
    document.getElementById('copy-export-btn').addEventListener('click', copyExportText);
    document.getElementById('close-timesheet-btn').addEventListener('click', hideTimesheetModal);
    document.getElementById('download-timesheet-btn').addEventListener('click', downloadTimesheet);
    setInterval(updateTimeTracking, 1000);
    initializeSchedule();
    renderTasks();
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    if (currentTaskId && !isPaused) {
        startTaskTracking(currentTaskId);
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.card-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function setupPrioritySlider() {
    const slider = document.getElementById('task-priority-input');
    const label = document.getElementById('priority-label');
    slider.addEventListener('input', () => {
        const value = parseInt(slider.value);
        label.textContent = PRIORITIES[value];
    });
}

function setupDurationButtons() {
    const durationBtns = document.querySelectorAll('.duration-btn');
    const durationInput = document.getElementById('task-duration-input');
    durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            durationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            durationInput.value = btn.dataset.duration;
        });
    });
    document.querySelector('.duration-btn[data-duration="30"]').classList.add('active');
}

function handlePause() {
    if (!isPaused) {
        document.getElementById('pause-reason-modal').style.display = 'flex';
        document.querySelectorAll('.pause-reason-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('other-reason-group').style.display = 'none';
        document.getElementById('other-reason-input').value = '';
    } else {
        resumeTask();
    }
}

function markDistracted() {
    alert('Focus lost! Take a moment to regain your concentration.');
}

document.addEventListener('DOMContentLoaded', init);