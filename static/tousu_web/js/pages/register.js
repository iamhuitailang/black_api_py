const RegisterPage = {
    registerType: 'student',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar">
                ${Layout.renderHeader('注册账号', true)}
                <div class="card">
                    <div class="card-body">
                        <div class="login-tabs">
                            <div class="login-tab ${this.registerType === 'student' ? 'active' : ''}" data-type="student">学生注册</div>
                            <div class="login-tab ${this.registerType === 'staff' ? 'active' : ''}" data-type="staff">教职工注册</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="username" placeholder="请输入用户名（3-20位字母数字下划线）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="phone" placeholder="请输入手机号">
                        </div>
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="nickname" placeholder="请输入昵称（选填）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="password" placeholder="请输入密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入密码">
                        </div>
                        <button class="btn btn-primary btn-block btn-lg" id="registerBtn">注册</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.registerType = tab.dataset.type;
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        document.getElementById('registerBtn').addEventListener('click', async () => {
            const username = document.getElementById('username').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const nickname = document.getElementById('nickname').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!username) {
                Toast.error('请输入用户名');
                return;
            }

            if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
                Toast.error('用户名格式不正确（3-20位字母数字下划线）');
                return;
            }

            if (!phone) {
                Toast.error('请输入手机号');
                return;
            }

            if (!/^1[3-9]\d{9}$/.test(phone)) {
                Toast.error('手机号格式不正确');
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

            const btn = document.getElementById('registerBtn');
            btn.disabled = true;
            btn.textContent = '注册中...';

            const result = await AuthService.register({
                username,
                phone,
                password,
                nickname,
                role: this.registerType
            });

            if (result.code === 0) {
                Toast.success('注册成功');
                Router.navigate('home');
            } else {
                Toast.error(result.msg || '注册失败');
                btn.disabled = false;
                btn.textContent = '注册';
            }
        });
    }
};

window.RegisterPage = RegisterPage;