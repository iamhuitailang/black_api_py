const LoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h2>🎬 光影推荐</h2>
                <p class="subtitle">欢迎回来，登录您的账号</p>
                
                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label>用户名</label>
                        <input type="text" v-model="form.username" placeholder="请输入用户名" required>
                    </div>
                    
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" v-model="form.password" placeholder="请输入密码" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading">
                        <span v-if="loading">登录中...</span>
                        <span v-else>登录</span>
                    </button>
                </form>
                
                <p class="auth-link">
                    还没有账号？
                    <router-link to="/register">立即注册</router-link>
                </p>
                
                <p style="margin-top: 16px; font-size: 12px; color: #999; text-align: center;">
                    测试账号：user / user123<br>
                    管理员账号：admin / admin123
                </p>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                password: ''
            },
            loading: false
        };
    },
    methods: {
        async handleLogin() {
            if (this.loading) return;
            
            this.loading = true;
            try {
                await AuthService.login(this.form.username, this.form.password);
                this.$root.showToast('登录成功', 'success');
                this.$router.push('/');
            } catch (error) {
                this.$root.showToast(error.message, 'error');
            } finally {
                this.loading = false;
            }
        }
    }
};
