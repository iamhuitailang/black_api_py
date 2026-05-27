const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-card">
                    <div class="login-logo">
                        <div class="login-logo-icon">📚</div>
                        <div class="login-logo-title">二手教材管理系统</div>
                    </div>
                    <form class="login-form" id="loginForm">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <div id="loginError" style="color:red;font-size:14px;margin-top:10px;display:none;"></div>
                        <button type="submit" class="btn btn-primary btn-block">登录</button>
                    </form>
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
            const errorEl = document.getElementById('loginError');
            errorEl.style.display = 'none';

            try {
                Layout.showLoading();
                const result = await AuthService.login(username, password);
                if (result.code === 0) {
                    if (Toast && Toast.success) {
                        Toast.success('登录成功');
                    }
                    setTimeout(() => {
                        Router.navigate('dashboard');
                    }, 500);
                } else {
                    errorEl.textContent = result.msg || '登录失败';
                    errorEl.style.display = 'block';
                }
            } catch (error) {
                errorEl.textContent = error.message || '登录失败';
                errorEl.style.display = 'block';
            } finally {
                Layout.hideLoading();
            }
        });
    }
};
