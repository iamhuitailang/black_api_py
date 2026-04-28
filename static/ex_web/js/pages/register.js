var RegisterPage = {
    render: function() {
        var app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="header">
                    <div class="header-left">
                        <button class="header-btn" onclick="Router.navigate('/login')">
                            <span>←</span>
                        </button>
                    </div>
                    <div class="header-title">注册账号</div>
                    <div class="header-right"></div>
                </div>
                <div class="login-header" style="padding-top: 30px;">
                    <div class="login-logo">🔄</div>
                    <h1 class="login-title" style="font-size: 20px;">加入换享</h1>
                    <p class="login-subtitle">让闲置物品流转起来</p>
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
                            <span class="prefix-icon">👤</span>
                            <input type="text" class="form-control" id="nickname" placeholder="请输入昵称">
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-box">
                            <span class="prefix-icon">🔒</span>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码（至少6位）">
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-box">
                            <span class="prefix-icon">🔒</span>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="请确认密码">
                        </div>
                    </div>
                    <div class="form-group mt-4">
                        <button type="button" class="btn btn-primary btn-block btn-round" id="registerBtn">注册并登录</button>
                    </div>
                </div>
                <div class="login-footer">
                    已有账号？
                    <a href="#/login">立即登录</a>
                </div>
            </div>
        `;
        
        this.bindEvents();
    },
    
    bindEvents: function() {
        var self = this;
        var registerBtn = document.getElementById('registerBtn');
        
        registerBtn.addEventListener('click', function() {
            var phone = document.getElementById('phone').value.trim();
            var nickname = document.getElementById('nickname').value.trim();
            var password = document.getElementById('password').value;
            var confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!phone) {
                Toast.error('请输入手机号');
                return;
            }
            
            if (!/^1[3-9]\d{9}$/.test(phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }
            
            if (!nickname) {
                Toast.error('请输入昵称');
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
            
            if (password !== confirmPassword) {
                Toast.error('两次密码输入不一致');
                return;
            }
            
            registerBtn.disabled = true;
            registerBtn.innerHTML = '<span class="loading-small"></span> 注册中...';
            
            Auth.register(phone, password, nickname)
                .then(function() {
                    Toast.success('注册成功');
                    setTimeout(function() {
                        Router.navigate('/');
                    }, 500);
                })
                .catch(function(error) {
                    Toast.error(error.message || '注册失败');
                    registerBtn.disabled = false;
                    registerBtn.innerHTML = '注册并登录';
                });
        });
    }
};
