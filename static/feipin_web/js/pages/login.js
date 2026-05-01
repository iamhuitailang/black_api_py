const LoginPage = {
    isLoginMode: true,
    isCollectorMode: false,

    render() {
        const html = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">♻️</div>
                    <h1 class="login-title">回收宝</h1>
                    <p class="login-subtitle">让废品变废为宝</p>
                </div>
                <div class="login-body">
                    <form class="login-form" id="loginForm">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="phone" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="nickname" placeholder="请输入昵称" style="display: none;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码">
                        </div>
                        <div class="form-group" id="confirmPasswordGroup" style="display: none;">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submitBtn">
                            登录
                        </button>
                    </form>
                    
                    <div class="login-switch">
                        <span class="login-switch-text">
                            <span id="switchText">还没有账号？</span>
                            <a href="javascript:void(0)" class="login-switch-link" id="switchMode">
                                立即注册
                            </a>
                        </span>
                    </div>
                    
                    <div class="login-switch" style="margin-top: 8px;">
                        <span class="login-switch-text">
                            <a href="javascript:void(0)" class="login-switch-link" id="switchRole">
                                切换到回收员登录
                            </a>
                        </span>
                    </div>

                    <div style="margin-top: 24px; padding: 16px; background-color: var(--bg-color); border-radius: var(--radius-md);">
                        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">测试账号：</p>
                        <p style="font-size: 12px; color: var(--text-secondary);">普通用户: 13800138001 / 123456</p>
                        <p style="font-size: 12px; color: var(--text-secondary);">回收员: 13800138002 / 123456</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('app').innerHTML = html;
        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        const switchMode = document.getElementById('switchMode');
        const switchRole = document.getElementById('switchRole');
        const nicknameInput = document.getElementById('nickname');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const switchText = document.getElementById('switchText');
        const submitBtn = document.getElementById('submitBtn');

        switchMode.addEventListener('click', () => {
            this.isLoginMode = !this.isLoginMode;
            if (this.isLoginMode) {
                nicknameInput.style.display = 'none';
                confirmPasswordGroup.style.display = 'none';
                switchText.textContent = '还没有账号？';
                switchMode.textContent = '立即注册';
                submitBtn.textContent = '登录';
            } else {
                nicknameInput.style.display = 'block';
                confirmPasswordGroup.style.display = 'block';
                switchText.textContent = '已有账号？';
                switchMode.textContent = '立即登录';
                submitBtn.textContent = '注册';
            }
        });

        switchRole.addEventListener('click', () => {
            this.isCollectorMode = !this.isCollectorMode;
            switchRole.textContent = this.isCollectorMode ? 
                '切换到用户登录' : '切换到回收员登录';
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const nickname = document.getElementById('nickname').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value;

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

            if (password.length < 6) {
                Toast.error('密码至少6位');
                return;
            }

            if (!this.isLoginMode) {
                if (!nickname) {
                    Toast.error('请输入昵称');
                    return;
                }

                if (password !== confirmPassword) {
                    Toast.error('两次密码输入不一致');
                    return;
                }

                const result = await Auth.register(phone, password, nickname);
                if (result.code === 200) {
                    Toast.success('注册成功，请登录');
                    this.isLoginMode = true;
                    nicknameInput.style.display = 'none';
                    confirmPasswordGroup.style.display = 'none';
                    switchText.textContent = '还没有账号？';
                    switchMode.textContent = '立即注册';
                    submitBtn.textContent = '登录';
                } else {
                    Toast.error(result.msg || '注册失败');
                }
            } else {
                try {
                    const result = await Auth.login(phone, password);
                    if (result.code === 200) {
                        Toast.success('登录成功');
                        setTimeout(() => {
                            Router.navigate('home');
                        }, 500);
                    } else {
                        Toast.error(result.msg || '登录失败');
                    }
                } catch (e) {
                    Toast.error('登录失败，请稍后重试');
                }
            }
        });
    }
};
