const ProfilePage = {
    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();

        app.innerHTML = `
            <div class="app-container">
                <div class="profile-header">
                    <div class="profile-avatar">${(user?.username || 'U').charAt(0).toUpperCase()}</div>
                    <div class="profile-name">${user?.username || '用户'}</div>
                    <div class="profile-email">${user?.email || ''}</div>
                </div>
                <div class="page-content">
                    <div class="menu-list">
                        <button class="menu-item-btn" onclick="ProfilePage.showEditProfile()">
                            <span><span class="menu-icon">✏️</span>编辑资料</span>
                            <span>›</span>
                        </button>
                        <button class="menu-item-btn" onclick="ProfilePage.showChangePassword()">
                            <span><span class="menu-icon">🔒</span>修改密码</span>
                            <span>›</span>
                        </button>
                    </div>
                    <div class="menu-list">
                        <button class="menu-item-btn" onclick="ProfilePage.showAbout()">
                            <span><span class="menu-icon">ℹ️</span>关于</span>
                            <span>›</span>
                        </button>
                    </div>
                    <button class="btn btn-danger btn-block" onclick="AuthService.logout()" style="margin-top: 16px;">退出登录</button>
                </div>
                ${HomePage.renderBottomNav('profile')}
            </div>
        `;
    },

    showEditProfile() {
        const user = AuthService.getCurrentUser();
        const modal = document.createElement('div');
        modal.id = 'editProfileModal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">编辑资料</span>
                        <button class="modal-close" onclick="document.getElementById('editProfileModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editProfileForm">
                            <div class="form-group">
                                <label>用户名</label>
                                <input type="text" id="editUsername" value="${user?.username || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>邮箱</label>
                                <input type="email" id="editEmail" value="${user?.email || ''}" required>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">保存</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const result = await ApiService.post('/xz/auth/profile/update', {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value
            });
            if (result.code === 0) {
                Storage.set('xz_user', result.data);
                Toast.success('更新成功');
                document.getElementById('editProfileModal').remove();
                this.render();
            } else {
                Toast.error(result.msg || '更新失败');
            }
        });
    },

    showChangePassword() {
        const modal = document.createElement('div');
        modal.id = 'changePwdModal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">修改密码</span>
                        <button class="modal-close" onclick="document.getElementById('changePwdModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="changePwdForm">
                            <div class="form-group">
                                <label>原密码</label>
                                <input type="password" id="oldPwd" required>
                            </div>
                            <div class="form-group">
                                <label>新密码</label>
                                <input type="password" id="newPwd" required minlength="6">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">修改</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('changePwdForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPwd = document.getElementById('oldPwd').value;
            const newPwd = document.getElementById('newPwd').value;
            
            if (oldPwd === newPwd) {
                Toast.error('新密码不能与原密码相同');
                return;
            }
            
            const result = await ApiService.post('/xz/auth/password/change', {
                old_password: oldPwd,
                new_password: newPwd
            });
            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录');
                document.getElementById('changePwdModal').remove();
                AuthService.logout();
            } else {
                Toast.error(result.msg || '修改失败');
            }
        });
    },

    showAbout() {
        const modal = document.createElement('div');
        modal.id = 'aboutModal';
        document.body.appendChild(modal);

        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">关于</span>
                        <button class="modal-close" onclick="document.getElementById('aboutModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 32px 16px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                        <h3 style="margin-bottom: 8px;">小组任务管理</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 8px;">版本 1.0.0</p>
                        <p style="color: var(--text-secondary); font-size: 13px;">高效协作，轻松管理</p>
                    </div>
                </div>
            </div>
        `;
    }
};

window.ProfilePage = ProfilePage;
