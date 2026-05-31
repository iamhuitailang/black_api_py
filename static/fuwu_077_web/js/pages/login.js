const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <h1 class="login-title">家政服务系统</h1>
                    <p class="login-subtitle">欢迎回来</p>
                    
                    <div class="role-tabs">
                        <button class="role-tab active" data-role="user">用户登录</button>
                        <button class="role-tab" data-role="admin">管理员登录</button>
                    </div>

                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label>手机号</label>
                            <input type="text" id="phone" placeholder="请输入手机号" required>
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">登录</button>
                    </form>

                    <div class="login-footer">
                        <p>还没有账号？<a href="#register">立即注册</a></p>
                    </div>

                    <div class="demo-accounts">
                        <p class="demo-title">测试账号：</p>
                        <p>用户：13800138000 / 123456</p>
                        <p>管理员：admin / admin123</p>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        let currentRole = 'user';

        const tabs = document.querySelectorAll('.role-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentRole = e.target.dataset.role;
            });
        });

        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;

            if (!phone || !password) {
                Utils.showToast('请填写手机号和密码', 'error');
                return;
            }

            try {
                if (currentRole === 'admin') {
                    await AuthService.adminLogin(phone, password);
                    Utils.showToast('管理员登录成功');
                    setTimeout(() => Router.navigate('admin/dashboard'), 500);
                } else {
                    await AuthService.userLogin(phone, password);
                    Utils.showToast('登录成功');
                    setTimeout(() => Router.navigate('home'), 500);
                }
            } catch (error) {
                Utils.showToast(error.message, 'error');
            }
        });
    }
};
