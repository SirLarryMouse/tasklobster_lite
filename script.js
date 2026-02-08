// ========== Global State ==========
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
let dayStarted = localStorage.getItem('dayStarted') === 'true';

const PRIORITIES = { 1: 'Lowest', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Urgent' };
const PRIORITY_CLASSES = { 1: 'lowest', 2: 'low', 3: 'medium', 4: 'high', 5: 'urgent' };

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

// ========== Toast Notifications ==========
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ========== Init ==========
function closeOrphanedTimeBlocks() {
    let changed = false;
    timeBlocks.forEach(b => {
        if (b.endTime === null && b.type !== 'marker') {
            // Only keep the current active task block open
            if (b.type === 'task' && b.taskId === currentTaskId && dayStarted && !isPaused) return;
            b.endTime = new Date().toISOString();
            b.reason = b.reason || 'orphaned-cleanup';
            changed = true;
        }
    });
    if (changed) localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
}

function init() {
    closeOrphanedTimeBlocks();
    updateHeaderTime();
    updateHeaderDate();
    updateGreeting();
    setInterval(updateHeaderTime, 30000);

    // Dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Style theme
    const savedStyle = localStorage.getItem('appStyle') || 'boil';
    document.documentElement.setAttribute('data-style', savedStyle);
    setupStyleToggle();

    // Start Day / End Day
    document.getElementById('start-day-btn').addEventListener('click', startDay);
    document.getElementById('start-day-add-btn').addEventListener('click', showAddTaskModal);
    document.getElementById('end-day-btn').addEventListener('click', showEndDayModal);
    document.getElementById('confirm-end-day-btn').addEventListener('click', confirmEndDay);
    document.getElementById('cancel-end-day-btn').addEventListener('click', () => {
        document.getElementById('end-day-modal').style.display = 'none';
    });

    // Task actions
    document.getElementById('add-task-btn').addEventListener('click', showAddTaskModal);
    document.getElementById('cancel-task-btn').addEventListener('click', hideAddTaskModal);
    document.getElementById('cancel-task-btn-2').addEventListener('click', hideAddTaskModal);
    document.getElementById('save-task-btn').addEventListener('click', saveTask);
    document.getElementById('pause-btn').addEventListener('click', handlePause);
    document.getElementById('complete-btn').addEventListener('click', completeCurrentTask);
    document.getElementById('reschedule-btn').addEventListener('click', rescheduleCurrentTask);
    document.getElementById('distracted-btn').addEventListener('click', markDistracted);

    // Break
    document.getElementById('resume-break-btn').addEventListener('click', resumeTask);
    document.getElementById('save-break-notes-btn').addEventListener('click', saveBreakNotes);
    document.getElementById('skip-break-notes-btn').addEventListener('click', skipBreakNotes);

    // Task switch
    document.getElementById('confirm-switch-btn').addEventListener('click', function() {
        const action = this.dataset.action || 'switch';
        if (action === 'switch') {
            const switchToId = this.dataset.switchToId;
            if (switchToId) switchToTask(switchToId);
        } else if (action === 'reschedule') {
            const taskId = this.dataset.taskId;
            if (taskId) completeReschedule(taskId);
        }
    });
    document.getElementById('cancel-switch-btn').addEventListener('click', cancelTaskSwitch);
    document.getElementById('progress-slider').addEventListener('input', function() {
        document.getElementById('progress-value').textContent = `${this.value}%`;
    });

    // Options panel
    document.getElementById('options-toggle').addEventListener('click', openOptionsPanel);
    document.getElementById('options-close').addEventListener('click', closeOptionsPanel);
    document.getElementById('options-panel-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeOptionsPanel();
    });

    // Import/Export
    document.getElementById('import-btn').addEventListener('click', importTasks);
    document.getElementById('export-btn').addEventListener('click', exportTasks);
    document.getElementById('timesheet-btn').addEventListener('click', generateTimesheet);
    document.getElementById('copy-export-btn').addEventListener('click', copyExportText);
    document.getElementById('close-timesheet-btn').addEventListener('click', () => {
        document.getElementById('timesheet-modal').style.display = 'none';
    });
    if (document.getElementById('close-timesheet-close')) {
        document.getElementById('close-timesheet-close').addEventListener('click', () => {
            document.getElementById('timesheet-modal').style.display = 'none';
        });
    }
    document.getElementById('download-timesheet-btn').addEventListener('click', downloadTimesheet);

    // Pause modal close buttons
    document.getElementById('cancel-pause-btn').addEventListener('click', () => {
        document.getElementById('pause-reason-modal').style.display = 'none';
    });
    if (document.getElementById('cancel-pause-close')) {
        document.getElementById('cancel-pause-close').addEventListener('click', () => {
            document.getElementById('pause-reason-modal').style.display = 'none';
        });
    }
    document.getElementById('confirm-pause-btn').addEventListener('click', confirmPause);

    setupDurationButtons();
    setupPrioritySlider();
    setupPauseReasonModal();

    // Time tracking
    setInterval(updateTimeTracking, 1000);

    // Reset lastTimestamp when tab becomes visible again to prevent time jumps
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) lastTimestamp = null;
    });

    // Show correct screen
    if (dayStarted) {
        showMainContent();
    } else {
        showStartDayScreen();
    }

    renderTasks();

    if (currentTaskId && !isPaused && dayStarted) {
        startTaskTracking(currentTaskId);
    }
}

