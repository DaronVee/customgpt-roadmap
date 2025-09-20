class RoadmapManager {
    constructor() {
        this.data = null;
        this.currentView = 'tree';
        this.currentItemId = null;
        this.apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3001/api'
            : `${window.location.protocol}//${window.location.host}/api`;
        this.expandedState = this.loadExpandedState();
        this.gridFocusMode = false;
        this.timelineShowMilestones = true;
        this.timelineShowDependencies = false;
        this.timelineFilter = 'all';
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
            const isExpanded = this.getExpandedState(`axis-${axis.id}`);
            const expandClass = isExpanded ? 'expanded' : '';
            const contentClass = isExpanded ? '' : 'hidden';

            html += `
                <div class="axis-container" data-id="${axis.id}">
                    <div class="axis-header" onclick="roadmap.toggleAxis('${axis.id}')">
                        <span class="expand-icon ${expandClass}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </span>
                        <div class="item-title-with-status">
                            <h2 class="axis-title">${axis.title}</h2>
                            ${this.createStatusBadge(axis)}
                        </div>
                        <div class="axis-actions">
                            <div class="progress-circle" onclick="event.stopPropagation(); roadmap.editProgress('${axis.id}', ${axisProgress}, event)" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); roadmap.editProgress('${axis.id}', ${axisProgress}, event); }" role="button" aria-label="Edit progress: ${axisProgress}% complete" tabindex="0">
                                <svg width="32" height="32" class="circular-progress" aria-hidden="true">
                                    <circle cx="16" cy="16" r="14" stroke="var(--border-color)" stroke-width="2" fill="none"/>
                                    <circle cx="16" cy="16" r="14" stroke="var(--primary-color)" stroke-width="2" fill="none"
                                        stroke-dasharray="87.96" stroke-dashoffset="${87.96 - (axisProgress / 100) * 87.96}"
                                        class="progress-ring" transform="rotate(-90 16 16)"/>
                                </svg>
                                <span class="progress-text" aria-hidden="true">${axisProgress}%</span>
                                ${this.getProgressSource(axis) !== 'direct' ? `<div class="progress-source-icon ${this.getProgressSource(axis)}" title="Progress ${this.getProgressSource(axis)}"></div>` : ''}
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
                    <div class="axis-content ${contentClass}" id="axis-content-${axis.id}">
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
            const isExpanded = this.getExpandedState(`pipeline-${item.id}`);
            const expandClass = isExpanded ? 'expanded' : '';

            html += `
                <div class="pipeline-container" data-id="${item.id}">
                    <div class="pipeline-header" onclick="roadmap.togglePipeline('${item.id}')">
                        <span class="expand-icon ${expandClass}">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </span>
                        <div class="item-title-with-status">
                            <h3 class="pipeline-title">${item.title}</h3>
                            ${this.createStatusBadge(item)}
                        </div>
                        <div class="pipeline-progress">
                            ${this.createProgressIndicator(item)}
                            <div class="progress-bar-container" onclick="event.stopPropagation(); roadmap.editProgress('${item.id}', ${itemProgress}, event)" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); roadmap.editProgress('${item.id}', ${itemProgress}, event); }" role="button" aria-label="Edit progress: ${itemProgress}% complete" tabindex="0">
                                <div class="progress-bar" style="width: ${itemProgress}%" aria-hidden="true"></div>
                            </div>
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
        const isExpanded = this.getExpandedState(`pipeline-${pipeline.id}`);
        const contentClass = isExpanded ? '' : 'hidden';
        let html = `<div class="pipeline-content ${contentClass}" id="pipeline-content-${pipeline.id}">`;
        
        // Handle phases if they exist
        if (pipeline.phases && pipeline.phases.length > 0) {
            pipeline.phases.forEach(phase => {
                const phaseProgress = this.calculateProgress(phase);
                html += `
                    <div class="phase-container" data-id="${phase.id}">
                        <div class="phase-header">
                            <div class="item-title-with-status">
                                <h4 class="phase-title">${phase.title}</h4>
                                ${this.createStatusBadge(phase)}
                            </div>
                            <div class="phase-progress">
                                ${this.createProgressIndicator(phase)}
                                <div class="progress-bar-container" onclick="event.stopPropagation(); roadmap.editProgress('${phase.id}', ${phaseProgress}, event)" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); roadmap.editProgress('${phase.id}', ${phaseProgress}, event); }" role="button" aria-label="Edit progress: ${phaseProgress}% complete" tabindex="0">
                                    <div class="progress-bar" style="width: ${phaseProgress}%" aria-hidden="true"></div>
                                </div>
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
                <div class="task-item item-container" data-id="${task.id}" onclick="roadmap.editTask('${task.id}')" onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); roadmap.editTask('${task.id}'); }" role="button" aria-label="Edit task: ${task.title}" tabindex="0">
                    <div class="task-progress-dot ${progressStatus}"
                        onclick="event.stopPropagation(); roadmap.editProgress('${task.id}', ${task.progress || 0}, event)"
                        onkeydown="if(event.key==='Enter'||event.key===' ') { event.preventDefault(); event.stopPropagation(); roadmap.editProgress('${task.id}', ${task.progress || 0}, event); }"
                        role="button" aria-label="Edit progress for ${task.title}: ${task.progress || 0}% ${statusText}" tabindex="0">
                    </div>
                    <div class="task-content">
                        <div class="item-title-with-status">
                            <span class="task-title">${task.title}</span>
                            ${this.createStatusBadge(task)}
                        </div>
                        <div class="item-metrics">
                            ${this.createProgressIndicator(task)}
                        </div>
                    </div>
                    ${this.createQuickStatusActions(task)}
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
        
        const columns = ['Not Started', 'In Progress', 'Review', 'Completed', 'Blocked'];
        let html = '<div class="kanban-view">';
        
        columns.forEach(column => {
            html += `
                <div class="kanban-column" data-column="${column}">
                    <div class="kanban-column-header">
                        <h3 class="kanban-column-title">${column}</h3>
                        <span class="kanban-count">${this.getItemsForColumn(column).length}</span>
                    </div>
                    <div class="kanban-cards" data-column="${column}">
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

        // Map column names to status values
        const columnStatusMap = {
            'Not Started': 'not_started',
            'In Progress': 'in_progress',
            'Review': 'review',
            'Completed': 'completed',
            'Blocked': 'blocked'
        };

        const targetStatus = columnStatusMap[column];

        this.data.axes.forEach(axis => {
            const axisItems = axis.pipelines || axis.components || axis.phases || [];
            axisItems.forEach(item => {
                const itemStatus = item.status || 'not_started';
                if (itemStatus === targetStatus) {
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
            const progress = this.calculateProgress(item);
            const status = item.status || 'not_started';
            const isDivergent = this.isStatusProgressDivergent(item);

            html += `
                <div class="kanban-card item-container" draggable="true" data-id="${item.id}" data-status="${status}">
                    <div class="kanban-card-header">
                        <div class="item-title-with-status">
                            <h4 class="kanban-card-title">${item.title}</h4>
                            ${isDivergent ? '<div class="divergence-indicator" title="Status and progress may be misaligned"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg></div>' : ''}
                        </div>
                        <div class="kanban-card-drag-handle">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 5zm0 6a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 11z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="kanban-card-meta">
                        <span class="kanban-card-axis">${item.axisTitle}</span>
                        <div class="item-metrics">
                            ${this.createProgressIndicator(item)}
                        </div>
                    </div>
                    <div class="kanban-card-actions">
                        <button class="kanban-quick-edit" onclick="event.stopPropagation(); roadmap.quickEditProgress('${item.id}', ${progress})" title="Quick edit progress">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-10.5 10.5-3.252.577.577-3.252 10.5-10.5 2 2z"/>
                            </svg>
                        </button>
                        ${this.createStatusSuggestion(item)}
                    </div>
                </div>
            `;
        });

        return html || '<div class="empty-column-drop-zone">Drop items here</div>';
    }

    renderTimelineView() {
        if (!this.data.axes || this.data.axes.length === 0) {
            return '<div class="empty-state">No data to display in Timeline view.</div>';
        }

        // Generate next 12 months for the timeline
        const timespan = this.generateTimespan();
        const currentDate = new Date();

        let html = `
            <div class="timeline-view-enhanced">
                <div class="timeline-header">
                    <div class="timeline-controls">
                        <button class="timeline-control-btn ${this.timelineShowMilestones ? 'active' : ''}" onclick="roadmap.toggleTimelineMilestones()" title="Show milestones">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                            </svg>
                            Milestones
                        </button>
                        <button class="timeline-control-btn ${this.timelineShowDependencies ? 'active' : ''}" onclick="roadmap.toggleTimelineDependencies()" title="Show dependencies">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 0 0-3 0v9a2.5 2.5 0 0 1-5 0V5a.5.5 0 0 1 1 0v7a1.5 1.5 0 0 0 3 0V3z"/>
                            </svg>
                            Dependencies
                        </button>
                        <select class="timeline-filter" onchange="roadmap.filterTimeline(this.value)">
                            <option value="all">All Items</option>
                            <option value="active">Active Only</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                    <div class="timeline-legend">
                        <div class="legend-item">
                            <div class="legend-color not-started"></div>
                            <span>Not Started</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color in-progress"></div>
                            <span>In Progress</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color completed"></div>
                            <span>Completed</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color milestone"></div>
                            <span>Milestone</span>
                        </div>
                    </div>
                </div>

                <div class="timeline-gantt">
                    <div class="timeline-grid">
                        <div class="timeline-grid-header">
                            <div class="timeline-task-header">Tasks</div>
                            <div class="timeline-months-header">
                                ${timespan.map(month => `
                                    <div class="timeline-month" data-month="${month.key}">
                                        <div class="timeline-month-label">${month.label}</div>
                                        <div class="timeline-weeks">
                                            ${Array.from({length: month.weeks}, (_, i) => `<div class="timeline-week"></div>`).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="timeline-content-grid">
                            ${this.data.axes.map(axis => {
                                const items = axis.pipelines || axis.components || axis.phases || [];
                                return `
                                    <div class="timeline-axis-section">
                                        <div class="timeline-axis-header">
                                            <button class="timeline-expand-btn ${this.getExpandedState(`timeline-${axis.id}`) ? 'expanded' : ''}"
                                                    onclick="roadmap.toggleTimelineAxis('${axis.id}')">
                                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                                                </svg>
                                            </button>
                                            <div class="item-title-with-status">
                                                <h3 class="timeline-axis-title">${axis.title}</h3>
                                                ${this.createStatusBadge(axis)}
                                            </div>
                                            <div class="item-metrics">
                                                ${this.createProgressIndicator(axis)}
                                            </div>
                                        </div>
                                        <div class="timeline-axis-track ${this.getExpandedState(`timeline-${axis.id}`) ? 'expanded' : 'collapsed'}">
                                            ${items.map(item => this.renderTimelineItem(item, timespan, currentDate)).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    renderTimelineItem(item, timespan, currentDate) {
        const progress = this.calculateProgress(item);
        const status = item.status || 'not_started';

        // Calculate estimated timeline based on progress and current date
        const startDate = item.startDate ? new Date(item.startDate) : currentDate;
        const estimatedDuration = item.estimatedWeeks || this.estimateTimelineForItem(item);
        const endDate = item.endDate ? new Date(item.endDate) : new Date(startDate.getTime() + estimatedDuration * 7 * 24 * 60 * 60 * 1000);

        const startPosition = this.calculateTimelinePosition(startDate, timespan);
        const duration = this.calculateTimelineDuration(startDate, endDate, timespan);
        const progressWidth = (progress / 100) * duration;

        const isOverdue = status !== 'completed' && status !== 'blocked' && endDate < currentDate;
        const isMilestone = item.validated || status === 'completed';
        const isDivergent = this.isStatusProgressDivergent(item);

        const statusIcons = {
            'not_started': '○',
            'in_progress': '⚡',
            'review': '👁️',
            'completed': '✅',
            'blocked': '🚫'
        };

        return `
            <div class="timeline-item-row status-${status} ${isOverdue ? 'overdue' : ''} ${isDivergent ? 'divergent' : ''}" data-id="${item.id}">
                <div class="timeline-item-label">
                    <div class="timeline-item-icon status-${status}">
                        ${statusIcons[status] || '○'}
                    </div>
                    <div class="timeline-item-info">
                        <div class="item-title-with-status">
                            <div class="timeline-item-title">${item.title}</div>
                            ${this.createStatusBadge(item)}
                        </div>
                        <div class="timeline-item-meta">
                            ${this.createProgressIndicator(item)} • ${estimatedDuration}w • ${item.validated ? 'Validated' : status.replace('_', ' ')}
                            ${isDivergent ? ' • <span class="divergence-warning">Check Status</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="timeline-item-bar-container">
                    <div class="timeline-item-bar status-${status}"
                         style="left: ${startPosition}%; width: ${duration}%;"
                         onclick="roadmap.editTimelineItem('${item.id}')"
                         title="Click to edit timeline">
                        <div class="timeline-progress-fill" style="width: ${progressWidth}%"></div>
                        <div class="timeline-item-handles">
                            <div class="timeline-handle start" onmousedown="roadmap.startTimelineDrag('${item.id}', 'start', event)"></div>
                            <div class="timeline-handle end" onmousedown="roadmap.startTimelineDrag('${item.id}', 'end', event)"></div>
                        </div>
                        ${isMilestone ? '<div class="timeline-milestone-marker">♦</div>' : ''}
                        ${isDivergent ? '<div class="timeline-divergence-indicator">⚠</div>' : ''}
                    </div>
                    ${isOverdue ? '<div class="timeline-overdue-indicator">!</div>' : ''}
                </div>
            </div>
        `;
    }

    generateTimespan() {
        const months = [];
        const currentDate = new Date();

        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

            // Calculate weeks in month
            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            const weeks = Math.ceil(daysInMonth / 7);

            months.push({
                key: monthKey,
                label: monthLabel,
                weeks: weeks,
                date: date
            });
        }

        return months;
    }

    calculateTimelinePosition(date, timespan) {
        const startOfTimespan = timespan[0].date;
        const endOfTimespan = new Date(timespan[timespan.length - 1].date.getFullYear(), timespan[timespan.length - 1].date.getMonth() + 1, 0);
        const totalDays = (endOfTimespan - startOfTimespan) / (1000 * 60 * 60 * 24);
        const daysSinceStart = Math.max(0, (date - startOfTimespan) / (1000 * 60 * 60 * 24));

        return Math.min(100, (daysSinceStart / totalDays) * 100);
    }

    calculateTimelineDuration(startDate, endDate, timespan) {
        const startOfTimespan = timespan[0].date;
        const endOfTimespan = new Date(timespan[timespan.length - 1].date.getFullYear(), timespan[timespan.length - 1].date.getMonth() + 1, 0);
        const totalDays = (endOfTimespan - startOfTimespan) / (1000 * 60 * 60 * 24);
        const durationDays = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));

        return Math.min(80, (durationDays / totalDays) * 100);
    }

    estimateTimelineForItem(item) {
        // Estimate timeline based on number of sub-items and complexity
        const subItems = item.phases || item.tasks || [];
        const baseWeeks = 2;
        const complexityMultiplier = Math.max(1, subItems.length * 0.5);
        return Math.ceil(baseWeeks * complexityMultiplier);
    }

    renderGridView() {
        if (!this.data.axes || this.data.axes.length === 0) {
            return '<div class="empty-state">No data to display in Grid view.</div>';
        }

        // Sort axes by progress (descending) to show most active first
        const sortedAxes = [...this.data.axes].sort((a, b) => {
            return this.calculateProgress(b) - this.calculateProgress(a);
        });

        let html = `
            <div class="grid-view-header">
                <div class="grid-controls">
                    <button class="grid-control-btn ${this.gridFocusMode ? 'active' : ''}" onclick="roadmap.toggleFocusMode()" title="Focus on active items">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM2 7.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0z"/>
                            <path d="m13 13 3 3"/>
                        </svg>
                        Focus Mode
                    </button>
                    <button class="grid-control-btn" onclick="roadmap.expandAllGridCards()" title="Expand all cards">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8zm7-7a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 1z"/>
                        </svg>
                        Expand All
                    </button>
                </div>
            </div>
            <div class="grid-view">
        `;

        sortedAxes.forEach(axis => {
            const axisProgress = this.calculateProgress(axis);
            const items = axis.pipelines || axis.components || axis.phases || [];
            const validatedItems = items.filter(i => i.validated).length;
            const inProgressItems = items.filter(i => (i.status === 'in_progress' || i.status === 'review')).length;
            const completedItems = items.filter(i => i.status === 'completed').length;
            const blockedItems = items.filter(i => i.status === 'blocked').length;

            // Calculate priority score (higher progress + more items = higher priority)
            const priorityScore = axisProgress + (items.length * 10);
            const priorityLevel = priorityScore > 50 ? 'high' : priorityScore > 20 ? 'medium' : 'low';

            // Estimate completion based on current velocity (mock calculation)
            const completionWeeks = axisProgress > 0 ? Math.ceil((100 - axisProgress) / Math.max(axisProgress / 4, 5)) : '∞';

            const isExpanded = this.getExpandedState(`grid-${axis.id}`);
            const isFocused = this.gridFocusMode && axisProgress > 0;

            html += `
                <div class="grid-card enhanced priority-${priorityLevel} ${isExpanded ? 'expanded' : ''} ${isFocused ? 'focused' : ''}" data-id="${axis.id}">
                    <div class="grid-card-header" onclick="roadmap.toggleGridCard('${axis.id}')">
                        <div class="grid-card-title-section">
                            <div class="item-title-with-status">
                                <h3 class="grid-card-title">${axis.title}</h3>
                                ${this.createStatusBadge(axis)}
                            </div>
                            <div class="grid-card-badges">
                                <span class="grid-card-badge priority-${priorityLevel}">${priorityLevel} priority</span>
                                ${axisProgress > 0 ? '<span class="grid-card-badge active">Active</span>' : ''}
                                ${this.isStatusProgressDivergent(axis) ? '<span class="grid-card-badge divergent">Check Status</span>' : ''}
                            </div>
                        </div>
                        <div class="grid-card-expand-icon ${isExpanded ? 'expanded' : ''}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </div>
                    </div>

                    <div class="grid-card-progress-section">
                        <div class="progress-circle-container">
                            <svg width="80" height="80" class="progress-donut" aria-hidden="true">
                                <circle cx="40" cy="40" r="35" stroke="var(--border-color)" stroke-width="6" fill="none"/>
                                <circle cx="40" cy="40" r="35" stroke="var(--primary-color)" stroke-width="6" fill="none"
                                    stroke-dasharray="219.9" stroke-dashoffset="${219.9 - (axisProgress / 100) * 219.9}"
                                    class="progress-ring" transform="rotate(-90 40 40)"/>
                            </svg>
                            <div class="progress-center">
                                <span class="progress-percentage">${axisProgress}%</span>
                                <span class="progress-label">Complete</span>
                                ${this.getProgressSource(axis) !== 'direct' ? `<div class="progress-source-indicator mini">${this.getProgressSource(axis)}</div>` : ''}
                            </div>
                        </div>

                        <div class="progress-quick-edit">
                            <label class="progress-slider-label">Quick Progress:</label>
                            <input type="range" class="progress-slider" min="0" max="100" value="${axisProgress}"
                                onchange="roadmap.updateAxisProgress('${axis.id}', this.value)"
                                oninput="this.nextElementSibling.textContent = this.value + '%'">
                            <span class="progress-slider-value">${axisProgress}%</span>
                        </div>
                    </div>

                    <div class="grid-card-stats-enhanced">
                        <div class="stat-item-enhanced">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <span class="stat-value">${items.length}</span>
                                <span class="stat-label">Total Items</span>
                            </div>
                        </div>
                        <div class="stat-item-enhanced">
                            <div class="stat-icon">⚡</div>
                            <div class="stat-content">
                                <span class="stat-value">${inProgressItems}</span>
                                <span class="stat-label">In Progress</span>
                            </div>
                        </div>
                        <div class="stat-item-enhanced">
                            <div class="stat-icon">✅</div>
                            <div class="stat-content">
                                <span class="stat-value">${completedItems}</span>
                                <span class="stat-label">Completed</span>
                            </div>
                        </div>
                        ${blockedItems > 0 ? `
                        <div class="stat-item-enhanced blocked">
                            <div class="stat-icon">🚫</div>
                            <div class="stat-content">
                                <span class="stat-value">${blockedItems}</span>
                                <span class="stat-label">Blocked</span>
                            </div>
                        </div>
                        ` : ''}
                        <div class="stat-item-enhanced">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-content">
                                <span class="stat-value">${completionWeeks === '∞' ? '∞' : completionWeeks + 'w'}</span>
                                <span class="stat-label">ETA</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid-card-expandable ${isExpanded ? 'expanded' : ''}">
                        <div class="grid-card-items">
                            <h4 class="grid-card-items-title">Sub-Items:</h4>
                            ${this.renderGridCardItems(items)}
                        </div>

                        <div class="grid-card-actions">
                            <button class="grid-action-btn primary" onclick="event.stopPropagation(); roadmap.addSubItem('${axis.id}')" title="Add new item">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                                </svg>
                                Add Item
                            </button>
                            <button class="grid-action-btn secondary" onclick="event.stopPropagation(); roadmap.editItem('${axis.id}')" title="Edit details">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-10.5 10.5-3.252.577.577-3.252 10.5-10.5 2 2z"/>
                                </svg>
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    renderGridCardItems(items) {
        if (!items || items.length === 0) {
            return '<p class="no-items">No items yet. Click "Add Item" to get started.</p>';
        }

        let html = '<div class="grid-sub-items">';

        items.forEach(item => {
            const progress = this.calculateProgress(item);
            const status = item.status || 'not_started';
            const isDivergent = this.isStatusProgressDivergent(item);

            html += `
                <div class="grid-sub-item status-${status} ${isDivergent ? 'divergent' : ''}" onclick="event.stopPropagation(); roadmap.editItem('${item.id}')">
                    <div class="grid-sub-item-status status-${status}"></div>
                    <div class="grid-sub-item-content">
                        <div class="item-title-with-status">
                            <span class="grid-sub-item-title">${item.title}</span>
                            ${this.createStatusBadge(item)}
                        </div>
                        <div class="item-metrics">
                            ${this.createProgressIndicator(item)}
                            ${isDivergent ? '<span class="divergence-warning">⚠</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    calculateProgress(item) {
        // Check for manual progress override first
        if (item.progressOverride !== undefined && item.progressOverride !== null) {
            return item.progressOverride;
        }

        // Use direct progress if available (leaf items)
        if (item.progress !== undefined && item.progress !== null) {
            return item.progress;
        }

        // Calculate based on sub-items with weighting
        let totalProgress = 0;
        let totalWeight = 0;

        // Check for different types of sub-items
        const subItems = item.pipelines || item.components || item.phases || item.tasks || [];

        if (subItems.length > 0) {
            subItems.forEach(subItem => {
                const weight = subItem.progressWeight || 1;
                totalProgress += this.calculateProgress(subItem) * weight;
                totalWeight += weight;
            });

            return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
        }

        return item.validated ? 100 : 0;
    }

    // Helper to determine if progress is manually set vs calculated
    getProgressSource(item) {
        if (item.progressOverride !== undefined && item.progressOverride !== null) {
            return 'override';
        }

        if (item.progress !== undefined && item.progress !== null) {
            const subItems = item.pipelines || item.components || item.phases || item.tasks || [];
            return subItems.length > 0 ? 'manual' : 'direct';
        }

        return 'calculated';
    }

    // Helper to suggest status based on progress and current status
    suggestStatus(item) {
        const progress = this.calculateProgress(item);
        const currentStatus = item.status || 'not_started';

        // Strong suggestions based on progress
        if (progress === 0) return 'not_started';
        if (progress === 100) return 'completed';

        // Nuanced suggestions based on current context
        if (progress >= 80 && currentStatus === 'in_progress') return 'review';
        if (progress >= 90) return 'review'; // High progress suggests review phase
        if (progress >= 1 && currentStatus === 'not_started') return 'in_progress';
        if (progress < 25 && currentStatus === 'review') return 'in_progress'; // Too early for review

        // Default to current status if no strong suggestion
        return currentStatus === 'blocked' ? 'in_progress' : currentStatus;
    }

    // Helper to check if status and progress are misaligned
    isStatusProgressDivergent(item) {
        const progress = this.calculateProgress(item);
        const status = item.status || 'not_started';

        // More nuanced divergence detection - only flag truly problematic combinations
        switch (status) {
            case 'not_started':
                return progress > 15; // Allow small prep work
            case 'in_progress':
                return false; // In progress can be at any % (work in progress)
            case 'review':
                return progress < 10; // Review should have some substantial work done
            case 'completed':
                return progress < 75; // Completed should be mostly done (allow scope reduction)
            case 'blocked':
                return false; // Can be blocked at any progress
            default:
                return false;
        }
    }

    // Create status badge HTML
    createStatusBadge(item, showQuickActions = false) {
        const status = item.status || 'not_started';
        const statusLabels = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'review': 'Review',
            'completed': 'Completed',
            'blocked': 'Blocked'
        };

        let html = `<span class="status-badge ${status}" title="${statusLabels[status]}">${statusLabels[status]}</span>`;

        if (showQuickActions) {
            html += this.createQuickStatusActions(item);
        }

        return html;
    }

    // Create progress indicator with source information
    createProgressIndicator(item) {
        const progress = this.calculateProgress(item);
        const source = this.getProgressSource(item);
        const isDivergent = this.isStatusProgressDivergent(item);

        const sourceIcons = {
            'calculated': `<svg class="progress-source-icon calculated" viewBox="0 0 16 16" fill="currentColor" title="Calculated from children">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>`,
            'manual': `<svg class="progress-source-icon manual" viewBox="0 0 16 16" fill="currentColor" title="Manually set">
                <path d="M13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642-0.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001z"/>
            </svg>`,
            'override': `<svg class="progress-source-icon override" viewBox="0 0 16 16" fill="currentColor" title="Override set">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>`,
            'direct': ''
        };

        let html = `
            <div class="progress-indicator">
                <span class="progress-value">${progress}%</span>
                ${sourceIcons[source] || ''}
        `;

        if (isDivergent) {
            html += `
                <div class="divergence-indicator" title="Status and progress may be misaligned">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    Check
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    // Create quick status action buttons with logical progression
    createQuickStatusActions(item) {
        const currentStatus = item.status || 'not_started';
        const progress = this.calculateProgress(item);

        // Define logical next steps based on current status and progress
        const logicalTransitions = {
            'not_started': ['in_progress', 'blocked'], // Can start work or get blocked
            'in_progress': ['review', 'completed', 'blocked', 'not_started'], // Can go to review, complete, get blocked, or reset
            'review': ['completed', 'in_progress', 'blocked'], // Can complete, send back to work, or get blocked
            'completed': ['in_progress'], // Can reopen if needed
            'blocked': ['not_started', 'in_progress'] // Can unblock to start or continue
        };

        // Special case: if progress is 100%, always allow direct completion
        if (progress === 100 && currentStatus !== 'completed') {
            if (!logicalTransitions[currentStatus].includes('completed')) {
                logicalTransitions[currentStatus].push('completed');
            }
        }

        // Special case: if progress is 0%, prefer not_started over review
        if (progress === 0 && currentStatus !== 'not_started') {
            logicalTransitions[currentStatus] = logicalTransitions[currentStatus].filter(s => s !== 'review');
        }

        const allowedTransitions = logicalTransitions[currentStatus] || [];
        let html = '<div class="quick-status-actions">';

        const statusIcons = {
            'not_started': '⭕',
            'in_progress': '🔄',
            'review': '👁️',
            'completed': '✅',
            'blocked': '🚫'
        };

        const statusLabels = {
            'not_started': 'Reset to Not Started',
            'in_progress': 'Start/Continue Work',
            'review': 'Send for Review',
            'completed': 'Mark Complete',
            'blocked': 'Mark as Blocked'
        };

        allowedTransitions.forEach(status => {
            html += `
                <button class="quick-status-btn ${status}"
                        onclick="roadmap.updateItemStatus('${item.id}', '${status}')"
                        title="${statusLabels[status]}">
                    ${statusIcons[status]}
                </button>
            `;
        });

        html += '</div>';
        return html;
    }

    // Create status suggestion popup
    createStatusSuggestion(item) {
        const currentStatus = item.status || 'not_started';
        const suggestedStatus = this.suggestStatus(item);

        if (currentStatus === suggestedStatus) {
            return '';
        }

        const statusLabels = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'review': 'Review',
            'completed': 'Completed',
            'blocked': 'Blocked'
        };

        return `
            <div class="status-suggestion" id="status-suggestion-${item.id}">
                <div class="status-suggestion-text">
                    Suggested: ${statusLabels[suggestedStatus]} (based on ${this.calculateProgress(item)}% progress)
                </div>
                <div class="status-suggestion-actions">
                    <button class="status-suggestion-btn primary"
                            onclick="roadmap.acceptStatusSuggestion('${item.id}', '${suggestedStatus}')">
                        Accept
                    </button>
                    <button class="status-suggestion-btn"
                            onclick="roadmap.dismissStatusSuggestion('${item.id}')">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
    }

    // Update item status
    updateItemStatus(itemId, newStatus) {
        const item = this.findItemById(itemId);
        if (item) {
            item.status = newStatus;
            this.saveData();
            this.renderContent();
            this.updateProgressOverview();
            this.showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
        }
    }

    // Accept status suggestion
    acceptStatusSuggestion(itemId, suggestedStatus) {
        this.updateItemStatus(itemId, suggestedStatus);
        this.dismissStatusSuggestion(itemId);
    }

    // Dismiss status suggestion
    dismissStatusSuggestion(itemId) {
        const suggestion = document.getElementById(`status-suggestion-${itemId}`);
        if (suggestion) {
            suggestion.remove();
        }
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
            const isCurrentlyHidden = content.classList.contains('hidden');
            content.classList.toggle('hidden');
            icon.classList.toggle('expanded');

            // Save the new state (opposite of current hidden state)
            this.setExpandedState(`axis-${axisId}`, isCurrentlyHidden);
        }
    }

    togglePipeline(pipelineId) {
        const container = document.getElementById(`pipeline-content-${pipelineId}`);
        const icon = document.querySelector(`.pipeline-container[data-id="${pipelineId}"] .expand-icon`);

        if (container) {
            const isCurrentlyHidden = container.classList.contains('hidden');
            container.classList.toggle('hidden');
            icon.classList.toggle('expanded');

            // Save the new state (opposite of current hidden state)
            this.setExpandedState(`pipeline-${pipelineId}`, isCurrentlyHidden);
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

        // Update all axes and pipelines in localStorage to expanded
        if (this.data && this.data.axes) {
            this.data.axes.forEach(axis => {
                this.setExpandedState(`axis-${axis.id}`, true);
                const items = axis.pipelines || axis.components || axis.phases || [];
                items.forEach(item => {
                    this.setExpandedState(`pipeline-${item.id}`, true);
                });
            });
        }
    }

    collapseAll() {
        document.querySelectorAll('.axis-content, .pipeline-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('.expand-icon').forEach(icon => {
            icon.classList.remove('expanded');
        });

        // Update all axes and pipelines in localStorage to collapsed
        if (this.data && this.data.axes) {
            this.data.axes.forEach(axis => {
                this.setExpandedState(`axis-${axis.id}`, false);
                const items = axis.pipelines || axis.components || axis.phases || [];
                items.forEach(item => {
                    this.setExpandedState(`pipeline-${item.id}`, false);
                });
            });
        }
    }

    expandActive() {
        // First collapse all
        this.collapseAll();

        // Then expand only items with progress > 0
        if (this.data && this.data.axes) {
            this.data.axes.forEach(axis => {
                const axisProgress = this.calculateProgress(axis);
                if (axisProgress > 0) {
                    // Expand the axis
                    const axisContent = document.getElementById(`axis-content-${axis.id}`);
                    const axisIcon = document.querySelector(`.axis-container[data-id="${axis.id}"] .expand-icon`);
                    if (axisContent && axisIcon) {
                        axisContent.classList.remove('hidden');
                        axisIcon.classList.add('expanded');
                        this.setExpandedState(`axis-${axis.id}`, true);
                    }

                    // Check pipelines within this axis
                    const items = axis.pipelines || axis.components || axis.phases || [];
                    items.forEach(item => {
                        const itemProgress = this.calculateProgress(item);
                        if (itemProgress > 0) {
                            const itemContent = document.getElementById(`pipeline-content-${item.id}`);
                            const itemIcon = document.querySelector(`.pipeline-container[data-id="${item.id}"] .expand-icon`);
                            if (itemContent && itemIcon) {
                                itemContent.classList.remove('hidden');
                                itemIcon.classList.add('expanded');
                                this.setExpandedState(`pipeline-${item.id}`, true);
                            }
                        }
                    });
                }
            });
        }

        this.showToast('Expanded all sections with progress', 'success');
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

    // Expanded state management with localStorage persistence
    loadExpandedState() {
        try {
            const saved = localStorage.getItem('roadmap-expanded-state');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load expanded state from localStorage:', error);
            return {};
        }
    }

    saveExpandedState() {
        try {
            localStorage.setItem('roadmap-expanded-state', JSON.stringify(this.expandedState));
        } catch (error) {
            console.warn('Failed to save expanded state to localStorage:', error);
        }
    }

    getExpandedState(key) {
        // Check if we have a saved state for this item
        if (this.expandedState.hasOwnProperty(key)) {
            return this.expandedState[key];
        }

        // Everything starts collapsed by default for cleaner initial view
        return false;
    }

    setExpandedState(key, expanded) {
        this.expandedState[key] = expanded;
        this.saveExpandedState();
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

        // Kanban drag-and-drop functionality
        if (this.currentView === 'kanban') {
            this.setupKanbanDragAndDrop();
        }
    }

    setupKanbanDragAndDrop() {
        // Handle drag start
        document.querySelectorAll('.kanban-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.target.classList.add('dragging');

                // Add visual feedback to drop zones
                document.querySelectorAll('.kanban-cards').forEach(zone => {
                    zone.classList.add('drop-zone-active');
                });
            });

            card.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');

                // Remove drop zone feedback
                document.querySelectorAll('.kanban-cards').forEach(zone => {
                    zone.classList.remove('drop-zone-active', 'drop-zone-hover');
                });
            });
        });

        // Handle drop zones
        document.querySelectorAll('.kanban-cards').forEach(dropZone => {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dropZone.classList.add('drop-zone-hover');
            });

            dropZone.addEventListener('dragleave', (e) => {
                // Only remove hover if we're actually leaving the drop zone
                if (!dropZone.contains(e.relatedTarget)) {
                    dropZone.classList.remove('drop-zone-hover');
                }
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData('text/plain');
                const targetColumn = e.currentTarget.dataset.column;

                dropZone.classList.remove('drop-zone-hover');

                if (itemId && targetColumn) {
                    this.moveCardToColumn(itemId, targetColumn);
                }
            });
        });
    }

    moveCardToColumn(itemId, targetColumn) {
        const item = this.findItemById(itemId);
        if (!item) return;

        // Map columns to status values
        const statusMap = {
            'Not Started': 'not_started',
            'In Progress': 'in_progress',
            'Review': 'review',
            'Completed': 'completed',
            'Blocked': 'blocked'
        };

        const newStatus = statusMap[targetColumn];
        if (newStatus !== undefined) {
            const oldStatus = item.status || 'not_started';
            const currentProgress = this.calculateProgress(item);

            // Update status
            item.status = newStatus;

            // Check if status and progress are now divergent
            const isDivergent = this.isStatusProgressDivergent(item);

            this.saveData();
            this.renderContent(); // Re-render Kanban view
            this.updateProgressOverview();

            let message = `"${item.title}" moved to ${targetColumn}`;
            if (isDivergent) {
                message += ` (${currentProgress}% progress - may need review)`;
            }

            this.showToast(message, isDivergent ? 'warning' : 'success');
        }
    }

    quickEditProgress(itemId, currentProgress) {
        this.editProgress(itemId, currentProgress, null);
    }

    // Enhanced Grid View Methods
    toggleGridCard(axisId) {
        const isCurrentlyExpanded = this.getExpandedState(`grid-${axisId}`);
        this.setExpandedState(`grid-${axisId}`, !isCurrentlyExpanded);
        this.renderContent(); // Re-render to update expansion state
    }

    toggleFocusMode() {
        this.gridFocusMode = !this.gridFocusMode;
        this.renderContent(); // Re-render to apply focus mode
        this.showToast(
            this.gridFocusMode ? 'Focus mode enabled - showing active items' : 'Focus mode disabled',
            'success'
        );
    }

    expandAllGridCards() {
        if (this.data && this.data.axes) {
            this.data.axes.forEach(axis => {
                this.setExpandedState(`grid-${axis.id}`, true);
            });
            this.renderContent(); // Re-render to show all expanded
            this.showToast('All cards expanded', 'success');
        }
    }

    updateAxisProgress(axisId, newProgress) {
        const item = this.findItemById(axisId);
        if (item) {
            item.progress = parseInt(newProgress);
            this.saveData();
            this.updateProgressOverview();

            // Update the visual feedback immediately
            const card = document.querySelector(`.grid-card[data-id="${axisId}"]`);
            if (card) {
                // Update donut chart
                const progressRing = card.querySelector('.progress-ring');
                if (progressRing) {
                    const offset = 219.9 - (newProgress / 100) * 219.9;
                    progressRing.style.strokeDashoffset = offset;
                }

                // Update percentage display
                const percentage = card.querySelector('.progress-percentage');
                if (percentage) {
                    percentage.textContent = `${newProgress}%`;
                }

                // Update priority and active badges
                const priorityScore = parseInt(newProgress) + (item.pipelines?.length || 0) * 10;
                const priorityLevel = priorityScore > 50 ? 'high' : priorityScore > 20 ? 'medium' : 'low';

                card.className = card.className.replace(/priority-\w+/, `priority-${priorityLevel}`);

                const badges = card.querySelector('.grid-card-badges');
                if (badges && newProgress > 0 && !badges.querySelector('.active')) {
                    badges.insertAdjacentHTML('beforeend', '<span class="grid-card-badge active">Active</span>');
                } else if (badges && newProgress === 0) {
                    const activeBadge = badges.querySelector('.active');
                    if (activeBadge) activeBadge.remove();
                }
            }

            this.showToast(`Progress updated to ${newProgress}%`, 'success');
        }
    }

    // Enhanced Timeline View Methods
    toggleTimelineAxis(axisId) {
        const isCurrentlyExpanded = this.getExpandedState(`timeline-${axisId}`);
        this.setExpandedState(`timeline-${axisId}`, !isCurrentlyExpanded);
        this.renderContent(); // Re-render to update expansion state
    }

    toggleTimelineMilestones() {
        this.timelineShowMilestones = !this.timelineShowMilestones;
        this.renderContent();
        this.showToast(
            this.timelineShowMilestones ? 'Milestones shown' : 'Milestones hidden',
            'success'
        );
    }

    toggleTimelineDependencies() {
        this.timelineShowDependencies = !this.timelineShowDependencies;
        this.renderContent();
        this.showToast(
            this.timelineShowDependencies ? 'Dependencies shown' : 'Dependencies hidden',
            'success'
        );
    }

    filterTimeline(filter) {
        this.timelineFilter = filter;
        this.renderContent();
        this.showToast(`Showing ${filter} items`, 'success');
    }

    editTimelineItem(itemId) {
        // Open a simple modal for editing timeline properties
        const item = this.findItemById(itemId);
        if (!item) return;

        const startDate = item.startDate || new Date().toISOString().split('T')[0];
        const estimatedWeeks = item.estimatedWeeks || this.estimateTimelineForItem(item);

        const newStartDate = prompt(`Start date for "${item.title}":`, startDate);
        if (newStartDate && newStartDate !== startDate) {
            item.startDate = newStartDate;

            const newWeeks = prompt(`Estimated duration (weeks):`, estimatedWeeks);
            if (newWeeks && !isNaN(newWeeks)) {
                item.estimatedWeeks = parseInt(newWeeks);
            }

            this.saveData();
            this.renderContent();
            this.showToast('Timeline updated', 'success');
        }
    }

    startTimelineDrag(itemId, handle, event) {
        // Placeholder for timeline drag functionality
        event.preventDefault();
        event.stopPropagation();

        // For now, just show a message
        this.showToast(`Timeline dragging coming soon! (${handle} handle)`, 'info');
    }
}

// Initialize the roadmap manager
const roadmap = new RoadmapManager();
