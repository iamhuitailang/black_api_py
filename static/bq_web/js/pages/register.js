const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">📝</div>
                    <div class="login-title">注册账号</div>
                    <div class="login-subtitle">创建您的便利贴账号</div>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" placeholder="请输入用户名（2-20个字符）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="nickname" placeholder="请输入昵称（可选）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入密码">
                        </div>
                        <div class="form-group">
                            <button class="btn btn-primary btn-block" id="registerBtn">注册</button>
                        </div>
                    </div>
                    <div class="login-links">
                        <span>已有账号？</span>
                        <a href="#login">立即登录</a>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const registerBtn = document.getElementById('registerBtn');
        const usernameInput = document.getElementById('username');
        const nicknameInput = document.getElementById('nickname');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        registerBtn.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            const nickname = nicknameInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!username) {
                Utils.showToast('请输入用户名');
                return;
            }

            if (username.length < 2 || username.length > 20) {
                Utils.showToast('用户名长度应为2-20个字符');
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
                Utils.showToast('两次密码输入不一致');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.register(username, password, nickname);
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('注册成功');
                    Router.navigate('home');
                } else {
                    Utils.showToast(result.msg || '注册失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast(error.message || '注册失败');
            }
        });

        confirmPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                registerBtn.click();
            }
        });
    }
};

window.RegisterPage = RegisterPage;
