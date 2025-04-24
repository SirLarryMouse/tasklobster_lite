// importExport.js - Import and export functionality

import AppState from '../core/state.js';
import { renderTasks } from '../tasks/taskUI.js';

// Import tasks from JSON
function importTasks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (Array.isArray(importedData)) {
                        // Import tasks
                        AppState.tasks = importedData;
                        AppState.saveToLocalStorage();
                        
                        // Update UI
                        renderTasks();
                        
                        alert(`Successfully imported ${importedData.length} tasks!`);
                    } else {
                        alert('Invalid import format. Please use a valid JSON task array.');
                    }
                } catch (error) {
                    alert('Error importing tasks: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        }
    });
    
    input.click();
}

// Export tasks to JSON
function exportTasks() {
    // Create JSON data
    const exportData = JSON.stringify(AppState.tasks, null, 2);
    
    // Create export text area
    document.getElementById('export-text').value = exportData;
    document.getElementById('export-output').style.display = 'block';
}

// Export tasks to todo.txt format
function exportToTodoTxt() {
    let exportText = '';
    
    AppState.tasks.forEach(task => {
        // Build todo.txt format line
        
        // Priority
        let line = '';
        if (task.priority === 5) line += '(A) ';
        else if (task.priority === 4) line += '(B) ';
        else if (task.priority === 3) line += '(C) ';
        else if (task.priority === 2) line += '(D) ';
        else if (task.priority === 1) line += '(E) ';
        
        // Creation date
        const creationDate = new Date(task.createdAt);
        line += `${creationDate.getFullYear()}-${String(creationDate.getMonth() + 1).padStart(2, '0')}-${String(creationDate.getDate()).padStart(2, '0')} `;
        
        // Task name
        line += task.name;
        
        // Tags (as contexts and projects)
        task.tags.forEach(tag => {
            line += ` @${tag}`;
        });
        
        // Due date
        if (task.deadline) {
            line += ` due:${task.deadline}`;
        }
        
        // Add completion status
        if (task.completed) {
            line = 'x ' + line;
        }
        
        exportText += line + '\n';
    });
    
    // Show export output
    document.getElementById('export-text').value = exportText;
    document.getElementById('export-output').style.display = 'block';
}

// Copy export text to clipboard
function copyExportText() {
    const exportText = document.getElementById('export-text');
    exportText.select();
    document.execCommand('copy');
    alert('Exported tasks copied to clipboard!');
}

export {
    importTasks,
    exportTasks,
    exportToTodoTxt,
    copyExportText
};
