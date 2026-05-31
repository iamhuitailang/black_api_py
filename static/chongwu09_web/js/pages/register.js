const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page safe-bottom">
                <header class="login-header">
                    <div class="login-logo">🐾</div>
                    <h1 class="login-title">注册账号</h1>
                    <p class="login-subtitle">加入宠托帮，给宠物最好的寄养</p>
                </header>
                <main class="login-body">
                    <form id="registerForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="regPhone" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="regPassword" placeholder="请输入密码(至少6位)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="regPassword2" placeholder="请再次输入密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="regNickname" placeholder="请输入昵称(选填)">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="registerBtn">注册</button>
                    </form>
                    <div class="login-links">
                        <a href="javascript:;" onclick="Router.navigate('login')">已有账号？去登录</a>
                    </div>
                </main>
            </div>
        `;
        this.bindEvents();
    },
    bindEvents() {
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    },
    async handleRegister() {
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const password2 = document.getElementById('regPassword2').value;
        const nickname = document.getElementById('regNickname').value.trim();
        const btn = document.getElementById('registerBtn');
        if (!phone || !Utils.validatePhone(phone)) { Toast.error('请输入正确的手机号'); return; }
        if (!password || password.length < 6) { Toast.error('密码至少6位'); return; }
        if (password !== password2) { Toast.error('两次密码不一致'); return; }
        btn.disabled = true; btn.textContent = '注册中...';
        try {
            const result = await AuthService.register(phone, password, nickname);
            if (result.code === 0) { Toast.success('注册成功'); Router.navigate('home'); }
            else { Toast.error(result.msg || '注册失败'); }
        } catch (error) { Toast.error('注册失败'); }
        finally { btn.disabled = false; btn.textContent = '注册'; }
    }
};
