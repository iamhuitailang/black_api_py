const RegisterPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">🎉</div>
                    <h1 class="login-title">加入我们</h1>
                    <p class="login-subtitle">注册账号，发现同城精彩活动</p>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <input type="tel" id="regPhone" class="form-control" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <input type="password" id="regPassword" class="form-control" placeholder="请输入密码(至少6位)">
                        </div>
                        <div class="form-group">
                            <input type="password" id="regPassword2" class="form-control" placeholder="请确认密码">
                        </div>
                        <div class="form-group">
                            <input type="text" id="regNickname" class="form-control" placeholder="昵称(选填)">
                        </div>
                        <div class="form-group">
                            <input type="text" id="regCity" class="form-control" placeholder="所在城市(选填)">
                        </div>
                        <button class="btn btn-primary btn-block" id="regBtn" style="padding: 14px;">注 册</button>
                    </div>
                    <div class="login-links">
                        <a href="javascript:void(0)" onclick="Router.navigate('login')">已有账号？去登录</a>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('regBtn').addEventListener('click', async () => {
            const phone = document.getElementById('regPhone').value.trim();
            const password = document.getElementById('regPassword').value;
            const password2 = document.getElementById('regPassword2').value;
            const nickname = document.getElementById('regNickname').value.trim();
            const city = document.getElementById('regCity').value.trim();
            if (!Utils.validatePhone(phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }
            if (password.length < 6) {
                Toast.error('密码至少6位');
                return;
            }
            if (password !== password2) {
                Toast.error('两次密码不一致');
                return;
            }
            Loading.show();
            try {
                const result = await AuthService.register(phone, password, nickname, city);
                if (result.code === 0) {
                    Toast.success('注册成功');
                    Router.navigate('home');
                } else {
                    Toast.error(result.msg || '注册失败');
                }
            } catch (e) {
                Toast.error('注册失败，请重试');
            } finally {
                Loading.hide();
            }
        });
    }
};
