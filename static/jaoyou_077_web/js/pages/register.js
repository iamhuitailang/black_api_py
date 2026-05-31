const RegisterPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h1>💑 注册账号</h1>
                <form @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label>手机号</label>
                        <input type="tel" v-model="phone" placeholder="请输入手机号" required>
                    </div>
                    <div class="form-group">
                        <label>昵称</label>
                        <input type="text" v-model="nickname" placeholder="请输入昵称">
                    </div>
                    <div class="form-group">
                        <label>性别</label>
                        <select v-model="gender">
                            <option value="1">男</option>
                            <option value="2">女</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" v-model="password" placeholder="请输入密码（至少6位）" required>
                    </div>
                    <div class="form-group">
                        <label>确认密码</label>
                        <input type="password" v-model="confirmPassword" placeholder="请再次输入密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        {{ loading ? '注册中...' : '注册' }}
                    </button>
                </form>
                <div class="auth-link">
                    已有账号？<router-link to="/login">立即登录</router-link>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            phone: '',
            nickname: '',
            gender: 1,
            password: '',
            confirmPassword: '',
            loading: false
        };
    },
    methods: {
        async handleRegister() {
            if (!this.phone || !this.password) {
                alert('请填写完整信息');
                return;
            }

            if (this.password !== this.confirmPassword) {
                alert('两次密码输入不一致');
                return;
            }

            if (this.password.length < 6) {
                alert('密码长度至少6位');
                return;
            }

            this.loading = true;
            const result = await AuthService.register(this.phone, this.password, this.nickname, parseInt(this.gender));
            this.loading = false;

            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
                this.$router.push('/');
            } else {
                alert(result.msg);
            }
        }
    }
};
