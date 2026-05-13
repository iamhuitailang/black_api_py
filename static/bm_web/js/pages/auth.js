const AuthPage = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
    },

    async handleLogin(e) {
        e.preventDefault();

        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;

        if (!phone || !password) {
            Toast.error('请填写手机号和密码');
            return;
        }

        const result = await API.auth.login(phone, password);

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
            Toast.success('登录成功');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            Toast.error(result.msg || '登录失败');
        }
    },

    async handleRegister(e) {
        e.preventDefault();

        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const nickname = document.getElementById('nickname').value;
        const realName = document.getElementById('realName').value;

        if (!phone || !password) {
            Toast.error('请填写手机号和密码');
            return;
        }

        if (password.length < 6) {
            Toast.error('密码长度至少6位');
            return;
        }

        const result = await API.auth.register({
            phone,
            password,
            nickname,
            real_name: realName
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
            Toast.success('注册成功');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            Toast.error(result.msg || '注册失败');
        }
    },

    async logout() {
        await API.auth.logout();
        Storage.clear();
        Toast.success('退出成功');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
};
