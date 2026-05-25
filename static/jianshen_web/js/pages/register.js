const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-page">
                <div class="auth-header">
                    <div class="logo">💪</div>
                    <h1>加入我们</h1>
                    <p>开启你的健身之旅</p>
                </div>
                <div class="auth-card">
                    <h2>创建账号</h2>
                    <form id="reg-form">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名（至少3位）">
                        </div>
                        <div class="form-group">
                            <label>昵称</label>
                            <input type="text" id="nickname" placeholder="请输入昵称（可选）">
                        </div>
                        <div class="form-group">
                            <label>邮箱</label>
                            <input type="email" id="email" placeholder="请输入邮箱（可选）">
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码（至少6位）">
                        </div>
                        <button type="submit" class="btn btn-primary">注 册</button>
                    </form>
                </div>
                <div class="auth-footer">
                    已有账号？ <a href="#login">立即登录</a>
                </div>
            </div>
        `;
        document.getElementById('reg-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const nickname = document.getElementById('nickname').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            if (!username || username.length < 3) { Toast.error('用户名至少3位'); return; }
            if (!password || password.length < 6) { Toast.error('密码至少6位'); return; }
            try {
                const res = await AuthService.register(username, password, nickname, email);
                if (res.code === 0) {
                    Storage.setToken(res.data.token);
                    Storage.setUser(res.data.user);
                    Toast.success('注册成功');
                    setTimeout(() => Router.navigate('home'), 400);
                } else {
                    Toast.error(res.msg);
                }
            } catch (e) {
                Toast.error('注册失败');
            }
        });
    }
};
