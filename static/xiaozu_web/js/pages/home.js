const HomePage = {
    async render() {
        const app = document.getElementById('app');
        const currentTeam = AuthService.getCurrentTeam();

        if (!currentTeam) {
            app.innerHTML = this.renderNoTeam();
            return;
        }

        app.innerHTML = `
            <div class="app-container">
                <div class="page-content">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <h2 style="font-size: 18px; font-weight: 500;">${currentTeam.team_name || '我的小组'}</h2>
                        <button class="btn btn-sm btn-secondary" onclick="HomePage.showTeamSwitcher()">切换小组</button>
                    </div>
                    <div id="dashboardContent">
                        <div class="empty-state"><p>加载中...</p></div>
                    </div>
                </div>
                ${this.renderBottomNav('home')}
            </div>
            <button class="btn-fab" onclick="TaskPage.showCreateModal()">+</button>
        `;

        await this.loadDashboard();
    },

    async loadDashboard() {
        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.get(`/xz/stats/dashboard/get?team_id=${currentTeam.team_id}`);

        if (result.code !== 0) {
            document.getElementById('dashboardContent').innerHTML = `
                <div class="empty-state"><p>${result.msg || '加载失败'}</p></div>
            `;
            return;
        }

        const data = result.data;
        const stats = data.statistics || {};

        document.getElementById('dashboardContent').innerHTML = `
            <div class="stat-grid">
                <div class="stat-item primary">
                    <div class="stat-value">${stats.total || 0}</div>
                    <div class="stat-label">总任务</div>
                </div>
                <div class="stat-item warning">
                    <div class="stat-value">${stats.in_progress || 0}</div>
                    <div class="stat-label">进行中</div>
                </div>
                <div class="stat-item success">
                    <div class="stat-value">${stats.done || 0}</div>
                    <div class="stat-label">已完成</div>
                </div>
                <div class="stat-item danger">
                    <div class="stat-value">${stats.due_soon || 0}</div>
                    <div class="stat-label">即将截止</div>
                </div>
            </div>

            <div class="progress-section">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 500;">整体进度</span>
                    <span style="color: var(--primary-color); font-weight: 500;">${data.completion_rate || 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${data.completion_rate || 0}%"></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">我的待办</span>
                </div>
                ${this.renderMyTasks(data.my_tasks)}
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">近期截止</span>
                </div>
                ${this.renderUpcomingDue(data.upcoming_due)}
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
            return '<div class="empty-state" style="padding: 20px;"><p>暂无待办任务</p></div>';
        }

        return tasks.slice(0, 5).map(t => `
            <div class="task-item priority-${t.priority}">
                <div class="task-title">${t.title}</div>
                <div class="task-meta">
                    <span class="badge priority-${t.priority}">${this.getPriorityText(t.priority)}</span>
                    <span>${t.due_date || '无截止'}</span>
                </div>
            </div>
        `).join('');
    },

    renderUpcomingDue(tasks) {
        if (!tasks || tasks.length === 0) {
            return '<div class="empty-state" style="padding: 20px;"><p>暂无即将截止的任务</p></div>';
        }

        return tasks.slice(0, 5).map(t => `
            <div style="padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                <div style="font-size: 14px; margin-bottom: 4px;">${t.title}</div>
                <div style="font-size: 12px; color: var(--danger-color);">截止: ${t.due_date}</div>
            </div>
        `).join('');
    },

    renderActivity(logs) {
        if (!logs || logs.length === 0) {
            return '<div class="empty-state" style="padding: 20px;"><p>暂无动态</p></div>';
        }

        return logs.slice(0, 5).map(log => `
            <div class="activity-item">
                <div class="avatar avatar-sm">${(log.username || 'U').charAt(0).toUpperCase()}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>${log.username}</strong> ${this.getActionText(log.action)}
                    </div>
                    <div class="activity-time">${this.formatTime(log.created_at)}</div>
                </div>
            </div>
        `).join('');
    },

    getActionText(action) {
        const map = {
            create: '创建了任务', update: '更新了任务', status_change: '更新了状态',
            assign: '分配了任务', delete: '删除了任务', comment: '评论了任务'
        };
        return map[action] || action;
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
            <div class="app-container">
                <div class="page-content" style="display: flex; flex-direction: column; justify-content: center; min-height: 70vh;">
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <h3>还没有加入小组</h3>
                        <p>创建或加入一个小组开始协作</p>
                        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 12px;">
                            <button class="btn btn-primary btn-block" onclick="HomePage.showCreateTeam()">创建小组</button>
                            <button class="btn btn-secondary btn-block" onclick="HomePage.showJoinTeam()">加入小组</button>
                        </div>
                    </div>
                </div>
                ${this.renderBottomNav('home')}
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
                Router.navigate('home');
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
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '加入失败');
            }
        });
    },

    showTeamSwitcher() {
        const teams = AuthService.getUserTeams() || [];
        if (teams.length === 0) return;

        const modal = document.createElement('div');
        modal.id = 'teamSwitcherModal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">切换小组</span>
                        <button class="modal-close" onclick="document.getElementById('teamSwitcherModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${teams.map(t => `
                            <div class="team-card" onclick="HomePage.switchTeam(${t.team_id})">
                                <div class="team-info">
                                    <div class="team-name">${t.team_name}</div>
                                    <div class="team-desc">${t.team_description || ''}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    switchTeam(teamId) {
        const teams = AuthService.getUserTeams() || [];
        const team = teams.find(t => t.team_id == teamId);
        if (team) {
            AuthService.setCurrentTeam(team);
            document.getElementById('teamSwitcherModal')?.remove();
            Router.navigate('home');
        }
    },

    renderBottomNav(active) {
        return `
            <nav class="bottom-nav">
                <button class="nav-item ${active === 'home' ? 'active' : ''}" onclick="Router.navigate('home')">
                    <span class="nav-icon">🏠</span>
                    <span>首页</span>
                </button>
                <button class="nav-item ${active === 'tasks' ? 'active' : ''}" onclick="Router.navigate('tasks')">
                    <span class="nav-icon">📋</span>
                    <span>任务</span>
                </button>
                <button class="nav-item ${active === 'team' ? 'active' : ''}" onclick="Router.navigate('team')">
                    <span class="nav-icon">👥</span>
                    <span>小组</span>
                </button>
                <button class="nav-item ${active === 'profile' ? 'active' : ''}" onclick="Router.navigate('profile')">
                    <span class="nav-icon">👤</span>
                    <span>我的</span>
                </button>
            </nav>
        `;
    }
};

window.HomePage = HomePage;
