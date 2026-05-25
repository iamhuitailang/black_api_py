const Layout = {
    render(content, { title = '', showTeamSelector = true } = {}) {
        const user = AuthService.getCurrentUser();
        const currentTeam = AuthService.getCurrentTeam();

        return `
            <div class="app-layout">
                <aside class="app-sidebar">
                    <div class="sidebar-header">
                        <h2>小组任务管理</h2>
                    </div>
                    <nav class="sidebar-menu">
                        <button class="menu-item ${Router.currentRoute === 'dashboard' ? 'active' : ''}" onclick="Router.navigate('dashboard')">
                            <span class="menu-icon">📊</span>
                            <span>仪表盘</span>
                        </button>
                        <button class="menu-item ${Router.currentRoute === 'task' ? 'active' : ''}" onclick="Router.navigate('task')">
                            <span class="menu-icon">📋</span>
                            <span>任务管理</span>
                        </button>
                        <button class="menu-item ${Router.currentRoute === 'kanban' ? 'active' : ''}" onclick="Router.navigate('kanban')">
                            <span class="menu-icon">🗂️</span>
                            <span>看板视图</span>
                        </button>
                        <button class="menu-item ${Router.currentRoute === 'member' ? 'active' : ''}" onclick="Router.navigate('member')">
                            <span class="menu-icon">👥</span>
                            <span>成员管理</span>
                        </button>
                        <button class="menu-item ${Router.currentRoute === 'statistics' ? 'active' : ''}" onclick="Router.navigate('statistics')">
                            <span class="menu-icon">📈</span>
                            <span>统计报表</span>
                        </button>
                    </nav>
                </aside>
                <div class="app-main">
                    <header class="app-header">
                        <div class="header-title">${title}</div>
                        <div class="header-right">
                            ${showTeamSelector ? this.renderTeamSelector() : ''}
                            <div class="header-user">
                                <div class="avatar">${this.getAvatarText(user)}</div>
                                <span>${user?.username || '用户'}</span>
                            </div>
                            <button class="btn btn-sm btn-secondary" onclick="AuthService.logout()">退出</button>
                        </div>
                    </header>
                    <main class="app-content">
                        ${content}
                    </main>
                </div>
            </div>
        `;
    },

    renderTeamSelector() {
        const teams = AuthService.getUserTeams() || [];
        const currentTeam = AuthService.getCurrentTeam();

        if (teams.length === 0) {
            return `
                <button class="btn btn-sm btn-primary" onclick="Router.navigate('team')">
                    + 创建小组
                </button>
            `;
        }

        return `
            <div class="team-selector">
                <select onchange="Layout.switchTeam(this.value)">
                    ${teams.map(t => `
                        <option value="${t.team_id}" ${t.team_id === currentTeam?.id ? 'selected' : ''}>
                            ${t.team_name}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    },

    switchTeam(teamId) {
        const teams = AuthService.getUserTeams() || [];
        const team = teams.find(t => t.team_id == teamId);
        if (team) {
            AuthService.setCurrentTeam(team);
            Router.handleRoute();
        }
    },

    getAvatarText(user) {
        if (user?.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return 'U';
    }
};

window.Layout = Layout;
