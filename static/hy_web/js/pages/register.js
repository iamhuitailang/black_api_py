import { apiService } from '../services/api.js';
import { toast } from '../utils/toast.js';

export default {
    template: `
        <div class="auth-container">
            <div class="auth-box">
                <h1>🌊 加入探险</h1>
                <form @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label>用户名</label>
                        <input v-model="form.username" type="text" placeholder="请输入用户名" required>
                    </div>
                    <div class="form-group">
                        <label>邮箱</label>
                        <input v-model="form.email" type="email" placeholder="请输入邮箱" required>
                    </div>
                    <div class="form-group">
                        <label>昵称</label>
                        <input v-model="form.nickname" type="text" placeholder="请输入昵称">
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input v-model="form.password" type="password" placeholder="请输入密码（至少6位）" required>
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        {{ loading ? '注册中...' : '注册' }}
                    </button>
                </form>
                <div class="auth-switch">
                    已有账号？<a @click="$router.push('/login')">立即登录</a>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            form: {
                username: '',
                email: '',
                nickname: '',
                password: ''
            },
            loading: false
        };
    },
    methods: {
        async handleRegister() {
            if (this.form.password.length < 6) {
                toast.error('密码至少需要6位');
                return;
            }
            
            this.loading = true;
            try {
                const response = await apiService.register(this.form);
                if (response.code === 200) {
                    toast.success('注册成功！请登录');
                    this.$router.push('/login');
                }
            } catch (error) {
                toast.error(error.message || '注册失败');
            } finally {
                this.loading = false;
            }
        }
    }
};
