const SettingsPage = {
    user: null,

    async render() {
        this.user = AuthService.getUser();
        const app = document.getElementById('app');
        app.innerHTML = this.getTemplate();
        this.bindEvents();
        this.loadUserInfo();
    },

    getTemplate() {
        const user = this.user || {};
        const notificationEnabled = Storage.getNotificationEnabled();

        return `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">设置</div>
                </div>

                <div class="user-card">
                    <div class="user-avatar">${user.nickname?.[0] || '用'}</div>
                    <div class="user-info">
                        <div class="user-name" id="userName">${user.nickname || '用户'}</div>
                        <div class="user-phone">${user.phone || ''}</div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-group">
                        <div class="settings-item" id="editProfile">
                            <div class="settings-item-left">
                                <span class="settings-icon">👤</span>
                                <span class="settings-label">编辑资料</span>
                            </div>
                            <span class="settings-arrow">›</span>
                        </div>
                        <div class="settings-item" id="changePassword">
                            <div class="settings-item-left">
                                <span class="settings-icon">🔐</span>
                                <span class="settings-label">修改密码</span>
                            </div>
                            <span class="settings-arrow">›</span>
                        </div>
                    </div>

                    <div class="settings-group">
                        <div class="settings-item">
                            <div class="settings-item-left">
                                <span class="settings-icon">🔔</span>
                                <span class="settings-label">签到提醒</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="notificationSwitch" ${notificationEnabled ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <div class="settings-item" id="about">
                            <div class="settings-item-left">
                                <span class="settings-icon">ℹ️</span>
                                <span class="settings-label">关于</span>
                            </div>
                            <span class="settings-arrow">›</span>
                        </div>
                    </div>

                    <div class="logout-btn" id="logoutBtn">退出登录</div>
                </div>

                <div class="modal" id="editModal">
                    <div class="modal-overlay" id="editModalOverlay"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <span class="modal-title">编辑资料</span>
                            <span class="modal-close" id="closeEditModal">×</span>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">昵称</label>
                                <input type="text" class="form-control" id="editNickname" placeholder="请输入昵称">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="cancelEdit">取消</button>
                            <button class="btn btn-primary" id="saveProfile">保存</button>
                        </div>
                    </div>
                </div>

                <div class="modal" id="passwordModal">
                    <div class="modal-overlay" id="passwordModalOverlay"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <span class="modal-title">修改密码</span>
                            <span class="modal-close" id="closePasswordModal">×</span>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">原密码</label>
                                <input type="password" class="form-control" id="oldPassword" placeholder="请输入原密码">
                            </div>
                            <div class="form-group">
                                <label class="form-label">新密码</label>
                                <input type="password" class="form-control" id="newPassword" placeholder="请输入新密码（至少6位）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认新密码</label>
                                <input type="password" class="form-control" id="confirmNewPassword" placeholder="请再次输入新密码">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="cancelPassword">取消</button>
                            <button class="btn btn-primary" id="savePassword">保存</button>
                        </div>
                    </div>
                </div>

                <div class="modal" id="aboutModal">
                    <div class="modal-overlay" id="aboutModalOverlay"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <span class="modal-title">关于</span>
                            <span class="modal-close" id="closeAboutModal">×</span>
                        </div>
                        <div class="modal-body" style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
                            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">每日签到</div>
                            <div style="color: #666; font-size: 14px;">版本 1.0.0</div>
                            <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; text-align: left;">
                                <p style="margin: 0 0 8px 0; font-weight: 500;">功能说明：</p>
                                <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px;">
                                    <li>每日签到获得积分奖励</li>
                                    <li>连续签到可获得额外奖励</li>
                                    <li>消耗积分可补签过去的日期</li>
                                    <li>支持设置每日签到提醒</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item" data-route="home">
                        <div class="tabbar-icon">📅</div>
                        <div class="tabbar-text">签到</div>
                    </div>
                    <div class="tabbar-item" data-route="history">
                        <div class="tabbar-icon">📋</div>
                        <div class="tabbar-text">记录</div>
                    </div>
                    <div class="tabbar-item active" data-route="settings">
                        <div class="tabbar-icon">⚙️</div>
                        <div class="tabbar-text">设置</div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route !== Router.getCurrentRoute()) {
                    Router.navigate(route);
                }
            });
        });

        document.getElementById('editProfile').addEventListener('click', () => {
            this.showEditModal();
        });

        document.getElementById('changePassword').addEventListener('click', () => {
            this.showPasswordModal();
        });

        document.getElementById('about').addEventListener('click', () => {
            document.getElementById('aboutModal').classList.add('show');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('notificationSwitch').addEventListener('change', (e) => {
            this.handleNotificationChange(e.target.checked);
        });

        document.getElementById('closeEditModal').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('show');
        });
        document.getElementById('editModalOverlay').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('show');
        });
        document.getElementById('cancelEdit').addEventListener('click', () => {
            document.getElementById('editModal').classList.remove('show');
        });
        document.getElementById('saveProfile').addEventListener('click', () => {
            this.handleSaveProfile();
        });

        document.getElementById('closePasswordModal').addEventListener('click', () => {
            document.getElementById('passwordModal').classList.remove('show');
        });
        document.getElementById('passwordModalOverlay').addEventListener('click', () => {
            document.getElementById('passwordModal').classList.remove('show');
        });
        document.getElementById('cancelPassword').addEventListener('click', () => {
            document.getElementById('passwordModal').classList.remove('show');
        });
        document.getElementById('savePassword').addEventListener('click', () => {
            this.handleSavePassword();
        });

        document.getElementById('closeAboutModal').addEventListener('click', () => {
            document.getElementById('aboutModal').classList.remove('show');
        });
        document.getElementById('aboutModalOverlay').addEventListener('click', () => {
            document.getElementById('aboutModal').classList.remove('show');
        });
    },

    async loadUserInfo() {
        try {
            const result = await UserApi.getCurrentUser();
            if (result.code === 0) {
                this.user = result.data;
                Storage.setUser(this.user);
                document.getElementById('userName').textContent = this.user.nickname || '用户';
            }
        } catch (error) {
            console.error('Load user info error:', error);
        }
    },

    showEditModal() {
        document.getElementById('editNickname').value = this.user?.nickname || '';
        document.getElementById('editModal').classList.add('show');
    },

    showPasswordModal() {
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        document.getElementById('passwordModal').classList.add('show');
    },

    async handleSaveProfile() {
        const nickname = document.getElementById('editNickname').value.trim();

        if (!nickname) {
            Utils.showToast('请输入昵称');
            return;
        }

        Utils.showLoading();
        try {
            const result = await UserApi.updateProfile({ nickname });
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('保存成功');
                document.getElementById('editModal').classList.remove('show');
                document.getElementById('userName').textContent = nickname;

                const user = AuthService.getUser();
                if (user) {
                    user.nickname = nickname;
                    Storage.setUser(user);
                    this.user = user;
                }
            } else {
                Utils.showToast(result.msg || '保存失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message || '网络错误');
        }
    },

    async handleSavePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (!oldPassword) {
            Utils.showToast('请输入原密码');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            Utils.showToast('新密码至少6位');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            Utils.showToast('两次密码输入不一致');
            return;
        }

        Utils.showLoading();
        try {
            const result = await UserApi.changePassword(oldPassword, newPassword);
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('密码修改成功，请重新登录');
                document.getElementById('passwordModal').classList.remove('show');
                setTimeout(() => {
                    this.handleLogout();
                }, 1000);
            } else {
                Utils.showToast(result.msg || '修改失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message || '网络错误');
        }
    },

    async handleNotificationChange(enabled) {
        Storage.setNotificationEnabled(enabled);

        if (enabled) {
            const permission = await AuthService.requestNotificationPermission();
            if (permission === 'granted') {
                AuthService.scheduleNotification();
                Utils.showToast('签到提醒已开启');
            } else {
                document.getElementById('notificationSwitch').checked = false;
                Utils.showToast('请允许通知权限');
            }
        } else {
            Utils.showToast('签到提醒已关闭');
        }
    },

    async handleLogout() {
        if (!confirm('确定要退出登录吗？')) {
            return;
        }

        Utils.showLoading();
        try {
            await AuthService.logout();
            Utils.hideLoading();
            Utils.showToast('已退出登录');
            Router.navigate('login');
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message || '退出失败');
        }
    }
};
