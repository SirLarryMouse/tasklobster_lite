# TaskLobsterLite

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow.svg)](http://vanilla-js.com/)
[![HTML5](https://img.shields.io/badge/HTML-5-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS-3-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/CSS)

> Automated task scheduling that works with your brain, not against it. 

## Overview

TaskLobsterLite is the free, browser-based version of the TaskLobster productivity system. It provides a streamlined interface for time-blocking, task management, and focus tracking, with all data stored locally in your browser. 

This repository hosts both the free app version and the marketing/landing pages for the TaskLobster ecosystem. While this repository serves content for the main domain, the full authenticated app will be available at app.tasklobster.com once it is developed.

## Key Features

- **Automatic Task Scheduling**: Intelligently schedules tasks based on priority and deadlines
- **Time Tracking**: Maintains an accurate historical view of time spent on tasks and breaks
- **Continuous Timeline**: Every minute worked is visible in the schedule, creating a complete record of your day
- **Break Management**: Track breaks with reasons and notes
- **Focus Tools**: Distraction tracking and focus timers built-in
- **Priority System**: 5-level priority system from low to urgent
- **Todo.txt Compatible**: Import and export task data using the popular todo.txt format
- **CSV Timesheet Export**: Generate professional timesheets of your work day
- **100% Client-Side**: No server required, all data stored in browser localStorage

## Quick Start

TaskLobsterLite is live and free to use at [tasklobster.com](https://tasklobster.com)

If you want to run your own version locally:

1. Clone this repository
2. Open `index.html` directly in your browser
3. Start organizing your tasks!

## Local Development

Since TaskLobsterLite is built with vanilla HTML, CSS, and JavaScript, you can simply open the HTML file directly in your browser:

```bash
# Clone the repository
git clone https://github.com/SirLarryMouse/TaskLobsterLite.git

# Navigate to the project directory
cd tasklobster-lite

# Open index.html in your browser
# On macOS
open index.html

# On Windows
start index.html

# On Linux
xdg-open index.html
```

Alternatively, if you're doing more advanced development or testing features that require proper origin handling:

```bash
# Run a simple server with Python
python -m http.server 8000

# Or with Node.js (requires http-server: npm install -g http-server)
http-server -p 8000
```

Then open your browser to http://localhost:8000

## Project Structure

```
tasklobster-lite/
├── index.html         # Main app HTML
├── styles.css         # App styling
├── script.js          # App functionality
├── assets/            # Images and static resources
├── landing/           # Marketing and landing pages
│   ├── index.html     # Homepage
│   ├── about.html     # About page
│   ├── pricing.html   # Pricing information
│   └── css/           # Landing page styles
└── README.md          # This file
```

## How It Works

TaskLobsterLite leverages key productivity principles:

1. **Time Blocking**: Schedule your day in focused blocks of time
2. **Historical Tracking**: See exactly how you spent your time 
3. **Priority-based Scheduling**: Most important tasks get scheduled first
4. **Break Management**: Regular breaks are essential for sustained productivity
5. **Minimal Interaction**: Focus on your work, not on managing your tasks

All data is stored locally in your browser using localStorage. This means:
- No account creation required
- Works offline
- Complete privacy - your data never leaves your computer
- No server costs or dependencies

## Technical Details

TaskLobsterLite is built with vanilla JavaScript, HTML5, and CSS3. This approach ensures:

- Fast loading and execution
- No framework dependencies
- Easy customization
- Simplified maintenance
- Broad browser compatibility

### Data Structure

Tasks are stored with the following structure:

```javascript
{
  id: "unique-id",
  name: "Task name",
  description: "Task description",
  duration: 30, // in minutes
  timeRemaining: 25, // in minutes
  priority: 3, // 1-5 scale
  tags: ["Work", "Project"],
  deadline: "2023-04-30",
  createdAt: "2023-04-20T09:15:00",
  completed: false,
  progress: 45 // percentage
}
```

Time blocks (for historical tracking) use this structure:

```javascript
{
  id: "block-id",
  taskId: "task-id",
  startTime: "2023-04-20T09:15:00",
  endTime: "2023-04-20T09:45:00",
  type: "task", // or "break"
  reason: "completed" // or "paused", "rescheduled", etc.
}
```

## Roadmap

Future plans for TaskLobsterLite include:

- Dark mode
- Custom themes
- Keyboard shortcuts
- Additional export formats
- Improved visualization options
- Template tasks
- Repeating tasks
- Browser notifications
- PWA support for mobile installation

## Full Version Features

The full [TaskLobster](https://app.tasklobster.com) app is planned to include additional features:

- Cloud sync across devices
- Team collaboration
- Calendar integration
- AI task scheduling and suggestions
- Delegation and task chunking workflows
- Advanced analytics
- Email integration
- Workflow automation
- API access

## License

TaskLobsterLite is MIT licensed. See [LICENSE](LICENSE) for details.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Contact

For questions, feedback, or support:

- Email: [support@tasklobster.com](mailto:support@tasklobster.com)
- GitHub Issues: [Report a bug](https://github.com/SirLarryMouse/TaskLobsterLite/issues)