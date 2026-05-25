const ChangePasswordPage = {
    render() {
        const app = document.getElementById('app');
        app.className = 'page has-header no-tabbar';
        app.innerHTML = `
            <div class="header">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">修改密码</div>
            </div>
            <div style="padding: 16px;">
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label class="form-label">原密码 <span style="color: #ef4444;">*</span></label>
                        <input type="password" class="form-input" id="oldPassword" placeholder="请输入原密码" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">新密码 <span style="color: #ef4444;">*</span></label>
                        <input type="password" class="form-input" id="newPassword" placeholder="请输入新密码（至少6位）" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">确认新密码 <span style="color: #ef4444;">*</span></label>
                        <input type="password" class="form-input" id="confirmPassword" placeholder="请再次输入新密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" id="submitBtn">确认修改</button>
                </form>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('changePasswordForm').onsubmit = async (e) => {
            e.preventDefault();

            const oldPassword = document.getElementById('oldPassword').value.trim();
            const newPassword = document.getElementById('newPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            if (!oldPassword) {
                Utils.showToast('请输入原密码');
                return;
            }
            if (newPassword.length < 6) {
                Utils.showToast('新密码至少6位');
                return;
            }
            if (newPassword !== confirmPassword) {
                Utils.showToast('两次输入的新密码不一致');
                return;
            }

            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.textContent = '修改中...';

            try {
                const result = await AuthService.changePassword(oldPassword, newPassword);
                if (result.code === 0) {
                    Utils.showToast('密码修改成功，请重新登录');
                    setTimeout(async () => {
                        await AuthService.logout();
                        Router.navigate('login');
                    }, 1000);
                } else {
                    Utils.showToast(result.msg);
                }
            } catch (error) {
                Utils.showToast('修改失败，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '确认修改';
            }
        };
    }
};
