const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page no-tabbar">
                <div class="login-header">
                    <div class="login-logo">🏃</div>
                    <div class="login-title">跃动人生</div>
                    <div class="login-subtitle">记录每一次跳跃，遇见更好的自己</div>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="login-phone" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="login-password" placeholder="请输入密码">
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block btn-lg" id="login-btn">登录</button>
                    <div class="login-links">
                        <span>还没有账号？<a href="#register">立即注册</a></span>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const loginBtn = document.getElementById('login-btn');
        const phoneInput = document.getElementById('login-phone');
        const passwordInput = document.getElementById('login-password');

        loginBtn.addEventListener('click', async () => {
            const phone = phoneInput.value.trim();
            const password = passwordInput.value;

            if (!phone) {
                Utils.showToast('请输入手机号');
                return;
            }

            if (!Utils.isValidPhone(phone)) {
                Utils.showToast('手机号格式不正确');
                return;
            }

            if (!password) {
                Utils.showToast('请输入密码');
                return;
            }

            if (password.length < 6) {
                Utils.showToast('密码长度至少6位');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.login(phone, password);
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('登录成功');
                    Router.navigate('home');
                } else {
                    Utils.showToast(result.msg || '登录失败');
                }
            } catch (e) {
                Utils.hideLoading();
                Utils.showToast('登录失败，请稍后重试');
            }
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }
};
