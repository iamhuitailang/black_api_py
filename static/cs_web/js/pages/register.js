window.RegisterPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card card">
                <h1>🔫 CS在线射击</h1>
                <p class="subtitle">创建新账号</p>
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" v-model="form.username" placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label>昵称</label>
                    <input type="text" v-model="form.nickname" placeholder="请输入昵称">
                </div>
                <div class="form-group">
                    <label>邮箱</label>
                    <input type="email" v-model="form.email" placeholder="请输入邮箱">
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" v-model="form.password" placeholder="请输入密码">
                </div>
                <div class="form-group">
                    <label>确认密码</label>
                    <input type="password" v-model="confirmPassword" placeholder="请再次输入密码" @keyup.enter="handleRegister">
                </div>
                <button class="btn btn-primary" @click="handleRegister" :disabled="loading">
                    {{ loading ? '注册中...' : '注册' }}
                </button>
                <p class="link">
                    已有账号？<router-link to="/login">立即登录</router-link>
                </p>
            </div>
        </div>
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
            {{ toast.message }}
        </div>
    `,
    setup() {
        const router = useRouter();
        const form = reactive({
            username: '',
            nickname: '',
            email: '',
            password: ''
        });
        const confirmPassword = ref('');
        const loading = ref(false);
        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });

        const showToast = (message, type = 'success') => {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            setTimeout(() => {
                toast.show = false;
            }, 3000);
        };

        const handleRegister = async () => {
            if (!form.username || !form.password) {
                showToast('请填写用户名和密码', 'error');
                return;
            }
            if (form.password !== confirmPassword.value) {
                showToast('两次密码不一致', 'error');
                return;
            }

            loading.value = true;
            const res = await API.user.register(form);
            loading.value = false;

            if (res.code === 200) {
                showToast('注册成功，请登录');
                setTimeout(() => {
                    router.push('/login');
                }, 1000);
            } else {
                showToast(res.message, 'error');
            }
        };

        return { form, confirmPassword, loading, toast, handleRegister };
    }
};
