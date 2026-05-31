const RegisterPage = {
    render() {
        document.getElementById('app').innerHTML = `
            <div class="auth-container">
                <div class="auth-box">
                    <h1>注册</h1>
                    <p class="subtitle">创建账号，开始成语接龙之旅</p>
                    <form id="registerForm">
                        <div class="form-group">
                            <label>用户名 *</label>
                            <input type="text" id="username" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label>昵称</label>
                            <input type="text" id="nickname" placeholder="请输入昵称（可选）">
                        </div>
                        <div class="form-group">
                            <label>密码 *</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">注册</button>
                    </form>
                    <p class="auth-message">已有账号？<a onclick="Router.navigate('login')">立即登录</a></p>
                    <p class="auth-back"><a onclick="Router.navigate('home')">← 返回首页</a></p>
                </div>
            </div>
        `;

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const nickname = document.getElementById('nickname').value.trim();
            const password = document.getElementById('password').value;
            if (!username || !password) { Toast.error('请填写用户名和密码'); return; }
            try {
                Loading.show();
                const res = await AuthService.register(username, password, nickname);
                Loading.hide();
                if (res.code === 0) {
                    Toast.success('注册成功！请登录');
                    setTimeout(() => Router.navigate('login'), 500);
                } else {
                    Toast.error(res.message || '注册失败');
                }
            } catch (err) {
                Loading.hide();
                Toast.error('注册失败，请重试');
            }
        });
    }
};
