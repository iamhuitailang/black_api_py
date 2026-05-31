const LoginPage = {
    render() {
        document.getElementById('app').innerHTML = `
            <div class="auth-container">
                <div class="auth-box">
                    <h1>登录</h1>
                    <p class="subtitle">欢迎回来！请登录您的账号</p>
                    <form id="loginForm">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">登录</button>
                    </form>
                    <p class="auth-message">还没有账号？<a onclick="Router.navigate('register')">立即注册</a></p>
                    <p class="auth-back"><a onclick="Router.navigate('home')">← 返回首页</a></p>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            if (!username || !password) { Toast.error('请填写用户名和密码'); return; }
            try {
                Loading.show();
                const res = await AuthService.login(username, password);
                Loading.hide();
                if (res.code === 0) {
                    Toast.success('登录成功！');
                    setTimeout(() => Router.navigate('home'), 500);
                } else {
                    Toast.error(res.message || '登录失败');
                }
            } catch (err) {
                Loading.hide();
                Toast.error('登录失败，请重试');
            }
        });
    }
};
