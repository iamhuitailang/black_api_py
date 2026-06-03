(function() {
const { ref, reactive, onMounted } = Vue;

const LoginPage = {
    name: 'LoginPage',
    setup() {
        const form = reactive({
            username: 'admin',
            password: '123456'
        });

        const loading = ref(false);
        const errors = reactive({
            username: '',
            password: ''
        });

        const validateForm = () => {
            let isValid = true;
            errors.username = '';
            errors.password = '';

            if (!form.username.trim()) {
                errors.username = '请输入用户名';
                isValid = false;
            }

            if (!form.password) {
                errors.password = '请输入密码';
                isValid = false;
            }

            return isValid;
        };

        const handleSubmit = async (e) => {
            e.preventDefault();

            if (!validateForm()) {
                return;
            }

            loading.value = true;

            try {
                const result = await AuthService.login(form.username, form.password);
                if (result.code === 0) {
                    GameStore.init();
                    await GameStore.loadAllData();
                    Toast.success('登录成功！');
                    Router.navigate('home');
                } else {
                    Toast.error(result.msg || '登录失败');
                }
            } catch (error) {
                console.error('登录错误:', error);
                Toast.error('登录失败，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        const goToRegister = () => {
            Router.navigate('register');
        };

        onMounted(() => {
        });

        return {
            form,
            loading,
            errors,
            handleSubmit,
            goToRegister
        };
    },
    template: `
        <div class="login-container">
            <div class="login-card">
                <div class="login-logo">
                    <div class="login-logo-icon">🔥</div>
                    <div class="login-title">忍者训练营</div>
                    <div class="login-subtitle">成为最强忍者</div>
                </div>

                <form @submit="handleSubmit">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            v-model="form.username" 
                            placeholder="请输入用户名"
                            :class="{ 'error': errors.username }"
                        >
                        <div v-if="errors.username" class="form-error">{{ errors.username }}</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input 
                            type="password" 
                            class="form-input" 
                            v-model="form.password" 
                            placeholder="请输入密码"
                            :class="{ 'error': errors.password }"
                        >
                        <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
                    </div>

                    <button 
                        type="submit" 
                        class="btn btn-primary btn-lg"
                        :disabled="loading"
                    >
                        <span v-if="loading">登录中...</span>
                        <span v-else>登录</span>
                    </button>
                </form>

                <div class="login-footer">
                    还没有账号？<a href="#" @click.prevent="goToRegister">立即注册</a>
                </div>

                <div style="margin-top: 16px; padding: 12px; background: var(--bg-primary); border-radius: var(--radius-sm); font-size: 11px; color: var(--text-secondary);">
                    <div style="font-weight: 600; margin-bottom: 4px;">测试账号：</div>
                    <div>admin / 123456</div>
                    <div>user / 123456</div>
                </div>
            </div>
        </div>
    `
};

const LoginPageWrapper = {
    render() {
        return Vue.h(LoginPage);
    }
};

window.LoginPage = LoginPage;
window.LoginPageWrapper = LoginPageWrapper;
})();
