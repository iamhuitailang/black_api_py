const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page safe-bottom">
                <header class="login-header">
                    <div class="login-logo">🎹</div>
                    <h1 class="login-title">魔法钢琴师</h1>
                    <p class="login-subtitle">成为魔法钢琴师</p>
                </header>
                <main class="login-body">
                    <form id="registerForm" class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名 <span class="text-primary">*</span></label>
                            <input type="text" class="form-control" id="regUsername" placeholder="请输入用户名（3-20位字母数字下划线）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="regNickname" placeholder="请输入昵称（可选）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码 <span class="text-primary">*</span></label>
                            <input type="password" class="form-control" id="regPassword" placeholder="请输入密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码 <span class="text-primary">*</span></label>
                            <input type="password" class="form-control" id="regConfirmPassword" placeholder="请再次输入密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="regBtn">注册</button>
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
        const regBtn = document.getElementById('regBtn');

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

        if (!Utils.validatePassword(password)) {
            Toast.error('密码至少6位');
            return;
        }

        if (password !== confirmPassword) {
            Toast.error('两次密码输入不一致');
            return;
        }

        regBtn.disabled = true;
        regBtn.innerHTML = '<span class="loading"></span> 注册中...';

        try {
            const result = await AuthService.register(username, password, nickname);

            if (result.code === 0) {
                Toast.success('注册成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '注册失败');
            }
        } catch (error) {
            Toast.error('注册失败，请检查网络');
        } finally {
            regBtn.disabled = false;
            regBtn.innerHTML = '注册';
        }
    }
};
