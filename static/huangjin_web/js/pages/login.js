const LoginPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div class="auth-page">
        <div class="auth-container">
            <h2 class="auth-title">⛏️ 黄金矿工</h2>
            <p class="auth-subtitle">登录账号，开始挖矿之旅</p>
            <div v-if="errorMsg" style="color:var(--danger);margin-bottom:16px;text-align:center;font-size:14px;">{{ errorMsg }}</div>
            <div class="form-group">
                <label>用户名</label>
                <input v-model="form.username" placeholder="请输入用户名" @keyup.enter="handleLogin">
            </div>
            <div class="form-group">
                <label>密码</label>
                <input v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin">
            </div>
            <button class="btn btn-primary btn-block btn-lg" @click="handleLogin" :disabled="loading">
                {{ loading ? '登录中...' : '登 录' }}
            </button>
            <div class="auth-link">
                还没有账号？<a @click="$emit('navigate', 'register')">立即注册</a>
            </div>
            <div class="auth-link mt-16">
                <a @click="handleAdminLogin" style="color:var(--text-secondary);font-size:13px;">管理员登录</a>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            form: { username: '', password: '' },
            loading: false,
            errorMsg: ''
        };
    },
    methods: {
        async handleLogin() {
            if (!this.form.username || !this.form.password) {
                this.errorMsg = '请输入用户名和密码';
                return;
            }
            this.loading = true;
            this.errorMsg = '';
            const result = await Auth.login(this.form.username, this.form.password);
            if (result.success) {
                this.$emit('login-success', result.user);
            } else {
                this.errorMsg = result.msg;
            }
            this.loading = false;
        },
        async handleAdminLogin() {
            if (!this.form.username || !this.form.password) {
                this.errorMsg = '请输入用户名和密码';
                return;
            }
            this.loading = true;
            this.errorMsg = '';
            const result = await Api.admin.login(this.form.username, this.form.password);
            if (result.code === 0 && result.data) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
                this.$emit('login-success', result.data.user);
            } else {
                this.errorMsg = result.msg || '管理员登录失败';
            }
            this.loading = false;
        }
    }
};
