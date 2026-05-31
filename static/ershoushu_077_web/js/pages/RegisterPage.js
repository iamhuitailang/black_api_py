const RegisterPage = {
    template: `
    <div class="login-page">
        <div class="login-card">
            <div class="login-header">
                <div class="login-icon">📖</div>
                <h1 class="login-title">注册账号</h1>
                <p class="login-subtitle">加入二手书交易社区</p>
            </div>
            <div class="login-body">
                <form @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input v-model="form.username" type="text" placeholder="至少3位，字母数字下划线" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input v-model="form.password" type="password" placeholder="至少6位" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input v-model="form.nickname" type="text" placeholder="选填">
                    </div>
                    <div class="form-group">
                        <label class="form-label">手机号</label>
                        <input v-model="form.phone" type="tel" placeholder="选填">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading">
                        <span v-if="loading" class="loading-spinner"></span>
                        {{ loading ? '注册中...' : '注册' }}
                    </button>
                </form>
                <div class="login-links">
                    <a href="javascript:;" @click="$root.navigate('login')">已有账号？去登录</a>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return { form: { username: '', password: '', nickname: '', phone: '' }, loading: false };
    },
    methods: {
        async handleRegister() {
            if (!this.form.username || !this.form.password) {
                this.$root.showToast('请填写用户名和密码', 'error');
                return;
            }
            this.loading = true;
            try {
                const result = await AuthService.register(
                    this.form.username, this.form.password,
                    this.form.nickname, this.form.phone
                );
                if (result.code === 0) {
                    this.$root.showToast('注册成功', 'success');
                    this.$root.navigate('home');
                } else {
                    this.$root.showToast(result.msg || '注册失败', 'error');
                }
            } catch (e) {
                this.$root.showToast('注册失败，请检查网络', 'error');
            } finally {
                this.loading = false;
            }
        }
    }
};
