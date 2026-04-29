const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-logo">
                    <div class="auth-logo-icon">🔄</div>
                    <h1 class="auth-title">易技圈</h1>
                    <p class="auth-subtitle">技能交换平台</p>
                </div>

                <div class="auth-card">
                    <h2 class="auth-card-title">注册</h2>

                    <form id="register-form" class="auth-form">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" id="phone" class="form-control" placeholder="请输入手机号" maxlength="11">
                        </div>

                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" id="nickname" class="form-control" placeholder="请输入昵称" maxlength="20">
                        </div>

                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" id="password" class="form-control" placeholder="请输入密码（至少6位）">
                        </div>

                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" id="confirm_password" class="form-control" placeholder="请再次输入密码">
                        </div>

                        <button type="submit" class="btn btn-primary btn-block btn-lg" id="register-btn">
                            注册
                        </button>
                    </form>

                    <div class="auth-footer">
                        <span>已有账号？</span>
                        <a href="#login" class="auth-link">立即登录</a>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('register-form');
        const registerBtn = document.getElementById('register-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phone = document.getElementById('phone').value.trim();
            const nickname = document.getElementById('nickname').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            if (!phone) {
                Toast.error('请输入手机号');
                return;
            }

            if (!/^1[3-9]\d{9}$/.test(phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }

            if (!nickname) {
                Toast.error('请输入昵称');
                return;
            }

            if (!password) {
                Toast.error('请输入密码');
                return;
            }

            if (password.length < 6) {
                Toast.error('密码至少6位');
                return;
            }

            if (password !== confirmPassword) {
                Toast.error('两次输入的密码不一致');
                return;
            }

            registerBtn.disabled = true;
            registerBtn.innerHTML = '<span class="loading"></span> 注册中...';

            try {
                const result = await AuthService.register(phone, password, nickname);

                if (result.code === 0) {
                    Toast.success('注册成功');
                    Router.navigate('home');
                } else {
                    Toast.error(result.msg || '注册失败');
                }
            } catch (error) {
                Toast.error(error.message || '网络错误');
            } finally {
                registerBtn.disabled = false;
                registerBtn.innerHTML = '注册';
            }
        });
    }
};

window.RegisterPage = RegisterPage;
