const ProfilePage = {
    userData: null,

    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getUser();

        if (!user) {
            Router.navigate('login');
            return;
        }

        app.innerHTML = `
            <div class="page has-header">
                ${Layout.renderHeader('个人中心', true)}
                
                <div class="profile-header">
                    <div class="profile-avatar">${user.nickname?.charAt(0) || '👤'}</div>
                    <div class="profile-info">
                        <div class="profile-name">${user.nickname || user.username}</div>
                        <div class="profile-role">${user.role_text || user.role}</div>
                    </div>
                </div>

                <div class="profile-menu">
                    <div class="profile-menu-item" onclick="Router.navigate('settings')">
                        <span class="profile-menu-icon">⚙️</span>
                        <span class="profile-menu-text">账号设置</span>
                        <span class="profile-menu-arrow">›</span>
                    </div>
                    ${user.role === 'admin' ? `
                    <div class="profile-menu-item" onclick="Router.navigate('admin')">
                        <span class="profile-menu-icon">📊</span>
                        <span class="profile-menu-text">管理后台</span>
                        <span class="profile-menu-arrow">›</span>
                    </div>
                    ` : ''}
                    <div class="profile-menu-item" onclick="ProfilePage.logout()">
                        <span class="profile-menu-icon">🚪</span>
                        <span class="profile-menu-text">退出登录</span>
                        <span class="profile-menu-arrow">›</span>
                    </div>
                </div>

                ${Layout.renderTabbar('profile')}
            </div>
        `;
    },

    async logout() {
        if (!confirm('确定要退出登录吗？')) return;

        await AuthService.logout();
        Toast.success('已退出登录');
        Router.navigate('login');
    }
};

window.ProfilePage = ProfilePage;