const RegisterPage = {
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
                    <div class="login-title">用户注册</div>
                    <div class="login-subtitle">创建账号，开启签到之旅</div>
                </div>
                <div class="login-body">
                    <form class="login-form" id="registerForm">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="phone" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称（选填）</label>
                            <input type="text" class="form-control" id="nickname" placeholder="请输入昵称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入密码">
                        </div>
                        <div class="form-group" style="margin-top: 32px;">
                            <button type="submit" class="btn btn-primary btn-block" id="registerBtn">注册</button>
                        </div>
                    </form>
                    <div class="login-links">
                        <a href="#login">已有账号？立即登录</a>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
    },

    async handleRegister() {
        const phone = document.getElementById('phone').value.trim();
        const nickname = document.getElementById('nickname').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

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

        if (password.length < 6) {
            Utils.showToast('密码长度至少6位');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showToast('两次密码输入不一致');
            return;
        }

        Utils.showLoading();
        try {
            const result = await AuthService.register(phone, password, nickname);
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('注册成功');
                setTimeout(() => {
                    Router.navigate('home');
                }, 500);
            } else {
                Utils.showToast(result.msg || '注册失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message || '网络错误');
        }
    }
};
