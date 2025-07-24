class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.taskIdCounter = 1;
        
        this.initializeEventListeners();
        this.loadTasks();
        this.render();
    }

    initializeEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.render();
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Enter key for adding tasks
        const taskInput = document.getElementById('taskInput');
        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTask();
                }
            });
        }

        // Auto-save every 30 seconds
        setInterval(() => this.saveTasks(), 30000);
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        
        if (!input || !prioritySelect) {
            console.error('Input elements not found');
            return;
        }

        const text = input.value.trim();
        const priority = prioritySelect.value;

        if (!text) {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        if (text.length > 200) {
            this.showNotification('Task is too long! Maximum 200 characters.', 'error');
            return;
        }

        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            priority: priority,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        input.value = '';
        this.saveTasks();
        this.render();
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.render();
            this.showNotification('Task deleted!', 'success');
        }
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.render();
            
            const message = task.completed ? 'Task completed! 🎉' : 'Task marked as pending';
            this.showNotification(message, 'success');
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const newText = prompt('Edit task:', task.text);
            if (newText !== null && newText.trim()) {
                if (newText.trim().length > 200) {
                    this.showNotification('Task is too long! Maximum 200 characters.', 'error');
                    return;
                }
                task.text = newText.trim();
                this.saveTasks();
                this.render();
                this.showNotification('Task updated!', 'success');
            }
        }
    }

    markAllComplete() {
        const pendingTasks = this.tasks.filter(task => !task.completed);
        if (pendingTasks.length === 0) {
            this.showNotification('No pending tasks to complete!', 'info');
            return;
        }

        pendingTasks.forEach(task => {
            task.completed = true;
            task.completedAt = new Date().toISOString();
        });
        
        this.saveTasks();
        this.render();
        this.showNotification(`${pendingTasks.length} tasks completed!`, 'success');
    }

    deleteCompleted() {
        const completedTasks = this.tasks.filter(task => task.completed);
        if (completedTasks.length === 0) {
            this.showNotification('No completed tasks to delete!', 'info');
            return;
        }

        if (confirm(`Delete ${completedTasks.length} completed tasks?`)) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveTasks();
            this.render();
            this.showNotification(`${completedTasks.length} completed tasks deleted!`, 'success');
        }
    }

    clearAllTasks() {
        if (this.tasks.length === 0) {
            this.showNotification('No tasks to clear!', 'info');
            return;
        }

        if (confirm(`Delete all ${this.tasks.length} tasks? This cannot be undone!`)) {
            this.tasks = [];
            this.taskIdCounter = 1;
            this.saveTasks();
            this.render();
            this.showNotification('All tasks cleared!', 'success');
        }
    }

    exportTasks() {
        if (this.tasks.length === 0) {
            this.showNotification('No tasks to export!', 'info');
            return;
        }

        const exportData = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            totalTasks: this.tasks.length,
            completedTasks: this.tasks.filter(t => t.completed).length
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `taskmaster-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showNotification('Tasks exported successfully!', 'success');
    }

    getFilteredTasks() {
        let filteredTasks = [...this.tasks];

        // Apply search filter
        if (this.searchQuery) {
            filteredTasks = filteredTasks.filter(task =>
                task.text.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply status/priority filter
        switch (this.currentFilter) {
            case 'pending':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'high':
            case 'medium':
            case 'low':
                filteredTasks = filteredTasks.filter(task => task.priority === this.currentFilter);
                break;
        }

        return filteredTasks;
    }

    render() {
        const container = document.getElementById('itemsContainer');
        if (!container) {
            console.error('Items container not found');
            return;
        }

        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" id="emptyState">
                    <div class="empty-icon">📋</div>
                    <h3>No tasks found!</h3>
                    <p>${this.tasks.length === 0 ? 'Add your first task to get started with TaskMaster Pro' : 'Try adjusting your search or filter criteria'}</p>
                </div>
            `;
        } else {
            container.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        }

        this.updateStats();
    }

    createTaskHTML(task) {
        const createdDate = new Date(task.createdAt).toLocaleDateString();
        const timeAgo = this.getTimeAgo(task.createdAt);
        
        return `
            <div class="item ${task.completed ? 'completed' : ''}">
                <div class="priority-indicator priority-${task.priority}"></div>
                <div class="checkbox ${task.completed ? 'checked' : ''}" onclick="window.taskManager.toggleComplete(${task.id})"></div>
                <div class="item-content">
                    <div class="item-text">${this.escapeHtml(task.text)}</div>
                    <div class="item-meta">
                        <span class="priority-badge ${task.priority}">${task.priority} priority</span>
                        <span>Created: ${createdDate}</span>
                        <span>${timeAgo}</span>
                        ${task.completed ? `<span>✅ Completed</span>` : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" onclick="window.taskManager.editTask(${task.id})" title="Edit task">✏️</button>
                    <button class="action-btn delete-btn" onclick="window.taskManager.deleteTask(${task.id})" title="Delete task">🗑️</button>
                </div>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const totalElement = document.getElementById('totalTasks');
        const completedElement = document.getElementById('completedTasks');
        const pendingElement = document.getElementById('pendingTasks');
        const rateElement = document.getElementById('completionRate');
        const progressFill = document.getElementById('progressFill');

        if (totalElement) totalElement.textContent = total;
        if (completedElement) completedElement.textContent = completed;
        if (pendingElement) pendingElement.textContent = pending;
        if (rateElement) rateElement.textContent = completionRate + '%';
        if (progressFill) progressFill.style.width = completionRate + '%';
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return `${Math.floor(diffInSeconds / 604800)}w ago`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#ff9800'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    saveTasks() {
        try {
            localStorage.setItem('taskmaster_tasks', JSON.stringify({
                tasks: this.tasks,
                taskIdCounter: this.taskIdCounter
            }));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showNotification('Error saving tasks!', 'error');
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('taskmaster_tasks');
            if (saved) {
                const data = JSON.parse(saved);
                this.tasks = data.tasks || [];
                this.taskIdCounter = data.taskIdCounter || 1;
            } else {
                // Add sample task for first-time users
                this.tasks = [
                    {
                        id: 1,
                        text: "Welcome to TaskMaster Pro! Edit or delete this task to get started.",
                        completed: false,
                        priority: "medium",
                        createdAt: new Date().toISOString(),
                        completedAt: null
                    }
                ];
                this.taskIdCounter = 2;
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
            this.taskIdCounter = 1;
        }
    }
}

// Global variable for task manager
let taskManager;

// Global functions for onclick handlers
function addTask() {
    if (window.taskManager) {
        window.taskManager.addTask();
    }
}

function markAllComplete() {
    if (window.taskManager) {
        window.taskManager.markAllComplete();
    }
}

function deleteCompleted() {
    if (window.taskManager) {
        window.taskManager.deleteCompleted();
    }
}

function clearAllTasks() {
    if (window.taskManager) {
        window.taskManager.clearAllTasks();
    }
}

function exportTasks() {
    if (window.taskManager) {
        window.taskManager.exportTasks();
    }
}

// Initialize the task manager when the page loads
document.addEventListener('DOMContentLoaded', function() {
    try {
        taskManager = new TaskManager();
        window.taskManager = taskManager; // Make it globally accessible
        console.log('TaskManager initialized successfully');
    } catch (error) {
        console.error('Error initializing TaskManager:', error);
    }
});