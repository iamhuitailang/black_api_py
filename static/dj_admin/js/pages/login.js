const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="card login-card">
                    <div class="login-logo">
                        <div style="font-size: 48px;">🛒</div>
                        <h1>赶大集</h1>
                        <p>后台管理系统</p>
                    </div>
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">
                                手机号<span class="required">*</span>
                            </label>
                            <input type="text" id="phone" class="form-control" placeholder="请输入手机号" autocomplete="username">
                            <div class="form-error" id="phoneError"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                密码<span class="required">*</span>
                            </label>
                            <input type="password" id="password" class="form-control" placeholder="请输入密码" autocomplete="current-password">
                            <div class="form-error" id="passwordError"></div>
                        </div>
                        <div class="form-group mt-2">
                            <button type="submit" id="loginBtn" class="btn btn-primary">
                                登录
                            </button>
                        </div>
                        <div class="text-center mt-2" style="color: var(--text-light); font-size: 12px;">
                            默认账号：13800138000 / admin123
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.bindEvents();
    },
    
    bindEvents() {
        const form = document.getElementById('loginForm');
        const phoneInput = document.getElementById('phone');
        const passwordInput = document.getElementById('password');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        
        phoneInput.addEventListener('input', () => {
            this.clearError('phone');
        });
        
        passwordInput.addEventListener('input', () => {
            this.clearError('password');
        });
        
        phoneInput.focus();
    },
    
    clearError(field) {
        const errorEl = document.getElementById(field + 'Error');
        if (errorEl) {
            errorEl.textContent = '';
        }
        const inputEl = document.getElementById(field);
        if (inputEl) {
            inputEl.style.borderColor = '';
        }
    },
    
    showError(field, message) {
        const errorEl = document.getElementById(field + 'Error');
        if (errorEl) {
            errorEl.textContent = message;
        }
        const inputEl = document.getElementById(field);
        if (inputEl) {
            inputEl.style.borderColor = 'var(--danger-color)';
        }
    },
    
    async handleLogin() {
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        
        let hasError = false;
        
        if (!phone) {
            this.showError('phone', '请输入手机号');
            hasError = true;
        } else if (!phone.match(/^1\d{10}$/)) {
            this.showError('phone', '手机号格式不正确');
            hasError = true;
        }
        
        if (!password) {
            this.showError('password', '请输入密码');
            hasError = true;
        }
        
        if (hasError) return;
        
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> 登录中...';
        
        try {
            const result = await AuthService.login(phone, password);
            
            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('dashboard');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误，请稍后重试');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录';
        }
    }
};
