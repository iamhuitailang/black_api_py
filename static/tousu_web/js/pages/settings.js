const SettingsPage = {
    async render() {
        const app = document.getElementById('app');
        const user = AuthService.getUser();

        app.innerHTML = `
            <div class="page has-header">
                ${Layout.renderHeader('账号设置', true)}

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">个人信息</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" value="${user?.username || ''}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="nickname" value="${user?.nickname || ''}" placeholder="请输入昵称">
                        </div>
                        <button class="btn btn-primary btn-block" id="saveProfileBtn">保存修改</button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">修改密码</h3>
                    </div>
                    <div class="card-body">
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
                            <input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入新密码">
                        </div>
                        <button class="btn btn-primary btn-block" id="changePasswordBtn">修改密码</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('saveProfileBtn').addEventListener('click', async () => {
            const nickname = document.getElementById('nickname').value.trim();

            try {
                const result = await ApiService.post('/tousu/user/profile/update', { nickname });
                if (result.code === 0) {
                    const user = Storage.getUser();
                    user.nickname = result.data.nickname;
                    Storage.setUser(user);
                    Toast.success('保存成功');
                } else {
                    Toast.error(result.msg || '保存失败');
                }
            } catch (error) {
                Toast.error('保存失败');
            }
        });

        document.getElementById('changePasswordBtn').addEventListener('click', async () => {
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!oldPassword) {
                Toast.error('请输入原密码');
                return;
            }

            if (!newPassword || newPassword.length < 6) {
                Toast.error('新密码至少6位');
                return;
            }

            if (newPassword !== confirmPassword) {
                Toast.error('两次密码输入不一致');
                return;
            }

            try {
                const result = await ApiService.post('/tousu/user/password/change', {
                    old_password: oldPassword,
                    new_password: newPassword
                });

                if (result.code === 0) {
                    Toast.success('密码修改成功，请重新登录');
                    setTimeout(() => {
                        AuthService.logout();
                        Router.navigate('login');
                    }, 1500);
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (error) {
                Toast.error('修改失败');
            }
        });
    }
};

window.SettingsPage = SettingsPage;