const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo">
                        <h1>注册账号</h1>
                        <p>加入高效协作</p>
                    </div>
                    <form id="registerForm">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label>邮箱</label>
                            <input type="email" id="email" placeholder="请输入邮箱" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="至少6位" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="registerBtn">注册</button>
                    </form>
                    <div class="login-footer">
                        <p>已有账号？<a href="#login">立即登录</a></p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    },

    async handleRegister() {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('registerBtn');

        btn.disabled = true;
        btn.textContent = '注册中...';

        const result = await AuthService.register(username, email, password);

        if (result.code === 0) {
            Toast.success('注册成功');
            Router.navigate('home');
        } else {
            Toast.error(result.msg || '注册失败');
            btn.disabled = false;
            btn.textContent = '注册';
        }
    }
};

window.RegisterPage = RegisterPage;
