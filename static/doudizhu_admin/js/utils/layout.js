const Layout = {
    render(content) {
        if (!AuthService.isLoggedIn()) {
            return content;
        }

        const admin = AuthService.getAdmin() || {};
        const isSuper = AuthService.isSuperAdmin();

        const menuItems = [
            { path: 'dashboard', icon: '📊', label: '数据概览' },
            { path: 'users', icon: '👥', label: '用户管理' },
            { path: 'ai-config', icon: '🤖', label: 'AI配置' },
            { path: 'achievements', icon: '🏆', label: '成就管理' },
            { path: 'game-records', icon: '📋', label: '游戏记录' },
            { path: 'stats', icon: '📈', label: '数据统计' }
        ];

        if (isSuper) {
            menuItems.push({ path: 'admins', icon: '👤', label: '管理员管理' });
        }

        const currentPath = Router.currentRoute;

        return `
            <div class="admin-layout">
                <aside class="admin-sidebar">
                    <div class="sidebar-header">
                        <div class="logo">🎴</div>
                        <h2>斗地主后台</h2>
                    </div>
                    <nav class="sidebar-menu">
                        ${menuItems.map(item => `
                            <a href="#/${item.path}" class="menu-item ${currentPath === item.path ? 'menu-active' : ''}">
                                <span class="menu-icon">${item.icon}</span>
                                <span class="menu-label">${item.label}</span>
                            </a>
                        `).join('')}
                    </nav>
                    <div class="sidebar-footer">
                        <div class="admin-info">
                            <div class="admin-avatar">
                                ${(admin.real_name || admin.username || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div class="admin-details">
                                <div class="admin-name">${admin.real_name || admin.username || '管理员'}</div>
                                <div class="admin-role">${admin.role === 0 ? '超级管理员' : '普通管理员'}</div>
                            </div>
                        </div>
                        <button id="logoutBtn" class="btn btn-outline btn-block btn-small">退出登录</button>
                    </div>
                </aside>
                <main class="admin-main">
                    <header class="admin-header">
                        <h1 id="pageTitle">管理后台</h1>
                        <div class="header-actions">
                            <span class="current-time" id="currentTime"></span>
                        </div>
                    </header>
                    <div class="admin-content">
                        ${content}
                    </div>
                </main>
            </div>
        `;
    },

    setPageTitle(title) {
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            titleEl.textContent = title;
        }
    },

    bindLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('确定要退出登录吗？')) {
                    await AuthService.logout();
                    Toast.success('已退出登录');
                    Router.navigate('login');
                }
            });
        }
    },

    updateTime() {
        const timeEl = document.getElementById('currentTime');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleString('zh-CN');
        }
    },

    init() {
        this.bindLogout();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }
};
