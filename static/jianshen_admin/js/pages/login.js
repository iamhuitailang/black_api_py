const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-brand">
                        <div class="logo">💪</div>
                        <h1>健身打卡管理系统</h1>
                        <p>管理员登录</p>
                    </div>
                    <form class="login-form" id="login-form">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名" value="admin" autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" value="123456" autocomplete="current-password">
                        </div>
                        <button type="submit" class="btn btn-primary">登 录</button>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            if (!username || !password) {
                Toast.error('请输入用户名和密码');
                return;
            }
            try {
                const res = await AuthService.login(username, password);
                if (res.code === 0) {
                    Toast.success('登录成功');
                    setTimeout(() => Router.navigate('dashboard'), 300);
                } else {
                    Toast.error(res.msg);
                }
            } catch (e) {
                Toast.error('登录失败，请检查网络');
            }
        });
    }
};
