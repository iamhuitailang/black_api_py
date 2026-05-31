const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h1>🎴 斗地主</h1>
                        <p class="auth-subtitle">创建新账号</p>
                    </div>
                    <form id="registerForm" class="auth-form">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" id="username" placeholder="请输入用户名" required />
                        </div>
                        <div class="form-group">
                            <label>昵称</label>
                            <input type="text" id="nickname" placeholder="请输入昵称" />
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required />
                        </div>
                        <div class="form-group">
                            <label>确认密码</label>
                            <input type="password" id="confirmPassword" placeholder="请确认密码" required />
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">注册</button>
                    </form>
                    <div class="auth-footer">
                        <span>已有账号？</span>
                        <a href="#/login" class="auth-link">立即登录</a>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const nickname = document.getElementById('nickname').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                Toast.error('两次输入的密码不一致');
                return;
            }

            const result = await AuthService.register(username, password, nickname);
            if (result.code === 0) {
                Toast.success('注册成功，请登录');
                setTimeout(() => {
                    window.location.hash = '#/login';
                }, 1000);
            } else {
                Toast.error(result.msg || '注册失败');
            }
        });
    }
};
