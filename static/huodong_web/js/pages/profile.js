const ProfilePage = {
    user: null,
    stats: { published: 0, registered: 0, favorites: 0 },

    async render() {
        const app = document.getElementById('app');
        this.user = AuthService.getCurrentUser();
        app.innerHTML = `
            <div class="page">
                <div class="profile-header">
                    <div class="profile-avatar">${(this.user?.nickname || 'U').charAt(0).toUpperCase()}</div>
                    <div class="profile-info">
                        <div class="profile-name">${this.user?.nickname || '用户'}</div>
                        <div class="profile-city">${this.user?.city || '未设置城市'}</div>
                    </div>
                </div>

                <div class="profile-stats" id="profileStats">
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="statPublished">-</div>
                        <div class="profile-stat-label">发布</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="statRegistered">-</div>
                        <div class="profile-stat-label">参与</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="statFavorites">-</div>
                        <div class="profile-stat-label">收藏</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="statPoints">0</div>
                        <div class="profile-stat-label">积分</div>
                    </div>
                </div>

                <div class="menu-list">
                    <div class="menu-item" onclick="Router.navigate('myActivities')">
                        <span class="menu-icon">📋</span>
                        <span class="menu-text">我的活动</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('myFavorites')">
                        <span class="menu-icon">❤️</span>
                        <span class="menu-text">我的收藏</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('messages')">
                        <span class="menu-icon">💬</span>
                        <span class="menu-text">消息通知</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('settings')">
                        <span class="menu-icon">⚙️</span>
                        <span class="menu-text">账号设置</span>
                        <span class="menu-arrow">›</span>
                    </div>
                </div>

                <div class="menu-list">
                    <div class="menu-item" id="logoutBtn">
                        <span class="menu-icon">🚪</span>
                        <span class="menu-text" style="color: var(--danger-color);">退出登录</span>
                    </div>
                </div>

                ${Tabbar.render('profile')}
            </div>
        `;
        this.bindEvents();
        await this.loadStats();
    },

    async loadStats() {
        try {
            const pointsResult = await ApiService.get('/huodong/points/summary/get');
            if (pointsResult.code === 0) {
                document.getElementById('statPoints').textContent = pointsResult.data.current_points || 0;
            }
        } catch (e) { }
        try {
            const regResult = await ApiService.get('/huodong/registration/my/list/get', { page: 1, page_size: 1 });
            if (regResult.code === 0) {
                document.getElementById('statRegistered').textContent = regResult.data.total || 0;
            }
        } catch (e) { }
        try {
            const pubResult = await ApiService.get('/huodong/activity/my/list/get', { page: 1, page_size: 1 });
            if (pubResult.code === 0) {
                document.getElementById('statPublished').textContent = pubResult.data.total || 0;
            }
        } catch (e) { }
        try {
            const favResult = await ApiService.get('/huodong/favorite/my/list/get', { page: 1, page_size: 1 });
            if (favResult.code === 0) {
                document.getElementById('statFavorites').textContent = favResult.data.total || 0;
            }
        } catch (e) { }
    },

    bindEvents() {
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        });
    }
};
