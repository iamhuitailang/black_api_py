const ProfilePage = {
    user: null,

    async render() {
        this.user = AuthService.getCurrentUser() || {};

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">我的</div>
                </div>

                <div class="profile-header">
                    <div class="profile-avatar">${this.user.avatar || '👤'}</div>
                    <div class="profile-info">
                        <div class="profile-name">${this.user.nickname || '用户'}</div>
                        <div class="profile-phone">${this.user.phone ? this.user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''}</div>
                    </div>
                </div>

                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="stat-total">${Utils.formatNumber(this.user.total_count || 0)}</div>
                        <div class="profile-stat-label">总次数</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="stat-streak">${this.user.streak_days || 0}</div>
                        <div class="profile-stat-label">连续打卡</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value" id="stat-calories">${(this.user.total_calories || 0).toFixed(0)}</div>
                        <div class="profile-stat-label">消耗卡路里</div>
                    </div>
                </div>

                <div class="profile-menu">
                    <div class="profile-menu-item" data-action="edit">
                        <div class="profile-menu-icon">✏️</div>
                        <div class="profile-menu-text">编辑资料</div>
                        <div class="profile-menu-arrow">›</div>
                    </div>
                    <div class="profile-menu-item" data-action="goal">
                        <div class="profile-menu-icon">🎯</div>
                        <div class="profile-menu-text">目标设置</div>
                        <div class="profile-menu-arrow">›</div>
                    </div>
                    <div class="profile-menu-item" data-action="achievements">
                        <div class="profile-menu-icon">🏅</div>
                        <div class="profile-menu-text">成就徽章</div>
                        <div class="profile-menu-arrow">›</div>
                    </div>
                    <div class="profile-menu-item" data-action="friends">
                        <div class="profile-menu-icon">👥</div>
                        <div class="profile-menu-text">好友管理</div>
                        <div class="profile-menu-arrow">›</div>
                    </div>
                </div>

                <div class="profile-menu" style="margin-top: 12px;">
                    <div class="profile-menu-item" data-action="password">
                        <div class="profile-menu-icon">🔐</div>
                        <div class="profile-menu-text">修改密码</div>
                        <div class="profile-menu-arrow">›</div>
                    </div>
                    <div class="profile-menu-item" data-action="share">
                        <div class="profile-menu-icon">📤</div>
                        <div class="profile-menu-text">分享战绩</div>
                        <div class="profile-menu-arrow">›</div>
                    </div>
                </div>

                <div style="padding: 20px; margin-top: 12px;">
                    <button class="btn btn-outline btn-block" id="logout-btn">退出登录</button>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item" data-tab="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" data-tab="record">
                        <div class="tabbar-icon">➕</div>
                        <div class="tabbar-text">记录</div>
                    </div>
                    <div class="tabbar-item" data-tab="stats">
                        <div class="tabbar-icon">📊</div>
                        <div class="tabbar-text">统计</div>
                    </div>
                    <div class="tabbar-item" data-tab="social">
                        <div class="tabbar-icon">👥</div>
                        <div class="tabbar-text">社交</div>
                    </div>
                    <div class="tabbar-item active" data-tab="profile">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadUserStats();
    },

    bindEvents() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                Router.navigate(tab);
            });
        });

        document.querySelectorAll('.profile-menu-item[data-action]').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                if (action === 'edit') {
                    this.showEditProfileModal();
                } else if (action === 'password') {
                    this.showChangePasswordModal();
                } else if (action === 'share') {
                    this.showShareCard();
                } else {
                    Router.navigate(action);
                }
            });
        });

        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', async () => {
            const confirmed = await Utils.showConfirm('退出登录', '确定要退出登录吗？');
            if (confirmed) {
                await AuthService.logout();
                Utils.showToast('已退出登录');
                Router.navigate('login');
            }
        });
    },

    async loadUserStats() {
        try {
            const result = await AuthService.getUserStats();
            if (result.code === 0 && result.data) {
                const data = result.data;
                const user = data.user || {};

                const totalEl = document.getElementById('stat-total');
                const streakEl = document.getElementById('stat-streak');
                const caloriesEl = document.getElementById('stat-calories');

                if (totalEl) totalEl.textContent = Utils.formatNumber(user.total_count || 0);
                if (streakEl) streakEl.textContent = user.streak_days || 0;
                if (caloriesEl) caloriesEl.textContent = (user.total_calories || 0).toFixed(0);
            }
        } catch (e) {
            console.error('Load user stats error:', e);
        }
    },

    showEditProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">编辑资料</div>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input type="text" class="form-control" id="edit-nickname" value="${this.user.nickname || ''}" placeholder="请输入昵称">
                    </div>
                    <div class="form-group">
                        <label class="form-label">身高 (cm)</label>
                        <input type="number" class="form-control" id="edit-height" value="${this.user.height || 170}" placeholder="请输入身高">
                    </div>
                    <div class="form-group">
                        <label class="form-label">体重 (kg)</label>
                        <input type="number" class="form-control" id="edit-weight" value="${this.user.weight || 60}" placeholder="请输入体重" step="0.1">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn" data-action="cancel">取消</button>
                    <button class="modal-btn primary" data-action="confirm">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', async (e) => {
            const action = e.target.dataset.action;
            if (action === 'cancel' || e.target === modal) {
                modal.remove();
            } else if (action === 'confirm') {
                const nickname = document.getElementById('edit-nickname').value.trim();
                const height = parseInt(document.getElementById('edit-height').value) || 170;
                const weight = parseFloat(document.getElementById('edit-weight').value) || 60;

                Utils.showLoading();
                try {
                    const result = await AuthService.updateProfile({
                        nickname,
                        height,
                        weight
                    });
                    Utils.hideLoading();
                    modal.remove();

                    if (result.code === 0) {
                        Utils.showToast('保存成功');
                        this.user = AuthService.getCurrentUser();
                        this.render();
                    } else {
                        Utils.showToast(result.msg || '保存失败');
                    }
                } catch (e) {
                    Utils.hideLoading();
                    Utils.showToast('保存失败，请稍后重试');
                }
            }
        });
    },

    showChangePasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">修改密码</div>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">原密码</label>
                        <input type="password" class="form-control" id="old-password" placeholder="请输入原密码">
                    </div>
                    <div class="form-group">
                        <label class="form-label">新密码</label>
                        <input type="password" class="form-control" id="new-password" placeholder="请输入新密码（至少6位）">
                    </div>
                    <div class="form-group">
                        <label class="form-label">确认新密码</label>
                        <input type="password" class="form-control" id="confirm-password" placeholder="请再次输入新密码">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn" data-action="cancel">取消</button>
                    <button class="modal-btn primary" data-action="confirm">确认</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', async (e) => {
            const action = e.target.dataset.action;
            if (action === 'cancel' || e.target === modal) {
                modal.remove();
            } else if (action === 'confirm') {
                const oldPassword = document.getElementById('old-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                if (!oldPassword) {
                    Utils.showToast('请输入原密码');
                    return;
                }
                if (!newPassword || newPassword.length < 6) {
                    Utils.showToast('新密码长度至少6位');
                    return;
                }
                if (newPassword !== confirmPassword) {
                    Utils.showToast('两次输入的新密码不一致');
                    return;
                }

                Utils.showLoading();
                try {
                    const result = await AuthService.changePassword(oldPassword, newPassword);
                    Utils.hideLoading();
                    modal.remove();

                    if (result.code === 0) {
                        Utils.showToast('密码修改成功，请重新登录');
                        await AuthService.logout();
                        Router.navigate('login');
                    } else {
                        Utils.showToast(result.msg || '修改失败');
                    }
                } catch (e) {
                    Utils.hideLoading();
                    Utils.showToast('修改失败，请稍后重试');
                }
            }
        });
    },

    showShareCard() {
        const user = AuthService.getCurrentUser() || {};
        ShareService.showShareModal({
            user: user,
            type: 'profile'
        });
    }
};
