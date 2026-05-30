const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-container">
                <div class="card auth-card">
                    <div class="auth-logo">
                        <div class="logo-icon">🎪</div>
                        <h1>多人同步杂耍</h1>
                        <p>注册新账号</p>
                    </div>
                    <form class="auth-form" id="registerForm">
                        <div class="form-group">
                            <label class="form-label">用户名 <span class="required">*</span></label>
                            <input type="text" class="form-control" id="username" placeholder="3-20个字符" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="nickname" placeholder="可选">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码 <span class="required">*</span></label>
                            <input type="password" class="form-control" id="password" placeholder="至少6位" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码 <span class="required">*</span></label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="再次输入密码" required>
                        </div>
                        <div class="form-group" id="errorMessage" style="display: none;">
                            <div class="form-error"></div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-lg" id="registerBtn">
                            注 册
                        </button>
                    </form>
                    <div class="auth-switch">
                        已有账号? <a href="#login">立即登录</a>
                    </div>
                </div>
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
        const username = document.getElementById('username').value.trim();
        const nickname = document.getElementById('nickname').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('errorMessage');
        const registerBtn = document.getElementById('registerBtn');

        if (!username || !password || !confirmPassword) {
            errorDiv.querySelector('.form-error').textContent = '请填写所有必填项';
            errorDiv.style.display = 'block';
            return;
        }

        if (password !== confirmPassword) {
            errorDiv.querySelector('.form-error').textContent = '两次输入的密码不一致';
            errorDiv.style.display = 'block';
            return;
        }

        errorDiv.style.display = 'none';
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="loading"></span> 注册中...';

        try {
            const result = await AuthService.register(username, password, nickname);

            if (result.code === 0) {
                Toast.success('注册成功，请登录');
                Router.navigate('login');
            } else {
                errorDiv.querySelector('.form-error').textContent = result.msg || '注册失败';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.querySelector('.form-error').textContent = '注册失败，请检查网络连接';
            errorDiv.style.display = 'block';
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '注 册';
        }
    }
};

window.RegisterPage = RegisterPage;
