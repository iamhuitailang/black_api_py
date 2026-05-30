const SettingsPage = {
    user: null,

    async render() {
        const app = document.getElementById('app');
        this.user = AuthService.getCurrentUser() || {};

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                ${Header.render('设置', true)}
                <main class="container">
                    <div class="card">
                        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">个人信息</h3>
                        <form id="profileForm">
                            <div class="form-group">
                                <label class="form-label">昵称</label>
                                <input type="text" class="form-input" id="nickname" value="${this.user.nickname || ''}" placeholder="请输入昵称">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">学号</label>
                                    <input type="text" class="form-input" id="studentId" value="${this.user.student_id || ''}" placeholder="请输入学号">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">学院</label>
                                    <input type="text" class="form-input" id="college" value="${this.user.college || ''}" placeholder="请输入学院">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">手机号</label>
                                <input type="tel" class="form-input" id="phone" value="${this.user.phone || ''}" placeholder="请输入手机号" readonly style="background: var(--gray-light);">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block" id="saveProfileBtn">保存修改</button>
                        </form>
                    </div>

                    <div class="card" style="margin-top: 16px;">
                        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">修改密码</h3>
                        <form id="passwordForm">
                            <div class="form-group">
                                <label class="form-label">原密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="oldPassword" placeholder="请输入原密码">
                            </div>
                            <div class="form-group">
                                <label class="form-label">新密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="newPassword" placeholder="请输入新密码（至少6位）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认新密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="confirmPassword" placeholder="请再次输入新密码">
                            </div>
                            <button type="submit" class="btn btn-outline btn-block" id="changePasswordBtn">修改密码</button>
                        </form>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdateProfile();
        });

        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePassword();
        });
    },

    async handleUpdateProfile() {
        const nickname = document.getElementById('nickname').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const college = document.getElementById('college').value.trim();
        const saveBtn = document.getElementById('saveProfileBtn');

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> 保存中...';

        try {
            const result = await AuthService.updateProfile({
                nickname,
                student_id: studentId,
                college
            });

            if (result.code === 0) {
                Toast.success('保存成功');
            } else {
                Toast.error(result.msg || '保存失败');
            }
        } catch (error) {
            Toast.error('保存失败，请检查网络');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '保存修改';
        }
    },

    async handleChangePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const changeBtn = document.getElementById('changePasswordBtn');

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
            Toast.error('两次密码输入不一致');
            return;
        }

        changeBtn.disabled = true;
        changeBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> 修改中...';

        try {
            const result = await AuthService.changePassword(oldPassword, newPassword);

            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录');
                document.getElementById('oldPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
                setTimeout(() => {
                    AuthService.logout();
                    Router.navigate('login');
                }, 1500);
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (error) {
            Toast.error('修改失败，请检查网络');
        } finally {
            changeBtn.disabled = false;
            changeBtn.innerHTML = '修改密码';
        }
    }
};

window.SettingsPage = SettingsPage;
