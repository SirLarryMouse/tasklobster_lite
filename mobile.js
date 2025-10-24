// Mobile-specific functionality for TaskLobster

// Setup mobile collapsible functionality with accordion behavior
function setupMobileCollapsible() {
    const collapsibleSections = [
        document.querySelector('.schedule-container'),
        document.getElementById('tasks-container')
    ].filter(Boolean); // Remove null elements
    
    // Function to collapse all sections except the target
    function collapseOthers(targetSection) {
        collapsibleSections.forEach(section => {
            if (section !== targetSection) {
                section.classList.remove('expanded');
            }
        });
    }
    
    // Make schedule collapsible on mobile
    const scheduleContainer = document.querySelector('.schedule-container');
    if (scheduleContainer) {
        scheduleContainer.addEventListener('click', function(e) {
            // Only toggle on mobile (check if we're in mobile view)
            if (window.innerWidth <= 768) {
                e.preventDefault();
                
                // If this section is being expanded, collapse others
                if (!this.classList.contains('expanded')) {
                    collapseOthers(this);
                }
                
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
                    
                    // If this section is being expanded, collapse others
                    if (!tasksContainer.classList.contains('expanded')) {
                        collapseOthers(tasksContainer);
                    }
                    
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
