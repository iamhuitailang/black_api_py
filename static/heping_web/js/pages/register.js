const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar has-header">
                <header class="header">
                    <button class="header-back" onclick="Router.back()">‹</button>
                    <h1 class="header-title">新兵注册</h1>
                </header>
                <main style="padding: 20px;">
                    <form id="registerForm">
                        <div class="form-group">
                            <label class="form-label">用户名 <span class="text-primary">*</span></label>
                            <input type="text" class="form-control" id="regUsername" placeholder="请输入用户名（3-20位）" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="regNickname" placeholder="请输入战斗昵称（选填）" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码 <span class="text-primary">*</span></label>
                            <input type="password" class="form-control" id="regPassword" placeholder="请设置密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码 <span class="text-primary">*</span></label>
                            <input type="password" class="form-control" id="regConfirmPassword" placeholder="请再次输入密码">
                        </div>
                        <div style="margin-top: 24px;">
                            <button type="submit" class="btn btn-primary btn-block" id="regBtn">注册</button>
                        </div>
                        <div style="margin-top: 16px; text-align: center;">
                            <a href="javascript:;" onclick="Router.navigate('login')" class="text-primary">已有账号？去登录</a>
                        </div>
                    </form>
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
            showToast('请输入用户名');
            return;
        }

        if (!validateUsername(username)) {
            showToast('用户名格式不正确（3-20位，字母数字下划线中文）');
            return;
        }

        if (!password) {
            showToast('请设置密码');
            return;
        }

        if (!validatePassword(password)) {
            showToast('密码至少6位');
            return;
        }

        if (password !== confirmPassword) {
            showToast('两次密码输入不一致');
            return;
        }

        regBtn.disabled = true;
        regBtn.innerHTML = '注册中...';

        try {
            const result = await AuthService.register(username, password, nickname);

            if (result.code === 0) {
                showToast('注册成功，欢迎加入战场');
                Router.navigate('home');
            } else {
                showToast(result.msg || '注册失败');
            }
        } catch (error) {
            showToast('注册失败，请检查网络');
        } finally {
            regBtn.disabled = false;
            regBtn.innerHTML = '注册';
        }
    }
};
