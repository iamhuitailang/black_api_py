const AdminLoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page safe-bottom">
                <header class="login-header">
                    <div class="login-logo">⚙️</div>
                    <h1 class="login-title">管理后台</h1>
                    <p class="login-subtitle">宠物寄养系统管理端</p>
                </header>
                <main class="login-body">
                    <form id="adminLoginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="adminUsername" placeholder="请输入用户名" value="admin">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="adminPassword" placeholder="请输入密码" value="admin123">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录</button>
                    </form>
                    <div class="login-links">
                        <a href="javascript:;" onclick="Router.navigate('login')">← 返回用户端</a>
                    </div>
                </main>
            </div>
        `;
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const btn = document.getElementById('loginBtn');
        if (!username || !password) { Toast.error('请输入用户名和密码'); return; }
        btn.disabled = true; btn.textContent = '登录中...';
        try {
            const result = await AuthService.adminLogin(username, password);
            if (result.code === 0) { Toast.success('登录成功'); Router.navigate('adminDashboard'); }
            else { Toast.error(result.msg || '登录失败'); }
        } catch (e) { Toast.error('登录失败'); }
        finally { btn.disabled = false; btn.textContent = '登录'; }
    }
};
