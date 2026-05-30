(function() {
    const { ref, reactive, computed } = Vue;
    
    window.LoginPage = {
        name: 'LoginPage',
        template: `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="auth-logo">😆</div>
                        <h1 class="auth-title">登录表情包合集</h1>
                        <p class="auth-subtitle">登录后可以收藏、上传表情包</p>
                    </div>
    
                    <form class="auth-form" @submit.prevent="handleLogin">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="form.username"
                                placeholder="请输入用户名"
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
    
                        <div class="form-options">
                            <label class="remember-me">
                                <input type="checkbox" v-model="rememberMe">
                                记住我
                            </label>
                            <a class="forgot-password" @click="forgotPassword">忘记密码？</a>
                        </div>
    
                        <button type="submit" class="auth-btn primary" :disabled="loading">
                            <span v-if="loading">
                                <span class="loading-spinner"></span> 登录中...
                            </span>
                            <span v-else>登 录</span>
                        </button>
                    </form>
    
                    <div class="auth-divider">
                        <span>其他登录方式</span>
                    </div>
    
                    <div class="social-login">
                        <span class="social-btn" @click="loginByWechat">💬 微信</span>
                        <span class="social-btn" @click="loginByQQ">🐧 QQ</span>
                        <span class="social-btn" @click="loginByWeibo">📢 微博</span>
                    </div>
    
                    <div class="auth-footer">
                        还没有账号？
                        <router-link :to="{ name: 'register' }" class="auth-link">立即注册</router-link>
                    </div>
    
                    <div class="admin-login">
                        <router-link :to="{ name: 'admin-login' }" class="admin-link">管理员登录 →</router-link>
                    </div>
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
            const route = VueRouter.useRoute();
    
            const form = reactive({
                username: '',
                password: ''
            });
            const loading = ref(false);
            const rememberMe = ref(false);
    
            const validate = () => {
                if (!form.username.trim()) {
                    Utils.showToast('请输入用户名', 'warning');
                    return false;
                }
                if (!form.password) {
                    Utils.showToast('请输入密码', 'warning');
                    return false;
                }
                if (form.password.length < 6) {
                    Utils.showToast('密码长度不能少于6位', 'warning');
                    return false;
                }
                return true;
            };
    
            const handleLogin = async () => {
                if (!validate()) return;
    
                loading.value = true;
                try {
                    const result = await Auth.login(form.username, form.password);
                    if (result.code === 0) {
                        Utils.showToast('登录成功', 'success');
                        
                        const redirect = route.query.redirect;
                        if (redirect) {
                            router.push(redirect);
                        } else {
                            router.push({ name: 'home' });
                        }
                    } else {
                        Utils.showToast(result.msg || '登录失败', 'error');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    Utils.showToast('登录失败，请稍后重试', 'error');
                } finally {
                    loading.value = false;
                }
            };
    
            const forgotPassword = () => {
                Utils.showToast('请联系管理员重置密码', 'info');
            };
    
            const loginByWechat = () => {
                Utils.showToast('微信登录功能开发中', 'info');
            };
    
            const loginByQQ = () => {
                Utils.showToast('QQ登录功能开发中', 'info');
            };
    
            const loginByWeibo = () => {
                Utils.showToast('微博登录功能开发中', 'info');
            };
    
            return {
                form,
                loading,
                rememberMe,
                handleLogin,
                forgotPassword,
                loginByWechat,
                loginByQQ,
                loginByWeibo,
                Utils
            };
        }
    };
})();
