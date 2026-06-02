const LoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <div class="auth-logo-icon">🎱</div>
                    <div class="auth-logo-text">弹珠台</div>
                </div>
                <h2 class="auth-title">登录</h2>
                <p class="auth-subtitle">登录你的账号开始游戏</p>

                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input type="text" class="form-input" v-model="form.username" 
                               placeholder="请输入用户名" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input type="password" class="form-input" v-model="form.password" 
                               placeholder="请输入密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg auth-btn" 
                            :disabled="loading">
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </form>

                <div style="text-align: center; margin: 20px 0; color: var(--text-secondary);">
                    或
                </div>

                <form @submit.prevent="handleAdminLogin">
                    <div class="form-group">
                        <label class="form-label">管理员账号登录</label>
                        <input type="text" class="form-input" v-model="adminForm.username" 
                               placeholder="管理员用户名">
                    </div>
                    <div class="form-group">
                        <label class="form-label">管理员密码</label>
                        <input type="password" class="form-input" v-model="adminForm.password" 
                               placeholder="管理员密码">
                    </div>
                    <button type="submit" class="btn btn-outline auth-btn" 
                            :disabled="adminLoading">
                        {{ adminLoading ? '登录中...' : '管理员登录' }}
                    </button>
                </form>

                <div class="auth-footer">
                    还没有账号？<a href="javascript:void(0)" @click="goRegister">立即注册</a>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                password: ''
            },
            adminForm: {
                username: '',
                password: ''
            },
            loading: false,
            adminLoading: false
        };
    },
    methods: {
        async handleLogin() {
            if (!this.form.username || !this.form.password) {
                Toast.warning('请填写完整信息');
                return;
            }

            this.loading = true;
            try {
                const result = await Auth.login(this.form.username, this.form.password);
                if (result.code === 0) {
                    Toast.success('登录成功');
                    const user = result.data.user;
                    if (user.role === 'admin') {
                        Router.navigate('/admin/dashboard');
                    } else {
                        Router.navigate('/game');
                    }
                    if (this.$root) {
                        this.$root.currentUser = user;
                    }
                } else {
                    Toast.error(result.msg || '登录失败');
                }
            } catch (e) {
                Toast.error('登录失败，请重试');
            } finally {
                this.loading = false;
            }
        },
        async handleAdminLogin() {
            if (!this.adminForm.username || !this.adminForm.password) {
                Toast.warning('请填写完整信息');
                return;
            }

            this.adminLoading = true;
            try {
                const result = await Auth.adminLogin(this.adminForm.username, this.adminForm.password);
                if (result.code === 0) {
                    Toast.success('管理员登录成功');
                    Router.navigate('/admin/dashboard');
                    if (this.$root) {
                        this.$root.currentUser = { ...result.data.admin, role: 'admin' };
                    }
                } else {
                    Toast.error(result.msg || '登录失败');
                }
            } catch (e) {
                Toast.error('登录失败，请重试');
            } finally {
                this.adminLoading = false;
            }
        },
        goRegister() {
            Router.navigate('/register');
        }
    }
};
