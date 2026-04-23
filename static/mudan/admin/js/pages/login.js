const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="card login-card">
                    <div class="login-logo">
                        <div style="font-size: 48px;">🌸</div>
                        <h1>曹州牡丹园</h1>
                        <p>后台管理系统</p>
                    </div>
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">
                                用户名<span class="required">*</span>
                            </label>
                            <input type="text" id="username" class="form-control" placeholder="请输入用户名" autocomplete="username">
                            <div class="form-error" id="usernameError"></div>
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
                            默认账号：admin / admin123
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.bindEvents();
    },
    
    bindEvents() {
        const form = document.getElementById('loginForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        
        usernameInput.addEventListener('input', () => {
            this.clearError('username');
        });
        
        passwordInput.addEventListener('input', () => {
            this.clearError('password');
        });
        
        usernameInput.focus();
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
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        
        let hasError = false;
        
        if (!username) {
            this.showError('username', '请输入用户名');
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
            const result = await AuthService.login(username, password);
            
            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('dashboard');
            } else {
                Toast.error(result.message || '登录失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误，请稍后重试');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录';
        }
    }
};
