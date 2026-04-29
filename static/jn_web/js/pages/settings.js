const SettingsPage = {
    user: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <div class="header-left">
                        <button class="back-btn" onclick="Router.navigate('profile')">
                            <span class="icon">‹</span>
                        </button>
                        <h1>设置</h1>
                    </div>
                </header>

                <div class="content-scroll">
                    <div class="settings-section">
                        <h3 class="section-title-small">账号设置</h3>
                        <div class="settings-list">
                            <div class="settings-item" id="edit-profile-item">
                                <span class="settings-label">编辑资料</span>
                                <span class="settings-arrow">›</span>
                            </div>
                            <div class="settings-item" id="change-password-item">
                                <span class="settings-label">修改密码</span>
                                <span class="settings-arrow">›</span>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3 class="section-title-small">关于</h3>
                        <div class="settings-list">
                            <div class="settings-item">
                                <span class="settings-label">版本号</span>
                                <span class="settings-value">1.0.0</span>
                            </div>
                            <div class="settings-item">
                                <span class="settings-label">关于易技圈</span>
                                <span class="settings-arrow">›</span>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-secondary btn-block logout-btn" id="logout-btn">
                        退出登录
                    </button>

                    <div class="copyright">
                        <p>© 2024 易技圈</p>
                        <p>技能交换平台 - 无现金，纯技能互换</p>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="password-modal">
                <div class="modal modal-bottom">
                    <div class="modal-header">
                        <h3 class="modal-title">修改密码</h3>
                        <button class="modal-close" id="password-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="password-form">
                            <div class="form-group">
                                <label class="form-label">原密码</label>
                                <input type="password" id="old-password" class="form-control" placeholder="请输入原密码">
                            </div>
                            <div class="form-group">
                                <label class="form-label">新密码</label>
                                <input type="password" id="new-password" class="form-control" placeholder="请输入新密码（至少6位）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认新密码</label>
                                <input type="password" id="confirm-password" class="form-control" placeholder="请再次输入新密码">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="password-modal-cancel">取消</button>
                        <button type="button" class="btn btn-primary" id="password-modal-save">确认修改</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('edit-profile-item').addEventListener('click', () => {
            Router.navigate('profile');
        });

        document.getElementById('change-password-item').addEventListener('click', () => {
            this.showPasswordModal();
        });

        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        document.getElementById('password-modal-close').addEventListener('click', () => {
            document.getElementById('password-modal').classList.remove('show');
        });
        document.getElementById('password-modal-cancel').addEventListener('click', () => {
            document.getElementById('password-modal').classList.remove('show');
        });
        document.getElementById('password-modal-save').addEventListener('click', () => this.changePassword());
    },

    showPasswordModal() {
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        document.getElementById('password-modal').classList.add('show');
    },

    async changePassword() {
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!oldPassword) {
            Toast.error('请输入原密码');
            return;
        }

        if (!newPassword) {
            Toast.error('请输入新密码');
            return;
        }

        if (newPassword.length < 6) {
            Toast.error('新密码至少6位');
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.error('两次输入的密码不一致');
            return;
        }

        const btn = document.getElementById('password-modal-save');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> 修改中...';

        try {
            const result = await AuthService.changePassword(oldPassword, newPassword);

            if (result.code === 0) {
                Toast.success('密码修改成功');
                document.getElementById('password-modal').classList.remove('show');
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '确认修改';
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

window.SettingsPage = SettingsPage;