// ========== Dark Mode ==========
function toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

// ========== Style Toggle ==========
function setupStyleToggle() {
    const btns = document.querySelectorAll('.style-toggle-btn');
    const current = localStorage.getItem('appStyle') || 'boil';
    btns.forEach(btn => {
        if (btn.dataset.style === current) btn.classList.add('active');
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.documentElement.setAttribute('data-style', btn.dataset.style);
            localStorage.setItem('appStyle', btn.dataset.style);
        });
    });
}

// ========== Header ==========
function updateHeaderTime() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 || 12;
    document.getElementById('header-time').textContent = `${dh}:${m < 10 ? '0' + m : m} ${ampm}`;
}

function updateHeaderDate() {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('header-date').textContent = new Date().toLocaleDateString('en-US', options).toUpperCase();
}

function updateGreeting() {
    const h = new Date().getHours();
    let g = 'Good evening';
    if (h < 12) g = 'Good morning';
    else if (h < 17) g = 'Good afternoon';
    document.getElementById('greeting').textContent = dayStarted ? `${g}, here's your day.` : `${g}.`;
}

// ========== Start Day / End Day ==========
function showStartDayScreen() {
    document.getElementById('start-day-screen').style.display = 'flex';
    const mc = document.getElementById('main-content');
    mc.classList.remove('active');
    mc.style.display = 'none';
    document.getElementById('end-day-btn').style.display = 'none';
    const remaining = tasks.filter(t => !t.completed).length;
    document.getElementById('start-day-task-count').textContent = remaining;
}

function showMainContent() {
    document.getElementById('start-day-screen').style.display = 'none';
    const mc = document.getElementById('main-content');
    mc.style.display = '';
    mc.classList.add('active');
    document.getElementById('end-day-btn').style.display = 'flex';
}

function startDay() {
    dayStarted = true;
    localStorage.setItem('dayStarted', 'true');

    // Record start-day time block
    const now = new Date();
    timeBlocks.push({
        id: generateId(),
        taskId: null,
        reason: 'Day Started',
        startTime: now.toISOString(),
        endTime: now.toISOString(),
        type: 'marker'
    });
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));

    showMainContent();
    updateGreeting();
    renderTasks();

    // Auto-start first task if available
    if (!currentTaskId) {
        setNextCurrentTask();
    }
    if (currentTaskId && !isPaused) {
        startTaskTracking(currentTaskId);
    }
    renderTasks();
}

function showEndDayModal() {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const focusHours = Math.floor(focusTime / 60);
    const focusMins = Math.round(focusTime % 60);
    let focusStr = '';
    if (focusHours > 0) focusStr += `${focusHours}h `;
    focusStr += `${focusMins}m`;

    document.getElementById('end-day-summary').textContent = completed === total && total > 0
        ? 'All tasks completed. Great work today!'
        : `You completed ${completed} of ${total} tasks today.`;
    document.getElementById('end-day-stats').innerHTML = `Focus time: <strong>${focusStr}</strong>`;
    document.getElementById('end-day-modal').style.display = 'flex';
}

function confirmEndDay() {
    // End current task tracking
    if (currentTaskId && !isPaused) {
        endTaskTracking(currentTaskId, 'day-ended');
    }

    // Record end-day marker
    const now = new Date();
    timeBlocks.push({
        id: generateId(),
        taskId: null,
        reason: 'Day Ended',
        startTime: now.toISOString(),
        endTime: now.toISOString(),
        type: 'marker'
    });
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));

    // Export if checked
    if (document.getElementById('end-day-export-timesheet').checked) {
        downloadTimesheet();
    }
    if (document.getElementById('end-day-export-todo').checked) {
        exportTasksSilent();
    }

    // Reset day
    dayStarted = false;
    localStorage.setItem('dayStarted', 'false');
    isPaused = false;
    localStorage.setItem('isPaused', 'false');
    lastTimestamp = null;

    document.getElementById('end-day-modal').style.display = 'none';
    showStartDayScreen();
    updateGreeting();
}

// ========== Briefing ==========
function updateBriefing() {
    const remaining = tasks.filter(t => !t.completed).length;
    const el = document.getElementById('briefing-text');
    if (remaining === 0 && tasks.length > 0) {
        el.innerHTML = `All tasks completed. Nice work!`;
    } else {
        el.innerHTML = `You have <strong>${remaining} task${remaining !== 1 ? 's' : ''}</strong> remaining today.`;
    }
}

// ========== Options Panel ==========
function openOptionsPanel() {
    document.getElementById('options-panel-overlay').classList.add('active');
}

function closeOptionsPanel() {
    document.getElementById('options-panel-overlay').classList.remove('active');
}

// ========== Setup Helpers ==========
function setupDurationButtons() {
    const btns = document.querySelectorAll('.duration-btn');
    const input = document.getElementById('task-duration-input');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            input.value = btn.dataset.duration;
        });
    });
    const def = document.querySelector('.duration-btn[data-duration="30"]');
    if (def) def.classList.add('active');
}

function setupPrioritySlider() {
    const slider = document.getElementById('task-priority-input');
    const label = document.getElementById('priority-label');
    slider.addEventListener('input', () => {
        label.textContent = PRIORITIES[parseInt(slider.value)];
    });
}

