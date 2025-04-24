function showAddTaskModal() {
    document.getElementById('add-task-modal').style.display = 'flex';
    document.getElementById('task-name-input').focus();
}

function hideAddTaskModal() {
    document.getElementById('add-task-modal').style.display = 'none';
    document.getElementById('task-form').reset();
    document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.duration-btn[data-duration="30"]').classList.add('active');
    document.getElementById('task-duration-input').value = '30';
    document.getElementById('task-priority-input').value = '3';
    document.getElementById('priority-label').textContent = 'Medium';
}

function saveTask() {
    const nameInput = document.getElementById('task-name-input');
    const descriptionInput = document.getElementById('task-description-input');
    const durationInput = document.getElementById('task-duration-input');
    const priorityInput = document.getElementById('task-priority-input');
    const tagsInput = document.getElementById('task-tags-input');
    const deadlineInput = document.getElementById('task-deadline-input');
    if (!nameInput.value.trim()) {
        alert('Task name is required!');
        return;
    }
    const task = {
        id: Date.now().toString(),
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        duration: parseInt(durationInput.value),
        timeRemaining: parseInt(durationInput.value),
        priority: parseInt(priorityInput.value),
        tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
        deadline: deadlineInput.value || null,
        createdAt: new Date().toISOString(),
        completed: false,
        progress: 0,
        rescheduleCount: 0
    };
    tasks.push(task);
    if (!currentTaskId && tasks.length === 1) {
        currentTaskId = task.id;
        startTaskTracking(currentTaskId);
    }
    saveToLocalStorage();
    renderTasks();
    hideAddTaskModal();
}

function renderTasks() {
    renderCurrentTask();
    renderTasksList();
    renderSchedule();
    updateStatsDisplay();
}

function renderCurrentTask() {
    const currentTaskCard = document.getElementById('current-task-card');
    const noTasksMessage = document.getElementById('no-tasks-message');
    const tasksContainer = document.getElementById('tasks-container');
    if (!currentTaskId || tasks.length === 0) {
        currentTaskCard.style.display = 'none';
        if (tasks.length === 0) {
            noTasksMessage.style.display = 'flex';
            tasksContainer.style.display = 'none';
        } else {
            noTasksMessage.style.display = 'none';
            tasksContainer.style.display = 'block';
        }
        return;
    }
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) {
        currentTaskCard.style.display = 'none';
        if (tasks.length === 0) {
            noTasksMessage.style.display = 'flex';
            tasksContainer.style.display = 'none';
        } else {
            noTasksMessage.style.display = 'none';
            tasksContainer.style.display = 'block';
        }
        return;
    }
    noTasksMessage.style.display = 'none';
    currentTaskCard.style.display = 'block';
    tasksContainer.style.display = 'block';
    updateCurrentTaskDisplay();
}

function renderTasksList() {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';
    const remainingTasks = sortTasks(tasks.filter(t => t.id !== currentTaskId && !t.completed));
    if (remainingTasks.length === 0) {
        return;
    }
    remainingTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.dataset.id = task.id;
        const hours = Math.floor(task.timeRemaining / 60);
        const minutes = Math.round(task.timeRemaining % 60);
        let timeString = '';
        if (hours > 0) {
            timeString += `${hours}h `;
        }
        timeString += `${minutes}m`;
        const priorityClass = task.priority === 1 ? 'lowest' : 
                              task.priority === 2 ? 'low' : 
                              task.priority === 3 ? 'medium' : 
                              task.priority === 4 ? 'high' : 'urgent';
        taskElement.innerHTML = `
            <div class="task-item-left">
                <div class="task-checkbox"></div>
                <div class="task-item-info">
                    <div class="task-item-title">${task.name}</div>
                    <div class="task-item-subtitle">
                        <div class="priority-indicator ${priorityClass}"></div>
                        ${task.description ? task.description.substring(0, 50) + (task.description.length > 50 ? '...' : '') : 'No description'}
                    </div>
                </div>
            </div>
            <div class="task-item-right">
                <div class="task-item-badge">${timeString}</div>
            </div>
        `;
        taskElement.addEventListener('click', () => {
            if (isPaused) {
                alert("Please resume your current task before switching to a new one.");
                return;
            }
            taskElement.dataset.switchId = task.id;
            const currentTask = tasks.find(t => t.id === currentTaskId);
            if (currentTask) {
                document.getElementById('current-task-name-confirm').textContent = currentTask.name;
                document.getElementById('new-task-name-confirm').textContent = task.name;
                document.getElementById('task-switch-modal').style.display = 'flex';
                document.getElementById('confirm-switch-btn').dataset.switchToId = task.id;
            } else {
                switchToTask(task.id);
            }
        });
        tasksList.appendChild(taskElement);
    });
}

function switchToTask(taskId) {
    if (currentTaskId && !isPaused) {
        endTaskTracking(currentTaskId, 'switched');
    }
    currentTaskId = taskId;
    if (!isPaused) {
        startTaskTracking(currentTaskId);
    }
    saveToLocalStorage();
    renderTasks();
    document.getElementById('task-switch-modal').style.display = 'none';
    document.getElementById('switch-modal-title').textContent = 'Switch Tasks?';
    document.getElementById('confirm-switch-btn').textContent = 'Switch Tasks';
    document.getElementById('confirm-switch-btn').dataset.action = 'switch';
    document.getElementById('progress-slider-container').style.display = 'none';
    document.getElementById('new-task-section').style.display = 'block';
}

function setNextCurrentTask() {
    const incompleteTasks = sortTasks(tasks.filter(t => !t.completed));
    currentTaskId = incompleteTasks.length > 0 ? incompleteTasks[0].id : null;
    localStorage.setItem('currentTaskId', currentTaskId);
}

function sortTasks(tasksArray) {
    return tasksArray.sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        if (a.deadline && b.deadline) {
            return new Date(a.deadline) - new Date(b.deadline);
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        if (a.rescheduleCount !== b.rescheduleCount) {
            return a.rescheduleCount - b.rescheduleCount;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('currentTaskId', currentTaskId);
    localStorage.setItem('timeBlocks', JSON.stringify(timeBlocks));
    localStorage.setItem('focusTime', focusTime);
    localStorage.setItem('isPaused', isPaused);
}