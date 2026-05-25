const LoginPage = {
    render() {
        const app = document.getElementById('app');
        app.className = '';
        app.innerHTML = `
            <div class="login-page">
                <div class="login-header">
                    <div class="login-logo">🔧</div>
                    <div class="login-title">宿舍报修系统</div>
                    <div class="login-subtitle">高效便捷的维修服务平台</div>
                </div>
                <div class="login-form">
                    <div class="login-tabs">
                        <div class="login-tab active" data-role="student">学生</div>
                        <div class="login-tab" data-role="repairman">维修工</div>
                        <div class="login-tab" data-role="admin">管理员</div>
                    </div>
                    <form id="loginForm">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-input" id="username" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-input" id="password" placeholder="请输入密码" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登 录</button>
                    </form>
                    <div class="register-link">
                        还没有账号？<a href="#register">立即注册</a>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        let currentRole = 'student';

        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentRole = tab.dataset.role;
            };
        });

        document.getElementById('loginForm').onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username || !password) {
                Utils.showToast('请输入用户名和密码');
                return;
            }

            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.textContent = '登录中...';

            try {
                const result = await AuthService.login(username, password);
                if (result.code === 0) {
                    Utils.showToast('登录成功');
                    setTimeout(() => {
                        Router.navigate('home');
                    }, 500);
                } else {
                    Utils.showToast(result.msg);
                }
            } catch (error) {
                Utils.showToast('登录失败，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '登 录';
            }
        };
    }
};
