const LoginPage = {
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
                    <h2 class="auth-card-title">登录</h2>

                    <form id="login-form" class="auth-form">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" id="phone" class="form-control" placeholder="请输入手机号" maxlength="11">
                        </div>

                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" id="password" class="form-control" placeholder="请输入密码">
                        </div>

                        <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-btn">
                            登录
                        </button>
                    </form>

                    <div class="auth-footer">
                        <span>还没有账号？</span>
                        <a href="#register" class="auth-link">立即注册</a>
                    </div>
                </div>

                <div class="auth-desc">
                    <p>无现金 · 纯技能互换</p>
                    <p>发布「我会A，想学B」，智能匹配促成交换</p>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('login-form');
        const loginBtn = document.getElementById('login-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;

            if (!phone) {
                Toast.error('请输入手机号');
                return;
            }

            if (!/^1[3-9]\d{9}$/.test(phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }

            if (!password) {
                Toast.error('请输入密码');
                return;
            }

            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="loading"></span> 登录中...';

            try {
                const result = await AuthService.login(phone, password);

                if (result.code === 0) {
                    Toast.success('登录成功');
                    Router.navigate('home');
                } else {
                    Toast.error(result.msg || '登录失败');
                }
            } catch (error) {
                Toast.error(error.message || '网络错误');
            } finally {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '登录';
            }
        });
    }
};

window.LoginPage = LoginPage;
