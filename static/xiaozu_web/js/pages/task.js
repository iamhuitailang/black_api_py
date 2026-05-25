const TaskPage = {
    async render(params) {
        const app = document.getElementById('app');
        const currentTeam = AuthService.getCurrentTeam();

        if (!currentTeam) {
            app.innerHTML = HomePage.renderNoTeam();
            return;
        }

        app.innerHTML = `
            <div class="app-container">
                <div class="page-content">
                    <h2 style="font-size: 18px; font-weight: 500; margin-bottom: 16px;">任务列表</h2>
                    <div class="filter-bar" style="display: flex; gap: 8px; margin-bottom: 16px;">
                        <select id="statusFilter" onchange="TaskPage.loadTasks()" style="flex: 1; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--card-bg);">
                            <option value="">全部状态</option>
                            <option value="todo">待办</option>
                            <option value="in_progress">进行中</option>
                            <option value="done">已完成</option>
                        </select>
                        <select id="priorityFilter" onchange="TaskPage.loadTasks()" style="flex: 1; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--card-bg);">
                            <option value="">全部优先级</option>
                            <option value="high">高</option>
                            <option value="medium">中</option>
                            <option value="low">低</option>
                        </select>
                    </div>
                    <div id="taskList">
                        <div class="empty-state"><p>加载中...</p></div>
                    </div>
                </div>
                ${HomePage.renderBottomNav('tasks')}
            </div>
            <button class="btn-fab" onclick="TaskPage.showCreateModal()">+</button>
        `;

        await this.loadTasks();
    },

    async loadTasks() {
        const currentTeam = AuthService.getCurrentTeam();
        const status = document.getElementById('statusFilter').value;
        const priority = document.getElementById('priorityFilter').value;

        let url = `/xz/task/list/get?team_id=${currentTeam.team_id}&page=1&page_size=50`;
        if (status) url += `&status=${status}`;
        if (priority) url += `&priority=${priority}`;

        const result = await ApiService.get(url);

        if (result.code !== 0) {
            document.getElementById('taskList').innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
            return;
        }

        const tasks = result.data.items || [];
        if (tasks.length === 0) {
            document.getElementById('taskList').innerHTML = '<div class="empty-state"><p>暂无任务</p></div>';
            return;
        }

        document.getElementById('taskList').innerHTML = tasks.map(t => `
            <div class="task-item priority-${t.priority}" onclick="TaskPage.showDetail(${t.id})">
                <div class="task-title">${t.title}</div>
                ${t.description ? `<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">${t.description.substring(0, 50)}${t.description.length > 50 ? '...' : ''}</div>` : ''}
                <div class="task-meta">
                    <span class="badge priority-${t.priority}">${this.getPriorityText(t.priority)}</span>
                    <span class="badge status-${t.status}">${this.getStatusText(t.status)}</span>
                    <span>${t.due_date || '-'}</span>
                </div>
                <div class="task-actions">
                    ${t.status !== 'done' ? `
                        <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); TaskPage.completeTask(${t.id})">完成</button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); TaskPage.deleteTask(${t.id})">删除</button>
                </div>
            </div>
        `).join('');
    },

    getPriorityText(p) { const m = { high: '高', medium: '中', low: '低' }; return m[p] || p; },
    getStatusText(s) { const m = { todo: '待办', in_progress: '进行中', done: '已完成' }; return m[s] || s; },

    showCreateModal() {
        const currentTeam = AuthService.getCurrentTeam();
        const modal = document.createElement('div');
        modal.id = 'createTaskModal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">创建任务</span>
                        <button class="modal-close" onclick="document.getElementById('createTaskModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="createTaskForm">
                            <div class="form-group">
                                <label>任务标题 *</label>
                                <input type="text" id="taskTitle" required>
                            </div>
                            <div class="form-group">
                                <label>任务描述</label>
                                <textarea id="taskDesc"></textarea>
                            </div>
                            <div class="form-group">
                                <label>优先级</label>
                                <select id="taskPriority">
                                    <option value="high">高</option>
                                    <option value="medium" selected>中</option>
                                    <option value="low">低</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>截止日期</label>
                                <input type="date" id="taskDueDate" min="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">创建</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const result = await ApiService.post('/xz/task/create', {
                team_id: currentTeam.team_id,
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDesc').value,
                priority: document.getElementById('taskPriority').value,
                due_date: document.getElementById('taskDueDate').value
            });
            if (result.code === 0) {
                Toast.success('创建成功');
                document.getElementById('createTaskModal').remove();
                this.loadTasks();
            } else {
                Toast.error(result.msg || '创建失败');
            }
        });
    },

    async completeTask(taskId) {
        const result = await ApiService.post('/xz/task/status/update', { task_id: taskId, status: 'done' });
        if (result.code === 0) {
            Toast.success('已完成');
            this.loadTasks();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async deleteTask(taskId) {
        if (!confirm('确定删除？')) return;
        const result = await ApiService.post(`/xz/task/delete?task_id=${taskId}`);
        if (result.code === 0) {
            Toast.success('已删除');
            this.loadTasks();
        } else {
            Toast.error(result.msg || '删除失败');
        }
    },

    async showDetail(taskId) {
        const existingModal = document.getElementById('taskDetailModal');
        if (existingModal) {
            existingModal.remove();
        }

        const result = await ApiService.get(`/xz/task/detail/get?task_id=${taskId}`);
        if (result.code !== 0) {
            Toast.error('加载失败');
            return;
        }

        const task = result.data;
        const commentsResult = await ApiService.get(`/xz/task/comment/list/get?task_id=${taskId}`);
        const comments = commentsResult.code === 0 ? commentsResult.data || [] : [];

        const modal = document.createElement('div');
        modal.id = 'taskDetailModal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">任务详情</span>
                        <button class="modal-close" onclick="document.getElementById('taskDetailModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h3 style="margin-bottom: 12px;">${task.title}</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <span class="badge priority-${task.priority}">${this.getPriorityText(task.priority)}</span>
                            <span class="badge status-${task.status}">${this.getStatusText(task.status)}</span>
                        </div>
                        ${task.description ? `<p style="margin-bottom: 12px;">${task.description}</p>` : ''}
                        <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
                            <div>预计: ${task.estimated_hours || 0}h | 实际: ${task.actual_hours || 0}h</div>
                            <div>截止: ${task.due_date || '-'}</div>
                        </div>
                        <div style="border-top: 1px solid var(--border-color); padding-top: 12px;">
                            <h4 style="font-size: 14px; margin-bottom: 8px;">评论</h4>
                            <div id="commentsList">
                                ${comments.map(c => `
                                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                                        <strong>${c.username}</strong>
                                        <p style="margin-top: 2px; font-size: 13px;">${c.content}</p>
                                    </div>
                                `).join('') || '<p style="color: var(--text-secondary);">暂无评论</p>'}
                            </div>
                            <div style="margin-top: 12px; display: flex; gap: 8px;">
                                <input type="text" id="commentInput" placeholder="添加评论..." style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                                <button class="btn btn-primary btn-sm" id="commentSubmitBtn" onclick="TaskPage.addComment(${taskId})">发送</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async addComment(taskId) {
        const input = document.getElementById('commentInput');
        const btn = document.getElementById('commentSubmitBtn');
        const content = input.value.trim();
        if (!content) {
            Toast.error('请输入评论内容');
            return;
        }
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = '发送中...';
        
        const result = await ApiService.post('/xz/task/comment/add', { task_id: taskId, content });
        if (result.code === 0) {
            Toast.success('评论成功');
            input.value = '';
            this.refreshComments(taskId);
        } else {
            Toast.error(result.msg || '评论失败');
        }
        btn.disabled = false;
        btn.textContent = '发送';
    },

    async refreshComments(taskId) {
        const commentsResult = await ApiService.get(`/xz/task/comment/list/get?task_id=${taskId}`);
        if (commentsResult.code !== 0) return;
        const comments = commentsResult.data || [];
        const listEl = document.getElementById('commentsList');
        if (!listEl) return;
        listEl.innerHTML = comments.map(c => `
            <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                <strong>${c.username}</strong>
                <p style="margin-top: 2px; font-size: 13px;">${c.content}</p>
            </div>
        `).join('') || '<p style="color: var(--text-secondary);">暂无评论</p>';
    }
};

window.TaskPage = TaskPage;
