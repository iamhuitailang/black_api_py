const LoginPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">🎉</div>
                    <h1 class="login-title">同城活动</h1>
                    <p class="login-subtitle">发现身边精彩，遇见志同道合</p>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <input type="tel" id="loginPhone" class="form-control" placeholder="请输入手机号" maxlength="11">
                        </div>
                        <div class="form-group">
                            <input type="password" id="loginPassword" class="form-control" placeholder="请输入密码">
                        </div>
                        <button class="btn btn-primary btn-block" id="loginBtn" style="padding: 14px;">登 录</button>
                    </div>
                    <div class="login-links">
                        <a href="javascript:void(0)" onclick="Router.navigate('register')">还没有账号？去注册</a>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('loginBtn').addEventListener('click', async () => {
            const phone = document.getElementById('loginPhone').value.trim();
            const password = document.getElementById('loginPassword').value;
            if (!Utils.validatePhone(phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }
            if (!password) {
                Toast.error('请输入密码');
                return;
            }
            Loading.show();
            try {
                const result = await AuthService.login(phone, password);
                if (result.code === 0) {
                    Toast.success('登录成功');
                    Router.navigate('home');
                } else {
                    Toast.error(result.msg || '登录失败');
                }
            } catch (e) {
                Toast.error('登录失败，请重试');
            } finally {
                Loading.hide();
            }
        });
    }
};
