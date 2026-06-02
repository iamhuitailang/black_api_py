const LoginPage = {
    template: `
        <div class="login-page">
            <div class="login-container">
                <div class="login-header">
                    <div class="login-logo">🪙</div>
                    <h1 class="login-title">推金币大作战</h1>
                    <p class="login-subtitle">超解压的推金币游戏</p>
                </div>
                <form class="login-form" @submit.prevent="handleLogin">
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
                            placeholder="请输入密码"
                            :disabled="loading"
                        >
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                        <span v-if="loading" class="loading"></span>
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </form>
                <div class="login-links">
                    <a href="javascript:;" @click="goToRegister">还没有账号？去注册</a>
                </div>
                <div class="login-tips">
                    <p>测试账号：13800138000</p>
                    <p>测试密码：123456</p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            phone: '',
            password: '',
            loading: false
        };
    },
    methods: {
        validatePhone(phone) {
            return /^1[3-9]\d{9}$/.test(phone);
        },

        async handleLogin() {
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

            this.loading = true;

            try {
                const result = await AuthService.login(this.phone, this.password);

                if (result.code === 0) {
                    Toast.success('登录成功');
                    if (GameStore.state) {
                        GameStore.state.user = result.data.user;
                    } else {
                        GameStore.init();
                    }
                    Router.navigate('game');
                } else {
                    Toast.error(result.msg || '登录失败');
                }
            } catch (error) {
                Toast.error('登录失败，请检查网络');
            } finally {
                this.loading = false;
            }
        },

        goToRegister() {
            Router.navigate('register');
        }
    }
};

window.LoginPage = LoginPage;
