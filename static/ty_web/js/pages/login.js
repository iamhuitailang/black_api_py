const LoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <h1>🎨 涂鸦战士</h1>
                    <p>欢迎回来，勇者！</p>
                </div>
                <form class="auth-form" @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label>手机号</label>
                        <input 
                            v-model="form.phone" 
                            type="tel" 
                            class="input" 
                            placeholder="请输入手机号"
                            maxlength="11"
                            :disabled="loading"
                        />
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input 
                            v-model="form.password" 
                            :type="showPassword ? 'text' : 'password'" 
                            class="input" 
                            placeholder="请输入密码"
                            :disabled="loading"
                        />
                    </div>
                    <button 
                        type="submit" 
                        class="btn btn-primary w-full" 
                        :disabled="loading"
                    >
                        <span v-if="loading">登录中...</span>
                        <span v-else>登 录</span>
                    </button>
                </form>
                <div class="auth-footer">
                    <p>还没有账号？<a @click="goToRegister">立即注册</a></p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                phone: '',
                password: ''
            },
            showPassword: false,
            loading: false
        };
    },
    methods: {
        validatePhone(phone) {
            const pattern = /^1[3-9]\d{9}$/;
            return pattern.test(phone);
        },
        async handleLogin() {
            const { phone, password } = this.form;

            if (!phone) {
                Toast.error('请输入手机号');
                return;
            }

            if (!this.validatePhone(phone)) {
                Toast.error('请输入正确的手机号格式');
                return;
            }

            if (!password) {
                Toast.error('请输入密码');
                return;
            }

            if (password.length < 6) {
                Toast.error('密码至少需要6位');
                return;
            }

            this.loading = true;

            try {
                await AuthService.login(phone, password);
                Toast.success('登录成功！');
                Router.navigate('home');
            } catch (error) {
                Toast.error(error.message || '登录失败，请重试');
            } finally {
                this.loading = false;
            }
        },
        goToRegister() {
            Router.navigate('register');
        }
    }
};
