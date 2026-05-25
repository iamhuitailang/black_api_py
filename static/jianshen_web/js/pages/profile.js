const ProfilePage = {
    async render() {
        if (!AuthService.requireAuth()) return;
        AppLayout.render(`<div class="content"><div class="loading"><div class="spinner"></div></div></div>`, '我的');
        try {
            const res = await ApiService.get('/jianshen/user/profile/get');
            if (res.code === 0) this.renderContent(res.data);
            else this.renderFallback();
        } catch (e) {
            this.renderFallback();
        }
    },

    renderFallback() {
        const user = Storage.getUser() || {};
        this.renderContent(user);
    },

    renderContent(user) {
        if (!user) {
            AppLayout.render(`
                <div class="content">
                    <div class="empty"><div class="icon">👤</div>请先登录</div>
                    <button class="btn btn-primary btn-block" onclick="Router.navigate('login')">去登录</button>
                </div>
            `, '我的');
            return;
        }
        const initial = (user.nickname || user.username || 'U').charAt(0).toUpperCase();
        const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '—';
        AppLayout.render(`
            <div class="content">
                <div class="profile-header">
                    <div class="avatar">${initial}</div>
                    <div class="name">${user.nickname || user.username}</div>
                    <div class="username">@${user.username}</div>
                </div>
                <div class="profile-stats">
                    <div class="stat">
                        <div class="value">${user.total_checkins || 0}</div>
                        <div class="label">总打卡</div>
                    </div>
                    <div class="stat">
                        <div class="value">${user.consecutive_days || 0}</div>
                        <div class="label">连续天数</div>
                    </div>
                    <div class="stat">
                        <div class="value">Lv.${user.level || 1}</div>
                        <div class="label">等级</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h2>📄 基本信息</h2></div>
                    <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
                        <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">用户名</span><span>${user.username}</span></div>
                        <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">邮箱</span><span>${user.email || '未设置'}</span></div>
                        <div style="display: flex; justify-content: space-between;"><span style="color: var(--text-secondary);">加入日期</span><span>${joinDate}</span></div>
                    </div>
                </div>

                <div class="menu-list">
                    <div class="item" onclick="Router.navigate('checkin')">
                        <div class="icon">📝</div>
                        <div class="label">我的打卡</div>
                        <div class="arrow">›</div>
                    </div>
                    <div class="item" onclick="Router.navigate('statistics')">
                        <div class="icon">📊</div>
                        <div class="label">数据统计</div>
                        <div class="arrow">›</div>
                    </div>
                    <div class="item" onclick="Router.navigate('plans')">
                        <div class="icon">🎯</div>
                        <div class="label">训练计划</div>
                        <div class="arrow">›</div>
                    </div>
                    <div class="item" onclick="Router.navigate('achievements')">
                        <div class="icon">🏆</div>
                        <div class="label">我的成就</div>
                        <div class="arrow">›</div>
                    </div>
                    <div class="item" onclick="Router.navigate('ranking')">
                        <div class="icon">🏅</div>
                        <div class="label">排行榜</div>
                        <div class="arrow">›</div>
                    </div>
                </div>

                <div class="menu-list">
                    <div class="item" onclick="ProfilePage.showEdit()">
                        <div class="icon">✏️</div>
                        <div class="label">编辑资料</div>
                        <div class="arrow">›</div>
                    </div>
                    <div class="item" onclick="ProfilePage.showPassword()">
                        <div class="icon">🔒</div>
                        <div class="label">修改密码</div>
                        <div class="arrow">›</div>
                    </div>
                    <div class="item" onclick="ProfilePage.toggleNotif()">
                        <div class="icon">🔔</div>
                        <div class="label">通知提醒</div>
                        <div class="switch ${user.notification_enabled ? 'on' : ''}" onclick="event.stopPropagation(); ProfilePage.toggleNotif()"></div>
                    </div>
                    <div class="item" onclick="ProfilePage.export()">
                        <div class="icon">📤</div>
                        <div class="label">导出数据</div>
                        <div class="arrow">›</div>
                    </div>
                </div>

                <div class="menu-list">
                    <div class="item" style="color: var(--danger);" onclick="ProfilePage.logout()">
                        <div class="icon" style="background: var(--danger-light); color: var(--danger);">🚪</div>
                        <div class="label">退出登录</div>
                    </div>
                </div>

                <div id="modal-container"></div>
            </div>
        `, '我的');
    },

    async toggleNotif() {
        const user = Storage.getUser() || {};
        const newVal = user.notification_enabled ? 0 : 1;
        const res = await ApiService.post('/jianshen/user/settings/update', { notification_enabled: newVal });
        if (res.code === 0) {
            Storage.setUser(res.data);
            Toast.success(newVal ? '已开启通知' : '已关闭通知');
            this.render();
        }
    },

    async showEdit() {
        const user = Storage.getUser() || {};
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-overlay" id="edit-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>编辑资料</h3>
                        <button class="modal-close" onclick="ProfilePage.closeModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>昵称</label>
                            <input type="text" id="e-nickname" value="${user.nickname || ''}">
                        </div>
                        <div class="form-group">
                            <label>邮箱</label>
                            <input type="email" id="e-email" value="${user.email || ''}">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ProfilePage.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="ProfilePage.saveEdit()">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') ProfilePage.closeModal();
        });
    },

    async saveEdit() {
        const nickname = document.getElementById('e-nickname').value.trim();
        const email = document.getElementById('e-email').value.trim();
        const res = await ApiService.post('/jianshen/user/profile/update', { nickname, email });
        if (res.code === 0) {
            Storage.setUser(res.data);
            Toast.success('更新成功');
            this.closeModal();
            this.render();
        } else {
            Toast.error(res.msg);
        }
    },

    showPassword() {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-overlay" id="pwd-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>修改密码</h3>
                        <button class="modal-close" onclick="ProfilePage.closeModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>原密码</label>
                            <input type="password" id="p-old">
                        </div>
                        <div class="form-group">
                            <label>新密码（至少6位）</label>
                            <input type="password" id="p-new">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ProfilePage.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="ProfilePage.savePassword()">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('pwd-modal').addEventListener('click', (e) => {
            if (e.target.id === 'pwd-modal') ProfilePage.closeModal();
        });
    },

    async savePassword() {
        const old_pwd = document.getElementById('p-old').value;
        const new_pwd = document.getElementById('p-new').value;
        if (!new_pwd || new_pwd.length < 6) { Toast.error('新密码至少6位'); return; }
        const res = await ApiService.post('/jianshen/user/password/change', {
            old_password: old_pwd, new_password: new_pwd
        });
        if (res.code === 0) {
            Toast.success('密码修改成功，请重新登录');
            this.closeModal();
            setTimeout(() => AuthService.logout(), 800);
        } else {
            Toast.error(res.msg);
        }
    },

    closeModal() {
        const c = document.getElementById('modal-container');
        if (c) c.innerHTML = '';
    },

    async export() {
        try {
            const res = await ApiService.get('/jianshen/statistics/summary/get');
            if (res.code === 0) {
                const dataStr = JSON.stringify(res.data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `fitness_data_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                Toast.success('导出成功');
            }
        } catch (e) {
            Toast.error('导出失败');
        }
    },

    async logout() {
        if (!confirm('确定要退出登录吗？')) return;
        await AuthService.logout();
    }
};
