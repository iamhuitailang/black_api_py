const ProfilePage = {
    async render() {
        const user = AuthService.getCurrentUser() || {};
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page">
                <div class="profile-header">
                    <div class="profile-avatar">${(user.nickname || 'U').charAt(0)}</div>
                    <div class="profile-info">
                        <div class="profile-name">${user.nickname || '用户'}</div>
                        <div class="profile-phone">${user.phone || ''}</div>
                    </div>
                </div>
                <div class="list">
                    <div class="list-item" onclick="Router.navigate('pets')">
                        <div class="list-item-content"><div class="list-item-title">🐾 我的宠物</div></div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('myBookings')">
                        <div class="list-item-content"><div class="list-item-title">📋 我的寄养</div></div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('notifications')">
                        <div class="list-item-content"><div class="list-item-title">🔔 消息提醒</div></div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('password')">
                        <div class="list-item-content"><div class="list-item-title">🔒 修改密码</div></div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" id="logoutBtn">
                        <div class="list-item-content"><div class="list-item-title" style="color:var(--danger-color)">退出登录</div></div>
                        <div class="list-item-arrow">›</div>
                    </div>
                </div>
                ${Tabbar.render('profile')}
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            if (!confirm('确定退出登录？')) return;
            await AuthService.logout();
            Toast.success('已退出');
            Router.navigate('login');
        });
    }
};
