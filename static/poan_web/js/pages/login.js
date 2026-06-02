const LoginPage = {
    template: `
        <div class="auth-page safe-bottom">
            <div class="auth-header">
                <div class="auth-logo">🔍</div>
                <h1 class="auth-title">时光侦探</h1>
                <p class="auth-subtitle">穿越时空，揭开历史迷雾</p>
            </div>
            <div class="auth-body">
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input type="text" class="form-control" id="loginUsername" placeholder="请输入用户名" maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" class="form-control" id="loginPassword" placeholder="请输入密码">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block btn-glow" id="loginBtn">登录</button>
                </form>
                <div class="auth-links">
                    <a href="javascript:;" onclick="Router.navigate('register')">还没有账号？去注册</a>
                </div>
                <div class="auth-tip">
                    <p>💡 提示：登录后即可开始探案之旅，穿越不同历史时期破解奇案。收集线索、询问证人、还原真相，成为最强时光侦探！</p>
                </div>
            </div>
        </div>
    `,

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.template;
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

        if (username.length < 3) {
            Toast.error('用户名至少3个字符');
            return;
        }

        if (!password) {
            Toast.error('请输入密码');
            return;
        }

        if (password.length < 6) {
            Toast.error('密码至少6个字符');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> 登录中...';

        try {
            const result = await AuthService.login(username, password);

            if (result.code === 0) {
                Toast.success('登录成功，欢迎回来，侦探！');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            console.error('Login error:', error);
            Toast.error('登录失败，请检查网络');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录';
        }
    }
};

window.LoginPage = LoginPage;
