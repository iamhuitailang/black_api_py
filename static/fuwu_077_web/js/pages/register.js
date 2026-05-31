const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <h1 class="login-title">注册账号</h1>
                    <p class="login-subtitle">创建您的家政服务账号</p>

                    <form id="registerForm" class="login-form">
                        <div class="form-group">
                            <label>手机号</label>
                            <input type="tel" id="phone" placeholder="请输入手机号" required>
                        </div>
                        <div class="form-group">
                            <label>昵称</label>
                            <input type="text" id="nickname" placeholder="请输入昵称">
                        </div>
                        <div class="form-group">
                            <label>常住地址</label>
                            <input type="text" id="address" placeholder="请输入常住地址">
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码（至少6位）" required>
                        </div>
                        <div class="form-group">
                            <label>确认密码</label>
                            <input type="password" id="confirmPassword" placeholder="请再次输入密码" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">注册</button>
                    </form>

                    <div class="login-footer">
                        <p>已有账号？<a href="#login">立即登录</a></p>
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

            const phone = document.getElementById('phone').value;
            const nickname = document.getElementById('nickname').value;
            const address = document.getElementById('address').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!phone || !password || !confirmPassword) {
                Utils.showToast('请填写所有必填项', 'error');
                return;
            }

            if (password.length < 6) {
                Utils.showToast('密码长度不能少于6位', 'error');
                return;
            }

            if (password !== confirmPassword) {
                Utils.showToast('两次输入的密码不一致', 'error');
                return;
            }

            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
                Utils.showToast('请输入正确的手机号', 'error');
                return;
            }

            try {
                await AuthService.register(phone, password, nickname, address);
                Utils.showToast('注册成功，自动登录');
                setTimeout(() => Router.navigate('home'), 1000);
            } catch (error) {
                Utils.showToast(error.message, 'error');
            }
        });
    }
};
