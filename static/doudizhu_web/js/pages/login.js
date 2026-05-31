const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h1>🎴 斗地主</h1>
                        <p class="auth-subtitle">登录开始游戏</p>
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
                        <span>还没有账号？</span>
                        <a href="#/register" class="auth-link">立即注册</a>
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
                    window.location.hash = '#/home';
                }, 1000);
            } else {
                Toast.error(result.msg || '登录失败');
            }
        });
    }
};
