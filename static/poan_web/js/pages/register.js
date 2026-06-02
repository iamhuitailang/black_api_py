const RegisterPage = {
    template: `
        <div class="auth-page safe-bottom">
            <div class="auth-header">
                <div class="auth-logo">📝</div>
                <h1 class="auth-title">加入时光侦探</h1>
                <p class="auth-subtitle">成为时空案件的破解者</p>
            </div>
            <div class="auth-body">
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input type="text" class="form-control" id="regUsername" placeholder="3-20个字符，字母数字下划线" maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input type="text" class="form-control" id="regNickname" placeholder="请输入您的侦探昵称" maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" class="form-control" id="regPassword" placeholder="至少6个字符">
                    </div>
                    <div class="form-group">
                        <label class="form-label">确认密码</label>
                        <input type="password" class="form-control" id="regConfirmPassword" placeholder="请再次输入密码">
                    </div>
                    <button type="submit" class="btn btn-secondary btn-block" id="registerBtn">注册账号</button>
                </form>
                <div class="auth-links">
                    <a href="javascript:;" onclick="Router.navigate('login')">已有账号？去登录</a>
                </div>
                <div class="auth-tip">
                    <p>🎯 注册成功后，您将获得：</p>
                    <p style="margin-top: 8px;">• 免费体验所有入门案件<br>• 完整的探案记录保存<br>• 侦探等级成长系统</p>
                </div>
            </div>
        </div>
    `,

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.template;
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
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const registerBtn = document.getElementById('registerBtn');

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }

        if (username.length < 3 || username.length > 20) {
            Toast.error('用户名长度为3-20个字符');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            Toast.error('用户名只能包含字母、数字和下划线');
            return;
        }

        if (!nickname) {
            Toast.error('请输入昵称');
            return;
        }

        if (nickname.length > 20) {
            Toast.error('昵称最多20个字符');
            return;
        }

        if (!password) {
            Toast.error('请输入密码');
            return;
        }

        if (password.length < 6) {
            Toast.error('密码至少6个字符');
            return;
        }

        if (password !== confirmPassword) {
            Toast.error('两次输入的密码不一致');
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="loading"></span> 注册中...';

        try {
            const result = await AuthService.register(username, password, nickname);

            if (result.code === 0) {
                Toast.success('注册成功，欢迎加入时光侦探！');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '注册失败');
            }
        } catch (error) {
            console.error('Register error:', error);
            Toast.error('注册失败，请检查网络');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '注册账号';
        }
    }
};

window.RegisterPage = RegisterPage;
