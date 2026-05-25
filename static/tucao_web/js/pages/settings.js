const SettingsPage = {
    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();
        
        app.innerHTML = `
            <div class="app-container">
                <header class="page-header">
                    <button class="back-btn" onclick="Router.navigate('home')">←</button>
                    <h1>个人中心</h1>
                    <div style="width: 40px;"></div>
                </header>

                <main class="app-main">
                    <div class="settings-container">
                        ${user ? `
                            <div class="user-profile">
                                <div class="user-avatar-large">${(user.nickname || user.username || 'U').charAt(0).toUpperCase()}</div>
                                <div class="user-info">
                                    <h2 class="user-nickname">${user.nickname || user.username}</h2>
                                    <p class="user-username">@${user.username}</p>
                                </div>
                            </div>

                            <div class="settings-list">
                                <div class="settings-item" onclick="Router.navigate('myPosts')">
                                    <span class="settings-icon">📝</span>
                                    <span class="settings-label">我的发布</span>
                                    <span class="settings-arrow">›</span>
                                </div>
                                <div class="settings-item" onclick="SettingsPage.showChangePassword()">
                                    <span class="settings-icon">🔐</span>
                                    <span class="settings-label">修改密码</span>
                                    <span class="settings-arrow">›</span>
                                </div>
                                <div class="settings-item settings-item-danger" onclick="SettingsPage.logout()">
                                    <span class="settings-icon">🚪</span>
                                    <span class="settings-label">退出登录</span>
                                </div>
                            </div>
                        ` : `
                            <div class="login-prompt">
                                <span class="prompt-icon">👤</span>
                                <p>请先登录</p>
                                <button class="btn-auth" onclick="Router.navigate('login')">立即登录</button>
                            </div>
                        `}
                    </div>
                </main>
            </div>
        `;
    },

    showChangePassword() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>修改密码</h3>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <input type="password" id="oldPassword" placeholder="原密码">
                    </div>
                    <div class="form-group">
                        <input type="password" id="newPassword" placeholder="新密码（至少6位）">
                    </div>
                    <div class="form-group">
                        <input type="password" id="confirmNewPassword" placeholder="确认新密码">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal btn-secondary" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn-modal" onclick="SettingsPage.submitChangePassword()">确认</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },

    async submitChangePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (!oldPassword || !newPassword) {
            Toast.warning('请输入密码');
            return;
        }

        if (newPassword.length < 6) {
            Toast.warning('新密码至少6位');
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.warning('两次密码不一致');
            return;
        }

        try {
            const result = await AuthService.changePassword(oldPassword, newPassword);
            
            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录');
                document.querySelector('.modal-overlay').remove();
                await AuthService.logout();
                Router.navigate('login');
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (e) {
            Toast.error('修改失败');
        }
    },

    async logout() {
        if (!confirm('确定要退出登录吗？')) return;
        
        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('home');
        } catch (e) {
            Storage.removeToken();
            Storage.removeUser();
            Router.navigate('home');
        }
    }
};
