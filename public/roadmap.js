class RoadmapManager {
    constructor() {
        this.data = null;
        this.currentView = 'tree';
        this.currentItemId = null;
        this.apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api'
            : `${window.location.protocol}//${window.location.host}/api`;
        this.init();
    }

    async init() {
        // Show skeleton screens immediately
        this.renderSkeletonContent();
        this.renderSkeletonNavigation();

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

    renderSkeletonNavigation() {
        const navContainer = document.getElementById('sidebar-nav');
        navContainer.innerHTML = `
            <div class="skeleton nav-item skeleton-line" style="width: 80%; margin-bottom: 0.5rem;"></div>
            <div class="skeleton nav-item nested skeleton-line" style="width: 70%; margin-bottom: 0.5rem;"></div>
            <div class="skeleton nav-item nested skeleton-line" style="width: 75%; margin-bottom: 0.5rem;"></div>
            <div class="skeleton nav-item skeleton-line" style="width: 85%; margin-bottom: 0.5rem;"></div>
            <div class="skeleton nav-item nested skeleton-line" style="width: 65%; margin-bottom: 0.5rem;"></div>
            <div class="skeleton nav-item nested skeleton-line" style="width: 70%; margin-bottom: 0.5rem;"></div>
        `;
    }

    renderSkeletonContent() {
        const contentContainer = document.getElementById('roadmap-content');
        contentContainer.innerHTML = `
            <div class="tree-view">
                ${this.generateSkeletonAxis()}
                ${this.generateSkeletonAxis()}
                ${this.generateSkeletonAxis()}
            </div>
        `;
    }

    generateSkeletonAxis() {
        return `
            <div class="skeleton-axis">
                <div class="skeleton-axis-header">
                    <div class="skeleton skeleton-line" style="width: 20px; height: 20px;"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-progress"></div>
                </div>
                ${this.generateSkeletonPipeline()}
                ${this.generateSkeletonPipeline()}
            </div>
        `;
    }

    generateSkeletonPipeline() {
        return `
            <div class="skeleton-pipeline">
                <div class="skeleton-pipeline-header">
                    <div class="skeleton skeleton-line" style="width: 16px; height: 16px;"></div>
                    <div class="skeleton skeleton-line" style="width: 45%; height: 1.2rem;"></div>
                    <div class="skeleton skeleton-line" style="width: 60px; height: 6px;"></div>
                </div>
                ${this.generateSkeletonTask()}
                ${this.generateSkeletonTask()}
                ${this.generateSkeletonTask()}
            </div>
        `;
    }

    generateSkeletonTask() {
        return `
            <div class="skeleton-task">
                <div class="skeleton skeleton-task-dot"></div>
                <div class="skeleton skeleton-task-title"></div>
                <div class="skeleton skeleton-line" style="width: 30px; height: 0.8rem;"></div>
            </div>
        `;
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
            navItem.setAttribute('aria-label', `Navigate to ${axis.title} section`);
            navContainer.appendChild(navItem);

            // Add sub-items
            const subItems = axis.pipelines || axis.components || axis.phases || [];
            subItems.forEach(item => {
                const subNavItem = document.createElement('button');
                subNavItem.className = 'nav-item nested';
                subNavItem.textContent = item.title;
                subNavItem.onclick = () => this.scrollToItem(item.id);
                subNavItem.setAttribute('aria-label', `Navigate to ${item.title} in ${axis.title}`);
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
                            <div class="progress-circle" onclick="event.stopPropagation(); roadmap.editProgress('${axis.id}', ${axisProgress}, event)" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); roadmap.editProgress('${axis.id}', ${axisProgress}, event); }" role="button" aria-label="Edit progress: ${axisProgress}% complete" tabindex="0">
                                <svg width="32" height="32" class="circular-progress" aria-hidden="true">
                                    <circle cx="16" cy="16" r="14" stroke="var(--border-color)" stroke-width="2" fill="none"/>
                                    <circle cx="16" cy="16" r="14" stroke="var(--primary-color)" stroke-width="2" fill="none"
                                        stroke-dasharray="87.96" stroke-dashoffset="${87.96 - (axisProgress / 100) * 87.96}"
                                        class="progress-ring" transform="rotate(-90 16 16)"/>
                                </svg>
                                <span class="progress-text" aria-hidden="true">${axisProgress}%</span>
                            </div>
                            <button class="btn-icon" onclick="event.stopPropagation(); roadmap.editItem('${axis.id}')" aria-label="Edit ${axis.title} details">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-10.5 10.5-3.252.577.577-3.252 10.5-10.5 2 2z"/>
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="event.stopPropagation(); roadmap.addSubItem('${axis.id}')" aria-label="Add new item to ${axis.title}">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
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
                        <div class="pipeline-progress">
                            <div class="progress-bar-container" onclick="event.stopPropagation(); roadmap.editProgress('${item.id}', ${itemProgress}, event)" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); roadmap.editProgress('${item.id}', ${itemProgress}, event); }" role="button" aria-label="Edit progress: ${itemProgress}% complete" tabindex="0">
                                <div class="progress-bar" style="width: ${itemProgress}%" aria-hidden="true"></div>
                            </div>
                            <span class="progress-label" aria-hidden="true">${itemProgress}%</span>
                        </div>
                        <button class="btn-icon" onclick="event.stopPropagation(); roadmap.editItem('${item.id}')" aria-label="Edit ${item.title} details">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
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
        let html = `<div class="pipeline-content" id="pipeline-content-${pipeline.id}">`;
        
        // Handle phases if they exist
        if (pipeline.phases && pipeline.phases.length > 0) {
            pipeline.phases.forEach(phase => {
                const phaseProgress = this.calculateProgress(phase);
                html += `
                    <div class="phase-container" data-id="${phase.id}">
                        <div class="phase-header">
                            <h4 class="phase-title">${phase.title}</h4>
                            <div class="phase-progress">
                                <div class="progress-bar-container" onclick="event.stopPropagation(); roadmap.editProgress('${phase.id}', ${phaseProgress}, event)" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); roadmap.editProgress('${phase.id}', ${phaseProgress}, event); }" role="button" aria-label="Edit progress: ${phaseProgress}% complete" tabindex="0">
                                    <div class="progress-bar" style="width: ${phaseProgress}%" aria-hidden="true"></div>
                                </div>
                                <span class="progress-label" aria-hidden="true">${phaseProgress}%</span>
                            </div>
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
            const progressStatus = task.progress >= 100 ? 'completed' : task.progress > 0 ? 'in-progress' : 'not-started';
            const statusText = task.progress >= 100 ? 'completed' : task.progress > 0 ? 'in progress' : 'not started';

            html += `
                <div class="task-item" data-id="${task.id}" onclick="roadmap.editTask('${task.id}')" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); roadmap.editTask('${task.id}'); }" role="button" aria-label="Edit task: ${task.title}" tabindex="0">
                    <div class="task-progress-dot ${progressStatus}"
                        onclick="event.stopPropagation(); roadmap.editProgress('${task.id}', ${task.progress || 0}, event)"
                        onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); roadmap.editProgress('${task.id}', ${task.progress || 0}, event); }"
                        role="button" aria-label="Edit progress for ${task.title}: ${task.progress || 0}% ${statusText}" tabindex="0">
                    </div>
                    <span class="task-title">${task.title}</span>
                    <span class="task-progress" aria-hidden="true">${task.progress || 0}%</span>
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
        const container = document.getElementById(`pipeline-content-${pipelineId}`);
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

    editProgress(itemId, currentProgress, event) {
        // Store the current edit context
        this.currentEditItemId = itemId;
        this.currentEditProgress = currentProgress;

        // Get the editor and input elements
        const editor = document.getElementById('inline-editor');
        const input = document.getElementById('inline-editor-input');

        // Position the editor near the clicked element
        const targetRect = event ? event.target.getBoundingClientRect() : null;
        if (targetRect) {
            editor.style.left = `${targetRect.left + window.scrollX}px`;
            editor.style.top = `${targetRect.bottom + window.scrollY + 8}px`;
        }

        // Set current value and show editor
        input.value = currentProgress;
        editor.classList.add('show');
        input.focus();
        input.select();

        // Add event listeners for keyboard shortcuts
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveInlineEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.closeInlineEditor();
            }
        };

        // Close editor when clicking outside
        this.outsideClickHandler = (e) => {
            if (!editor.contains(e.target)) {
                this.closeInlineEditor();
            }
        };
        setTimeout(() => document.addEventListener('click', this.outsideClickHandler), 0);
    }

    saveInlineEdit() {
        const input = document.getElementById('inline-editor-input');
        const newProgress = input.value;

        if (newProgress !== null && !isNaN(newProgress)) {
            const progress = Math.max(0, Math.min(100, parseInt(newProgress)));
            this.updateProgress(this.currentEditItemId, progress);
            this.renderContent(); // Re-render to update visual indicators
            this.showToast('Progress updated successfully', 'success');
        }

        this.closeInlineEditor();
    }

    closeInlineEditor() {
        const editor = document.getElementById('inline-editor');
        editor.classList.remove('show');

        // Remove outside click handler
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }

        // Clear edit context
        this.currentEditItemId = null;
        this.currentEditProgress = null;
    }

    showItemEditor(parentId, itemType, placeholder, onSave) {
        this.currentItemEditor = { parentId, itemType, onSave };

        // Reuse the inline editor but change the input type and placeholder
        const editor = document.getElementById('inline-editor');
        const input = document.getElementById('inline-editor-input');

        input.type = 'text';
        input.placeholder = placeholder;
        input.value = '';
        input.min = null;
        input.max = null;

        // Position in center of screen
        editor.style.left = '50%';
        editor.style.top = '50%';
        editor.style.transform = 'translate(-50%, -50%)';

        editor.classList.add('show');
        input.focus();

        // Update button text
        const saveBtn = editor.querySelector('.inline-editor-btn.primary');
        saveBtn.textContent = 'Add';

        // Add event listeners for keyboard shortcuts
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveItemEditor();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.closeItemEditor();
            }
        };

        // Close editor when clicking outside
        this.outsideClickHandler = (e) => {
            if (!editor.contains(e.target)) {
                this.closeItemEditor();
            }
        };
        setTimeout(() => document.addEventListener('click', this.outsideClickHandler), 0);
    }

    saveItemEditor() {
        const input = document.getElementById('inline-editor-input');
        const title = input.value.trim();

        if (title) {
            this.currentItemEditor.onSave(title);
        }

        this.closeItemEditor();
    }

    closeItemEditor() {
        const editor = document.getElementById('inline-editor');
        editor.classList.remove('show');

        // Reset editor for progress editing
        const input = document.getElementById('inline-editor-input');
        input.type = 'number';
        input.placeholder = 'Enter progress (0-100)';
        input.min = '0';
        input.max = '100';
        editor.style.transform = '';

        // Reset button text
        const saveBtn = editor.querySelector('.inline-editor-btn.primary');
        saveBtn.textContent = 'Save';

        // Remove outside click handler
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }

        // Clear editor context
        this.currentItemEditor = null;
    }

    updateProgress(itemId, progress) {
        const item = this.findItemById(itemId);
        if (item) {
            // Only allow direct progress setting for leaf items (tasks without children)
            const hasChildren = (item.tasks && item.tasks.length > 0) ||
                               (item.phases && item.phases.length > 0) ||
                               (item.pipelines && item.pipelines.length > 0) ||
                               (item.components && item.components.length > 0);

            if (!hasChildren) {
                // This is a leaf item (task), set progress directly
                item.progress = parseInt(progress);
            } else {
                // This item has children, progress should be calculated automatically
                // We'll still allow manual override but recalculate after
                item.progress = parseInt(progress);
            }

            this.saveData();
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
        this.showItemEditor(null, 'axis', 'Enter axis title:', (title) => {
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
        });
    }

    addSubItem(parentId) {
        const parent = this.findItemById(parentId);
        if (!parent) return;

        this.showItemEditor(parentId, 'item', 'Enter item title:', (title) => {
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
        });
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
            const isActive = btn.dataset.view === view;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
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

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');

        if (sidebar.classList.contains('mobile-open')) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');

        sidebar.classList.add('mobile-open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');

        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
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
