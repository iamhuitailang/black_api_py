const ProfilePage = {
    user: null,

    async render() {
        const app = document.getElementById('app');
        this.user = AuthService.getCurrentUser();

        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <button class="back-btn" onclick="Router.navigate('home')">←</button>
                        <h1 class="header-title">个人中心</h1>
                        <div style="width:40px;"></div>
                    </div>
                </header>

                <div class="profile-content">
                    <div class="user-card">
                        <div class="user-avatar">${this.user?.nickname?.charAt(0) || 'U'}</div>
                        <div class="user-info">
                            <h2 class="user-name">${this.user?.nickname || '用户'}</h2>
                            <p class="user-phone">${this.user?.phone || '-'}</p>
                        </div>
                    </div>

                    <div class="menu-list">
                        <div class="menu-item" data-action="myOrders">
                            <span class="menu-icon">📋</span>
                            <span class="menu-text">我的订单</span>
                            <span class="menu-arrow">›</span>
                        </div>
                        <div class="menu-item" data-action="notifications">
                            <span class="menu-icon">🔔</span>
                            <span class="menu-text">消息通知</span>
                            <span class="menu-arrow">›</span>
                        </div>
                        <div class="menu-item" data-action="settings">
                            <span class="menu-icon">⚙️</span>
                            <span class="menu-text">账号设置</span>
                            <span class="menu-arrow">›</span>
                        </div>
                    </div>

                    <button class="btn btn-danger btn-block btn-logout" id="logoutBtn">退出登录</button>
                </div>

                <nav class="bottom-nav">
                    <a href="#home" class="nav-item">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-text">首页</span>
                    </a>
                    <a href="#myOrders" class="nav-item">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">订单</span>
                    </a>
                    <a href="#notifications" class="nav-item">
                        <span class="nav-icon">🔔</span>
                        <span class="nav-text">消息</span>
                    </a>
                    <a href="#profile" class="nav-item active">
                        <span class="nav-icon">👤</span>
                        <span class="nav-text">我的</span>
                    </a>
                </nav>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                Router.navigate(action);
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            const confirmed = await Utils.confirm('确认退出登录吗？');
            if (!confirmed) return;

            await AuthService.logout();
            Utils.showToast('已退出登录');
            Router.navigate('login');
        });
    }
};
