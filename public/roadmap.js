class RoadmapManager {
    constructor() {
        this.data = null;
        this.currentView = 'tree';
        this.currentItemId = null;
        this.apiUrl = 'http://localhost:3001/api';
        this.init();
    }

    async init() {
        await this.loadData();
        this.renderNavigation();
        this.renderContent();
        this.updateProgressOverview();
        this.attachEventListeners();
    }

    async loadData() {
        try {
            const response = await fetch(`${this.apiUrl}/roadmap`);
            const data = await response.json();
            this.data = data.roadmap;
            this.showToast('Roadmap loaded successfully', 'success');
        } catch (error) {
            console.error('Failed to load roadmap:', error);
            this.showToast('Failed to load roadmap', 'error');
            // Use default data structure if server is not available
            this.initializeDefaultData();
        }
    }

    initializeDefaultData() {
        this.data = {
            id: 'root',
            title: 'CustomGPT Expansion & Enhancement',
            type: 'root',
            progress: 0,
            validated: false,
            axes: []
        };
    }

    renderNavigation() {
        const navContainer = document.getElementById('sidebar-nav');
        navContainer.innerHTML = '';
        
        if (!this.data.axes) return;
        
        this.data.axes.forEach(axis => {
            const navItem = document.createElement('button');
            navItem.className = 'nav-item';
            navItem.textContent = axis.title;
            navItem.onclick = () => this.scrollToAxis(axis.id);
            navContainer.appendChild(navItem);
            
            // Add sub-items
            const subItems = axis.pipelines || axis.components || axis.phases || [];
            subItems.forEach(item => {
                const subNavItem = document.createElement('button');
                subNavItem.className = 'nav-item nested';
                subNavItem.textContent = item.title;
                subNavItem.onclick = () => this.scrollToItem(item.id);
                navContainer.appendChild(subNavItem);
            });
        });
    }

    renderContent() {
        const contentContainer = document.getElementById('roadmap-content');
        
        switch(this.currentView) {
            case 'tree':
                contentContainer.innerHTML = this.renderTreeView();
                break;
            case 'kanban':
                contentContainer.innerHTML = this.renderKanbanView();
                break;
            case 'timeline':
                contentContainer.innerHTML = this.renderTimelineView();
                break;
            case 'grid':
                contentContainer.innerHTML = this.renderGridView();
                break;
        }
        
        this.attachContentEventListeners();
    }

    renderTreeView() {
        if (!this.data.axes || this.data.axes.length === 0) {
            return '<div class="empty-state">No axes defined. Click "Add Axis" to get started.</div>';
        }
        
        let html = '<div class="tree-view">';
        
        this.data.axes.forEach(axis => {
            const axisProgress = this.calculateProgress(axis);
            html += `
                <div class="axis-container" data-id="${axis.id}">
                    <div class="axis-header" onclick="roadmap.toggleAxis('${axis.id}')">
                        <span class="expand-icon expanded">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </span>
                        <h2 class="axis-title">${axis.title}</h2>
                        <div class="axis-actions">
                            <input type="checkbox" class="validation-checkbox" ${axis.validated ? 'checked' : ''} 
                                onclick="event.stopPropagation(); roadmap.toggleValidation('${axis.id}')">
                            <span class="progress-badge ${axisProgress > 75 ? 'high' : axisProgress > 50 ? 'medium' : ''}">
                                ${axisProgress}%
                            </span>
                            <button class="btn-icon" onclick="event.stopPropagation(); roadmap.editItem('${axis.id}')">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-10.5 10.5-3.252.577.577-3.252 10.5-10.5 2 2z"/>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="event.stopPropagation(); roadmap.addSubItem('${axis.id}')">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="axis-content" id="axis-content-${axis.id}">
                        ${this.renderAxisContent(axis)}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    renderAxisContent(axis) {
        let html = '';
        const items = axis.pipelines || axis.components || axis.phases || [];
        
        items.forEach(item => {
            const itemProgress = this.calculateProgress(item);
            html += `
                <div class="pipeline-container" data-id="${item.id}">
                    <div class="pipeline-header" onclick="roadmap.togglePipeline('${item.id}')">
                        <span class="expand-icon expanded">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </span>
                        <h3 class="pipeline-title">${item.title}</h3>
                        <input type="checkbox" class="validation-checkbox" ${item.validated ? 'checked' : ''} 
                            onclick="event.stopPropagation(); roadmap.toggleValidation('${item.id}')">
                        <span class="progress-badge">${itemProgress}%</span>
                        <button class="btn-icon" onclick="event.stopPropagation(); roadmap.editItem('${item.id}')">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-10.5 10.5-3.252.577.577-3.252 10.5-10.5 2 2z"/>
                            </svg>
                        </button>
                    </div>
                    ${this.renderPipelineContent(item)}
                </div>
            `;
        });
        
        return html;
    }

    renderPipelineContent(pipeline) {
        let html = '<div class="pipeline-content">';
        
        // Handle phases if they exist
        if (pipeline.phases && pipeline.phases.length > 0) {
            pipeline.phases.forEach(phase => {
                const phaseProgress = this.calculateProgress(phase);
                html += `
                    <div class="phase-container" data-id="${phase.id}">
                        <div class="phase-header">
                            <h4 class="phase-title">${phase.title}</h4>
                            <input type="checkbox" class="validation-checkbox" ${phase.validated ? 'checked' : ''} 
                                onclick="event.stopPropagation(); roadmap.toggleValidation('${phase.id}')">
                            <span class="progress-badge">${phaseProgress}%</span>
                        </div>
                        ${this.renderTasks(phase.tasks || [])}
                    </div>
                `;
            });
        }
        
        // Handle direct tasks
        if (pipeline.tasks && pipeline.tasks.length > 0) {
            html += this.renderTasks(pipeline.tasks);
        }
        
        html += '</div>';
        return html;
    }

    renderTasks(tasks) {
        if (!tasks || tasks.length === 0) return '';
        
        let html = '<div class="task-list">';
        tasks.forEach(task => {
            html += `
                <div class="task-item" data-id="${task.id}" onclick="roadmap.editTask('${task.id}')">
                    <input type="checkbox" class="task-checkbox" ${task.validated ? 'checked' : ''} 
                        onclick="event.stopPropagation(); roadmap.toggleTaskValidation('${task.id}')">
                    <span class="task-title">${task.title}</span>
                    <span class="task-progress">${task.progress || 0}%</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    renderKanbanView() {
        if (!this.data.axes || this.data.axes.length === 0) {
            return '<div class="empty-state">No data to display in Kanban view.</div>';
        }
        
        const columns = ['Not Started', 'In Progress', 'Review', 'Completed'];
        let html = '<div class="kanban-view">';
        
        columns.forEach(column => {
            html += `
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <h3 class="kanban-column-title">${column}</h3>
                        <span class="kanban-count">${this.getItemsForColumn(column).length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${this.renderKanbanCards(column)}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    getItemsForColumn(column) {
        const items = [];
        
        this.data.axes.forEach(axis => {
            const axisItems = axis.pipelines || axis.components || axis.phases || [];
            axisItems.forEach(item => {
                const progress = this.calculateProgress(item);
                if (
                    (column === 'Not Started' && progress === 0) ||
                    (column === 'In Progress' && progress > 0 && progress < 50) ||
                    (column === 'Review' && progress >= 50 && progress < 100) ||
                    (column === 'Completed' && progress === 100)
                ) {
                    items.push({ ...item, axisTitle: axis.title });
                }
            });
        });
        
        return items;
    }

    renderKanbanCards(column) {
        const items = this.getItemsForColumn(column);
        let html = '';
        
        items.forEach(item => {
            html += `
                <div class="kanban-card" draggable="true" data-id="${item.id}">
                    <h4 class="kanban-card-title">${item.title}</h4>
                    <div class="kanban-card-meta">
                        <span>${item.axisTitle}</span>
                        <span>${this.calculateProgress(item)}%</span>
                    </div>
                </div>
            `;
        });
        
        return html || '<div class="empty-column">No items</div>';
    }

    renderTimelineView() {
        if (!this.data.axes || this.data.axes.length === 0) {
            return '<div class="empty-state">No data to display in Timeline view.</div>';
        }
        
        let html = '<div class="timeline-view">';
        
        this.data.axes.forEach(axis => {
            html += `
                <div class="timeline-axis">
                    <h2 class="timeline-axis-title">${axis.title}</h2>
                    <div class="timeline-track">
            `;
            
            const items = axis.pipelines || axis.components || axis.phases || [];
            items.forEach(item => {
                html += `
                    <div class="timeline-item">
                        <div class="timeline-marker ${item.validated ? 'validated' : ''}"></div>
                        <div class="timeline-content">
                            <h3 class="timeline-title">${item.title}</h3>
                            <div class="timeline-meta">
                                Progress: ${this.calculateProgress(item)}% | 
                                ${item.validated ? 'Validated' : 'In Progress'}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += '</div>';
        return html;
    }

    renderGridView() {
        if (!this.data.axes || this.data.axes.length === 0) {
            return '<div class="empty-state">No data to display in Grid view.</div>';
        }
        
        let html = '<div class="grid-view">';
        
        this.data.axes.forEach(axis => {
            const axisProgress = this.calculateProgress(axis);
            const items = axis.pipelines || axis.components || axis.phases || [];
            const validatedItems = items.filter(i => i.validated).length;
            
            html += `
                <div class="grid-card" data-id="${axis.id}" onclick="roadmap.editItem('${axis.id}')">
                    <div class="grid-card-header">
                        <h3 class="grid-card-title">${axis.title}</h3>
                        <span class="grid-card-badge">${axis.type}</span>
                    </div>
                    <div class="progress-bar" style="margin: 1rem 0">
                        <div class="progress-fill overall" style="width: ${axisProgress}%"></div>
                    </div>
                    <div class="grid-card-stats">
                        <div class="stat-item">
                            <span class="stat-value">${axisProgress}%</span>
                            <span class="stat-label">Progress</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${validatedItems}</span>
                            <span class="stat-label">Validated</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${items.length}</span>
                            <span class="stat-label">Total Items</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    calculateProgress(item) {
        if (item.progress !== undefined) {
            return item.progress;
        }
        
        // Calculate based on sub-items
        let totalProgress = 0;
        let itemCount = 0;
        
        // Check for different types of sub-items
        const subItems = item.pipelines || item.components || item.phases || item.tasks || [];
        
        if (subItems.length > 0) {
            subItems.forEach(subItem => {
                totalProgress += this.calculateProgress(subItem);
                itemCount++;
            });
            
            return itemCount > 0 ? Math.round(totalProgress / itemCount) : 0;
        }
        
        return item.validated ? 100 : 0;
    }

    updateProgressOverview() {
        if (!this.data) return;
        
        const overallProgress = this.calculateProgress(this.data);
        const totalItems = this.countAllItems(this.data);
        const validatedItems = this.countValidatedItems(this.data);
        const activeAxes = this.data.axes ? this.data.axes.filter(a => this.calculateProgress(a) > 0).length : 0;
        const totalAxes = this.data.axes ? this.data.axes.length : 0;
        
        document.getElementById('overall-progress').textContent = `${overallProgress}%`;
        document.getElementById('overall-progress-bar').style.width = `${overallProgress}%`;
        
        document.getElementById('validated-count').textContent = `${validatedItems} / ${totalItems}`;
        document.getElementById('validated-progress-bar').style.width = 
            `${totalItems > 0 ? (validatedItems / totalItems) * 100 : 0}%`;
        
        document.getElementById('active-axes').textContent = `${activeAxes} / ${totalAxes}`;
        document.getElementById('active-progress-bar').style.width = 
            `${totalAxes > 0 ? (activeAxes / totalAxes) * 100 : 0}%`;
    }

    countAllItems(item) {
        let count = 1;
        const subItems = item.axes || item.pipelines || item.components || item.phases || item.tasks || [];
        subItems.forEach(subItem => {
            count += this.countAllItems(subItem);
        });
        return count;
    }

    countValidatedItems(item) {
        let count = item.validated ? 1 : 0;
        const subItems = item.axes || item.pipelines || item.components || item.phases || item.tasks || [];
        subItems.forEach(subItem => {
            count += this.countValidatedItems(subItem);
        });
        return count;
    }

    toggleAxis(axisId) {
        const content = document.getElementById(`axis-content-${axisId}`);
        const icon = document.querySelector(`.axis-container[data-id="${axisId}"] .expand-icon`);
        
        if (content) {
            content.classList.toggle('hidden');
            icon.classList.toggle('expanded');
        }
    }

    togglePipeline(pipelineId) {
        const container = document.querySelector(`.pipeline-container[data-id="${pipelineId}"] .pipeline-content`);
        const icon = document.querySelector(`.pipeline-container[data-id="${pipelineId}"] .expand-icon`);
        
        if (container) {
            container.classList.toggle('hidden');
            icon.classList.toggle('expanded');
        }
    }

    toggleValidation(itemId) {
        const item = this.findItemById(itemId);
        if (item) {
            item.validated = !item.validated;
            this.saveData();
            this.renderContent();
            this.updateProgressOverview();
        }
    }

    toggleTaskValidation(taskId) {
        const task = this.findItemById(taskId);
        if (task) {
            task.validated = !task.validated;
            task.progress = task.validated ? 100 : 0;
            this.saveData();
            this.renderContent();
            this.updateProgressOverview();
        }
    }

    findItemById(id, item = this.data) {
        if (item.id === id) return item;
        
        const subItems = item.axes || item.pipelines || item.components || item.phases || item.tasks || [];
        for (let subItem of subItems) {
            const found = this.findItemById(id, subItem);
            if (found) return found;
        }
        
        return null;
    }

    editItem(itemId) {
        this.currentItemId = itemId;
        const item = this.findItemById(itemId);
        
        if (item) {
            document.getElementById('modal-title').textContent = `Edit ${item.type || 'Item'}`;
            document.getElementById('item-title').value = item.title || '';
            document.getElementById('item-description').value = item.description || '';
            document.getElementById('item-progress').value = item.progress || 0;
            document.getElementById('progress-value').textContent = `${item.progress || 0}%`;
            document.getElementById('item-validated').checked = item.validated || false;
            
            this.openModal();
        }
    }

    editTask(taskId) {
        this.editItem(taskId);
    }

    addAxis() {
        const title = prompt('Enter axis title:');
        if (title) {
            const newAxis = {
                id: this.generateId(),
                title: title,
                type: 'axis',
                progress: 0,
                validated: false,
                pipelines: []
            };
            
            if (!this.data.axes) {
                this.data.axes = [];
            }
            
            this.data.axes.push(newAxis);
            this.saveData();
            this.renderNavigation();
            this.renderContent();
            this.updateProgressOverview();
            this.showToast('Axis added successfully', 'success');
        }
    }

    addSubItem(parentId) {
        const parent = this.findItemById(parentId);
        if (!parent) return;
        
        const title = prompt('Enter item title:');
        if (title) {
            const newItem = {
                id: this.generateId(),
                title: title,
                type: 'pipeline',
                progress: 0,
                validated: false,
                phases: []
            };
            
            // Determine where to add the item based on parent type
            if (parent.pipelines !== undefined) {
                parent.pipelines.push(newItem);
            } else if (parent.components !== undefined) {
                parent.components.push(newItem);
            } else if (parent.phases !== undefined) {
                parent.phases.push(newItem);
            } else if (parent.tasks !== undefined) {
                parent.tasks.push(newItem);
            } else {
                // Default to creating a pipelines array
                parent.pipelines = [newItem];
            }
            
            this.saveData();
            this.renderNavigation();
            this.renderContent();
            this.updateProgressOverview();
            this.showToast('Item added successfully', 'success');
        }
    }

    deleteItem() {
        if (confirm('Are you sure you want to delete this item?')) {
            this.removeItemById(this.currentItemId);
            this.closeModal();
            this.saveData();
            this.renderNavigation();
            this.renderContent();
            this.updateProgressOverview();
            this.showToast('Item deleted successfully', 'info');
        }
    }

    removeItemById(id, item = this.data) {
        const arrays = ['axes', 'pipelines', 'components', 'phases', 'tasks'];
        
        for (let arrayName of arrays) {
            if (item[arrayName]) {
                const index = item[arrayName].findIndex(i => i.id === id);
                if (index !== -1) {
                    item[arrayName].splice(index, 1);
                    return true;
                }
                
                for (let subItem of item[arrayName]) {
                    if (this.removeItemById(id, subItem)) return true;
                }
            }
        }
        
        return false;
    }

    async saveData() {
        try {
            const response = await fetch(`${this.apiUrl}/roadmap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ roadmap: this.data })
            });
            
            if (response.ok) {
                console.log('Data saved successfully');
            }
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    async saveProgress() {
        await this.saveData();
        this.showToast('Progress saved successfully', 'success');
    }

    exportData() {
        const dataStr = JSON.stringify({ roadmap: this.data }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roadmap-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('Roadmap exported successfully', 'success');
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.renderContent();
    }

    toggleViewMode() {
        const viewModeText = document.getElementById('view-mode-text');
        if (this.currentView === 'tree') {
            this.switchView('kanban');
            viewModeText.textContent = 'Kanban View';
        } else if (this.currentView === 'kanban') {
            this.switchView('timeline');
            viewModeText.textContent = 'Timeline View';
        } else if (this.currentView === 'timeline') {
            this.switchView('grid');
            viewModeText.textContent = 'Grid View';
        } else {
            this.switchView('tree');
            viewModeText.textContent = 'Tree View';
        }
    }

    expandAll() {
        document.querySelectorAll('.axis-content, .pipeline-content').forEach(content => {
            content.classList.remove('hidden');
        });
        document.querySelectorAll('.expand-icon').forEach(icon => {
            icon.classList.add('expanded');
        });
    }

    collapseAll() {
        document.querySelectorAll('.axis-content, .pipeline-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('.expand-icon').forEach(icon => {
            icon.classList.remove('expanded');
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }

    openModal() {
        const modal = document.getElementById('edit-modal');
        modal.classList.add('open');
    }

    closeModal() {
        const modal = document.getElementById('edit-modal');
        modal.classList.remove('open');
        this.currentItemId = null;
    }

    scrollToAxis(axisId) {
        const element = document.querySelector(`.axis-container[data-id="${axisId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    scrollToItem(itemId) {
        const element = document.querySelector(`[data-id="${itemId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-message">${message}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    generateId() {
        return 'id-' + Math.random().toString(36).substr(2, 9);
    }

    attachEventListeners() {
        // Form submission
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const item = this.findItemById(this.currentItemId);
            
            if (item) {
                item.title = document.getElementById('item-title').value;
                item.description = document.getElementById('item-description').value;
                item.progress = parseInt(document.getElementById('item-progress').value);
                item.validated = document.getElementById('item-validated').checked;
                
                this.saveData();
                this.renderNavigation();
                this.renderContent();
                this.updateProgressOverview();
                this.closeModal();
                this.showToast('Item updated successfully', 'success');
            }
        });
        
        // Progress slider
        document.getElementById('item-progress').addEventListener('input', (e) => {
            document.getElementById('progress-value').textContent = `${e.target.value}%`;
        });
        
        // Close modal on background click
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeModal();
            }
        });
    }

    attachContentEventListeners() {
        // Re-attach any dynamic event listeners after content is rendered
        // This is called after renderContent() to ensure new elements have event handlers
    }
}

// Initialize the roadmap manager
const roadmap = new RoadmapManager();
