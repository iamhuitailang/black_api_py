const LoginPage = {
    isAdminMode: false,

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-page safe-bottom">
                <header class="login-header">
                    <div class="login-logo">⚔️</div>
                    <h1 class="login-title">和平精英 · 战场求生</h1>
                    <p class="login-subtitle">大吉大利 今晚吃鸡</p>
                </header>
                <main class="login-body">
                    <form id="loginForm" class="login-form">
                        <div class="form-group" id="loginUsernameGroup">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="loginUsername" placeholder="请输入用户名" maxlength="20">
                        </div>
                        <div class="form-group" id="loginPasswordGroup">
                            <label class="form-label">密码</label>
                            <input type="password" class="form-control" id="loginPassword" placeholder="请输入密码">
                        </div>
                        <div class="form-group" id="adminUsernameGroup" style="display:none;">
                            <label class="form-label">管理员账号</label>
                            <input type="text" class="form-control" id="adminUsername" placeholder="请输入管理员账号" maxlength="20">
                        </div>
                        <div class="form-group" id="adminPasswordGroup" style="display:none;">
                            <label class="form-label">管理员密码</label>
                            <input type="password" class="form-control" id="adminPassword" placeholder="请输入管理员密码">
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录战场</button>
                    </form>
                    <div class="login-links">
                        <a href="javascript:;" onclick="Router.navigate('register')">还没有账号？去注册</a>
                        <a href="javascript:;" id="adminToggleLink" style="margin-left:12px;">管理员登录</a>
                    </div>
                </main>
            </div>
        `;

        this.isAdminMode = false;
        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.isAdminMode) {
                this.handleAdminLogin();
            } else {
                this.handleLogin();
            }
        });

        document.getElementById('adminToggleLink').addEventListener('click', () => {
            this.isAdminMode = !this.isAdminMode;
            const adminToggleLink = document.getElementById('adminToggleLink');
            const usernameGroup = document.getElementById('loginUsernameGroup');
            const passwordGroup = document.getElementById('loginPasswordGroup');
            const adminUsernameGroup = document.getElementById('adminUsernameGroup');
            const adminPasswordGroup = document.getElementById('adminPasswordGroup');
            const loginBtn = document.getElementById('loginBtn');

            if (this.isAdminMode) {
                usernameGroup.style.display = 'none';
                passwordGroup.style.display = 'none';
                adminUsernameGroup.style.display = 'block';
                adminPasswordGroup.style.display = 'block';
                loginBtn.textContent = '管理员登录';
                adminToggleLink.textContent = '用户登录';
            } else {
                usernameGroup.style.display = 'block';
                passwordGroup.style.display = 'block';
                adminUsernameGroup.style.display = 'none';
                adminPasswordGroup.style.display = 'none';
                loginBtn.textContent = '登录战场';
                adminToggleLink.textContent = '管理员登录';
            }
        });
    },

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');

        if (!username) {
            showToast('请输入用户名');
            return;
        }

        if (!validateUsername(username)) {
            showToast('用户名格式不正确（3-20位，字母数字下划线中文）');
            return;
        }

        if (!password) {
            showToast('请输入密码');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '登录中...';

        try {
            const result = await AuthService.login(username, password);

            if (result.code === 0) {
                showToast('登录成功，欢迎回到战场');
                Router.navigate('home');
            } else {
                showToast(result.msg || '登录失败');
            }
        } catch (error) {
            showToast('登录失败，请检查网络');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录战场';
        }
    },

    async handleAdminLogin() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const loginBtn = document.getElementById('loginBtn');

        if (!username) {
            showToast('请输入管理员账号');
            return;
        }

        if (!password) {
            showToast('请输入管理员密码');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '登录中...';

        try {
            const result = await AuthService.adminLogin(username, password);

            if (result.code === 0) {
                showToast('管理员登录成功');
                Router.navigate('admin');
            } else {
                showToast(result.msg || '管理员登录失败');
            }
        } catch (error) {
            showToast('登录失败，请检查网络');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '管理员登录';
        }
    }
};
