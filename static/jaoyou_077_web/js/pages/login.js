const LoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h1>💑 相亲交友</h1>
                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label>手机号</label>
                        <input type="tel" v-model="phone" placeholder="请输入手机号" required>
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" v-model="password" placeholder="请输入密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </form>
                <div class="auth-link">
                    还没有账号？<router-link to="/register">立即注册</router-link>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            phone: '',
            password: '',
            loading: false
        };
    },
    methods: {
        async handleLogin() {
            if (!this.phone || !this.password) {
                alert('请填写完整信息');
                return;
            }

            this.loading = true;
            const result = await AuthService.login(this.phone, this.password);
            this.loading = false;

            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
                this.$router.push('/');
            } else {
                alert(result.msg);
            }
        }
    }
};
