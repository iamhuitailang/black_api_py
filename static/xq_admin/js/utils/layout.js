const Layout = {
    render(content, activeMenu = 'dashboard') {
        const user = AuthService.getCurrentUser() || {};
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="admin-layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">
                            <span style="font-size: 28px;">🤝</span>
                            <div class="sidebar-logo-text">
                                <div class="sidebar-title">邻里互助</div>
                                <div class="sidebar-subtitle">后台管理系统</div>
                            </div>
                        </div>
                    </div>
                    
                    <nav class="sidebar-nav">
                        <div class="nav-item ${activeMenu === 'dashboard' ? 'active' : ''}" onclick="Router.navigate('dashboard')">
                            <span class="nav-icon">📊</span>
                            <span class="nav-text">数据统计</span>
                        </div>
                        <div class="nav-item ${activeMenu === 'user' ? 'active' : ''}" onclick="Router.navigate('user')">
                            <span class="nav-icon">👥</span>
                            <span class="nav-text">用户管理</span>
                        </div>
                        <div class="nav-item ${activeMenu === 'post' ? 'active' : ''}" onclick="Router.navigate('post')">
                            <span class="nav-icon">📝</span>
                            <span class="nav-text">内容管理</span>
                        </div>
                        <div class="nav-item ${activeMenu === 'category' ? 'active' : ''}" onclick="Router.navigate('category')">
                            <span class="nav-icon">🏷️</span>
                            <span class="nav-text">分类管理</span>
                        </div>
                    </nav>
                    
                    <div class="sidebar-footer">
                        <div class="sidebar-user">
                            <div class="sidebar-user-avatar">${(user.real_name || 'A').charAt(0).toUpperCase()}</div>
                            <div class="sidebar-user-info">
                                <div class="sidebar-user-name">${user.real_name || user.username || '管理员'}</div>
                                <div class="sidebar-user-role">${user.username}</div>
                            </div>
                        </div>
                        <div class="sidebar-logout" onclick="Layout.handleLogout()">
                            <span>🚪</span>
                            <span>退出登录</span>
                        </div>
                    </div>
                </aside>
                
                <main class="main-content">
                    ${content}
                </main>
            </div>
        `;
    },

    async handleLogout() {
        if (!confirm('确定要退出登录吗？')) return;
        
        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            console.error('退出登录失败:', error);
            Storage.removeToken();
            Storage.removeUser();
            Router.navigate('login');
        }
    }
};

window.Layout = Layout;
