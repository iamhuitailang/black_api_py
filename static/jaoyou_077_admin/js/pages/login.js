const AdminLoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h1>💑 相亲交友</h1>
                <p>管理后台登录</p>
                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label>用户名</label>
                        <input type="text" v-model="username" placeholder="请输入用户名" required>
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" v-model="password" placeholder="请输入密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </form>
            </div>
        </div>
    `,
    data() {
        return {
            username: '',
            password: '',
            loading: false
        };
    },
    methods: {
        async handleLogin() {
            if (!this.username || !this.password) {
                alert('请填写完整信息');
                return;
            }

            this.loading = true;
            const result = await AdminAuthService.login(this.username, this.password);
            this.loading = false;

            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.admin);
                this.$router.push('/');
            } else {
                alert(result.msg);
            }
        }
    }
};
