const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">📝</div>
                    <div class="login-title">便利贴</div>
                    <div class="login-subtitle">轻量级在线便签工具</div>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" placeholder="请输入用户名" autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码" autocomplete="current-password">
                        </div>
                        <div class="form-group">
                            <button class="btn btn-primary btn-block" id="loginBtn">登录</button>
                        </div>
                    </div>
                    <div class="login-links">
                        <span>还没有账号？</span>
                        <a href="#register">立即注册</a>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const loginBtn = document.getElementById('loginBtn');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        loginBtn.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username) {
                Utils.showToast('请输入用户名');
                return;
            }

            if (!password) {
                Utils.showToast('请输入密码');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.login(username, password);
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('登录成功');
                    Router.navigate('home');
                } else {
                    Utils.showToast(result.msg || '登录失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast(error.message || '登录失败');
            }
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }
};

window.LoginPage = LoginPage;
