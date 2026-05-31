const RegisterPage = {
    template: `
    <div class="login-page">
        <div class="login-header">
            <div class="login-logo">🔍</div>
            <h1 class="login-title">注册账号</h1>
            <p class="login-subtitle">加入找不同，挑战你的眼力</p>
        </div>
        <div class="login-body">
            <form @submit.prevent="handleRegister" class="login-form">
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input type="text" class="form-control" v-model="form.username" placeholder="3位以上，字母数字下划线">
                </div>
                <div class="form-group">
                    <label class="form-label">昵称</label>
                    <input type="text" class="form-control" v-model="form.nickname" placeholder="请输入昵称（选填）">
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input type="password" class="form-control" v-model="form.password" placeholder="至少6位密码">
                </div>
                <div class="form-group">
                    <label class="form-label">确认密码</label>
                    <input type="password" class="form-control" v-model="form.confirmPassword" placeholder="再次输入密码">
                </div>
                <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                    {{ loading ? '注册中...' : '注册' }}
                </button>
            </form>
            <div class="login-links">
                <a href="javascript:;" @click="goLogin">已有账号？去登录</a>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            form: { username: '', nickname: '', password: '', confirmPassword: '' },
            loading: false
        };
    },
    methods: {
        goLogin() { ZbtRouter.navigate('/login'); },
        async handleRegister() {
            if (!this.form.username) { this.showToast('请输入用户名'); return; }
            if (this.form.username.length < 3) { this.showToast('用户名至少3位'); return; }
            if (!this.form.password) { this.showToast('请输入密码'); return; }
            if (this.form.password.length < 6) { this.showToast('密码至少6位'); return; }
            if (this.form.password !== this.form.confirmPassword) { this.showToast('两次密码不一致'); return; }

            this.loading = true;
            try {
                const result = await ZbtAuth.register(this.form.username, this.form.password, this.form.nickname);
                if (result.code === 0) {
                    this.showToast('注册成功', 'success');
                    ZbtRouter.navigate('/home');
                } else {
                    this.showToast(result.msg || '注册失败');
                }
            } catch (e) {
                this.showToast('注册失败，请检查网络');
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
