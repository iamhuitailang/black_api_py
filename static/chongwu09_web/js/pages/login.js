const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page safe-bottom">
                <header class="login-header">
                    <div class="login-logo">🐾</div>
                    <h1 class="login-title">宠物寄养 · 宠托帮</h1>
                    <p class="login-subtitle">给毛孩子一个温暖的家</p>
                </header>
                <main class="login-body">
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="loginPhone" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="loginPassword" placeholder="请输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录</button>
                    </form>
                    <div class="login-links">
                        <a href="javascript:;" onclick="Router.navigate('register')">还没有账号？去注册</a>
                        <a href="javascript:;" onclick="Router.navigate('adminLogin')">管理员入口</a>
                    </div>
                </main>
            </div>
        `;
        this.bindEvents();
    },
    bindEvents() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },
    async handleLogin() {
        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        if (!phone) { Toast.error('请输入手机号'); return; }
        if (!Utils.validatePhone(phone)) { Toast.error('请输入正确的手机号'); return; }
        if (!password) { Toast.error('请输入密码'); return; }
        loginBtn.disabled = true;
        loginBtn.textContent = '登录中...';
        try {
            const result = await AuthService.login(phone, password);
            if (result.code === 0) { Toast.success('登录成功'); Router.navigate('home'); }
            else { Toast.error(result.msg || '登录失败'); }
        } catch (error) { Toast.error('登录失败，请检查网络'); }
        finally { loginBtn.disabled = false; loginBtn.textContent = '登录'; }
    }
};
