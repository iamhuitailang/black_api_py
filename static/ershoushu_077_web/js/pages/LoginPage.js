const LoginPage = {
    template: `
    <div class="login-page">
        <div class="login-card">
            <div class="login-header">
                <div class="login-icon">📚</div>
                <h1 class="login-title">二手书交易</h1>
                <p class="login-subtitle">让好书找到新主人</p>
            </div>
            <div class="login-body">
                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input v-model="form.username" type="text" placeholder="请输入用户名" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input v-model="form.password" type="password" placeholder="请输入密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading">
                        <span v-if="loading" class="loading-spinner"></span>
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </form>
                <div class="login-links">
                    <a href="javascript:;" @click="$root.navigate('register')">还没有账号？去注册</a>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return { form: { username: '', password: '' }, loading: false };
    },
    methods: {
        async handleLogin() {
            if (!this.form.username || !this.form.password) return;
            this.loading = true;
            try {
                const result = await AuthService.login(this.form.username, this.form.password);
                if (result.code === 0) {
                    this.$root.showToast('登录成功', 'success');
                    const user = result.data.user;
                    if (user.role === 'admin') {
                        this.$root.navigate('admin-dashboard');
                    } else {
                        this.$root.navigate('home');
                    }
                } else {
                    this.$root.showToast(result.msg || '登录失败', 'error');
                }
            } catch (e) {
                this.$root.showToast('登录失败，请检查网络', 'error');
            } finally {
                this.loading = false;
            }
        }
    }
};
