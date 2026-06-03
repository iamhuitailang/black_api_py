(function() {
const { ref, reactive, onMounted } = Vue;

const RegisterPage = {
    name: 'RegisterPage',
    setup() {
        const form = reactive({
            username: '',
            nickname: '',
            password: '',
            confirmPassword: ''
        });

        const loading = ref(false);
        const errors = reactive({
            username: '',
            nickname: '',
            password: '',
            confirmPassword: ''
        });

        const validateForm = () => {
            let isValid = true;
            errors.username = '';
            errors.nickname = '';
            errors.password = '';
            errors.confirmPassword = '';

            if (!form.username.trim()) {
                errors.username = '请输入用户名';
                isValid = false;
            } else if (form.username.length < 3) {
                errors.username = '用户名至少3个字符';
                isValid = false;
            }

            if (!form.nickname.trim()) {
                errors.nickname = '请输入昵称';
                isValid = false;
            }

            if (!form.password) {
                errors.password = '请输入密码';
                isValid = false;
            } else if (form.password.length < 6) {
                errors.password = '密码至少6个字符';
                isValid = false;
            }

            if (!form.confirmPassword) {
                errors.confirmPassword = '请确认密码';
                isValid = false;
            } else if (form.password !== form.confirmPassword) {
                errors.confirmPassword = '两次输入的密码不一致';
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
                const result = await AuthService.register(form.username, form.password, form.nickname);
                if (result.code === 0) {
                    GameStore.init();
                    await GameStore.loadAllData();
                    Toast.success('注册成功！');
                    Router.navigate('home');
                } else {
                    Toast.error(result.msg || '注册失败');
                }
            } catch (error) {
                console.error('注册错误:', error);
                Toast.error('注册失败，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        const goToLogin = () => {
            Router.navigate('login');
        };

        onMounted(() => {
        });

        return {
            form,
            loading,
            errors,
            handleSubmit,
            goToLogin
        };
    },
    template: `
        <div class="login-container">
            <div class="login-card">
                <div class="login-logo">
                    <div class="login-logo-icon">🌟</div>
                    <div class="login-title">忍者注册</div>
                    <div class="login-subtitle">开启你的忍者之路</div>
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
                        <label class="form-label">昵称</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            v-model="form.nickname" 
                            placeholder="请输入昵称"
                            :class="{ 'error': errors.nickname }"
                        >
                        <div v-if="errors.nickname" class="form-error">{{ errors.nickname }}</div>
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

                    <div class="form-group">
                        <label class="form-label">确认密码</label>
                        <input 
                            type="password" 
                            class="form-input" 
                            v-model="form.confirmPassword" 
                            placeholder="请再次输入密码"
                            :class="{ 'error': errors.confirmPassword }"
                        >
                        <div v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</div>
                    </div>

                    <button 
                        type="submit" 
                        class="btn btn-primary btn-lg"
                        :disabled="loading"
                    >
                        <span v-if="loading">注册中...</span>
                        <span v-else>注册</span>
                    </button>
                </form>

                <div class="login-footer">
                    已有账号？<a href="#" @click.prevent="goToLogin">立即登录</a>
                </div>
            </div>
        </div>
    `
};

const RegisterPageWrapper = {
    render() {
        return Vue.h(RegisterPage);
    }
};

window.RegisterPage = RegisterPage;
window.RegisterPageWrapper = RegisterPageWrapper;
})();
