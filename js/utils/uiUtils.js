// uiUtils.js - UI helper functions

// Add a custom tooltip element to the DOM
const tooltipElement = document.createElement('div');
tooltipElement.className = 'custom-tooltip';
document.body.appendChild(tooltipElement);

// Variables to track tooltip state
let tooltipVisible = false;
let tooltipTimeout = null;

// Function to show tooltip
function showTooltip(content, event) {
    // Clear any existing timeout
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    
    // Set tooltip content
    tooltipElement.innerHTML = content;
    
    // Position tooltip near the mouse
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    
    // Ensure tooltip stays within viewport
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust position if needed
    const adjustedX = Math.min(x, viewportWidth - tooltipRect.width - 20);
    const adjustedY = Math.min(y, viewportHeight - tooltipRect.height - 20);
    
    // Set position
    tooltipElement.style.left = `${adjustedX}px`;
    tooltipElement.style.top = `${adjustedY}px`;
    
    // Show tooltip
    tooltipElement.classList.add('visible');
    tooltipVisible = true;
}

// Function to hide tooltip
function hideTooltip() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    
    tooltipTimeout = setTimeout(() => {
        tooltipElement.classList.remove('visible');
        tooltipVisible = false;
    }, 200);
}

// Update the date display
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('en-US', options);
    document.getElementById('current-date').textContent = dateString;
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
    
    // Update current time indicator on schedule
    updateCurrentTimeIndicator();
}

// Update the current time indicator on the schedule
function updateCurrentTimeIndicator() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Create or update current time indicator
    let indicator = document.getElementById('current-time-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'current-time-indicator';
        indicator.className = 'current-time-indicator';
        document.getElementById('schedule-content').appendChild(indicator);
    }
    
    // Calculate position based on 24-hour day
    const dayPercentage = (hours + minutes / 60) / 24 * 100;
    indicator.style.top = `${dayPercentage}%`;
}

export {
    showTooltip,
    hideTooltip,
    updateDateDisplay,
    updateCurrentTime,
    updateCurrentTimeIndicator
};
