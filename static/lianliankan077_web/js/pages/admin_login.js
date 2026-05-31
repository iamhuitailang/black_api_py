const AdminLoginPage = {
    render() {
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="admin-login-page">
                <header class="login-header">
                    <div class="login-logo">⚙️</div>
                    <h1 class="login-title">连连看管理后台</h1>
                </header>
                <main class="login-body">
                    <form id="adminLoginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">管理员账号</label>
                            <input type="text" class="form-control" id="adminUsername" placeholder="请输入管理员账号">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="adminPassword" placeholder="请输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="adminLoginBtn">登录</button>
                    </form>
                    <div class="login-links">
                        <a href="javascript:;" onclick="window.location.href = './index.html'">← 返回用户端</a>
                    </div>
                </main>
            </div>
        `
        this.bindEvents()
    },

    bindEvents() {
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault()
            this.handleLogin()
        })
    },

    async handleLogin() {
        const username = document.getElementById('adminUsername').value.trim()
        const password = document.getElementById('adminPassword').value
        const loginBtn = document.getElementById('adminLoginBtn')

        if (!username) { Toast.error('请输入账号'); return }
        if (!password) { Toast.error('请输入密码'); return }

        loginBtn.disabled = true
        loginBtn.innerHTML = '<span class="loading"></span> 登录中...'

        try {
            const result = await AdminAuthService.login(username, password)
            if (result.code === 0) {
                Toast.success('登录成功')
                AdminRouter.navigate('dashboard')
            } else {
                Toast.error(result.msg || '登录失败')
            }
        } catch (error) {
            Toast.error('登录失败，请检查网络')
        } finally {
            loginBtn.disabled = false
            loginBtn.innerHTML = '登录'
        }
    }
}
