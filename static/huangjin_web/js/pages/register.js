const RegisterPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div class="auth-page">
        <div class="auth-container">
            <h2 class="auth-title">⛏️ 加入矿工</h2>
            <p class="auth-subtitle">注册账号，开始你的挖矿之旅</p>
            <div v-if="errorMsg" style="color:var(--danger);margin-bottom:16px;text-align:center;font-size:14px;">{{ errorMsg }}</div>
            <div class="form-group">
                <label>用户名</label>
                <input v-model="form.username" placeholder="至少3个字符，字母数字下划线" @keyup.enter="handleRegister">
            </div>
            <div class="form-group">
                <label>密码</label>
                <input v-model="form.password" type="password" placeholder="至少6位密码" @keyup.enter="handleRegister">
            </div>
            <div class="form-group">
                <label>昵称（可选）</label>
                <input v-model="form.nickname" placeholder="给自己取个昵称" @keyup.enter="handleRegister">
            </div>
            <button class="btn btn-primary btn-block btn-lg" @click="handleRegister" :disabled="loading">
                {{ loading ? '注册中...' : '注 册' }}
            </button>
            <div class="auth-link">
                已有账号？<a @click="$emit('navigate', 'login')">去登录</a>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            form: { username: '', password: '', nickname: '' },
            loading: false,
            errorMsg: ''
        };
    },
    methods: {
        async handleRegister() {
            if (!this.form.username || !this.form.password) {
                this.errorMsg = '请输入用户名和密码';
                return;
            }
            this.loading = true;
            this.errorMsg = '';
            const result = await Auth.register(this.form.username, this.form.password, this.form.nickname);
            if (result.success) {
                this.$emit('login-success', result.user);
            } else {
                this.errorMsg = result.msg;
            }
            this.loading = false;
        }
    }
};
