const LoginPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page no-tabbar">
                <div class="login-header">
                    <div class="login-logo">⚔️</div>
                    <h1 class="login-title">遗迹守卫</h1>
                    <p class="login-subtitle">Dota 小游戏 · 选择英雄，击败敌人</p>
                </div>

                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" placeholder="请输入用户名（3-20位字母数字下划线）" maxlength="20">
                        </div>

                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码（至少6位）" maxlength="20">
                        </div>

                        <div class="form-group">
                            <button class="btn btn-primary btn-block btn-lg" id="loginBtn">登录</button>
                        </div>

                        <div class="form-group">
                            <button class="btn btn-outline btn-block" id="registerLinkBtn">注册账号</button>
                        </div>
                    </div>

                    <div class="login-links">
                        <span>新用户？<a href="javascript:;" id="registerLink">立即注册</a></span>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const loginBtn = document.getElementById('loginBtn');
        const registerLink = document.getElementById('registerLink');
        const registerLinkBtn = document.getElementById('registerLinkBtn');

        loginBtn.addEventListener('click', async () => {
            await this.handleLogin();
        });

        registerLink.addEventListener('click', () => {
            Router.navigate('register');
        });

        registerLinkBtn.addEventListener('click', () => {
            Router.navigate('register');
        });

        document.getElementById('password').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.handleLogin();
            }
        });
    },

    async handleLogin() {
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

        Utils.showLoading();

        try {
            const result = await AuthService.login(username, password);

            if (result.success) {
                Toast.success('登录成功');
                Router.navigate('home');
            } else {
                Toast.error(result.message);
            }
        } catch (error) {
            Toast.error('登录失败：' + error.message);
        } finally {
            Utils.hideLoading();
        }
    }
};
