const RegisterPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h2>🎬 光影推荐</h2>
                <p class="subtitle">创建新账号，发现好电影</p>
                
                <form @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label>用户名</label>
                        <input type="text" v-model="form.username" placeholder="请输入用户名" required>
                    </div>
                    
                    <div class="form-group">
                        <label>邮箱（可选）</label>
                        <input type="email" v-model="form.email" placeholder="请输入邮箱">
                    </div>
                    
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" v-model="form.password" placeholder="请输入密码（至少6位）" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label>确认密码</label>
                        <input type="password" v-model="form.confirmPassword" placeholder="请再次输入密码" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading">
                        <span v-if="loading">注册中...</span>
                        <span v-else>注册</span>
                    </button>
                </form>
                
                <p class="auth-link">
                    已有账号？
                    <router-link to="/login">立即登录</router-link>
                </p>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                email: '',
                password: '',
                confirmPassword: ''
            },
            loading: false
        };
    },
    methods: {
        async handleRegister() {
            if (this.loading) return;
            
            if (this.form.password !== this.form.confirmPassword) {
                this.$root.showToast('两次输入的密码不一致', 'error');
                return;
            }
            
            this.loading = true;
            try {
                await AuthService.register(
                    this.form.username,
                    this.form.password,
                    this.form.email || undefined
                );
                this.$root.showToast('注册成功', 'success');
                this.$router.push('/');
            } catch (error) {
                this.$root.showToast(error.message, 'error');
            } finally {
                this.loading = false;
            }
        }
    }
};