function setupPauseReasonModal() {
    const btns = document.querySelectorAll('.pause-reason-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('other-reason-group').style.display =
                btn.dataset.reason === 'other' ? 'block' : 'none';
        });
    });
}

// ========== Task CRUD ==========
function showAddTaskModal() {
    document.getElementById('add-task-modal').style.display = 'flex';
    document.getElementById('task-name-input').focus();
}

function hideAddTaskModal() {
    document.getElementById('add-task-modal').style.display = 'none';
    document.getElementById('task-form').reset();
    document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
    const def = document.querySelector('.duration-btn[data-duration="30"]');
    if (def) def.classList.add('active');
    document.getElementById('task-duration-input').value = '30';
    document.getElementById('task-priority-input').value = '3';
    document.getElementById('priority-label').textContent = 'Medium';
}

function saveTask() {
    const name = document.getElementById('task-name-input').value.trim();
    if (!name) { showToast('Task name is required!', 'warning'); return; }

    const task = {
        id: generateId(),
        name: name,
        description: document.getElementById('task-description-input').value.trim(),
        duration: parseInt(document.getElementById('task-duration-input').value),
        timeRemaining: parseInt(document.getElementById('task-duration-input').value),
        priority: parseInt(document.getElementById('task-priority-input').value),
        tags: document.getElementById('task-tags-input').value.split(',').map(t => t.trim()).filter(t => t),
        deadline: document.getElementById('task-deadline-input').value || null,
        createdAt: new Date().toISOString(),
        completed: false,
        progress: 0,
        rescheduleCount: 0
    };

    tasks.push(task);

    if (!currentTaskId && dayStarted) {
        currentTaskId = task.id;
        startTaskTracking(currentTaskId);
    }

    saveToLocalStorage();
    renderTasks();
    hideAddTaskModal();

    // Update start day screen count if visible
    const countEl = document.getElementById('start-day-task-count');
    if (countEl) countEl.textContent = tasks.filter(t => !t.completed).length;
}

// ========== Time Tracking ==========
function startTaskTracking(taskId) {
    const now = new Date();
    timeBlocks.push({
        id: generateId(),
        taskId: taskId,
        startTime: now.toISOString(),
        originalStartTime: now.toISOString(),
        endTime: null,
        type: 'task'
    });
    lastTimestamp = Date.now();
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
}

function endTaskTracking(taskId, reason = 'completed') {
    const idx = timeBlocks.findIndex(b => b.taskId === taskId && b.endTime === null);
    if (idx !== -1) {
        timeBlocks[idx].endTime = new Date().toISOString();
        timeBlocks[idx].reason = reason;
        localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    }
}

function updateTimeTracking() {
    if (!currentTaskId || isPaused || !dayStarted) { lastTimestamp = null; return; }
    const now = Date.now();
    if (lastTimestamp) {
        const rawElapsed = (now - lastTimestamp) / 1000 / 60;
        // Cap at 3 seconds worth to prevent tab-throttle / sleep jumps
        const elapsed = Math.min(rawElapsed, 0.05);
        const idx = tasks.findIndex(t => t.id === currentTaskId);
        if (idx !== -1) {
            tasks[idx].timeRemaining = Math.max(0, tasks[idx].timeRemaining - elapsed);
            tasks[idx].progress = Math.min(100, Math.round(100 - (tasks[idx].timeRemaining / tasks[idx].duration * 100)));
            if (tasks[idx].timeRemaining <= 0) { completeCurrentTask(); return; }
            updateCurrentTaskDisplay();
        }
        focusTime += elapsed;
        localStorage.setItem('focusTime', focusTime.toString());
        updateStatsDisplay();
    }
    lastTimestamp = now;
}

