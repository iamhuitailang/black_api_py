const DashboardPage = {
    async render() {
        const app = document.getElementById('app');
        const currentTeam = AuthService.getCurrentTeam();

        if (!currentTeam) {
            app.innerHTML = Layout.render(this.renderNoTeam(), { title: '仪表盘' });
            return;
        }

        app.innerHTML = Layout.render(`
            <div id="dashboardContent">
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <p>加载中...</p>
                </div>
            </div>
        `, { title: '仪表盘' });

        await this.loadDashboard();
    },

    async loadDashboard() {
        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.get(`/xz/stats/dashboard/get?team_id=${currentTeam.team_id}`);

        if (result.code !== 0) {
            document.getElementById('dashboardContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>${result.msg || '加载失败'}</p>
                </div>
            `;
            return;
        }

        const data = result.data;
        const stats = data.statistics || {};

        document.getElementById('dashboardContent').innerHTML = `
            <div class="stat-cards">
                <div class="stat-card primary">
                    <div class="stat-card-icon">📋</div>
                    <div class="stat-card-label">总任务数</div>
                    <div class="stat-card-value">${stats.total || 0}</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-card-icon">🔄</div>
                    <div class="stat-card-label">进行中</div>
                    <div class="stat-card-value">${stats.in_progress || 0}</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-card-icon">✅</div>
                    <div class="stat-card-label">已完成</div>
                    <div class="stat-card-value">${stats.done || 0}</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-card-icon">⏰</div>
                    <div class="stat-card-label">即将截止</div>
                    <div class="stat-card-value">${stats.due_soon || 0}</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">整体完成进度</span>
                    <span>${data.completion_rate || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${data.completion_rate || 0}%"></div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">我的待办任务</span>
                    </div>
                    ${this.renderMyTasks(data.my_tasks)}
                </div>
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">近期截止</span>
                    </div>
                    ${this.renderUpcomingDue(data.upcoming_due)}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">小组动态</span>
                </div>
                ${this.renderActivity(data.recent_logs)}
            </div>
        `;
    },

    renderMyTasks(tasks) {
        if (!tasks || tasks.length === 0) {
            return '<div class="empty-state"><p>暂无待办任务</p></div>';
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>任务</th>
                        <th>优先级</th>
                        <th>截止日期</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.map(t => `
                        <tr>
                            <td>${t.title}</td>
                            <td><span class="badge priority-${t.priority}">${this.getPriorityText(t.priority)}</span></td>
                            <td>${t.due_date || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    renderUpcomingDue(tasks) {
        if (!tasks || tasks.length === 0) {
            return '<div class="empty-state"><p>暂无即将截止的任务</p></div>';
        }

        return tasks.map(t => `
            <div style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <div style="font-weight: 500; margin-bottom: 4px;">${t.title}</div>
                <div style="font-size: 13px; color: var(--text-secondary);">
                    截止: ${t.due_date}
                </div>
            </div>
        `).join('');
    },

    renderActivity(logs) {
        if (!logs || logs.length === 0) {
            return '<div class="empty-state"><p>暂无动态</p></div>';
        }

        return `
            <ul class="activity-list">
                ${logs.map(log => `
                    <li class="activity-item">
                        <div class="avatar avatar-sm">${(log.username || 'U').charAt(0).toUpperCase()}</div>
                        <div class="activity-content">
                            <div class="activity-text">
                                <strong>${log.username}</strong> ${this.getActionText(log.action, log.old_value, log.new_value)}
                                ${log.task_title ? `<em>"${log.task_title}"</em>` : ''}
                            </div>
                            <div class="activity-time">${this.formatTime(log.created_at)}</div>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    },

    getActionText(action, oldValue, newValue) {
        const actionMap = {
            'create': '创建了任务',
            'update': '更新了任务',
            'status_change': `将状态从 "${oldValue}" 改为 "${newValue}"`,
            'assign': `将任务分配给了`,
            'delete': '删除了任务',
            'comment': '评论了任务'
        };
        return actionMap[action] || action;
    },

    getPriorityText(priority) {
        const map = { high: '高', medium: '中', low: '低' };
        return map[priority] || priority;
    },

    formatTime(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        return date.toLocaleDateString();
    },

    renderNoTeam() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3>还没有加入小组</h3>
                <p>创建一个小组开始协作，或者使用邀请码加入已有小组</p>
                <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-primary" onclick="DashboardPage.showCreateTeam()">创建小组</button>
                    <button class="btn btn-secondary" onclick="DashboardPage.showJoinTeam()">加入小组</button>
                </div>
            </div>
        `;
    },

    showCreateTeam() {
        const modal = document.createElement('div');
        modal.id = 'createTeamModal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">创建小组</span>
                        <button class="modal-close" onclick="document.getElementById('createTeamModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="createTeamForm">
                            <div class="form-group">
                                <label>小组名称</label>
                                <input type="text" id="teamName" placeholder="请输入小组名称" required>
                            </div>
                            <div class="form-group">
                                <label>小组描述</label>
                                <textarea id="teamDesc" placeholder="请输入小组描述（可选）"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">创建</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('createTeamForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('teamName').value;
            const description = document.getElementById('teamDesc').value;

            const result = await ApiService.post('/xz/team/create', { name, description });
            if (result.code === 0) {
                Toast.success('创建成功');
                const teamsResult = await AuthService.loadUserTeams();
                if (teamsResult.code === 0 && teamsResult.data && teamsResult.data.length > 0) {
                    const newTeam = teamsResult.data.find(t => t.team_id === result.data.id) || teamsResult.data[0];
                    AuthService.setCurrentTeam(newTeam);
                }
                document.getElementById('createTeamModal').remove();
                Router.navigate('dashboard');
            } else {
                Toast.error(result.msg || '创建失败');
            }
        });
    },

    showJoinTeam() {
        const modal = document.createElement('div');
        modal.id = 'joinTeamModal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">加入小组</span>
                        <button class="modal-close" onclick="document.getElementById('joinTeamModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="joinTeamForm">
                            <div class="form-group">
                                <label>邀请码</label>
                                <input type="text" id="inviteCode" placeholder="请输入邀请码" required>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">加入</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('joinTeamForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const invite_code = document.getElementById('inviteCode').value;

            const result = await ApiService.post('/xz/team/join', { invite_code });
            if (result.code === 0) {
                Toast.success('加入成功');
                const teamsResult = await AuthService.loadUserTeams();
                if (teamsResult.code === 0 && teamsResult.data && teamsResult.data.length > 0) {
                    const newTeam = teamsResult.data.find(t => t.team_id === result.data.id) || teamsResult.data[0];
                    AuthService.setCurrentTeam(newTeam);
                }
                document.getElementById('joinTeamModal').remove();
                Router.navigate('dashboard');
            } else {
                Toast.error(result.msg || '加入失败');
            }
        });
    }
};

window.DashboardPage = DashboardPage;
