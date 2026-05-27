const LoginPage = {
    loginType: 'student',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">🏫</div>
                    <h1 class="login-title">校园投诉建议系统</h1>
                    <p class="login-subtitle">便捷反馈，高效处理</p>
                </div>
                <div class="login-body">
                    <div class="login-tabs">
                        <div class="login-tab ${this.loginType === 'student' ? 'active' : ''}" data-type="student">学生登录</div>
                        <div class="login-tab ${this.loginType === 'staff' ? 'active' : ''}" data-type="staff">教职工登录</div>
                        <div class="login-tab ${this.loginType === 'admin' ? 'active' : ''}" data-type="admin">管理员登录</div>
                    </div>
                    <div class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" placeholder="请输入用户名">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码">
                        </div>
                        <button class="btn btn-primary btn-block btn-lg" id="loginBtn">登录</button>
                    </div>
                    <div class="login-links">
                        <a href="javascript:void(0)" onclick="Router.navigate('register')">注册账号</a>
                        <a href="javascript:void(0)" onclick="Toast.info('请联系管理员重置密码')">忘记密码？</a>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.loginType = tab.dataset.type;
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        document.getElementById('loginBtn').addEventListener('click', async () => {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username) {
                Toast.error('请输入用户名');
                return;
            }

            if (!password) {
                Toast.error('请输入密码');
                return;
            }

            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.textContent = '登录中...';

            const result = await AuthService.login(username, password);

            if (result.code === 0) {
                Toast.success('登录成功');
                const user = result.data.user;
                if (user.role === 'admin') {
                    Router.navigate('admin');
                } else {
                    Router.navigate('home');
                }
            } else {
                Toast.error(result.msg || '登录失败');
                btn.disabled = false;
                btn.textContent = '登录';
            }
        });

        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loginBtn').click();
            }
        });
    }
};

window.LoginPage = LoginPage;