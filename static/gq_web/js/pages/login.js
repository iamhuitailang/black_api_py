const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page safe-bottom">
                <header class="login-header">
                    <div class="login-logo">🎹</div>
                    <h1 class="login-title">魔法钢琴师</h1>
                    <p class="login-subtitle">弹奏钢琴，创造魔法</p>
                </header>
                <main class="login-body">
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="loginUsername" placeholder="请输入用户名">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="loginPassword" placeholder="请输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录</button>
                    </form>
                    <div class="login-links">
                        <a href="javascript:;" onclick="Router.navigate('register')">还没有账号？去注册</a>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }

        if (!Utils.validateUsername(username)) {
            Toast.error('用户名格式不正确（3-20位字母数字下划线）');
            return;
        }

        if (!password) {
            Toast.error('请输入密码');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> 登录中...';

        try {
            const result = await AuthService.login(username, password);

            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            Toast.error('登录失败，请检查网络');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录';
        }
    }
};
