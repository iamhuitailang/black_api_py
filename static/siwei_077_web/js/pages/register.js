const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">🧠</div>
                    <div class="login-title">注册账号</div>
                    <div class="login-subtitle">创建你的思维导图账号</div>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <div class="form-label">用户名</div>
                            <input type="text" id="reg-username" class="form-control" placeholder="至少3个字符" autocomplete="username">
                        </div>
                        <div class="form-group">
                            <div class="form-label">昵称</div>
                            <input type="text" id="reg-nickname" class="form-control" placeholder="选填" autocomplete="nickname">
                        </div>
                        <div class="form-group">
                            <div class="form-label">密码</div>
                            <input type="password" id="reg-password" class="form-control" placeholder="至少6位" autocomplete="new-password">
                        </div>
                        <div class="form-group">
                            <div class="form-label">确认密码</div>
                            <input type="password" id="reg-password2" class="form-control" placeholder="再次输入密码" autocomplete="new-password">
                        </div>
                        <button class="btn btn-primary btn-block" id="reg-btn" style="margin-top: 24px;">注 册</button>
                    </div>
                    <div class="login-links">
                        <a href="javascript:void(0)" id="to-login">已有账号？去登录</a>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('reg-btn').addEventListener('click', async () => {
            const username = document.getElementById('reg-username').value.trim();
            const nickname = document.getElementById('reg-nickname').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const password2 = document.getElementById('reg-password2').value.trim();

            if (!username || !password) {
                Utils.showToast('请填写用户名和密码');
                return;
            }
            if (username.length < 3) {
                Utils.showToast('用户名至少3个字符');
                return;
            }
            if (password.length < 6) {
                Utils.showToast('密码至少6位');
                return;
            }
            if (password !== password2) {
                Utils.showToast('两次密码不一致');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.register(username, password, nickname);
                if (result.code === 0) {
                    Utils.showToast('注册成功');
                    setTimeout(() => Router.navigate('home'), 500);
                } else {
                    Utils.showToast(result.msg || '注册失败');
                }
            } catch (e) {
                Utils.showToast('注册失败');
            } finally {
                Utils.hideLoading();
            }
        });

        document.getElementById('to-login').addEventListener('click', () => {
            Router.navigate('login');
        });
    }
};
