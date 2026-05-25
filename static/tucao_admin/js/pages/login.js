const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo">📮</div>
                    <h1 class="login-title">匿名吐槽箱</h1>
                    <p class="login-subtitle">后台管理系统</p>
                    
                    <form class="login-form" onsubmit="LoginPage.handleLogin(event)">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <button type="submit" class="btn-login">登 录</button>
                    </form>
                    
                    <div class="login-footer">
                        <p>默认账号: admin / admin123</p>
                    </div>
                </div>
            </div>
        `;
    },

    async handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            Toast.warning('请输入用户名和密码');
            return;
        }

        try {
            const result = await AuthService.login(username, password);
            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('dashboard');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            Toast.error(error.message || '登录失败');
        }
    }
};
