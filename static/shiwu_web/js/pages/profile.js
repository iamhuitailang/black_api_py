const ProfilePage = {
    user: null,

    async render() {
        const app = document.getElementById('app');
        this.user = AuthService.getCurrentUser() || {};

        app.innerHTML = `
            <div class="page no-header">
                <div class="profile-header">
                    <div class="profile-avatar">${Utils.getInitial(this.user.nickname)}</div>
                    <h1 class="profile-name">${this.user.nickname || '用户' + (this.user.phone?.slice(-4) || '')}</h1>
                    <p class="profile-info">
                        ${this.user.college ? this.user.college + ' · ' : ''}
                        ${this.user.student_id || '学号未设置'}
                    </p>
                </div>

                <div class="container">
                    <div class="profile-menu">
                        <div class="profile-menu-item" onclick="Router.navigate('myPosts')">
                            <div class="icon">📝</div>
                            <div class="text">我的发布</div>
                            <div class="arrow">›</div>
                        </div>
                        <div class="profile-menu-item" onclick="Router.navigate('myClaims')">
                            <div class="icon">📋</div>
                            <div class="text">我的申请</div>
                            <div class="arrow">›</div>
                        </div>
                        <div class="profile-menu-item" onclick="Router.navigate('notifications')">
                            <div class="icon">🔔</div>
                            <div class="text">消息通知</div>
                            <div class="arrow">›</div>
                        </div>
                        <div class="profile-menu-item" onclick="Router.navigate('settings')">
                            <div class="icon">⚙️</div>
                            <div class="text">设置</div>
                            <div class="arrow">›</div>
                        </div>
                        <div class="profile-menu-item" onclick="ProfilePage.logout()">
                            <div class="icon" style="background: var(--danger-light); color: var(--danger-color);">🚪</div>
                            <div class="text" style="color: var(--danger-color);">退出登录</div>
                            <div class="arrow">›</div>
                        </div>
                    </div>

                    <div style="margin-top: 24px; text-align: center;">
                        <p style="font-size: 12px; color: var(--text-light);">
                            校园失物招领平台 v1.0
                        </p>
                    </div>
                </div>

                ${Tabbar.render('profile')}
            </div>
        `;

        await this.loadUserInfo();
    },

    async loadUserInfo() {
        try {
            const result = await AuthService.getCurrentUserInfo();
            if (result.code === 0 && result.data) {
                this.user = result.data;
                document.querySelector('.profile-avatar').textContent = Utils.getInitial(this.user.nickname);
                document.querySelector('.profile-name').textContent = this.user.nickname || '用户' + (this.user.phone?.slice(-4) || '');
                document.querySelector('.profile-info').textContent = 
                    (this.user.college ? this.user.college + ' · ' : '') + 
                    (this.user.student_id || '学号未设置');
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
    },

    async logout() {
        if (!confirm('确定要退出登录吗？')) return;

        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            Storage.removeToken();
            Storage.removeUser();
            Router.navigate('login');
        }
    }
};

window.ProfilePage = ProfilePage;
