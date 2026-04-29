const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="card login-card">
                    <div class="login-logo">
                        <div class="login-logo-icon">🔄</div>
                        <h1>易技圈管理系统</h1>
                        <p>技能交换平台后台管理</p>
                    </div>
                    
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">
                                用户名 <span class="required">*</span>
                            </label>
                            <input type="text" class="form-control" id="username" 
                                   placeholder="请输入用户名" value="admin">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                密码 <span class="required">*</span>
                            </label>
                            <input type="password" class="form-control" id="password" 
                                   placeholder="请输入密码" value="admin123">
                        </div>
                        
                        <button type="submit" class="btn btn-primary" id="loginBtn">
                            登 录
                        </button>
                    </form>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');

        if (!username) {
            Toast.warning('请输入用户名');
            return;
        }

        if (!password) {
            Toast.warning('请输入密码');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> 登录中...';

        try {
            const result = await AuthService.login(username, password);
            
            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('dashboard');
            } else {
                Toast.error(result.msg || '登录失败');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '登 录';
            }
        } catch (error) {
            Toast.error(error.message || '登录失败，请稍后重试');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登 录';
        }
    }
};

window.LoginPage = LoginPage;
