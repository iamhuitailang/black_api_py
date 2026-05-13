const LoginPage = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    },

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            Toast.error('请输入用户名和密码');
            return;
        }

        const result = await API.auth.login(username, password);

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
    }
};
