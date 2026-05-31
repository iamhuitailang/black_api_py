const RegisterPage = {
    template: `
        <div class="login-page">
            <div class="login-header">
                <div class="login-logo">🏋️</div>
                <div class="login-title">注册账号</div>
                <div class="login-subtitle">加入FitLife健身大家庭</div>
            </div>
            <div class="login-body">
                <div class="login-form">
                    <div class="form-group">
                        <input class="form-control" v-model="form.username" placeholder="用户名（至少3个字符）">
                    </div>
                    <div class="form-group">
                        <input class="form-control" type="password" v-model="form.password" placeholder="密码（至少6位）">
                    </div>
                    <div class="form-group">
                        <input class="form-control" type="password" v-model="form.confirmPassword" placeholder="确认密码">
                    </div>
                    <div class="form-group">
                        <input class="form-control" v-model="form.nickname" placeholder="昵称（选填）">
                    </div>
                    <div class="form-group">
                        <input class="form-control" v-model="form.phone" placeholder="手机号（选填）">
                    </div>
                    <button class="btn btn-primary btn-block" @click="handleRegister" :disabled="loading">
                        {{ loading ? '注册中...' : '注册' }}
                    </button>
                </div>
                <div class="login-links">
                    <router-link to="/login" style="color: var(--primary-color)">已有账号？去登录</router-link>
                    <span></span>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                password: '',
                confirmPassword: '',
                nickname: '',
                phone: ''
            },
            loading: false
        };
    },
    methods: {
        async handleRegister() {
            if (!this.form.username || this.form.username.length < 3) {
                Toast.warning('用户名至少3个字符');
                return;
            }
            if (!this.form.password || this.form.password.length < 6) {
                Toast.warning('密码至少6位');
                return;
            }
            if (this.form.password !== this.form.confirmPassword) {
                Toast.warning('两次密码不一致');
                return;
            }

            this.loading = true;
            try {
                const result = await AuthService.register(
                    this.form.username,
                    this.form.password,
                    this.form.nickname,
                    this.form.phone,
                    0
                );
                if (result.code === 0) {
                    Toast.success('注册成功');
                    this.$router.push('/courses');
                } else {
                    Toast.error(result.msg || '注册失败');
                }
            } catch (error) {
                Toast.error('注册失败，请重试');
            } finally {
                this.loading = false;
            }
        }
    },
    created() {
        if (AuthService.isLoggedIn()) {
            this.$router.push('/courses');
        }
    }
};

window.RegisterPage = RegisterPage;
