const ProfilePage = {
    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser() || {};
        const userInitial = (user.nickname || user.phone?.slice(-1) || 'U').charAt(0).toUpperCase();

        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">我的</h1>
                </header>

                <div class="profile-header">
                    <div class="profile-avatar">${userInitial}</div>
                    <div class="profile-info">
                        <div class="profile-name">${user.nickname || '用户' + (user.phone?.slice(-4) || '')}</div>
                        <div class="profile-community">${user.community || '还没填写小区'}</div>
                        <div class="profile-credit">
                            <span class="profile-credit-badge">信用 ${user.credit || 100}分</span>
                        </div>
                    </div>
                </div>

                <div class="list" style="margin: 12px;">
                    <div class="list-item" onclick="Router.navigate('myPosts')">
                        <div class="list-item-content">
                            <div class="list-item-title">我的发布</div>
                            <div class="list-item-desc">查看我发布的求助和帮助</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                    <div class="list-item" onclick="Router.navigate('myClaims')">
                        <div class="list-item-content">
                            <div class="list-item-title">我的帮助</div>
                            <div class="list-item-desc">查看我申请帮助的记录</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                </div>

                <div class="list" style="margin: 12px;">
                    <div class="list-item" onclick="Router.navigate('settings')">
                        <div class="list-item-content">
                            <div class="list-item-title">设置</div>
                            <div class="list-item-desc">修改密码、退出登录</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                </div>

                ${Tabbar.render('profile')}
            </div>
        `;

        await this.refreshUserInfo();
    },

    async refreshUserInfo() {
        try {
            const result = await AuthService.getCurrentUserInfo();
            if (result.code === 0) {
                const profileAvatar = document.querySelector('.profile-avatar');
                const profileName = document.querySelector('.profile-name');
                const profileCommunity = document.querySelector('.profile-community');

                if (profileAvatar) {
                    profileAvatar.textContent = (result.data.nickname || result.data.phone?.slice(-1) || 'U').charAt(0).toUpperCase();
                }
                if (profileName) {
                    profileName.textContent = result.data.nickname || '用户' + (result.data.phone?.slice(-4) || '');
                }
                if (profileCommunity) {
                    profileCommunity.textContent = result.data.community || '还没填写小区';
                }
            }
        } catch (error) {
            console.error('刷新用户信息失败:', error);
        }
    }
};
