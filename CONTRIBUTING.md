# Contributing to TaskLobsterLite

Thank you for your interest in contributing to TaskLobsterLite! This document provides guidelines and instructions for contributing to make the process smooth and effective for everyone involved.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by the TaskLobster Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [support@tasklobster.com](mailto:support@tasklobster.com).

## Getting Started

### Prerequisites

- Git
- A modern web browser
- Basic knowledge of HTML, CSS, and JavaScript
- A text editor or IDE

### Local Development Setup

1. Fork the repository on GitHub
2. Clone your forked repository
   ```bash
   git clone https://github.com/SirLarryMouse/TaskLobsterLite.git
   ```
3. Navigate to the project directory
   ```bash
   cd TaskLobsterLite
   ```
4. Create a new branch for your feature or bugfix
   ```bash
   git checkout -b feature/your-feature-name
   ```

Now you're ready to make changes!

## Development Workflow

TaskLobsterLite follows a simple development workflow:

1. Pick an issue to work on or create a new one
2. Create a branch for your work
3. Make changes and test locally
4. Commit your changes with meaningful commit messages
5. Push to your fork
6. Submit a pull request

### Branch Naming Convention

Please use the following naming convention for branches:

- `feature/your-feature-name` for new features
- `bugfix/issue-description` for bug fixes
- `docs/what-you-documented` for documentation
- `refactor/what-you-refactored` for code refactoring

### Commit Messages

Write clear, concise commit messages that explain what changes you've made and why. Use the present tense ("Add feature" not "Added feature").

Example of a good commit message:
```
Add break timer visualization 

- Create timer overlay component
- Implement pause duration tracking
- Add styling for break mode
- Update documentation
```

## Coding Standards

TaskLobsterLite is built with vanilla technologies, so we emphasize clean, readable code.

### HTML

- Use semantic HTML elements
- Follow proper indentation (2 spaces)
- Include appropriate accessibility attributes
- Validate your HTML

### CSS

- Follow BEM naming convention where appropriate
- Use comments for section breaks
- Minimize the use of !important
- Organize properties consistently

### JavaScript

- Follow a consistent code style
- Use meaningful variable and function names
- Add comments for complex logic
- Avoid global variables when possible
- Keep functions small and focused on a single responsibility
- Use ES6+ features appropriately

## Pull Request Process

1. Update the README.md with details of significant changes if applicable
2. Make sure all your commits are squashed into logical units
3. Ensure all code has been tested in multiple browsers
4. Submit your pull request with a clear description of the changes
5. Link any relevant issues in the PR description
6. Wait for review from maintainers

### Pull Request Template

When you submit a PR, please include:

- A clear and descriptive title
- A summary of the changes
- Any relevant issue numbers
- Screenshots/GIFs if the PR includes visual changes
- Any special instructions needed to test the changes

## Issue Reporting

When reporting issues, please use the following template:

### Bug Reports

- **Browser and Version**:
- **Operating System**:
- **Description of the Bug**:
- **Steps to Reproduce**:
- **Expected Behavior**:
- **Actual Behavior**:
- **Screenshots** (if applicable):

## Feature Requests

When suggesting features, please include:

- A clear and concise description of the feature
- The problem it solves
- Any alternatives you've considered
- Any implementation ideas you have
- Mockups or examples (if applicable)

## Documentation

Documentation is crucial for the project's usability. When adding or changing features:

- Update inline code comments
- Update README.md if necessary
- Consider creating/updating user documentation
- Add JSDoc comments for functions

## Community

Join our community channels to get help and discuss contributions:

- [GitHub Discussions](https://github.com/SirLarryMouse/tasklobster_lite/discussions)

---

Thank you for contributing to TaskLobsterLite! Your efforts help make productivity more accessible for everyone.