const LoginPage = {
    template: `
        <div class="login-page">
            <div class="login-header">
                <div class="login-logo">💪</div>
                <div class="login-title">FitLife</div>
                <div class="login-subtitle">健身房会员系统</div>
            </div>
            <div class="login-body">
                <div class="login-form">
                    <div class="form-group">
                        <input class="form-control" v-model="form.username" placeholder="用户名" @keyup.enter="handleLogin">
                    </div>
                    <div class="form-group">
                        <input class="form-control" type="password" v-model="form.password" placeholder="密码" @keyup.enter="handleLogin">
                    </div>
                    <button class="btn btn-primary btn-block" @click="handleLogin" :disabled="loading">
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </div>
                <div class="login-links">
                    <router-link to="/register" style="color: var(--primary-color)">注册账号</router-link>
                    <span></span>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                password: ''
            },
            loading: false
        };
    },
    methods: {
        async handleLogin() {
            if (!this.form.username) {
                Toast.warning('请输入用户名');
                return;
            }
            if (!this.form.password) {
                Toast.warning('请输入密码');
                return;
            }

            this.loading = true;
            try {
                const result = await AuthService.login(this.form.username, this.form.password);
                if (result.code === 0) {
                    Toast.success('登录成功');
                    const user = result.data.user;
                    if (user.role === 1) {
                        this.$router.push('/admin/courses');
                    } else {
                        this.$router.push('/courses');
                    }
                } else {
                    Toast.error(result.msg || '登录失败');
                }
            } catch (error) {
                Toast.error('登录失败，请重试');
            } finally {
                this.loading = false;
            }
        }
    },
    created() {
        if (AuthService.isLoggedIn()) {
            const user = AuthService.getCurrentUser();
            if (user && user.role === 1) {
                this.$router.push('/admin/courses');
            } else {
                this.$router.push('/courses');
            }
        }
    }
};

window.LoginPage = LoginPage;
