const RegisterPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <div class="auth-logo-icon">🎱</div>
                    <div class="auth-logo-text">弹珠台</div>
                </div>
                <h2 class="auth-title">注册</h2>
                <p class="auth-subtitle">创建账号开始游戏之旅</p>

                <form @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input type="text" class="form-input" v-model="form.username" 
                               placeholder="3-20位字母数字下划线" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">昵称（可选）</label>
                        <input type="text" class="form-input" v-model="form.nickname" 
                               placeholder="显示给其他玩家的名称">
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" class="form-input" v-model="form.password" 
                               placeholder="至少6位" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">确认密码</label>
                        <input type="password" class="form-input" v-model="form.confirmPassword" 
                               placeholder="再次输入密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg auth-btn" 
                            :disabled="loading">
                        {{ loading ? '注册中...' : '注册' }}
                    </button>
                </form>

                <div class="auth-footer">
                    已有账号？<a href="javascript:void(0)" @click="goLogin">立即登录</a>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                nickname: '',
                password: '',
                confirmPassword: ''
            },
            loading: false
        };
    },
    methods: {
        async handleRegister() {
            if (!this.form.username || !this.form.password) {
                Toast.warning('请填写完整信息');
                return;
            }

            if (this.form.password !== this.form.confirmPassword) {
                Toast.warning('两次输入的密码不一致');
                return;
            }

            if (this.form.password.length < 6) {
                Toast.warning('密码长度至少6位');
                return;
            }

            this.loading = true;
            try {
                const result = await Auth.register(
                    this.form.username,
                    this.form.password,
                    this.form.nickname
                );

                if (result.code === 0) {
                    Toast.success('注册成功');
                    Router.navigate('/game');
                    if (this.$root) {
                        this.$root.currentUser = result.data.user;
                    }
                } else {
                    Toast.error(result.msg || '注册失败');
                }
            } catch (e) {
                Toast.error('注册失败，请重试');
            } finally {
                this.loading = false;
            }
        },
        goLogin() {
            Router.navigate('/login');
        }
    }
};
