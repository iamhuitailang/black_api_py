import { apiService } from '../services/api.js';
import { toast } from '../utils/toast.js';

export default {
    template: `
        <div class="auth-container">
            <div class="auth-box">
                <h1>🌊 海底探险者</h1>
                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label>用户名</label>
                        <input v-model="form.username" type="text" placeholder="请输入用户名" required>
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input v-model="form.password" type="password" placeholder="请输入密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </form>
                <div class="auth-switch">
                    还没有账号？<a @click="$router.push('/register')">立即注册</a>
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
            loading: false
        };
    },
    methods: {
        async handleLogin() {
            this.loading = true;
            try {
                const response = await apiService.login(this.form);
                if (response.code === 200) {
                    apiService.setToken(response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    toast.success('登录成功！');
                    this.$emit('login', response.data.user);
                    this.$router.push('/game');
                }
            } catch (error) {
                toast.error(error.message || '登录失败');
            } finally {
                this.loading = false;
            }
        }
    }
};
