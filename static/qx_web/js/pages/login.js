const LoginPage = {
    render: function() {
        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = `
            <div class="grid justify-center" style="grid-template-columns: minmax(300px, 400px);">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title text-center">🚴 登录骑行搭子</h3>
                    </div>
                    <div class="card-body">
                        <form id="login-form">
                            <div class="form-group">
                                <label class="form-label">手机号 <span class="required">*</span></label>
                                <input type="tel" class="form-input" id="phone" name="phone" placeholder="请输入手机号" maxlength="11">
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="password" name="password" placeholder="请输入密码">
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-green btn-lg w-full" id="login-btn">登录</button>
                            </div>
                            <div class="text-center">
                                还没有账号？<a href="?page=register" data-route="register">立即注册</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    },
    setupEventListeners: function() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('login-btn');

            if (!phone) {
                App.showToast('请输入手机号', 'error');
                return;
            }

            if (!/^1[3-9]\d{9}$/.test(phone)) {
                App.showToast('请输入正确的手机号', 'error');
                return;
            }

            if (!password) {
                App.showToast('请输入密码', 'error');
                return;
            }

            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';

            try {
                const result = await Auth.login(phone, password);
                
                if (result.code === 0) {
                    App.showToast('登录成功', 'success');
                    App.updateUserInfo();
                    setTimeout(() => {
                        Router.go('home');
                    }, 500);
                } else {
                    App.showToast(result.msg || '登录失败', 'error');
                }
            } catch (error) {
                App.showToast('登录失败，请稍后重试', 'error');
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = '登录';
            }
        });
    }
};

Router.register('login', function(params) {
    if (Auth.isLoggedIn()) {
        Router.go('home');
        return;
    }
    LoginPage.render();
});
