const LoginPage = {
    render() {
        if (AuthService.isLoggedIn()) {
            Router.navigate('dashboard');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="logo-big">🎴</div>
                        <h1>斗地主管理后台</h1>
                        <p class="auth-subtitle">请登录管理员账号</p>
                    </div>
                    <form id="loginForm" class="auth-form">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名" required />
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required />
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">登录</button>
                    </form>
                    <div class="auth-footer">
                        <span>默认账号: admin / admin123</span>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const result = await AuthService.login(username, password);
            if (result.code === 0) {
                Toast.success('登录成功');
                setTimeout(() => {
                    Router.navigate('dashboard');
                }, 1000);
            } else {
                Toast.error(result.msg || '登录失败');
            }
        });
    }
};
