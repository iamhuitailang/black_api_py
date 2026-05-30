const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar no-header">
                <div class="hero-section" style="text-align: center; padding: 60px 20px 40px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">🔍</div>
                    <h1 class="hero-title">校园失物招领</h1>
                    <p class="hero-subtitle">帮助同学们找回丢失的物品</p>
                </div>
                <main class="container">
                    <div class="card">
                        <form id="loginForm">
                            <div class="form-group">
                                <label class="form-label">手机号 <span class="required">*</span></label>
                                <input type="tel" class="form-input" id="loginPhone" placeholder="请输入手机号" maxlength="11">
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="loginPassword" placeholder="请输入密码">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginBtn">登录</button>
                        </form>
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="javascript:;" onclick="Router.navigate('register')">还没有账号？去注册</a>
                        </div>
                        <div style="margin-top: 12px; text-align: center;">
                            <a href="javascript:;" onclick="Router.navigate('adminLogin')" style="color: var(--text-secondary); font-size: 13px;">管理员登录</a>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');

        if (!phone) {
            Toast.error('请输入手机号');
            return;
        }

        if (!Utils.validatePhone(phone)) {
            Toast.error('请输入正确的手机号');
            return;
        }

        if (!password) {
            Toast.error('请输入密码');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> 登录中...';

        try {
            const result = await AuthService.login(phone, password);

            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            Toast.error('登录失败，请检查网络');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录';
        }
    }
};

window.LoginPage = LoginPage;
