function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('en-US', options);
    document.getElementById('current-date').textContent = dateString;
}

function updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    document.getElementById('current-time').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${displayHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}
    `;
    updateCurrentTimeIndicator();
}

function updateCurrentTimeIndicator() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    let indicator = document.querySelector('.current-time-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'current-time-indicator';
        const label = document.createElement('div');
        label.className = 'current-time-label';
        label.textContent = 'Now';
        indicator.appendChild(label);
        document.getElementById('schedule-content').appendChild(indicator);
    }
    const position = (hours + minutes / 60) * (100/24);
    indicator.style.top = `${position}%`;
}

function updateStatsDisplay() {
    const completedCount = tasks.filter(t => t.completed).length;
    const focusHours = Math.floor(focusTime / 60);
    const focusMinutes = Math.round(focusTime % 60);
    let focusTimeString = '';
    if (focusHours > 0) {
        focusTimeString += `${focusHours} hr${focusHours > 1 ? 's' : ''} `;
    }
    if (focusMinutes > 0 || focusHours === 0) {
        focusTimeString += `${focusMinutes} min${focusMinutes !== 1 ? 's' : ''}`;
    }
    document.getElementById('completed-count').textContent = `${completedCount} / ${tasks.length}`;
    document.getElementById('focus-time').textContent = focusTimeString;
}

function updateCurrentTaskDisplay() {
    if (!currentTaskId) return;
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    document.getElementById('current-task-name').textContent = task.name;
    document.getElementById('current-task-description').textContent = task.description || 'No description provided.';
    document.getElementById('current-task-progress').textContent = `${task.progress}%`;
    document.getElementById('current-task-progress-bar').style.width = `${task.progress}%`;
    const hours = Math.floor(task.timeRemaining / 60);
    const minutes = Math.round(task.timeRemaining % 60);
    let timeString = '';
    if (hours > 0) {
        timeString += `${hours} hr${hours > 1 ? 's' : ''} `;
    }
    timeString += `${minutes} min${minutes !== 1 ? 's' : ''}`;
    document.getElementById('current-task-time-remaining').textContent = `${timeString} remaining`;
    const tagsContainer = document.getElementById('current-task-tags');
    tagsContainer.innerHTML = '';
    task.tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            ${tag}
        `;
        tagsContainer.appendChild(tagElement);
    });
    if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        const deadlineString = deadlineDate.toLocaleDateString('en-US', options);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDay = new Date(deadlineDate);
        deadlineDay.setHours(0, 0, 0, 0);
        const diffTime = deadlineDay - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysText = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `(${diffDays} days)`;
        document.getElementById('current-task-deadline').textContent = `${deadlineString} ${daysText}`;
    } else {
        document.getElementById('current-task-deadline').textContent = 'No deadline set';
    }
    const priorityContainer = document.getElementById('current-task-priority');
    const priorityClass = task.priority === 1 ? 'lowest' : task.priority === 2 ? 'low' : task.priority === 3 ? 'medium' : task.priority === 4 ? 'high' : 'urgent';
    priorityContainer.innerHTML = `
        <div class="priority-indicator ${priorityClass}"></div>
        <span class="detail-value-text">${PRIORITIES[task.priority]}</span>
    `;
}

function showTooltip(content, event) {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    tooltipElement.innerHTML = content;
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const adjustedX = Math.min(x, viewportWidth - tooltipRect.width - 20);
    const adjustedY = Math.min(y, viewportHeight - tooltipRect.height - 20);
    tooltipElement.style.left = `${adjustedX}px`;
    tooltipElement.style.top = `${adjustedY}px`;
    tooltipElement.classList.add('visible');
    tooltipVisible = true;
}

function hideTooltip() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    tooltipTimeout = setTimeout(() => {
        tooltipElement.classList.remove('visible');
        tooltipVisible = false;
    }, 200);
}