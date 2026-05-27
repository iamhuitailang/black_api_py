const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">📚</div>
                    <div class="login-title">校园二手教材</div>
                    <div class="login-subtitle">让闲置教材流动起来</div>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名/手机号</label>
                            <input type="text" class="form-control" id="username" placeholder="请输入用户名或手机号">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码">
                        </div>
                        <button class="btn btn-primary btn-block" id="loginBtn">登录</button>
                    </div>
                    <div class="login-links">
                        <a href="#register">没有账号？立即注册</a>
                        <a href="#" id="testAccountBtn">测试账号</a>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('testAccountBtn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('username').value = 'buyer001';
            document.getElementById('password').value = '123456';
        });

        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
    },

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username) {
            Toast.error('请输入用户名或手机号');
            return;
        }
        if (!password) {
            Toast.error('请输入密码');
            return;
        }

        Utils.showLoading();
        try {
            const result = await AuthService.login(username, password);
            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (e) {
            Toast.error('登录失败，请重试');
        } finally {
            Utils.hideLoading();
        }
    }
};

window.LoginPage = LoginPage;
