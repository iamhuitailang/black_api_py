const RegisterPage = {
    render() {
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="login-page">
                <header class="login-header">
                    <div class="login-logo">🧩</div>
                    <h1 class="login-title">趣味连连看</h1>
                    <p class="login-subtitle">注册新账号</p>
                </header>
                <main class="login-body">
                    <form id="registerForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="regUsername" placeholder="3位以上，字母数字下划线" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="regNickname" placeholder="给自己取个昵称（选填）" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="regPassword" placeholder="至少6位密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="regPassword2" placeholder="再次输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="registerBtn">注册</button>
                    </form>
                    <div class="login-links">
                        <a href="javascript:;" onclick="Router.navigate('login')">已有账号？去登录</a>
                    </div>
                </main>
            </div>
        `
        this.bindEvents()
    },

    bindEvents() {
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault()
            this.handleRegister()
        })
    },

    async handleRegister() {
        const username = document.getElementById('regUsername').value.trim()
        const nickname = document.getElementById('regNickname').value.trim()
        const password = document.getElementById('regPassword').value
        const password2 = document.getElementById('regPassword2').value
        const registerBtn = document.getElementById('registerBtn')

        if (!username) { Toast.error('请输入用户名'); return }
        if (!password) { Toast.error('请输入密码'); return }
        if (password !== password2) { Toast.error('两次密码不一致'); return }

        registerBtn.disabled = true
        registerBtn.innerHTML = '<span class="loading"></span> 注册中...'

        try {
            const result = await AuthService.register(username, password, nickname)
            if (result.code === 0) {
                Toast.success('注册成功')
                Router.navigate('home')
            } else {
                Toast.error(result.msg || '注册失败')
            }
        } catch (error) {
            Toast.error('注册失败，请检查网络')
        } finally {
            registerBtn.disabled = false
            registerBtn.innerHTML = '注册'
        }
    }
}
