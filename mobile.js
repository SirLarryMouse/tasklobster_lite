// Mobile-specific functionality for TaskLobster

// Setup mobile collapsible functionality
function setupMobileCollapsible() {
    // Make schedule collapsible on mobile
    const scheduleContainer = document.querySelector('.schedule-container');
    if (scheduleContainer) {
        scheduleContainer.addEventListener('click', function(e) {
            // Only toggle on mobile (check if we're in mobile view)
            if (window.innerWidth <= 768) {
                e.preventDefault();
                this.classList.toggle('expanded');
            }
        });
    }
    
    // Make tasks container collapsible on mobile too
    const tasksContainer = document.getElementById('tasks-container');
    if (tasksContainer) {
        const header = tasksContainer.querySelector('.card-header');
        if (header) {
            header.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    tasksContainer.classList.toggle('expanded');
                }
            });
        }
    }
}

// Initialize mobile functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupMobileCollapsible();
});

