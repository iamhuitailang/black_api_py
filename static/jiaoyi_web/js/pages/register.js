const RegisterPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">📚</div>
                    <div class="login-title">注册账号</div>
                    <div class="login-subtitle">开启校园教材交易之旅</div>
                </div>
                <div class="login-body">
                    <div class="login-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" placeholder="请输入用户名">
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="phone" placeholder="请输入手机号">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="nickname" placeholder="请输入昵称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">学校</label>
                            <input type="text" class="form-control" id="school" placeholder="请输入学校名称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">用户角色</label>
                            <div class="condition-select">
                                <div class="condition-option active" data-role="buyer">我是买家</div>
                                <div class="condition-option" data-role="seller">我是卖家</div>
                                <div class="condition-option" data-role="both">两者都是</div>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" id="registerBtn">注册</button>
                    </div>
                    <div class="login-links">
                        <a href="#login">已有账号？立即登录</a>
                    </div>
                </div>
            </div>
        `;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());

        document.querySelectorAll('.condition-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.condition-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            });
        });
    },

    async handleRegister() {
        const username = document.getElementById('username').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const nickname = document.getElementById('nickname').value.trim();
        const school = document.getElementById('school').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.querySelector('.condition-option.active').dataset.role;

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }
        if (!phone) {
            Toast.error('请输入手机号');
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

        Utils.showLoading();
        try {
            const result = await AuthService.register({
                username,
                phone,
                password,
                nickname,
                school,
                role
            });
            if (result.code === 0) {
                Toast.success('注册成功，请登录');
                Router.navigate('login');
            } else {
                Toast.error(result.msg || '注册失败');
            }
        } catch (e) {
            Toast.error('注册失败，请重试');
        } finally {
            Utils.hideLoading();
        }
    }
};

window.RegisterPage = RegisterPage;
