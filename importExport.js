function importTasks() {
    const importText = document.getElementById('import-text').value.trim();
    if (!importText) {
        alert('Please paste todo.txt content to import.');
        return;
    }
    const lines = importText.split('\n').filter(line => line.trim());
    const importedTasks = [];
    lines.forEach(line => {
        let priority = 3;
        let name = line.trim();
        let tags = [];
        let deadline = null;
        const priorityMatch = name.match(/^\(([A-Z])\)\s+/);
        if (priorityMatch) {
            const priorityLetter = priorityMatch[1];
            if (priorityLetter === 'A') priority = 5;
            else if (priorityLetter === 'B') priority = 4;
            else if (priorityLetter === 'C') priority = 3;
            else if (priorityLetter === 'D') priority = 2;
            else priority = 1;
            name = name.substring(priorityMatch[0].length);
        }
        const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})\s+/);
        if (dateMatch) {
            name = name.substring(dateMatch[0].length);
        }
        const contextMatches = name.match(/@\w+/g) || [];
        const projectMatches = name.match(/\+\w+/g) || [];
        contextMatches.forEach(context => {
            tags.push(context.substring(1));
            name = name.replace(context, '').trim();
        });
        projectMatches.forEach(project => {
            tags.push(project.substring(1));
            name = name.replace(project, '').trim();
        });
        const dueMatch = name.match(/due:(\d{4}-\d{2}-\d{2})/);
        if (dueMatch) {
            deadline = dueMatch[1];
            name = name.replace(dueMatch[0], '').trim();
        }
        const task = {
            id: Date.now().toString() + importedTasks.length,
            name: name,
            description: '',
            duration: 30,
            timeRemaining: 30,
            priority: priority,
            tags: tags,
            deadline: deadline,
            createdAt: new Date().toISOString(),
            completed: false,
            progress: 0
        };
        importedTasks.push(task);
    });
    if (importedTasks.length === 0) {
        alert('No valid tasks found in the imported content.');
        return;
    }
    tasks = tasks.concat(importedTasks);
    if (!currentTaskId && importedTasks.length > 0) {
        currentTaskId = importedTasks[0].id;
        if (!isPaused) {
            startTaskTracking(currentTaskId);
        }
    }
    saveToLocalStorage();
    renderTasks();
    document.getElementById('import-text').value = '';
    alert(`Successfully imported ${importedTasks.length} tasks.`);
}

function exportTasks() {
    if (tasks.length === 0) {
        alert('No tasks to export.');
        return;
    }
    let exportText = '';
    tasks.forEach(task => {
        let line = '';
        if (task.priority === 5) line += '(A) ';
        else if (task.priority === 4) line += '(B) ';
        else if (task.priority === 3) line += '(C) ';
        else if (task.priority === 2) line += '(D) ';
        else if (task.priority === 1) line += '(E) ';
        const creationDate = new Date(task.createdAt);
        line += `${creationDate.getFullYear()}-${String(creationDate.getMonth() + 1).padStart(2, '0')}-${String(creationDate.getDate()).padStart(2, '0')} `;
        line += task.name;
        task.tags.forEach(tag => {
            line += ` @${tag}`;
        });
        if (task.deadline) {
            line += ` due:${task.deadline}`;
        }
        if (task.completed) {
            line = 'x ' + line;
        }
        exportText += line + '\n';
    });
    document.getElementById('export-text').value = exportText;
    document.getElementById('export-output').style.display = 'block';
}

function copyExportText() {
    const exportText = document.getElementById('export-text');
    exportText.select();
    document.execCommand('copy');
    alert('Exported tasks copied to clipboard!');
}

function generateTimesheet() {
    document.getElementById('timesheet-modal').style.display = 'flex';
    const timesheetContent = document.getElementById('timesheet-content');
    timesheetContent.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBlocks = timeBlocks.filter(block => {
        const blockDate = new Date(block.startTime);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === today.getTime();
    });
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    todayBlocks.forEach(block => {
        if (!block.endTime) return;
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);
        const durationMinutes = (endTime - startTime) / 1000 / 60;
        if (block.type === 'break') {
            totalBreakMinutes += durationMinutes;
        } else {
            totalWorkMinutes += durationMinutes;
        }
    });
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
                const task = tasks.find(t => t.id === block.taskId);
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

function hideTimesheetModal() {
    document.getElementById('timesheet-modal').style.display = 'none';
}

function downloadTimesheet() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString().split('T')[0];
    const todayBlocks = timeBlocks.filter(block => {
        const blockDate = new Date(block.startTime);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === today.getTime();
    });
    const sortedBlocks = [...todayBlocks].sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
    );
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
            const task = tasks.find(t => t.id === block.taskId);
            if (task) {
                activity = task.name;
            } else {
                activity = 'Unknown Task';
            }
        } else if (block.reason) {
            activity = `Break: ${block.reason}`;
        }
        activity = activity.replace(/,/g, ';');
        status = status.replace(/,/g, ';');
        csvContent += `${startTimeStr},${endTimeStr},${durationMinutes},"${activity}","${status}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `TaskLobster_Timesheet_${dateString}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}