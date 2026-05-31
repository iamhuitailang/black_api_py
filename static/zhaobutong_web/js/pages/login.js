const LoginPage = {
    template: `
    <div class="login-page">
        <div class="login-header">
            <div class="login-logo">🔍</div>
            <h1 class="login-title">找不同</h1>
            <p class="login-subtitle">火眼金睛，挑战你的观察力</p>
        </div>
        <div class="login-body">
            <form @submit.prevent="handleLogin" class="login-form">
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input type="text" class="form-control" v-model="form.username" placeholder="请输入用户名" autocomplete="username">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input type="password" class="form-control" v-model="form.password" placeholder="请输入密码" autocomplete="current-password">
                </div>
                <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                    {{ loading ? '登录中...' : '登录' }}
                </button>
            </form>
            <div class="login-links">
                <a href="javascript:;" @click="goRegister">还没有账号？去注册</a>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            form: { username: '', password: '' },
            loading: false
        };
    },
    methods: {
        goRegister() {
            ZbtRouter.navigate('/register');
        },
        async handleLogin() {
            if (!this.form.username) { this.showToast('请输入用户名'); return; }
            if (!this.form.password) { this.showToast('请输入密码'); return; }
            this.loading = true;
            try {
                const result = await ZbtAuth.login(this.form.username, this.form.password);
                if (result.code === 0) {
                    this.showToast('登录成功', 'success');
                    ZbtRouter.navigate('/home');
                } else {
                    this.showToast(result.msg || '登录失败');
                }
            } catch (e) {
                this.showToast('登录失败，请检查网络');
            } finally {
                this.loading = false;
            }
        },
        showToast(msg, type = 'error') {
            const existing = document.querySelector('.zbt-toast');
            if (existing) existing.remove();
            const el = document.createElement('div');
            el.className = 'zbt-toast';
            el.textContent = msg;
            el.style.background = type === 'success' ? '#10b981' : '#ef4444';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2000);
        }
    }
};
