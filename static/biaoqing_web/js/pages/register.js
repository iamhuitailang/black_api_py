(function() {
    const { ref, reactive } = Vue;
    
    window.RegisterPage = {
        name: 'RegisterPage',
        template: `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="auth-logo">🎉</div>
                        <h1 class="auth-title">注册表情包合集</h1>
                        <p class="auth-subtitle">加入我们，分享你的快乐</p>
                    </div>
    
                    <form class="auth-form" @submit.prevent="handleRegister">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="form.username"
                                placeholder="请输入用户名（4-20位）"
                                required
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">邮箱</label>
                            <input 
                                type="email" 
                                class="form-input" 
                                v-model="form.email"
                                placeholder="请输入邮箱"
                                required
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="form.nickname"
                                placeholder="请输入昵称（选填）"
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input 
                                type="tel" 
                                class="form-input" 
                                v-model="form.phone"
                                placeholder="请输入手机号（选填）"
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">密码</label>
                            <input 
                                type="password" 
                                class="form-input" 
                                v-model="form.password"
                                placeholder="请输入密码（6-20位）"
                                required
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">确认密码</label>
                            <input 
                                type="password" 
                                class="form-input" 
                                v-model="form.confirmPassword"
                                placeholder="请再次输入密码"
                                required
                            >
                        </div>
    
                        <div class="form-options">
                            <label class="agree-terms">
                                <input type="checkbox" v-model="agreeTerms" required>
                                我已阅读并同意
                                <a href="#" @click.prevent="showTerms">《用户协议》</a>
                                和
                                <a href="#" @click.prevent="showPrivacy">《隐私政策》</a>
                            </label>
                        </div>
    
                        <button type="submit" class="auth-btn primary" :disabled="loading">
                            <span v-if="loading">
                                <span class="loading-spinner"></span> 注册中...
                            </span>
                            <span v-else>注 册</span>
                        </button>
                    </form>
    
                    <div class="auth-footer">
                        已有账号？
                        <router-link :to="{ name: 'login' }" class="auth-link">立即登录</router-link>
                    </div>
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
    
            const form = reactive({
                username: '',
                email: '',
                nickname: '',
                phone: '',
                password: '',
                confirmPassword: ''
            });
            const loading = ref(false);
            const agreeTerms = ref(false);
    
            const validate = () => {
                if (!form.username.trim()) {
                    Utils.showToast('请输入用户名', 'warning');
                    return false;
                }
                if (form.username.length < 4 || form.username.length > 20) {
                    Utils.showToast('用户名长度应为4-20位', 'warning');
                    return false;
                }
                if (!form.email.trim()) {
                    Utils.showToast('请输入邮箱', 'warning');
                    return false;
                }
                if (!Utils.validateEmail(form.email)) {
                    Utils.showToast('请输入有效的邮箱地址', 'warning');
                    return false;
                }
                if (!form.password) {
                    Utils.showToast('请输入密码', 'warning');
                    return false;
                }
                if (form.password.length < 6 || form.password.length > 20) {
                    Utils.showToast('密码长度应为6-20位', 'warning');
                    return false;
                }
                if (!form.confirmPassword) {
                    Utils.showToast('请确认密码', 'warning');
                    return false;
                }
                if (form.password !== form.confirmPassword) {
                    Utils.showToast('两次输入的密码不一致', 'warning');
                    return false;
                }
                if (!agreeTerms.value) {
                    Utils.showToast('请先同意用户协议和隐私政策', 'warning');
                    return false;
                }
                return true;
            };
    
            const handleRegister = async () => {
                if (!validate()) return;
    
                loading.value = true;
                try {
                    const result = await Auth.register(
                        form.username,
                        form.email,
                        form.password,
                        form.nickname,
                        form.phone
                    );
                    if (result.code === 0) {
                        Utils.showToast('注册成功', 'success');
                        router.push({ name: 'home' });
                    } else {
                        Utils.showToast(result.msg || '注册失败', 'error');
                    }
                } catch (error) {
                    console.error('Register error:', error);
                    Utils.showToast('注册失败，请稍后重试', 'error');
                } finally {
                    loading.value = false;
                }
            };
    
            const showTerms = () => {
                Utils.showToast('用户协议', 'info');
            };
    
            const showPrivacy = () => {
                Utils.showToast('隐私政策', 'info');
            };
    
            return {
                form,
                loading,
                agreeTerms,
                handleRegister,
                showTerms,
                showPrivacy,
                Utils
            };
        }
    };
})();
