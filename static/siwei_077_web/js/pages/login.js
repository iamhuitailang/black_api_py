const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">🧠</div>
                    <div class="login-title">思维导图</div>
                    <div class="login-subtitle">在线协作思维导图工具</div>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <div class="form-label">用户名</div>
                            <input type="text" id="login-username" class="form-control" placeholder="请输入用户名" autocomplete="username">
                        </div>
                        <div class="form-group">
                            <div class="form-label">密码</div>
                            <input type="password" id="login-password" class="form-control" placeholder="请输入密码" autocomplete="current-password">
                        </div>
                        <button class="btn btn-primary btn-block" id="login-btn" style="margin-top: 24px;">登 录</button>
                    </div>
                    <div class="login-links">
                        <a href="javascript:void(0)" id="to-register">没有账号？去注册</a>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('login-btn').addEventListener('click', async () => {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            if (!username || !password) {
                Utils.showToast('请填写用户名和密码');
                return;
            }
            Utils.showLoading();
            try {
                const result = await AuthService.login(username, password);
                if (result.code === 0) {
                    Utils.showToast('登录成功');
                    setTimeout(() => Router.navigate('home'), 500);
                } else {
                    Utils.showToast(result.msg || '登录失败');
                }
            } catch (e) {
                Utils.showToast('登录失败');
            } finally {
                Utils.hideLoading();
            }
        });

        document.getElementById('to-register').addEventListener('click', () => {
            Router.navigate('register');
        });

        document.getElementById('login-password').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('login-btn').click();
        });
    }
};
