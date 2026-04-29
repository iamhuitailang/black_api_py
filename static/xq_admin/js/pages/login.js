const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="card login-card">
                    <div class="login-logo">
                        <div style="font-size: 48px;">🤝</div>
                        <h1>邻里互助 · 小帮手</h1>
                        <p>后台管理系统</p>
                    </div>
                    <form class="login-form" id="loginForm">
                        <div class="form-group">
                            <label class="form-label">用户名 <span class="required">*</span></label>
                            <input type="text" class="form-control" id="username" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码 <span class="required">*</span></label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码" required>
                        </div>
                        <div class="form-group" id="errorMessage" style="display: none;">
                            <div class="form-error"></div>
                        </div>
                        <button type="submit" class="btn btn-primary" id="loginBtn">
                            登 录
                        </button>
                    </form>
                    <div class="text-center mt-2" style="color: var(--text-secondary); font-size: 12px;">
                        默认账号: admin / admin123
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        const loginBtn = document.getElementById('loginBtn');

        if (!username || !password) {
            errorDiv.querySelector('.form-error').textContent = '请输入用户名和密码';
            errorDiv.style.display = 'block';
            return;
        }

        errorDiv.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> 登录中...';

        try {
            const result = await AuthService.login(username, password);

            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('dashboard');
            } else {
                errorDiv.querySelector('.form-error').textContent = result.msg || '登录失败';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.querySelector('.form-error').textContent = '登录失败，请检查网络连接';
            errorDiv.style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登 录';
        }
    }
};