// ========== Pause / Break ==========
function handlePause() {
    if (!isPaused) {
        document.getElementById('pause-reason-modal').style.display = 'flex';
        document.querySelectorAll('.pause-reason-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('other-reason-group').style.display = 'none';
        document.getElementById('other-reason-input').value = '';
    } else {
        resumeTask();
    }
}

function confirmPause() {
    const activeBtn = document.querySelector('.pause-reason-btn.active');
    if (!activeBtn) { showToast('Please select a reason.', 'warning'); return; }

    let reasonText = activeBtn.dataset.reason;
    if (reasonText === 'other') {
        const val = document.getElementById('other-reason-input').value.trim();
        if (!val) { showToast('Please specify your reason.', 'warning'); return; }
        reasonText = val;
    }

    if (currentTaskId) endTaskTracking(currentTaskId, 'paused');

    isPaused = true;
    pauseReason = reasonText;
    pauseTimestamp = Date.now();

    timeBlocks.push({
        id: generateId(),
        taskId: null,
        reason: reasonText,
        startTime: new Date().toISOString(),
        endTime: null,
        type: 'break'
    });
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));

    updatePauseButtonUI(true);
    renderSchedule();
    document.getElementById('pause-reason-modal').style.display = 'none';

    // Show break timer
    document.getElementById('break-timer-overlay').style.display = 'flex';
    document.getElementById('break-timer-reason').textContent = reasonText;
    document.getElementById('break-timer-display').textContent = '00:00';
    document.body.classList.add('break-mode');
    breakDuration = 0;
    breakTimerInterval = setInterval(() => {
        breakDuration++;
        const m = Math.floor(breakDuration / 60);
        const s = breakDuration % 60;
        document.getElementById('break-timer-display').textContent =
            `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);

    saveToLocalStorage();
}

function updatePauseButtonUI(paused) {
    const btn = document.getElementById('pause-btn');
    if (paused) {
        btn.innerHTML = `<span class="icon-circle"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>Resume`;
    } else {
        btn.innerHTML = `<span class="icon-circle"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></span>Pause`;
    }
}

function resumeTask() {
    if (!isPaused) return;
    clearInterval(breakTimerInterval);
    document.getElementById('resume-break-btn').style.display = 'none';
    document.getElementById('break-notes-container').style.display = 'block';
}

function saveBreakNotes() {
    const notes = document.getElementById('break-notes-input').value.trim();
    const idx = timeBlocks.findIndex(b => b.type === 'break' && b.endTime === null);
    if (idx !== -1 && notes) timeBlocks[idx].notes = notes;
    completeResume();
}

function skipBreakNotes() { completeResume(); }

function completeResume() {
    const idx = timeBlocks.findIndex(b => b.type === 'break' && b.endTime === null);
    if (idx !== -1) timeBlocks[idx].endTime = new Date().toISOString();

    isPaused = false;
    pauseReason = null;
    pauseTimestamp = null;

    updatePauseButtonUI(false);
    document.getElementById('break-timer-overlay').style.display = 'none';
    document.getElementById('break-notes-container').style.display = 'none';
    document.getElementById('resume-break-btn').style.display = 'block';
    document.getElementById('break-notes-input').value = '';
    document.body.classList.remove('break-mode');

    if (currentTaskId) startTaskTracking(currentTaskId);

    renderSchedule();
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    saveToLocalStorage();
}

// ========== Complete / Reschedule / Distracted ==========
function completeCurrentTask() {
    if (!currentTaskId) return;
    endTaskTracking(currentTaskId, 'completed');
    const idx = tasks.findIndex(t => t.id === currentTaskId);
    if (idx !== -1) {
        tasks[idx].completed = true;
        tasks[idx].progress = 100;
        tasks[idx].completedAt = new Date().toISOString();
        const old = currentTaskId;
        setNextCurrentTask();
        if (currentTaskId && currentTaskId !== old && !isPaused) startTaskTracking(currentTaskId);
        saveToLocalStorage();
        renderTasks();
    }
}

function rescheduleCurrentTask() {
    if (!currentTaskId) return;
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;

    document.getElementById('task-switch-modal').style.display = 'flex';
    document.getElementById('switch-modal-title').textContent = 'Reschedule Task?';
    document.getElementById('switch-modal-question').textContent = `Reschedule "${task.name}"?`;
    document.getElementById('progress-slider-container').style.display = 'block';
    document.getElementById('progress-slider').value = task.progress;
    document.getElementById('progress-value').textContent = `${task.progress}%`;

    const btn = document.getElementById('confirm-switch-btn');
    btn.textContent = 'Reschedule';
    btn.dataset.action = 'reschedule';
    btn.dataset.taskId = currentTaskId;
    document.getElementById('new-task-section').style.display = 'none';
}

function completeReschedule(taskId) {
    const newProgress = parseInt(document.getElementById('progress-slider').value);
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;

    tasks[idx].progress = newProgress;
    if (newProgress > 0) {
        const spent = calculateTotalTimeSpent(taskId);
        const est = spent / (newProgress / 100);
        tasks[idx].timeRemaining = Math.max(0, est - spent);
    }

    endTaskTracking(taskId, 'rescheduled');
    tasks[idx].rescheduleCount = (tasks[idx].rescheduleCount || 0) + 1;

    const old = currentTaskId;
    setNextCurrentTask();
    if (currentTaskId && currentTaskId !== old && !isPaused) startTaskTracking(currentTaskId);

    saveToLocalStorage();
    renderTasks();
    document.getElementById('task-switch-modal').style.display = 'none';
}

function calculateTotalTimeSpent(taskId) {
    let total = 0;
    timeBlocks.forEach(b => {
        if (b.taskId === taskId && b.endTime) {
            total += (new Date(b.endTime) - new Date(b.startTime)) / 60000;
        }
    });
    return total;
}

function markDistracted() {
    if (!currentTaskId) return;
    timeBlocks.push({
        id: generateId(),
        taskId: currentTaskId,
        reason: 'distracted',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        type: 'distraction-marker'
    });
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));

    const task = tasks.find(t => t.id === currentTaskId);
    const name = task ? task.name : 'current task';
    showToast(`Distraction logged on "${name}". Refocus!`, 'warning');
}

function setNextCurrentTask() {
    const incomplete = sortTasks(tasks.filter(t => !t.completed));
    currentTaskId = incomplete.length > 0 ? incomplete[0].id : null;
    localStorage.setItem('currentTaskId', currentTaskId);
}

function sortTasks(arr) {
    return [...arr].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        if ((a.rescheduleCount || 0) !== (b.rescheduleCount || 0))
            return (a.rescheduleCount || 0) - (b.rescheduleCount || 0);
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

// ========== Task Switch ==========
function switchToTask(taskId) {
    if (currentTaskId && !isPaused) endTaskTracking(currentTaskId, 'switched');
    currentTaskId = taskId;
    if (!isPaused) startTaskTracking(currentTaskId);
    saveToLocalStorage();
    renderTasks();
    document.getElementById('task-switch-modal').style.display = 'none';
    resetSwitchModal();
}

function cancelTaskSwitch() {
    document.getElementById('task-switch-modal').style.display = 'none';
    resetSwitchModal();
}

function resetSwitchModal() {
    document.getElementById('switch-modal-title').textContent = 'Switch Tasks?';
    document.getElementById('confirm-switch-btn').textContent = 'Switch Tasks';
    document.getElementById('confirm-switch-btn').dataset.action = 'switch';
    document.getElementById('progress-slider-container').style.display = 'none';
    document.getElementById('new-task-section').style.display = 'block';
}

// ========== Rendering ==========
function renderTasks() {
    renderCurrentTask();
    renderTasksList();
    renderSchedule();
    updateStatsDisplay();
    updateBriefing();
}

function renderCurrentTask() {
    const focusSec = document.getElementById('focus-section');
    const noMsg = document.getElementById('no-tasks-message');
    const queueSec = document.getElementById('queue-section');
    const schedSec = document.getElementById('schedule-section');

    if (!currentTaskId || tasks.length === 0) {
        focusSec.style.display = 'none';
        if (tasks.length === 0) {
            noMsg.style.display = 'flex';
            queueSec.style.display = 'flex';
            schedSec.style.display = 'none';
        } else {
            noMsg.style.display = 'none';
            queueSec.style.display = 'flex';
            schedSec.style.display = 'block';
        }
        return;
    }

    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) { focusSec.style.display = 'none'; return; }

    noMsg.style.display = 'none';
    focusSec.style.display = 'block';
    queueSec.style.display = 'flex';
    schedSec.style.display = 'block';
    updateCurrentTaskDisplay();
}

function updateCurrentTaskDisplay() {
    if (!currentTaskId) return;
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;

    document.getElementById('current-task-name').textContent = task.name;
    document.getElementById('current-task-description').textContent = task.description || 'No description provided.';

    const pctEl = document.getElementById('current-task-progress');
    pctEl.innerHTML = `${task.progress}<sup>%</sup>`;
    document.getElementById('current-task-progress-bar').style.width = `${task.progress}%`;

    // Time remaining
    const h = Math.floor(task.timeRemaining / 60);
    const m = Math.round(task.timeRemaining % 60);
    let ts = '';
    if (h > 0) ts += `${h}h `;
    ts += `${m}m`;
    document.getElementById('current-task-time-remaining').textContent = `${ts} left`;

    // Progress note
    const now = new Date();
    const finishTime = new Date(now.getTime() + task.timeRemaining * 60000);
    const fh = finishTime.getHours() % 12 || 12;
    const fm = finishTime.getMinutes();
    const fap = finishTime.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('progress-note').textContent =
        `On track \u2014 est. done by ${fh}:${fm < 10 ? '0' + fm : fm} ${fap}`;

    // Tags
    const tagsEl = document.getElementById('current-task-tags');
    tagsEl.innerHTML = '';
    task.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        tagsEl.appendChild(span);
    });

    // Deadline
    if (task.deadline) {
        const dl = new Date(task.deadline);
        const opts = { weekday: 'long', month: 'long', day: 'numeric' };
        const dlStr = dl.toLocaleDateString('en-US', opts);
        const today = new Date(); today.setHours(0,0,0,0);
        const dlDay = new Date(dl); dlDay.setHours(0,0,0,0);
        const diff = Math.ceil((dlDay - today) / 86400000);
        const dText = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `(${diff} days)`;
        document.getElementById('current-task-deadline').textContent = `${dlStr} ${dText}`;
    } else {
        document.getElementById('current-task-deadline').textContent = 'No deadline set';
    }

    // Priority
    const pc = PRIORITY_CLASSES[task.priority] || 'medium';
    document.getElementById('current-task-priority').innerHTML =
        `<span class="priority-bar ${pc}"></span>${PRIORITIES[task.priority]}`;

    // Status indicator
    const statusEl = document.getElementById('status-live');
    if (isPaused) {
        statusEl.innerHTML = '<span class="live-dot" style="background:var(--gold);animation:none"></span>Paused';
        statusEl.style.color = 'var(--gold)';
    } else {
        statusEl.innerHTML = '<span class="live-dot"></span>In Progress';
        statusEl.style.color = '';
    }
}

function renderTasksList() {
    const list = document.getElementById('tasks-list');
    list.innerHTML = '';

    const remaining = sortTasks(tasks.filter(t => t.id !== currentTaskId && !t.completed));
    const countEl = document.getElementById('queue-count');

    // Calculate total time
    let totalMins = 0;
    remaining.forEach(t => totalMins += t.timeRemaining);
    const th = Math.floor(totalMins / 60);
    const tm = Math.round(totalMins % 60);
    let timeStr = '';
    if (th > 0) timeStr += `${th}h `;
    timeStr += `${tm}m`;
    countEl.textContent = `${remaining.length} task${remaining.length !== 1 ? 's' : ''} \u00b7 ~${timeStr}`;

    remaining.forEach((task, i) => {
        const el = document.createElement('div');
        el.className = 'queue-item';
        el.dataset.id = task.id;

        const h = Math.floor(task.timeRemaining / 60);
        const m = Math.round(task.timeRemaining % 60);
        let ts = '';
        if (h > 0) ts += `${h}h `;
        ts += `${m}m`;

        const pc = PRIORITY_CLASSES[task.priority] || 'medium';

        // Context line
        let ctx = task.tags.length > 0 ? task.tags[0] : '';
        if (task.deadline) {
            const dl = new Date(task.deadline);
            const today = new Date(); today.setHours(0,0,0,0);
            const dlDay = new Date(dl); dlDay.setHours(0,0,0,0);
            const diff = Math.ceil((dlDay - today) / 86400000);
            const dueText = diff === 0 ? 'Due today' : diff === 1 ? 'Due tomorrow' : diff <= 7 ? `Due in ${diff} days` : '';
            if (dueText) ctx += (ctx ? ' \u00b7 ' : '') + dueText;
        }
        if (!ctx) ctx = PRIORITIES[task.priority];

        el.innerHTML = `
            <span class="q-rank">${i + 1}</span>
            <div class="q-indicator ${pc}"></div>
            <div class="q-info">
                <div class="q-title">${task.name}</div>
                <div class="q-context">${ctx}</div>
            </div>
            <span class="q-duration">${ts}</span>
        `;

        el.addEventListener('click', () => {
            if (isPaused) { showToast('Resume your current task first.', 'warning'); return; }
            const cur = tasks.find(t => t.id === currentTaskId);
            if (cur) {
                document.getElementById('current-task-name-confirm').textContent = cur.name;
                const confirms = document.querySelectorAll('#new-task-name-confirm, #new-task-name-confirm-2');
                confirms.forEach(c => c.textContent = task.name);
                document.getElementById('task-switch-modal').style.display = 'flex';
                document.getElementById('confirm-switch-btn').dataset.switchToId = task.id;
                document.getElementById('confirm-switch-btn').dataset.action = 'switch';
                document.getElementById('confirm-switch-btn').textContent = 'Switch Tasks';
                document.getElementById('progress-slider-container').style.display = 'none';
                document.getElementById('new-task-section').style.display = 'block';
            } else {
                switchToTask(task.id);
            }
        });

        list.appendChild(el);
    });
}

// ========== Schedule ==========
function renderSchedule() {
    const track = document.getElementById('schedule-track');
    if (!track) return;
    track.innerHTML = '';

    const today = new Date();
    today.setHours(0,0,0,0);

    // Gather items: completed blocks, current block, future tasks
    const items = [];

    // Completed time blocks for today
    timeBlocks.filter(b => b.endTime && b.type !== 'marker').forEach(b => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        const bDay = new Date(start); bDay.setHours(0,0,0,0);
        if (bDay.getTime() !== today.getTime()) return;

        const dMins = Math.round((end - start) / 60000);
        if (dMins < 1) return;

        let name = 'Break';
        let type = 'completed';
        if (b.type === 'break') {
            name = `Break: ${b.reason || ''}`;
            type = 'break-block';
        } else {
            const task = tasks.find(t => t.id === b.taskId);
            name = task ? task.name : 'Unknown';
        }

        items.push({
            time: start,
            name: name,
            duration: dMins,
            type: type
        });
    });

    // Active block
    const activeBlock = timeBlocks.find(b => b.endTime === null && b.type !== 'marker');
    if (activeBlock) {
        const start = new Date(activeBlock.startTime);
        const now = new Date();
        const dMins = Math.round((now - start) / 60000);

        if (activeBlock.type === 'break') {
            items.push({ time: start, name: `Break: ${activeBlock.reason || ''}`, duration: Math.max(1, dMins), type: 'break-block' });
        } else {
            const task = tasks.find(t => t.id === activeBlock.taskId);
            if (task) {
                items.push({ time: start, name: task.name, duration: task.duration, type: 'current' });
            }
        }
    }

    // Future tasks
    if (!isPaused) {
        let nextTime = new Date();
        if (activeBlock && activeBlock.type === 'task') {
            const task = tasks.find(t => t.id === activeBlock.taskId);
            if (task) {
                const start = new Date(activeBlock.originalStartTime || activeBlock.startTime);
                nextTime = new Date(start.getTime() + task.duration * 60000);
            }
        }
        const future = sortTasks(tasks.filter(t => !t.completed && t.id !== currentTaskId));
        future.forEach(task => {
            items.push({ time: new Date(nextTime), name: task.name, duration: task.timeRemaining, type: 'future' });
            nextTime = new Date(nextTime.getTime() + task.timeRemaining * 60000);
        });
    }

    // Sort by time
    items.sort((a, b) => a.time - b.time);

    // Render
    items.forEach(item => {
        const el = document.createElement('div');
        el.className = `schedule-block ${item.type}`;

        const h = item.time.getHours() % 12 || 12;
        const m = item.time.getMinutes();
        const ap = item.time.getHours() >= 12 ? 'pm' : 'am';

        const dh = Math.floor(item.duration / 60);
        const dm = Math.round(item.duration % 60);
        let dStr = '';
        if (dh > 0) dStr += `${dh}h `;
        dStr += `${dm}m`;

        el.innerHTML = `
            <span class="sched-time">${h}:${m < 10 ? '0' + m : m} ${ap}</span>
            <span class="sched-name">${item.name}</span>
            <span class="sched-duration">${dStr}</span>
        `;
        track.appendChild(el);
    });

    if (items.length === 0) {
        track.innerHTML = '<div style="padding:16px;text-align:center;font-size:0.72rem;color:var(--text-muted)">No schedule items yet.</div>';
    }
}

// ========== Stats ==========
function updateStatsDisplay() {
    const completed = tasks.filter(t => t.completed).length;
    const fh = Math.floor(focusTime / 60);
    const fm = Math.round(focusTime % 60);
    let fs = '';
    if (fh > 0) fs += `${fh}h `;
    fs += `${fm}m`;
    document.getElementById('completed-count').textContent = `${completed} / ${tasks.length}`;
    document.getElementById('focus-time').textContent = fs;
}

// ========== Import / Export ==========
function importTasks() {
    const text = document.getElementById('import-text').value.trim();
    if (!text) { showToast('Paste todo.txt content to import.', 'warning'); return; }

    const lines = text.split('\n').filter(l => l.trim());
    const imported = [];

    lines.forEach(line => {
        let priority = 3, name = line.trim(), tags = [], deadline = null;
        let completed = false, completedAt = null, duration = 30, progress = 0;

        if (name.startsWith('x ')) {
            completed = true;
            name = name.substring(2).trim();
            const cdm = name.match(/^(\d{4}-\d{2}-\d{2})\s+/);
            if (cdm) { completedAt = cdm[1]; name = name.substring(cdm[0].length); }
        }

        const pm = name.match(/^\(([A-Z])\)\s+/);
        if (pm) {
            const l = pm[1];
            priority = l === 'A' ? 5 : l === 'B' ? 4 : l === 'C' ? 3 : l === 'D' ? 2 : 1;
            name = name.substring(pm[0].length);
        }

        const dm = name.match(/^(\d{4}-\d{2}-\d{2})\s+/);
        let createdAt = new Date().toISOString();
        if (dm) { createdAt = new Date(dm[1]).toISOString(); name = name.substring(dm[0].length); }

        (name.match(/@\w+/g) || []).forEach(c => { tags.push(c.substring(1)); name = name.replace(c, '').trim(); });
        (name.match(/\+\w+/g) || []).forEach(p => { tags.push(p.substring(1)); name = name.replace(p, '').trim(); });

        const durM = name.match(/\bdur:(\d+)\b/);
        if (durM) { duration = Math.max(1, parseInt(durM[1])); name = name.replace(durM[0], '').trim(); }

        const progM = name.match(/\bprogress:(\d{1,3})\b/);
        if (progM) { progress = Math.min(100, Math.max(0, parseInt(progM[1]))); name = name.replace(progM[0], '').trim(); }

        const dueM = name.match(/due:(\d{4}-\d{2}-\d{2})/);
        if (dueM) { deadline = dueM[1]; name = name.replace(dueM[0], '').trim(); }

        const np = completed ? 100 : progress;
        const tr = completed ? 0 : Math.max(0, Math.round(duration * (1 - np / 100)));

        imported.push({
            id: generateId(),
            name, description: '', duration, timeRemaining: tr, priority, tags, deadline,
            createdAt, completed, completedAt: completedAt ? new Date(completedAt).toISOString() : null,
            progress: np, rescheduleCount: 0
        });
    });

    if (imported.length === 0) { showToast('No valid tasks found.', 'warning'); return; }

    tasks = tasks.concat(imported);
    if (!currentTaskId && imported.length > 0 && dayStarted) {
        setNextCurrentTask();
        if (currentTaskId && !isPaused) startTaskTracking(currentTaskId);
    }

    saveToLocalStorage();
    renderTasks();
    document.getElementById('import-text').value = '';
    showToast(`Imported ${imported.length} tasks.`, 'info');
}

function exportTasks() {
    if (tasks.length === 0) { showToast('No tasks to export.', 'warning'); return; }
    const text = buildTodoTxt();
    document.getElementById('export-text').value = text;
    document.getElementById('export-output').style.display = 'block';

    const ts = new Date();
    const dp = ts.toISOString().split('T')[0];
    const tp = `${String(ts.getHours()).padStart(2,'0')}-${String(ts.getMinutes()).padStart(2,'0')}`;
    downloadTextFile(text, `tasklobster_${dp}_${tp}.todo.txt`, 'text/plain');
}

function exportTasksSilent() {
    if (tasks.length === 0) return;
    const text = buildTodoTxt();
    const ts = new Date();
    const dp = ts.toISOString().split('T')[0];
    const tp = `${String(ts.getHours()).padStart(2,'0')}-${String(ts.getMinutes()).padStart(2,'0')}`;
    downloadTextFile(text, `tasklobster_${dp}_${tp}.todo.txt`, 'text/plain');
}

function buildTodoTxt() {
    let text = '';
    tasks.forEach(task => {
        let line = '';
        if (task.completed) {
            const cd = task.completedAt ? formatDate(task.completedAt) + ' ' : '';
            line += `x ${cd}`;
        }
        if (task.priority === 5) line += '(A) ';
        else if (task.priority === 4) line += '(B) ';
        else if (task.priority === 3) line += '(C) ';
        else if (task.priority === 2) line += '(D) ';
        else if (task.priority === 1) line += '(E) ';

        const cd = new Date(task.createdAt || new Date());
        line += `${cd.getFullYear()}-${String(cd.getMonth()+1).padStart(2,'0')}-${String(cd.getDate()).padStart(2,'0')} `;
        line += task.name;
        (task.tags || []).forEach(t => { line += ` @${t}`; });
        if (task.deadline) line += ` due:${task.deadline}`;
        if (task.duration) line += ` dur:${Math.round(task.duration)}`;
        if (task.progress !== undefined && task.progress !== null) line += ` progress:${Math.round(task.progress)}`;
        text += line + '\n';
    });
    return text;
}

function copyExportText() {
    const el = document.getElementById('export-text');
    el.select();
    document.execCommand('copy');
    showToast('Copied to clipboard!', 'info');
}

// ========== Timesheet ==========
function generateTimesheet() {
    document.getElementById('timesheet-modal').style.display = 'flex';
    closeOptionsPanel();

    const content = document.getElementById('timesheet-content');
    content.innerHTML = '';

    const today = new Date(); today.setHours(0,0,0,0);
    const todayBlocks = timeBlocks.filter(b => {
        const bd = new Date(b.startTime); bd.setHours(0,0,0,0);
        return bd.getTime() === today.getTime() && b.type !== 'marker';
    });

    let totalWork = 0, totalBreak = 0;
    todayBlocks.forEach(b => {
        if (!b.endTime) return;
        const dur = (new Date(b.endTime) - new Date(b.startTime)) / 60000;
        if (b.type === 'break') totalBreak += dur; else totalWork += dur;
    });

    let html = `<table class="timesheet-table"><thead><tr><th>Start</th><th>End</th><th>Duration</th><th>Activity</th><th>Status</th></tr></thead><tbody>`;

    if (todayBlocks.length === 0) {
        html += `<tr><td colspan="5" style="text-align:center">No activity today</td></tr>`;
    } else {
        [...todayBlocks].sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).forEach(b => {
            const st = new Date(b.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
            let et = 'Active', ds = 'Ongoing', status = 'Active';
            if (b.endTime) {
                et = new Date(b.endTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
                const dm = Math.round((new Date(b.endTime) - new Date(b.startTime)) / 60000);
                const dh = Math.floor(dm/60), dmr = dm%60;
                ds = (dh > 0 ? `${dh}h ` : '') + `${dmr}m`;
                status = b.reason || 'Completed';
            }
            let act = 'Break';
            if (b.type !== 'break' && b.taskId) {
                const t = tasks.find(t => t.id === b.taskId);
                act = t ? t.name : 'Unknown';
            } else if (b.reason) act = `Break: ${b.reason}`;
            html += `<tr><td>${st}</td><td>${et}</td><td>${ds}</td><td>${act}</td><td>${status}</td></tr>`;
        });
    }

    const fmtTime = (mins) => {
        const h = Math.floor(mins/60), m = Math.round(mins%60);
        return (h > 0 ? `${h}h ` : '') + `${m}m`;
    };

    html += `</tbody></table><div class="timesheet-total"><p>Work: ${fmtTime(totalWork)}</p><p>Breaks: ${fmtTime(totalBreak)}</p><p>Net: ${fmtTime(totalWork)}</p></div>`;
    content.innerHTML = html;
}

function downloadTimesheet() {
    const today = new Date(); today.setHours(0,0,0,0);
    const ds = today.toISOString().split('T')[0];
    const blocks = timeBlocks.filter(b => {
        const bd = new Date(b.startTime); bd.setHours(0,0,0,0);
        return bd.getTime() === today.getTime() && b.type !== 'marker';
    }).sort((a,b) => new Date(a.startTime) - new Date(b.startTime));

    let csv = 'Start Time,End Time,Duration (minutes),Activity,Status\n';
    blocks.forEach(b => {
        const st = new Date(b.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
        let et = 'Active', dm = 'Ongoing', status = 'Active';
        if (b.endTime) {
            et = new Date(b.endTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
            dm = Math.round((new Date(b.endTime) - new Date(b.startTime)) / 60000);
            status = b.reason || 'Completed';
        }
        let act = 'Break';
        if (b.type !== 'break' && b.taskId) {
            const t = tasks.find(t => t.id === b.taskId);
            act = t ? t.name : 'Unknown';
        } else if (b.reason) act = `Break: ${b.reason}`;
        csv += `${st},${et},${dm},"${act.replace(/,/g,';')}","${String(status).replace(/,/g,';')}"\n`;
    });
    downloadTextFile(csv, `TaskLobster_Timesheet_${ds}.csv`, 'text/csv;charset=utf-8;');
}

// ========== Utilities ==========
function downloadTextFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatDate(str) {
    const d = new Date(str);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('currentTaskId', currentTaskId);
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    localStorage.setItem('focusTime', focusTime);
    localStorage.setItem('isPaused', isPaused);
    localStorage.setItem('dayStarted', dayStarted);
}

// ========== Bootstrap ==========
document.addEventListener('DOMContentLoaded', init);
