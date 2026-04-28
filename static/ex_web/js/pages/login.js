var LoginPage = {
    render: function() {
        var params = Router.getParams();
        var redirect = params.redirect || '/';
        
        var app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <div class="login-logo">🔄</div>
                    <h1 class="login-title">换享</h1>
                    <p class="login-subtitle">以物换物，让闲置流动起来</p>
                </div>
                <div class="login-form">
                    <div class="form-group">
                        <div class="input-box">
                            <span class="prefix-icon">📱</span>
                            <input type="tel" class="form-control" id="phone" placeholder="请输入手机号" maxlength="11">
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-box">
                            <span class="prefix-icon">🔒</span>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码">
                        </div>
                    </div>
                    <div class="form-group mt-4">
                        <button type="button" class="btn btn-primary btn-block btn-round" id="loginBtn">登录</button>
                    </div>
                </div>
                <div class="login-footer">
                    还没有账号？
                    <a href="#/register">立即注册</a>
                </div>
            </div>
        `;
        
        this.bindEvents(redirect);
    },
    
    bindEvents: function(redirect) {
        var self = this;
        var loginBtn = document.getElementById('loginBtn');
        var phoneInput = document.getElementById('phone');
        var passwordInput = document.getElementById('password');
        
        loginBtn.addEventListener('click', function() {
            var phone = phoneInput.value.trim();
            var password = passwordInput.value;
            
            if (!phone) {
                Toast.error('请输入手机号');
                return;
            }
            
            if (!/^1[3-9]\d{9}$/.test(phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }
            
            if (!password) {
                Toast.error('请输入密码');
                return;
            }
            
            if (password.length < 6) {
                Toast.error('密码至少6位');
                return;
            }
            
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="loading-small"></span> 登录中...';
            
            Auth.login(phone, password)
                .then(function() {
                    Toast.success('登录成功');
                    setTimeout(function() {
                        Router.navigate(decodeURIComponent(redirect));
                    }, 500);
                })
                .catch(function(error) {
                    Toast.error(error.message || '登录失败');
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '登录';
                });
        });
    }
};
