const SettingsPage = {
    render() {
        const user = AuthService.getCurrentUser();
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="settings-page">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <span class="header-title">设置</span>
                </div>
                <div class="settings-section">
                    <div class="section-title">个人资料</div>
                    <div class="card">
                        <div class="card-body">
                            <div class="form-group">
                                <div class="form-label">用户名</div>
                                <input type="text" class="form-control" id="settings-username" value="${user ? user.username : ''}" disabled>
                            </div>
                            <div class="form-group">
                                <div class="form-label">昵称</div>
                                <input type="text" class="form-control" id="settings-nickname" value="${user ? (user.nickname || '') : ''}">
                            </div>
                            <button class="btn btn-primary btn-block" id="save-profile-btn">保存资料</button>
                        </div>
                    </div>
                </div>
                <div class="settings-section">
                    <div class="section-title">修改密码</div>
                    <div class="card">
                        <div class="card-body">
                            <div class="form-group">
                                <div class="form-label">原密码</div>
                                <input type="password" class="form-control" id="old-password" placeholder="输入原密码">
                            </div>
                            <div class="form-group">
                                <div class="form-label">新密码</div>
                                <input type="password" class="form-control" id="new-password" placeholder="输入新密码(至少6位)">
                            </div>
                            <div class="form-group">
                                <div class="form-label">确认新密码</div>
                                <input type="password" class="form-control" id="new-password2" placeholder="再次输入新密码">
                            </div>
                            <button class="btn btn-primary btn-block" id="change-password-btn">修改密码</button>
                        </div>
                    </div>
                </div>
                <div class="settings-section">
                    <button class="btn btn-danger btn-block" id="logout-btn">退出登录</button>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('back-btn').addEventListener('click', () => {
            Router.navigate('home');
        });

        document.getElementById('save-profile-btn').addEventListener('click', async () => {
            const nickname = document.getElementById('settings-nickname').value.trim();
            Utils.showLoading();
            try {
                const result = await AuthService.updateProfile({ nickname });
                if (result.code === 0) {
                    Utils.showToast('保存成功');
                } else {
                    Utils.showToast(result.msg || '保存失败');
                }
            } catch (e) {
                Utils.showToast('保存失败');
            } finally {
                Utils.hideLoading();
            }
        });

        document.getElementById('change-password-btn').addEventListener('click', async () => {
            const oldPassword = document.getElementById('old-password').value.trim();
            const newPassword = document.getElementById('new-password').value.trim();
            const newPassword2 = document.getElementById('new-password2').value.trim();

            if (!oldPassword || !newPassword) {
                Utils.showToast('请填写密码');
                return;
            }
            if (newPassword.length < 6) {
                Utils.showToast('新密码至少6位');
                return;
            }
            if (newPassword !== newPassword2) {
                Utils.showToast('两次密码不一致');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.changePassword(oldPassword, newPassword);
                if (result.code === 0) {
                    Utils.showToast('密码修改成功，请重新登录');
                    await AuthService.logout();
                    setTimeout(() => Router.navigate('login'), 1000);
                } else {
                    Utils.showToast(result.msg || '修改失败');
                }
            } catch (e) {
                Utils.showToast('修改失败');
            } finally {
                Utils.hideLoading();
            }
        });

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await AuthService.logout();
            Router.navigate('login');
        });
    }
};
