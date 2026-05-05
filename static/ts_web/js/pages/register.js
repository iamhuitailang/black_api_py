const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page no-tabbar">
                <div class="header no-tabbar">
                    <button class="header-back" id="register-back">←</button>
                    <div class="header-title">注册账号</div>
                </div>
                <div class="login-body" style="flex: 1; border-radius: 0;">
                    <div class="login-form" style="margin-top: 20px;">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="register-phone" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称（可选）</label>
                            <input type="text" class="form-control" id="register-nickname" placeholder="请输入昵称" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="register-password" placeholder="请输入密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="register-confirm-password" placeholder="请再次输入密码">
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block btn-lg" id="register-btn">注册</button>
                    <div class="login-links">
                        <span>已有账号？<a href="#login">立即登录</a></span>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const backBtn = document.getElementById('register-back');
        const registerBtn = document.getElementById('register-btn');
        const phoneInput = document.getElementById('register-phone');
        const nicknameInput = document.getElementById('register-nickname');
        const passwordInput = document.getElementById('register-password');
        const confirmPasswordInput = document.getElementById('register-confirm-password');

        backBtn.addEventListener('click', () => {
            Router.navigate('login');
        });

        registerBtn.addEventListener('click', async () => {
            const phone = phoneInput.value.trim();
            const nickname = nicknameInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

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

            if (password !== confirmPassword) {
                Utils.showToast('两次输入的密码不一致');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.register(phone, password, nickname);
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('注册成功');
                    Router.navigate('home');
                } else {
                    Utils.showToast(result.msg || '注册失败');
                }
            } catch (e) {
                Utils.hideLoading();
                Utils.showToast('注册失败，请稍后重试');
            }
        });

        confirmPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                registerBtn.click();
            }
        });
    }
};
