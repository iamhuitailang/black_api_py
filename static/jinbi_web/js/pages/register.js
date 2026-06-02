const RegisterPage = {
    template: `
        <div class="login-page">
            <div class="login-container">
                <div class="login-header">
                    <div class="login-logo">🪙</div>
                    <h1 class="login-title">注册账号</h1>
                    <p class="login-subtitle">开启你的推币之旅</p>
                </div>
                <form class="login-form" @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input 
                            type="text" 
                            class="form-control" 
                            v-model="nickname" 
                            placeholder="请输入昵称（选填）"
                            :disabled="loading"
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">手机号</label>
                        <input 
                            type="tel" 
                            class="form-control" 
                            v-model="phone" 
                            placeholder="请输入手机号" 
                            maxlength="11"
                            :disabled="loading"
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input 
                            type="password" 
                            class="form-control" 
                            v-model="password" 
                            placeholder="请输入密码（至少6位）"
                            :disabled="loading"
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">确认密码</label>
                        <input 
                            type="password" 
                            class="form-control" 
                            v-model="confirmPassword" 
                            placeholder="请再次输入密码"
                            :disabled="loading"
                        >
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                        <span v-if="loading" class="loading"></span>
                        {{ loading ? '注册中...' : '注册' }}
                    </button>
                </form>
                <div class="login-links">
                    <a href="javascript:;" @click="goToLogin">已有账号？去登录</a>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            nickname: '',
            phone: '',
            password: '',
            confirmPassword: '',
            loading: false
        };
    },
    methods: {
        validatePhone(phone) {
            return /^1[3-9]\d{9}$/.test(phone);
        },

        async handleRegister() {
            if (!this.phone) {
                Toast.error('请输入手机号');
                return;
            }

            if (!this.validatePhone(this.phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }

            if (!this.password) {
                Toast.error('请输入密码');
                return;
            }

            if (this.password.length < 6) {
                Toast.error('密码至少6位');
                return;
            }

            if (this.password !== this.confirmPassword) {
                Toast.error('两次密码输入不一致');
                return;
            }

            this.loading = true;

            try {
                const result = await AuthService.register(this.phone, this.password, this.nickname);

                if (result.code === 0) {
                    Toast.success('注册成功');
                    if (GameStore.state) {
                        GameStore.state.user = result.data.user;
                    } else {
                        GameStore.init();
                    }
                    Router.navigate('game');
                } else {
                    Toast.error(result.msg || '注册失败');
                }
            } catch (error) {
                Toast.error('注册失败，请检查网络');
            } finally {
                this.loading = false;
            }
        },

        goToLogin() {
            Router.navigate('login');
        }
    }
};

window.RegisterPage = RegisterPage;
