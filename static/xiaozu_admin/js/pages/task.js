const TaskPage = {
    async render(params) {
        const app = document.getElementById('app');
        const currentTeam = AuthService.getCurrentTeam();

        if (!currentTeam) {
            app.innerHTML = Layout.render(`
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>请先创建或加入小组</p>
                </div>
            `, { title: '任务管理' });
            return;
        }

        app.innerHTML = Layout.render(`
            <div class="card">
                <div class="card-header">
                    <span class="card-title">任务列表</span>
                    <button class="btn btn-primary" onclick="TaskPage.showCreateModal()">+ 创建任务</button>
                </div>
                <div class="filter-bar">
                    <input type="text" class="search-input" id="taskSearch" placeholder="搜索任务标题..." onkeyup="TaskPage.searchTasks()">
                    <select id="statusFilter" onchange="TaskPage.loadTasks()">
                        <option value="">全部状态</option>
                        <option value="todo">待办</option>
                        <option value="in_progress">进行中</option>
                        <option value="done">已完成</option>
                    </select>
                    <select id="priorityFilter" onchange="TaskPage.loadTasks()">
                        <option value="">全部优先级</option>
                        <option value="high">高</option>
                        <option value="medium">中</option>
                        <option value="low">低</option>
                    </select>
                    <select id="assigneeFilter" onchange="TaskPage.loadTasks()">
                        <option value="">全部负责人</option>
                    </select>
                </div>
                <div id="taskList">
                    <div class="empty-state"><p>加载中...</p></div>
                </div>
            </div>
        `, { title: '任务管理' });

        await this.loadMembers();
        await this.loadTasks();
    },

    async loadMembers() {
        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.get(`/xz/team/members/get?team_id=${currentTeam.team_id}`);
        if (result.code === 0 && result.data) {
            const select = document.getElementById('assigneeFilter');
            result.data.forEach(m => {
                const option = document.createElement('option');
                option.value = m.user_id;
                option.textContent = m.username;
                select.appendChild(option);
            });
        }
    },

    async loadTasks() {
        const currentTeam = AuthService.getCurrentTeam();
        const status = document.getElementById('statusFilter').value;
        const priority = document.getElementById('priorityFilter').value;
        const assignee_id = document.getElementById('assigneeFilter').value;
        const keyword = document.getElementById('taskSearch').value;

        let url = `/xz/task/list/get?team_id=${currentTeam.team_id}&page=1&page_size=50`;
        if (status) url += `&status=${status}`;
        if (priority) url += `&priority=${priority}`;
        if (assignee_id) url += `&assignee_id=${assignee_id}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

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

        document.getElementById('taskList').innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>任务</th>
                        <th>优先级</th>
                        <th>状态</th>
                        <th>负责人</th>
                        <th>预计工时</th>
                        <th>截止日期</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.map(t => `
                        <tr>
                            <td>
                                <div style="font-weight: 500;">${t.title}</div>
                                ${t.description ? `<div style="font-size: 12px; color: var(--text-secondary);">${t.description.substring(0, 50)}${t.description.length > 50 ? '...' : ''}</div>` : ''}
                            </td>
                            <td><span class="badge priority-${t.priority}">${this.getPriorityText(t.priority)}</span></td>
                            <td><span class="badge status-${t.status}">${this.getStatusText(t.status)}</span></td>
                            <td>${t.assignee_id ? `用户#${t.assignee_id}` : '-'}</td>
                            <td>${t.estimated_hours || 0}h</td>
                            <td>${t.due_date || '-'}</td>
                            <td>
                                ${t.status !== 'done' ? `
                                    <button class="btn btn-sm btn-success" onclick="TaskPage.completeTask(${t.id})">完成</button>
                                ` : ''}
                                <button class="btn btn-sm btn-secondary" onclick="TaskPage.showDetail(${t.id})">详情</button>
                                <button class="btn btn-sm btn-danger" onclick="TaskPage.deleteTask(${t.id})">删除</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    searchTasks() {
        this.loadTasks();
    },

    getPriorityText(priority) {
        const map = { high: '高', medium: '中', low: '低' };
        return map[priority] || priority;
    },

    getStatusText(status) {
        const map = { todo: '待办', in_progress: '进行中', done: '已完成' };
        return map[status] || status;
    },

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
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label>优先级</label>
                                    <select id="taskPriority">
                                        <option value="high">高</option>
                                        <option value="medium" selected>中</option>
                                        <option value="low">低</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>预计工时(h)</label>
                                    <input type="number" id="taskHours" value="1" min="0" step="0.5">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label>开始日期</label>
                                    <input type="date" id="taskStartDate">
                                </div>
                                <div class="form-group">
                                    <label>截止日期</label>
                                    <input type="date" id="taskDueDate">
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">创建</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDesc').value;
            const priority = document.getElementById('taskPriority').value;
            const estimated_hours = parseFloat(document.getElementById('taskHours').value) || 0;
            const start_date = document.getElementById('taskStartDate').value;
            const due_date = document.getElementById('taskDueDate').value;

            const result = await ApiService.post('/xz/task/create', {
                team_id: currentTeam.team_id,
                title, description, priority,
                estimated_hours, start_date, due_date
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
        const result = await ApiService.post('/xz/task/status/update', {
            task_id: taskId,
            status: 'done'
        });

        if (result.code === 0) {
            Toast.success('任务已完成');
            this.loadTasks();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async deleteTask(taskId) {
        if (!confirm('确定要删除这个任务吗？')) return;

        const result = await ApiService.post(`/xz/task/delete?task_id=${taskId}`);
        if (result.code === 0) {
            Toast.success('删除成功');
            this.loadTasks();
        } else {
            Toast.error(result.msg || '删除失败');
        }
    },

    async showDetail(taskId) {
        const result = await ApiService.get(`/xz/task/detail/get?task_id=${taskId}`);
        if (result.code !== 0) {
            Toast.error(result.msg || '加载失败');
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
                <div class="modal" style="max-width: 640px;">
                    <div class="modal-header">
                        <span class="modal-title">任务详情</span>
                        <button class="modal-close" onclick="document.getElementById('taskDetailModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h3 style="margin-bottom: 16px;">${task.title}</h3>
                        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                            <span class="badge priority-${task.priority}">优先级: ${this.getPriorityText(task.priority)}</span>
                            <span class="badge status-${task.status}">${this.getStatusText(task.status)}</span>
                        </div>
                        ${task.description ? `<p style="margin-bottom: 16px;">${task.description}</p>` : ''}
                        <div style="color: var(--text-secondary); margin-bottom: 16px;">
                            <div>预计工时: ${task.estimated_hours || 0}h | 实际工时: ${task.actual_hours || 0}h</div>
                            <div>开始: ${task.start_date || '-'} | 截止: ${task.due_date || '-'}</div>
                        </div>
                        <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
                            <h4 style="margin-bottom: 12px;">评论 (${comments.length})</h4>
                            ${comments.map(c => `
                                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                                    <strong>${c.username}</strong>
                                    <span style="color: var(--text-light); font-size: 12px;">${c.created_at}</span>
                                    <p style="margin-top: 4px;">${c.content}</p>
                                </div>
                            `).join('') || '<p style="color: var(--text-secondary);">暂无评论</p>'}
                        </div>
                        <div style="margin-top: 16px;">
                            <input type="text" id="commentInput" placeholder="添加评论..." class="form-control">
                            <button class="btn btn-primary btn-sm mt-1" onclick="TaskPage.addComment(${taskId})">发送</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async addComment(taskId) {
        const content = document.getElementById('commentInput').value;
        if (!content) return;

        const result = await ApiService.post('/xz/task/comment/add', { task_id: taskId, content });
        if (result.code === 0) {
            Toast.success('评论成功');
            this.showDetail(taskId);
        } else {
            Toast.error(result.msg || '评论失败');
        }
    }
};

window.TaskPage = TaskPage;
