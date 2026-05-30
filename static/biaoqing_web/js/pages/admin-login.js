(function() {
    const { ref, reactive, computed } = Vue;
    
    window.AdminLoginPage = {
        name: 'AdminLoginPage',
        template: `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="auth-logo">🔐</div>
                        <h1 class="auth-title">管理员登录</h1>
                        <p class="auth-subtitle">表情包合集管理后台</p>
                    </div>
    
                    <form class="auth-form" @submit.prevent="handleLogin">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="form.username"
                                placeholder="请输入管理员用户名"
                                required
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input 
                                type="password" 
                                class="form-input" 
                                v-model="form.password"
                                placeholder="请输入密码"
                                required
                            >
                        </div>
    
                        <button type="submit" class="auth-btn primary" :disabled="loading">
                            <span v-if="loading">
                                <span class="loading-spinner"></span> 登录中...
                            </span>
                            <span v-else>登 录</span>
                        </button>
                    </form>
    
                    <div class="auth-footer">
                        <router-link :to="{ name: 'login' }" class="auth-link">← 返回用户登录</router-link>
                    </div>
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
    
            const form = reactive({
                username: '',
                password: ''
            });
            const loading = ref(false);
    
            const validate = () => {
                if (!form.username.trim()) {
                    Utils.showToast('请输入用户名', 'warning');
                    return false;
                }
                if (!form.password) {
                    Utils.showToast('请输入密码', 'warning');
                    return false;
                }
                return true;
            };
    
            const handleLogin = async () => {
                if (!validate()) return;
    
                loading.value = true;
                try {
                    const result = await Auth.adminLogin(form.username, form.password);
                    if (result.code === 0) {
                        Utils.showToast('登录成功', 'success');
                        router.push({ name: 'admin' });
                    } else {
                        Utils.showToast(result.msg || '登录失败', 'error');
                    }
                } catch (error) {
                    console.error('Admin login error:', error);
                    Utils.showToast('登录失败，请稍后重试', 'error');
                } finally {
                    loading.value = false;
                }
            };
    
            return {
                form,
                loading,
                handleLogin,
                Utils
            };
        }
    };
})();
