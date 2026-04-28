var LoginPage = {
    render: function() {
        var app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="card login-card">
                    <div class="login-logo">
                        <div style="font-size: 48px; color: var(--primary-color);">🔄</div>
                        <h1>换享 · 后台管理</h1>
                        <p>以物换物平台管理系统</p>
                    </div>
                    <form class="login-form" id="loginForm">
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="text" class="form-control" id="phone" placeholder="请输入手机号" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码" required>
                        </div>
                        <div class="form-group mt-3">
                            <button type="submit" class="btn btn-primary" id="loginBtn">
                                登录
                            </button>
                        </div>
                        <div class="text-center mt-2">
                            <small class="text-secondary">提示：注册用户可直接登录，首次登录自动创建账户</small>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.bindEvents();
    },
    
    bindEvents: function() {
        var form = document.getElementById('loginForm');
        var loginBtn = document.getElementById('loginBtn');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var phone = document.getElementById('phone').value.trim();
            var password = document.getElementById('password').value;
            
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
            
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="loading"></span> 登录中...';
            
            Auth.login(phone, password)
                .then(function() {
                    Toast.success('登录成功');
                    setTimeout(function() {
                        Router.navigate('/dashboard');
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
