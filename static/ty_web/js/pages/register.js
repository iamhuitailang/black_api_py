const RegisterPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <h1>🎨 加入涂鸦战士</h1>
                    <p>开启你的涂鸦冒险之旅！</p>
                </div>
                <form class="auth-form" @submit.prevent="handleRegister">
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
                        <label>昵称</label>
                        <input 
                            v-model="form.nickname" 
                            type="text" 
                            class="input" 
                            placeholder="请输入昵称"
                            maxlength="20"
                            :disabled="loading"
                        />
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input 
                            v-model="form.password" 
                            :type="showPassword ? 'text' : 'password'" 
                            class="input" 
                            placeholder="请设置密码（至少6位）"
                            :disabled="loading"
                        />
                    </div>
                    <div class="form-group">
                        <label>确认密码</label>
                        <input 
                            v-model="form.confirmPassword" 
                            :type="showConfirmPassword ? 'text' : 'password'" 
                            class="input" 
                            placeholder="请再次输入密码"
                            :disabled="loading"
                        />
                    </div>
                    <button 
                        type="submit" 
                        class="btn btn-success w-full" 
                        :disabled="loading"
                    >
                        <span v-if="loading">注册中...</span>
                        <span v-else>注 册</span>
                    </button>
                </form>
                <div class="auth-footer">
                    <p>已有账号？<a @click="goToLogin">立即登录</a></p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                phone: '',
                nickname: '',
                password: '',
                confirmPassword: ''
            },
            showPassword: false,
            showConfirmPassword: false,
            loading: false
        };
    },
    methods: {
        validatePhone(phone) {
            const pattern = /^1[3-9]\d{9}$/;
            return pattern.test(phone);
        },
        async handleRegister() {
            const { phone, nickname, password, confirmPassword } = this.form;

            if (!phone) {
                Toast.error('请输入手机号');
                return;
            }

            if (!this.validatePhone(phone)) {
                Toast.error('请输入正确的手机号格式');
                return;
            }

            if (!nickname) {
                Toast.error('请输入昵称');
                return;
            }

            if (nickname.length < 2 || nickname.length > 20) {
                Toast.error('昵称长度应为2-20个字符');
                return;
            }

            if (!password) {
                Toast.error('请设置密码');
                return;
            }

            if (password.length < 6) {
                Toast.error('密码至少需要6位');
                return;
            }

            if (!confirmPassword) {
                Toast.error('请确认密码');
                return;
            }

            if (password !== confirmPassword) {
                Toast.error('两次输入的密码不一致');
                return;
            }

            this.loading = true;

            try {
                await AuthService.register(phone, password, nickname);
                Toast.success('注册成功！');
                Router.navigate('home');
            } catch (error) {
                Toast.error(error.message || '注册失败，请重试');
            } finally {
                this.loading = false;
            }
        },
        goToLogin() {
            Router.navigate('login');
        }
    }
};
