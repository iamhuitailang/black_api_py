const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo">
                        <h1>小组任务管理</h1>
                        <p>高效协作，轻松管理</p>
                    </div>
                    <form id="loginForm">
                        <div class="form-group">
                            <label>账号</label>
                            <input type="text" id="account" placeholder="用户名或邮箱" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录</button>
                    </form>
                    <div class="login-footer">
                        <p>还没有账号？<a href="#register">立即注册</a></p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const account = document.getElementById('account').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');

        btn.disabled = true;
        btn.textContent = '登录中...';

        const result = await AuthService.login(account, password);

        if (result.code === 0) {
            Toast.success('登录成功');
            Router.navigate('home');
        } else {
            Toast.error(result.msg || '登录失败');
            btn.disabled = false;
            btn.textContent = '登录';
        }
    }
};

window.LoginPage = LoginPage;
