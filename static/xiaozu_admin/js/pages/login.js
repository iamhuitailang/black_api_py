const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo">
                        <h1>小组任务管理</h1>
                        <p>高效协作，轻松管理</p>
                    </div>
                    <form id="loginForm">
                        <div class="form-group">
                            <label>账号</label>
                            <input type="text" id="account" placeholder="用户名或邮箱" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录</button>
                    </form>
                    <div class="login-footer">
                        <p>还没有账号？<a href="javascript:void(0)" onclick="LoginPage.showRegister()">立即注册</a></p>
                    </div>
                </div>
            </div>
            <div id="registerModal"></div>
        `;

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const account = document.getElementById('account').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');

        btn.disabled = true;
        btn.textContent = '登录中...';

        const result = await AuthService.login(account, password);

        if (result.code === 0) {
            Toast.success('登录成功');
            Router.navigate('dashboard');
        } else {
            Toast.error(result.msg || '登录失败');
            btn.disabled = false;
            btn.textContent = '登录';
        }
    },

    showRegister() {
        const modal = document.getElementById('registerModal');
        modal.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target===this)LoginPage.closeRegister()">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">注册账号</span>
                        <button class="modal-close" onclick="LoginPage.closeRegister()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="registerForm">
                            <div class="form-group">
                                <label>用户名</label>
                                <input type="text" id="regUsername" placeholder="请输入用户名" required>
                            </div>
                            <div class="form-group">
                                <label>邮箱</label>
                                <input type="email" id="regEmail" placeholder="请输入邮箱" required>
                            </div>
                            <div class="form-group">
                                <label>密码</label>
                                <input type="password" id="regPassword" placeholder="请输入密码(至少6位)" required>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block">注册</button>
                        </form>
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
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        const result = await AuthService.register(username, email, password);

        if (result.code === 0) {
            Toast.success('注册成功');
            this.closeRegister();
            Router.navigate('dashboard');
        } else {
            Toast.error(result.msg || '注册失败');
        }
    },

    closeRegister() {
        document.getElementById('registerModal').innerHTML = '';
    }
};

window.LoginPage = LoginPage;
