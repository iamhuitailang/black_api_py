const LoginPage = {
    name: 'login',
    requiresAuth: false,
    template: `
        <div class="login-page">
            <div class="login-header">
                <div class="login-logo">🏔️</div>
                <div class="login-title">一起去野</div>
                <div class="login-subtitle">探索自然 · 遇见伙伴</div>
            </div>
            <div class="login-body">
                <form class="login-form" id="loginForm">
                    <div class="form-group">
                        <input type="tel" class="form-control" id="loginPhone" placeholder="请输入手机号" maxlength="11">
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" id="loginPassword" placeholder="请输入密码">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginBtn">登录</button>
                </form>
                <div class="login-links">
                    <span class="text-secondary">还没有账号？</span>
                    <a href="#register">立即注册</a>
                </div>
            </div>
        </div>
    `,

    init() {
        const form = document.getElementById('loginForm');
        const phoneInput = document.getElementById('loginPhone');
        const passwordInput = document.getElementById('loginPassword');
        const loginBtn = document.getElementById('loginBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = phoneInput.value.trim();
            const password = passwordInput.value.trim();

            if (!phone) {
                Utils.showToast('请输入手机号');
                return;
            }
            if (!/^1[3-9]\d{9}$/.test(phone)) {
                Utils.showToast('请输入正确的手机号');
                return;
            }
            if (!password) {
                Utils.showToast('请输入密码');
                return;
            }
            if (password.length < 6) {
                Utils.showToast('密码长度不能少于6位');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.login(phone, password);
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('登录成功');
                    Router.navigate('home');
                } else {
                    Utils.showToast(result.msg || '登录失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('网络错误，请重试');
                console.error('Login error:', error);
            }
        });
    }
};

const RegisterPage = {
    name: 'register',
    requiresAuth: false,
    template: `
        <div class="login-page">
            <div class="login-header">
                <div class="login-logo">🌿</div>
                <div class="login-title">加入我们</div>
                <div class="login-subtitle">开启你的户外之旅</div>
            </div>
            <div class="login-body">
                <form class="login-form" id="registerForm">
                    <div class="form-group">
                        <input type="tel" class="form-control" id="regPhone" placeholder="请输入手机号" maxlength="11">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-control" id="regNickname" placeholder="请输入昵称（选填）">
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" id="regPassword" placeholder="请设置密码（至少6位）">
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" id="regConfirmPassword" placeholder="请再次输入密码">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block btn-lg" id="registerBtn">注册</button>
                </form>
                <div class="login-links">
                    <span class="text-secondary">已有账号？</span>
                    <a href="#login">立即登录</a>
                </div>
            </div>
        </div>
    `,

    init() {
        const form = document.getElementById('registerForm');
        const phoneInput = document.getElementById('regPhone');
        const nicknameInput = document.getElementById('regNickname');
        const passwordInput = document.getElementById('regPassword');
        const confirmPasswordInput = document.getElementById('regConfirmPassword');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = phoneInput.value.trim();
            const nickname = nicknameInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            if (!phone) {
                Utils.showToast('请输入手机号');
                return;
            }
            if (!/^1[3-9]\d{9}$/.test(phone)) {
                Utils.showToast('请输入正确的手机号');
                return;
            }
            if (!password) {
                Utils.showToast('请设置密码');
                return;
            }
            if (password.length < 6) {
                Utils.showToast('密码长度不能少于6位');
                return;
            }
            if (password !== confirmPassword) {
                Utils.showToast('两次输入的密码不一致');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.register(phone, password, nickname || undefined);
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('注册成功');
                    Router.navigate('home');
                } else {
                    Utils.showToast(result.msg || '注册失败');
                }
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('网络错误，请重试');
                console.error('Register error:', error);
            }
        });
    }
};
