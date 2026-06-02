const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="register-page safe-bottom">
                <div class="dream-particles">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>
                <header class="register-header">
                    <button class="header-back" onclick="Router.navigate('login')">‹</button>
                    <div class="register-logo">
                        <span class="logo-glow">✨</span>
                    </div>
                    <h1 class="register-title">开启梦境之旅</h1>
                    <p class="register-subtitle">创建你的专属梦境账号</p>
                </header>
                <main class="register-body">
                    <form id="registerForm" class="register-form">
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">👤</span>
                                用户名
                            </label>
                            <input type="text" class="form-control" id="regUsername" placeholder="字母、数字、下划线，3-20位" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">🎭</span>
                                昵称
                            </label>
                            <input type="text" class="form-control" id="regNickname" placeholder="给自己取个好听的名字" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">📧</span>
                                邮箱（选填）
                            </label>
                            <input type="email" class="form-control" id="regEmail" placeholder="用于找回密码" maxlength="50">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">🔒</span>
                                密码
                            </label>
                            <input type="password" class="form-control" id="regPassword" placeholder="至少6位">
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">🔐</span>
                                确认密码
                            </label>
                            <input type="password" class="form-control" id="regConfirmPassword" placeholder="再次输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-dream" id="registerBtn">
                            <span class="btn-text">开启梦境</span>
                        </button>
                    </form>
                    <div class="register-links">
                        <a href="javascript:;" onclick="Router.navigate('login')">已有账号？去登录</a>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    },

    async handleRegister() {
        const username = document.getElementById('regUsername').value.trim();
        const nickname = document.getElementById('regNickname').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const registerBtn = document.getElementById('registerBtn');

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }

        if (!Utils.validateUsername(username)) {
            Toast.error('用户名只能包含字母、数字和下划线，长度3-20位');
            return;
        }

        if (!password) {
            Toast.error('请输入密码');
            return;
        }

        if (!Utils.validatePassword(password)) {
            Toast.error('密码至少6位');
            return;
        }

        if (password !== confirmPassword) {
            Toast.error('两次输入的密码不一致');
            return;
        }

        if (email && !Utils.validateEmail(email)) {
            Toast.error('请输入正确的邮箱格式');
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="loading"></span><span class="btn-text">创建梦境中...</span>';

        try {
            const result = await AuthService.register(username, password, nickname, email);

            if (result.code === 0) {
                Toast.success('梦境账号创建成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '注册失败');
            }
        } catch (error) {
            Toast.error('注册失败，请检查网络');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<span class="btn-text">开启梦境</span>';
        }
    }
};
