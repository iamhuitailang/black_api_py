const KanbanPage = {
    async render() {
        const app = document.getElementById('app');
        const currentTeam = AuthService.getCurrentTeam();

        if (!currentTeam) {
            app.innerHTML = Layout.render(`
                <div class="empty-state">
                    <div class="empty-state-icon">🗂️</div>
                    <p>请先创建或加入小组</p>
                </div>
            `, { title: '看板视图' });
            return;
        }

        app.innerHTML = Layout.render(`
            <div class="card">
                <div class="card-header">
                    <span class="card-title">任务看板</span>
                    <button class="btn btn-primary" onclick="TaskPage.showCreateModal()">+ 创建任务</button>
                </div>
                <div id="kanbanBoard">
                    <div class="empty-state"><p>加载中...</p></div>
                </div>
            </div>
        `, { title: '看板视图' });

        await this.loadKanban();
    },

    async loadKanban() {
        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.get(`/xz/task/kanban/get?team_id=${currentTeam.team_id}`);

        if (result.code !== 0) {
            document.getElementById('kanbanBoard').innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
            return;
        }

        const data = result.data;
        const columns = [
            { key: 'todo', title: '📋 待办', color: '#5f6368' },
            { key: 'in_progress', title: '🔄 进行中', color: '#1a73e8' },
            { key: 'done', title: '✅ 已完成', color: '#34a853' }
        ];

        document.getElementById('kanbanBoard').innerHTML = `
            <div class="kanban-board">
                ${columns.map(col => `
                    <div class="kanban-column">
                        <div class="kanban-column-header">
                            <span>${col.title}</span>
                            <span class="kanban-column-count">${(data[col.key] || []).length}</span>
                        </div>
                        ${this.renderKanbanCards(data[col.key] || [], col.key)}
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderKanbanCards(tasks, status) {
        if (tasks.length === 0) {
            return '<div style="text-align: center; color: var(--text-light); padding: 40px 0;">暂无任务</div>';
        }

        return tasks.map(t => `
            <div class="kanban-card priority-${t.priority}" onclick="KanbanPage.showTaskDetail(${t.id})">
                <div class="kanban-card-title">${t.title}</div>
                <div class="kanban-card-meta">
                    <span>${t.due_date || '无截止'}</span>
                    ${status !== 'done' ? `<button class="btn btn-sm" style="padding: 2px 8px;" onclick="event.stopPropagation(); KanbanPage.moveTask(${t.id}, '${this.getNextStatus(status)}')">→</button>` : ''}
                </div>
            </div>
        `).join('');
    },

    getNextStatus(currentStatus) {
        const map = { todo: 'in_progress', in_progress: 'done' };
        return map[currentStatus] || currentStatus;
    },

    async moveTask(taskId, newStatus) {
        const result = await ApiService.post('/xz/task/status/update', {
            task_id: taskId,
            status: newStatus
        });

        if (result.code === 0) {
            Toast.success('状态已更新');
            this.loadKanban();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    showTaskDetail(taskId) {
        TaskPage.showDetail(taskId);
    }
};

window.KanbanPage = KanbanPage;
