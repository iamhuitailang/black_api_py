const Toast = {
    container: null,
    
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <div class="login-logo">🛒</div>
                    <h1>赶大集</h1>
                    <p>农村集市信息服务平台</p>
                </div>
                
                <div class="login-content">
                    <div class="login-tabs">
                        <div class="login-tab active" data-tab="login">登录</div>
                        <div class="login-tab" data-tab="register">注册</div>
                    </div>
                    
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" id="loginPhone" class="form-control" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" id="loginPassword" class="form-control" placeholder="请输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">
                            登录
                        </button>
                        <div class="forgot-password">
                            <a href="javascript:;" onclick="LoginPage.showResetModal()">忘记密码？</a>
                        </div>
                    </form>
                    
                    <form id="registerForm" class="login-form hidden">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" id="regPhone" class="form-control" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">验证码</label>
                            <div class="flex gap-1">
                                <input type="text" id="regCode" class="form-control" placeholder="请输入验证码" maxlength="6" style="flex:1;">
                                <button type="button" class="btn btn-outline-primary btn-sm" id="sendCodeBtn">发送</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" id="regNickname" class="form-control" placeholder="请输入昵称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" id="regPassword" class="form-control" placeholder="请设置密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" id="regConfirmPassword" class="form-control" placeholder="请再次输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="registerBtn">
                            注册
                        </button>
                    </form>
                </div>
            </div>
            
            <div id="toastContainer" class="toast-container"></div>
        `;
        
        this.bindEvents();
    },
    
    bindEvents() {
        const loginTabs = document.querySelectorAll('.login-tab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        loginTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                loginTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (targetTab === 'login') {
                    loginForm.classList.remove('hidden');
                    registerForm.classList.add('hidden');
                } else {
                    loginForm.classList.add('hidden');
                    registerForm.classList.remove('hidden');
                }
            });
        });
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        const sendCodeBtn = document.getElementById('sendCodeBtn');
        sendCodeBtn.addEventListener('click', () => {
            this.sendVerifyCode();
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
        
        if (!/^1\d{10}$/.test(phone)) {
            Toast.error('手机号格式不正确');
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
                Router.navigate('market');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误，请稍后重试');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录';
        }
    },
    
    async handleRegister() {
        const phone = document.getElementById('regPhone').value.trim();
        const code = document.getElementById('regCode').value.trim();
        const nickname = document.getElementById('regNickname').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const registerBtn = document.getElementById('registerBtn');
        
        if (!phone || !/^1\d{10}$/.test(phone)) {
            Toast.error('请输入正确的手机号');
            return;
        }
        
        if (!code) {
            Toast.error('请输入验证码');
            return;
        }
        
        if (!nickname) {
            Toast.error('请输入昵称');
            return;
        }
        
        if (!password || password.length < 6) {
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
            const result = await AuthService.register({
                phone,
                verify_code: code,
                nickname,
                password
            });
            
            if (result.code === 0) {
                Toast.success('注册成功，请登录');
                document.querySelectorAll('.login-tab')[0].click();
                document.getElementById('loginPhone').value = phone;
            } else {
                Toast.error(result.msg || '注册失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '注册';
        }
    },
    
    async sendVerifyCode() {
        const phone = document.getElementById('regPhone').value.trim();
        const sendCodeBtn = document.getElementById('sendCodeBtn');
        
        if (!phone || !/^1\d{10}$/.test(phone)) {
            Toast.error('请输入正确的手机号');
            return;
        }
        
        if (sendCodeBtn.disabled) return;
        
        sendCodeBtn.disabled = true;
        let countdown = 60;
        sendCodeBtn.textContent = `${countdown}s`;
        
        const timer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(timer);
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = '发送';
            } else {
                sendCodeBtn.textContent = `${countdown}s`;
            }
        }, 1000);
        
        Toast.success('验证码已发送（演示：666666）');
    },
    
    showResetModal() {
        const modalHtml = `
            <div class="modal-overlay show" id="resetModal">
                <div class="modal">
                    <div class="modal-header">
                        <div class="modal-title">重置密码</div>
                        <button class="modal-close" onclick="LoginPage.closeResetModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" id="resetPhone" class="form-control" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">验证码</label>
                            <div class="flex gap-1">
                                <input type="text" id="resetCode" class="form-control" placeholder="请输入验证码" maxlength="6" style="flex:1;">
                                <button type="button" class="btn btn-outline-primary btn-sm" id="resetSendCodeBtn">发送</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input type="password" id="resetNewPassword" class="form-control" placeholder="请设置新密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认新密码</label>
                            <input type="password" id="resetConfirmPassword" class="form-control" placeholder="请再次输入新密码">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="LoginPage.closeResetModal()">取消</button>
                        <button class="btn btn-primary" onclick="LoginPage.handleResetPassword()">确认重置</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('resetSendCodeBtn').addEventListener('click', () => {
            this.sendResetCode();
        });
    },
    
    closeResetModal() {
        const modal = document.getElementById('resetModal');
        if (modal) {
            modal.remove();
        }
    },
    
    async sendResetCode() {
        const phone = document.getElementById('resetPhone').value.trim();
        const sendCodeBtn = document.getElementById('resetSendCodeBtn');
        
        if (!phone || !/^1\d{10}$/.test(phone)) {
            Toast.error('请输入正确的手机号');
            return;
        }
        
        sendCodeBtn.disabled = true;
        let countdown = 60;
        sendCodeBtn.textContent = `${countdown}s`;
        
        const timer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(timer);
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = '发送';
            } else {
                sendCodeBtn.textContent = `${countdown}s`;
            }
        }, 1000);
        
        Toast.success('验证码已发送（演示：666666）');
    },
    
    async handleResetPassword() {
        const phone = document.getElementById('resetPhone').value.trim();
        const code = document.getElementById('resetCode').value.trim();
        const newPassword = document.getElementById('resetNewPassword').value;
        const confirmPassword = document.getElementById('resetConfirmPassword').value;
        
        if (!phone || !/^1\d{10}$/.test(phone)) {
            Toast.error('请输入正确的手机号');
            return;
        }
        
        if (!code) {
            Toast.error('请输入验证码');
            return;
        }
        
        if (!newPassword || newPassword.length < 6) {
            Toast.error('新密码至少6位');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Toast.error('两次输入的密码不一致');
            return;
        }
        
        try {
            const result = await AuthService.resetPassword(phone, code, newPassword);
            
            if (result.code === 0) {
                Toast.success('密码重置成功，请重新登录');
                this.closeResetModal();
            } else {
                Toast.error(result.msg || '重置失败');
            }
        } catch (error) {
            Toast.error(error.message || '网络错误');
        }
    }
};
