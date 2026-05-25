const LoginPage = {
    render() {
        const app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">📮</div>
                    <h1 class="auth-title">匿名吐槽箱</h1>
                    <p class="auth-subtitle">登录你的账号</p>
                    
                    <form class="auth-form" onsubmit="LoginPage.handleLogin(event)">
                        <div class="form-group">
                            <input type="text" id="username" placeholder="用户名" required>
                        </div>
                        <div class="form-group">
                            <input type="password" id="password" placeholder="密码" required>
                        </div>
                        <button type="submit" class="btn-auth">登 录</button>
                    </form>
                    
                    <div class="auth-footer">
                        <p>还没有账号？<a href="#register">立即注册</a></p>
                    </div>
                    
                    <div class="auth-back" onclick="Router.navigate('home')">
                        ← 返回首页
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
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            Toast.error(error.message || '登录失败');
        }
    }
};
