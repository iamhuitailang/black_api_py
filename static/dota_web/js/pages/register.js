const RegisterPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page no-tabbar">
                <div class="login-header">
                    <div class="login-logo">⚔️</div>
                    <h1 class="login-title">账号注册</h1>
                    <p class="login-subtitle">创建您的遗迹守卫账号</p>
                </div>

                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" placeholder="3-20位字母数字下划线" maxlength="20">
                        </div>

                        <div class="form-group">
                            <label class="form-label">昵称（可选）</label>
                            <input type="text" class="form-control" id="nickname" placeholder="您的游戏昵称" maxlength="20">
                        </div>

                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="至少6位" maxlength="20">
                        </div>

                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="再次输入密码" maxlength="20">
                        </div>

                        <div class="form-group">
                            <button class="btn btn-primary btn-block btn-lg" id="registerBtn">注册</button>
                        </div>

                        <div class="form-group">
                            <button class="btn btn-outline btn-block" id="loginLinkBtn">返回登录</button>
                        </div>
                    </div>

                    <div class="login-links">
                        <span>已有账号？<a href="javascript:;" id="loginLink">立即登录</a></span>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const registerBtn = document.getElementById('registerBtn');
        const loginLink = document.getElementById('loginLink');
        const loginLinkBtn = document.getElementById('loginLinkBtn');

        registerBtn.addEventListener('click', async () => {
            await this.handleRegister();
        });

        loginLink.addEventListener('click', () => {
            Router.navigate('login');
        });

        loginLinkBtn.addEventListener('click', () => {
            Router.navigate('login');
        });

        document.getElementById('confirmPassword').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.handleRegister();
            }
        });
    },

    async handleRegister() {
        const username = document.getElementById('username').value.trim();
        const nickname = document.getElementById('nickname').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            Toast.error('用户名格式不正确（3-20位字母数字下划线）');
            return;
        }

        if (!password || password.length < 6) {
            Toast.error('密码长度至少6位');
            return;
        }

        if (password !== confirmPassword) {
            Toast.error('两次输入的密码不一致');
            return;
        }

        Utils.showLoading();

        try {
            const result = await AuthService.register(username, password, nickname);

            if (result.success) {
                Toast.success('注册成功');
                Router.navigate('home');
            } else {
                Toast.error(result.message);
            }
        } catch (error) {
            Toast.error('注册失败：' + error.message);
        } finally {
            Utils.hideLoading();
        }
    }
};
