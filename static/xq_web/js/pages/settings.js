const SettingsPage = {
    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser() || {};

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">‹</button>
                    <h1 class="header-title">设置</h1>
                </header>

                <div class="list" style="margin: 12px;">
                    <div class="list-item" onclick="SettingsPage.showEditProfile()">
                        <div class="list-item-content">
                            <div class="list-item-title">编辑资料</div>
                            <div class="list-item-desc">修改昵称、小区</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                </div>

                <div class="list" style="margin: 12px;">
                    <div class="list-item" onclick="SettingsPage.showChangePassword()">
                        <div class="list-item-content">
                            <div class="list-item-title">修改密码</div>
                            <div class="list-item-desc">修改登录密码</div>
                        </div>
                        <span class="list-item-arrow">›</span>
                    </div>
                </div>

                <div style="padding: 20px;">
                    <button class="btn btn-danger btn-block" onclick="SettingsPage.logout()">退出登录</button>
                </div>
            </div>

            <div class="modal-overlay" id="editModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">编辑资料</h3>
                        <button class="modal-close" onclick="SettingsPage.closeEditModal()">&times;</button>
                    </div>
                    <form id="editForm">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">昵称</label>
                                <input type="text" class="form-control" id="editNickname" value="${user.nickname || ''}" placeholder="请输入昵称">
                            </div>
                            <div class="form-group">
                                <label class="form-label">小区名称</label>
                                <input type="text" class="form-control" id="editCommunity" value="${user.community || ''}" placeholder="请输入小区名称">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="SettingsPage.closeEditModal()">取消</button>
                            <button type="submit" class="btn btn-primary" id="saveEditBtn">保存</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="modal-overlay" id="passwordModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">修改密码</h3>
                        <button class="modal-close" onclick="SettingsPage.closePasswordModal()">&times;</button>
                    </div>
                    <form id="passwordForm">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">原密码 <span class="text-primary">*</span></label>
                                <input type="password" class="form-control" id="oldPassword" placeholder="请输入原密码">
                            </div>
                            <div class="form-group">
                                <label class="form-label">新密码 <span class="text-primary">*</span></label>
                                <input type="password" class="form-control" id="newPassword" placeholder="请输入新密码（至少6位）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认新密码 <span class="text-primary">*</span></label>
                                <input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入新密码">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="SettingsPage.closePasswordModal()">取消</button>
                            <button type="submit" class="btn btn-primary" id="savePasswordBtn">确认修改</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
    },

    showEditProfile() {
        document.getElementById('editModal').classList.add('show');
    },

    closeEditModal() {
        document.getElementById('editModal').classList.remove('show');
    },

    showChangePassword() {
        document.getElementById('passwordModal').classList.add('show');
    },

    closePasswordModal() {
        document.getElementById('passwordModal').classList.remove('show');
    },

    async saveProfile() {
        const nickname = document.getElementById('editNickname').value.trim();
        const community = document.getElementById('editCommunity').value.trim();
        const saveBtn = document.getElementById('saveEditBtn');

        if (!nickname && !community) {
            Toast.error('请至少填写一项');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading"></span> 保存中...';

        try {
            const data = {};
            if (nickname) data.nickname = nickname;
            if (community) data.community = community;

            const result = await AuthService.updateProfile(data);

            if (result.code === 0) {
                Toast.success('修改成功');
                this.closeEditModal();
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (error) {
            console.error('修改资料失败:', error);
            Toast.error('修改失败，请检查网络');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '保存';
        }
    },

    async changePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const saveBtn = document.getElementById('savePasswordBtn');

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

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading"></span> 修改中...';

        try {
            const result = await AuthService.changePassword(oldPassword, newPassword);

            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录');
                this.closePasswordModal();
                setTimeout(() => {
                    AuthService.logout();
                    Router.navigate('login');
                }, 1000);
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            Toast.error('修改失败，请检查网络');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '确认修改';
        }
    },

    async logout() {
        if (!confirm('确定退出登录吗？')) return;

        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            console.error('退出登录失败:', error);
            Storage.removeToken();
            Storage.removeUser();
            Router.navigate('login');
        }
    }
};
