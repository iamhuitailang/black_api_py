const SettingsPage = {
    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();

        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <button class="back-btn" onclick="Router.back()">←</button>
                        <h1 class="header-title">账号设置</h1>
                        <div style="width:40px;"></div>
                    </div>
                </header>

                <div class="settings-content">
                    <div class="settings-tabs">
                        <button class="settings-tab active" data-tab="profile">个人信息</button>
                        <button class="settings-tab" data-tab="password">修改密码</button>
                    </div>

                    <div class="settings-panels">
                        <div class="settings-panel active" id="profilePanel">
                            <form id="profileForm" class="settings-form">
                                <div class="form-group">
                                    <label>手机号</label>
                                    <input type="tel" id="phone" value="${user?.phone || ''}" disabled>
                                </div>
                                <div class="form-group">
                                    <label>昵称</label>
                                    <input type="text" id="nickname" value="${user?.nickname || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label>常住地址</label>
                                    <input type="text" id="address" value="${user?.address || ''}" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">保存修改</button>
                            </form>
                        </div>

                        <div class="settings-panel" id="passwordPanel">
                            <form id="passwordForm" class="settings-form">
                                <div class="form-group">
                                    <label>当前密码</label>
                                    <input type="password" id="oldPassword" placeholder="请输入当前密码" required>
                                </div>
                                <div class="form-group">
                                    <label>新密码</label>
                                    <input type="password" id="newPassword" placeholder="请输入新密码（至少6位）" required>
                                </div>
                                <div class="form-group">
                                    <label>确认新密码</label>
                                    <input type="password" id="confirmPassword" placeholder="请再次输入新密码" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block">修改密码</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const tabs = document.querySelectorAll('.settings-tab');
        const panels = document.querySelectorAll('.settings-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(target + 'Panel').classList.add('active');
            });
        });

        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nickname = document.getElementById('nickname').value;
            const address = document.getElementById('address').value;

            if (!nickname) {
                Utils.showToast('请填写昵称', 'error');
                return;
            }

            try {
                const result = await UserApi.updateProfile({ nickname, address });
                if (result.code === 0) {
                    const user = AuthService.getCurrentUser();
                    user.nickname = nickname;
                    user.address = address;
                    Storage.setUser(user);
                    Utils.showToast('修改成功');
                } else {
                    Utils.showToast(result.msg || '修改失败', 'error');
                }
            } catch (error) {
                Utils.showToast(error.message || '修改失败', 'error');
            }
        });

        document.getElementById('passwordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!oldPassword || !newPassword || !confirmPassword) {
                Utils.showToast('请填写完整信息', 'error');
                return;
            }

            if (newPassword.length < 6) {
                Utils.showToast('新密码长度不能少于6位', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                Utils.showToast('两次输入的新密码不一致', 'error');
                return;
            }

            try {
                const result = await UserApi.changePassword({
                    old_password: oldPassword,
                    new_password: newPassword
                });
                if (result.code === 0) {
                    Utils.showToast('密码修改成功，请重新登录');
                    setTimeout(async () => {
                        await AuthService.logout();
                        Router.navigate('login');
                    }, 1000);
                } else {
                    Utils.showToast(result.msg || '修改失败', 'error');
                }
            } catch (error) {
                Utils.showToast(error.message || '修改失败', 'error');
            }
        });
    }
};
