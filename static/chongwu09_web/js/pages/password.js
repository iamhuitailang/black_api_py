const PasswordPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar has-header">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">修改密码</h1>
                </header>
                <div style="padding:16px">
                    <form id="passwordForm">
                        <div class="form-group">
                            <label class="form-label">原密码</label>
                            <input type="password" class="form-control" id="oldPassword" placeholder="请输入原密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input type="password" class="form-control" id="newPassword" placeholder="请输入新密码(至少6位)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认新密码</label>
                            <input type="password" class="form-control" id="newPassword2" placeholder="请再次输入新密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="submitBtn">确认修改</button>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    },

    async handleSubmit() {
        const oldPwd = document.getElementById('oldPassword').value;
        const newPwd = document.getElementById('newPassword').value;
        const newPwd2 = document.getElementById('newPassword2').value;
        if (!oldPwd) { Toast.error('请输入原密码'); return; }
        if (!newPwd || newPwd.length < 6) { Toast.error('新密码至少6位'); return; }
        if (newPwd !== newPwd2) { Toast.error('两次密码不一致'); return; }
        const btn = document.getElementById('submitBtn');
        btn.disabled = true; btn.textContent = '修改中...';
        try {
            const result = await AuthService.changePassword(oldPwd, newPwd);
            if (result.code === 0) {
                Toast.success('密码修改成功，请重新登录');
                await AuthService.logout();
                Router.navigate('login');
            } else { Toast.error(result.msg || '修改失败'); }
        } catch (e) { Toast.error('修改失败'); }
        finally { btn.disabled = false; btn.textContent = '确认修改'; }
    }
};
