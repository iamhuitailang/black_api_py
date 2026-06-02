const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page safe-bottom">
                <div class="dream-particles">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>
                <header class="login-header">
                    <div class="login-logo">
                        <span class="logo-glow">🌙</span>
                    </div>
                    <h1 class="login-title">梦境世界</h1>
                    <p class="login-subtitle">Dream World · 探索无限可能</p>
                </header>
                <main class="login-body">
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">👤</span>
                                用户名
                            </label>
                            <input type="text" class="form-control" id="loginUsername" placeholder="请输入用户名" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">🔒</span>
                                密码
                            </label>
                            <input type="password" class="form-control" id="loginPassword" placeholder="请输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-dream" id="loginBtn">
                            <span class="btn-text">进入梦境</span>
                        </button>
                    </form>
                    <div class="login-links">
                        <a href="javascript:;" onclick="Router.navigate('register')">还没有账号？去注册</a>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }

        if (!Utils.validateUsername(username)) {
            Toast.error('用户名只能包含字母、数字和下划线，长度3-20位');
            return;
        }

        if (!password) {
            Toast.error('请输入密码');
            return;
        }

        if (!Utils.validatePassword(password)) {
            Toast.error('密码至少6位');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span><span class="btn-text">进入梦境中...</span>';

        try {
            const result = await AuthService.login(username, password);

            if (result.code === 0) {
                Toast.success('欢迎来到梦境世界');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            Toast.error('登录失败，请检查网络');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span class="btn-text">进入梦境</span>';
        }
    }
};
