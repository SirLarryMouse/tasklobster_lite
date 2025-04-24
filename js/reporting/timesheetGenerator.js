// timesheetGenerator.js - Generate timesheets and reports

import AppState from '../core/state.js';

// Generate timesheet
function generateTimesheet() {
    // Open the timesheet modal
    document.getElementById('timesheet-modal').style.display = 'flex';
    
    const timesheetContent = document.getElementById('timesheet-content');
    timesheetContent.innerHTML = '';
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all time blocks for today
    const todayBlocks = AppState.timeBlocks.filter(block => {
        const blockDate = new Date(block.startTime);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === today.getTime();
    });
    
    // Calculate total work time and break time
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    
    todayBlocks.forEach(block => {
        if (!block.endTime) return; // Skip active blocks
        
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);
        const durationMinutes = (endTime - startTime) / 1000 / 60;
        
        if (block.type === 'break') {
            totalBreakMinutes += durationMinutes;
        } else {
            totalWorkMinutes += durationMinutes;
        }
    });
    
    // Create timesheet HTML
    let timesheetHTML = `
        <div class="timesheet-section">
            <h4 class="timesheet-section-title">Time Log</h4>
            <table class="timesheet-table">
                <thead>
                    <tr>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                        <th>Activity</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (todayBlocks.length === 0) {
        timesheetHTML += `
            <tr>
                <td colspan="5" style="text-align: center;">No activity recorded today</td>
            </tr>
        `;
    } else {
        // Sort blocks by start time
        const sortedBlocks = [...todayBlocks].sort((a, b) => 
            new Date(a.startTime) - new Date(b.startTime)
        );
        
        sortedBlocks.forEach(block => {
            const startTime = new Date(block.startTime);
            const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let endTimeStr = 'Active';
            let durationStr = 'Ongoing';
            let status = 'Active';
            
            if (block.endTime) {
                const endTime = new Date(block.endTime);
                endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);
                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;
                
                durationStr = '';
                if (hours > 0) durationStr += `${hours}h `;
                durationStr += `${minutes}m`;
                
                status = block.reason || 'Completed';
            }
            
            let activity = 'Break';
            if (block.type !== 'break' && block.taskId) {
                const task = AppState.tasks.find(t => t.id === block.taskId);
                if (task) {
                    activity = task.name;
                } else {
                    activity = 'Unknown Task';
                }
            } else if (block.reason) {
                activity = `Break: ${block.reason}`;
            }
            
            timesheetHTML += `
                <tr>
                    <td>${startTimeStr}</td>
                    <td>${endTimeStr}</td>
                    <td>${durationStr}</td>
                    <td>${activity}</td>
                    <td>${status}</td>
                </tr>
            `;
        });
    }
    
    // Format total times
    const totalWorkHours = Math.floor(totalWorkMinutes / 60);
    const totalWorkMinutesRemainder = totalWorkMinutes % 60;
    let totalWorkText = '';
    if (totalWorkHours > 0) totalWorkText += `${totalWorkHours}h `;
    totalWorkText += `${totalWorkMinutesRemainder}m`;
    
    const totalBreakHours = Math.floor(totalBreakMinutes / 60);
    const totalBreakMinutesRemainder = Math.round(totalBreakMinutes % 60);
    let totalBreakText = '';
    if (totalBreakHours > 0) totalBreakText += `${totalBreakHours}h `;
    totalBreakText += `${totalBreakMinutesRemainder}m`;
    
    // Net working time
    const netMinutes = Math.max(0, totalWorkMinutes);
    const netHours = Math.floor(netMinutes / 60);
    const netMinutesRemainder = Math.round(netMinutes % 60);
    let netText = '';
    if (netHours > 0) netText += `${netHours}h `;
    netText += `${netMinutesRemainder}m`;
    
    timesheetHTML += `
                </tbody>
            </table>
        </div>
        
        <div class="timesheet-total">
            <p>Total Work Time: ${totalWorkText}</p>
            <p>Total Break Time: ${totalBreakText}</p>
            <p>Net Working Time: ${netText}</p>
        </div>
    `;
    
    timesheetContent.innerHTML = timesheetHTML;
}

// Hide timesheet modal
function hideTimesheetModal() {
    document.getElementById('timesheet-modal').style.display = 'none';
}

// Download timesheet as CSV file
function downloadTimesheet() {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString().split('T')[0];
    
    // Get all time blocks for today
    const todayBlocks = AppState.timeBlocks.filter(block => {
        const blockDate = new Date(block.startTime);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === today.getTime();
    });
    
    // Sort blocks by start time
    const sortedBlocks = [...todayBlocks].sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
    );
    
    // Create CSV content
    let csvContent = 'Start Time,End Time,Duration (minutes),Activity,Status\n';
    
    sortedBlocks.forEach(block => {
        const startTime = new Date(block.startTime);
        const startTimeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let endTimeStr = 'Active';
        let durationMinutes = 'Ongoing';
        let status = 'Active';
        
        if (block.endTime) {
            const endTime = new Date(block.endTime);
            endTimeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            durationMinutes = Math.round((endTime - startTime) / 1000 / 60);
            status = block.reason || 'Completed';
        }
        
        let activity = 'Break';
        if (block.type !== 'break' && block.taskId) {
            const task = AppState.tasks.find(t => t.id === block.taskId);
            if (task) {
                activity = task.name;
            } else {
                activity = 'Unknown Task';
            }
        } else if (block.reason) {
            activity = `Break: ${block.reason}`;
        }
        
        // Escape any commas in the text fields
        activity = activity.replace(/,/g, ';');
        status = status.replace(/,/g, ';');
        
        csvContent += `${startTimeStr},${endTimeStr},${durationMinutes},"${activity}","${status}"\n`;
    });
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `TaskLobster_Timesheet_${dateString}.csv`);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export {
    generateTimesheet,
    hideTimesheetModal,
    downloadTimesheet
};
