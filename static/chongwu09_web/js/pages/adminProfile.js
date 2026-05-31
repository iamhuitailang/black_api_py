const AdminProfilePage = {
    async render() {
        const admin = AuthService.getCurrentAdmin() || {};
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="display:flex;min-height:100vh">
                ${AdminDashboardPage.renderSidebar('profile')}
                <div class="admin-main">
                    <div class="admin-header"><h2 class="admin-page-title">个人设置</h2></div>
                    <div style="max-width:500px">
                        <div class="card">
                            <div class="card-header"><div class="card-title">基本信息</div></div>
                            <div class="card-body">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">用户名</label>
                                    <input type="text" class="admin-form-control" value="${admin.username || ''}" disabled>
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">真实姓名</label>
                                    <input type="text" class="admin-form-control" id="adminRealName" value="${admin.real_name || ''}">
                                </div>
                                <button class="btn btn-primary btn-block" id="saveProfileBtn">保存</button>
                            </div>
                        </div>
                        <div class="card" style="margin-top:16px">
                            <div class="card-header"><div class="card-title">修改密码</div></div>
                            <div class="card-body">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">原密码</label>
                                    <input type="password" class="admin-form-control" id="adminOldPwd" placeholder="请输入原密码">
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">新密码</label>
                                    <input type="password" class="admin-form-control" id="adminNewPwd" placeholder="请输入新密码(至少6位)">
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">确认新密码</label>
                                    <input type="password" class="admin-form-control" id="adminNewPwd2" placeholder="请再次输入新密码">
                                </div>
                                <button class="btn btn-primary btn-block" id="changePwdBtn">修改密码</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        AdminDashboardPage.bindSidebar();
        document.getElementById('saveProfileBtn').addEventListener('click', async () => {
            const realName = document.getElementById('adminRealName').value.trim();
            try {
                const result = await AuthService.adminUpdateProfile({ real_name: realName });
                if (result.code === 0) Toast.success('保存成功');
                else Toast.error(result.msg);
            } catch (e) { Toast.error('保存失败'); }
        });
        document.getElementById('changePwdBtn').addEventListener('click', async () => {
            const oldPwd = document.getElementById('adminOldPwd').value;
            const newPwd = document.getElementById('adminNewPwd').value;
            const newPwd2 = document.getElementById('adminNewPwd2').value;
            if (!oldPwd || !newPwd) { Toast.error('请填写完整'); return; }
            if (newPwd.length < 6) { Toast.error('新密码至少6位'); return; }
            if (newPwd !== newPwd2) { Toast.error('两次密码不一致'); return; }
            try {
                const result = await AuthService.adminChangePassword(oldPwd, newPwd);
                if (result.code === 0) {
                    Toast.success('密码修改成功，请重新登录');
                    await AuthService.adminLogout();
                    Router.navigate('adminLogin');
                } else { Toast.error(result.msg); }
            } catch (e) { Toast.error('修改失败'); }
        });
    }
};
