const ProfilePage = {
    render() {
        const user = AuthService.getCurrentUser();
        const role = user?.role;
        const app = document.getElementById('app');
        
        const tabbarHtml = this.getTabbarHtml(role);
        
        app.className = 'page has-header';
        app.innerHTML = `
            <div class="header">
                <div class="header-title">个人中心</div>
            </div>
            <div class="profile-header">
                <div class="profile-avatar">${user?.real_name?.charAt(0) || user?.username?.charAt(0) || '?'}</div>
                <div class="profile-name">${user?.real_name || user?.username || '用户'}</div>
                <div class="profile-role">${Utils.getRoleText(user?.role)}</div>
            </div>
            <div class="menu-list">
                <div class="menu-list-item" id="editProfile">
                    <div class="menu-list-icon">✏️</div>
                    <div class="menu-list-label">编辑资料</div>
                    <div class="menu-list-arrow">›</div>
                </div>
                <div class="menu-list-item" id="changePassword">
                    <div class="menu-list-icon">🔒</div>
                    <div class="menu-list-label">修改密码</div>
                    <div class="menu-list-arrow">›</div>
                </div>
                <div class="menu-list-item" id="myOrders">
                    <div class="menu-list-icon">📋</div>
                    <div class="menu-list-label">${role === 'repairman' ? '我的工单' : '我的报修'}</div>
                    <div class="menu-list-arrow">›</div>
                </div>
                ${role === 'admin' ? `
                <div class="menu-list-item" id="dormitories">
                    <div class="menu-list-icon">🏢</div>
                    <div class="menu-list-label">宿舍楼管理</div>
                    <div class="menu-list-arrow">›</div>
                </div>
                <div class="menu-list-item" id="logs">
                    <div class="menu-list-icon">📝</div>
                    <div class="menu-list-label">系统日志</div>
                    <div class="menu-list-arrow">›</div>
                </div>
                ` : ''}
                <div class="menu-list-item" id="notifications">
                    <div class="menu-list-icon">🔔</div>
                    <div class="menu-list-label">消息通知</div>
                    <div class="menu-list-arrow">›</div>
                </div>
                <div class="menu-list-item" id="logout">
                    <div class="menu-list-icon" style="color: #ef4444;">🚪</div>
                    <div class="menu-list-label" style="color: #ef4444;">退出登录</div>
                </div>
            </div>
            ${tabbarHtml}
        `;

        this.bindEvents();
    },

    getTabbarHtml(role) {
        if (role === 'admin') {
            return `
            <div class="tabbar tabbar-5">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">报修</div>
                </div>
                <div class="tabbar-item" data-route="users">
                    <div class="tabbar-icon">👥</div>
                    <div class="tabbar-label">用户</div>
                </div>
                <div class="tabbar-item" data-route="statistics">
                    <div class="tabbar-icon">📊</div>
                    <div class="tabbar-label">统计</div>
                </div>
                <div class="tabbar-item active" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        } else if (role === 'repairman') {
            return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">工单</div>
                </div>
                <div class="tabbar-item" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
                <div class="tabbar-item active" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        } else {
            return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">报修单</div>
                </div>
                <div class="tabbar-item" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
                <div class="tabbar-item active" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        }
    },

    bindEvents() {
        document.getElementById('editProfile').onclick = () => Router.navigate('editProfile');
        document.getElementById('changePassword').onclick = () => Router.navigate('changePassword');
        document.getElementById('myOrders').onclick = () => Router.navigate('orders');
        document.getElementById('notifications').onclick = () => Router.navigate('notifications');
        
        const dormitoriesEl = document.getElementById('dormitories');
        if (dormitoriesEl) {
            dormitoriesEl.onclick = () => Router.navigate('dormitories');
        }
        
        const logsEl = document.getElementById('logs');
        if (logsEl) {
            logsEl.onclick = () => Router.navigate('logs');
        }
        
        document.getElementById('logout').onclick = () => {
            Utils.showModal({
                title: '确认退出',
                content: '<p>确定要退出登录吗？</p>',
                onConfirm: async () => {
                    await AuthService.logout();
                    Utils.showToast('已退出登录');
                    Router.navigate('login');
                }
            });
        };

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.onclick = () => {
                const route = item.dataset.route;
                if (route) {
                    Router.navigate(route);
                }
            };
        });
    }
};
