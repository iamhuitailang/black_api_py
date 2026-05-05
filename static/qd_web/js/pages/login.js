const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.getTemplate();
        this.bindEvents();
    },

    getTemplate() {
        return `
            <div class="page login-page no-tabbar">
                <div class="login-header">
                    <div class="login-logo">📅</div>
                    <div class="login-title">每日签到</div>
                    <div class="login-subtitle">坚持签到，领取更多奖励</div>
                </div>
                <div class="login-body">
                    <form class="login-form" id="loginForm">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="phone" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码">
                        </div>
                        <div class="form-group" style="margin-top: 32px;">
                            <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录</button>
                        </div>
                    </form>
                    <div class="login-links">
                        <a href="#register">还没有账号？立即注册</a>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    },

    async handleLogin() {
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;

        if (!phone) {
            Utils.showToast('请输入手机号');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            Utils.showToast('手机号格式不正确');
            return;
        }

        if (!password) {
            Utils.showToast('请输入密码');
            return;
        }

        Utils.showLoading();
        try {
            const result = await AuthService.login(phone, password);
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('登录成功');
                setTimeout(() => {
                    Router.navigate('home');
                }, 500);
            } else {
                Utils.showToast(result.msg || '登录失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message || '网络错误');
        }
    }
};
