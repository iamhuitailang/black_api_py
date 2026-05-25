const LoginPage = {
    render() {
        if (AuthService.isLoggedIn()) {
            Router.navigate('home');
            return;
        }
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-page">
                <div class="auth-header">
                    <div class="logo">💪</div>
                    <h1>健身打卡</h1>
                    <p>坚持运动，遇见更好的自己</p>
                </div>
                <div class="auth-card">
                    <h2>欢迎回来</h2>
                    <form id="login-form">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名" autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" autocomplete="current-password">
                        </div>
                        <button type="submit" class="btn btn-primary">登 录</button>
                    </form>
                </div>
                <div class="auth-footer">
                    还没有账号？ <a href="#register">立即注册</a>
                </div>
            </div>
        `;
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            if (!username || !password) { Toast.error('请输入用户名和密码'); return; }
            try {
                const res = await AuthService.login(username, password);
                if (res.code === 0) {
                    Toast.success('登录成功');
                    setTimeout(() => Router.navigate('home'), 400);
                } else {
                    Toast.error(res.msg);
                }
            } catch (e) {
                Toast.error('登录失败');
            }
        });
    }
};
