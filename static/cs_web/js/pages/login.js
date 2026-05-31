window.LoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card card">
                <h1>🔫 CS在线射击</h1>
                <p class="subtitle">登录你的账号</p>
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" v-model="form.username" placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" v-model="form.password" placeholder="请输入密码" @keyup.enter="handleLogin">
                </div>
                <button class="btn btn-primary" @click="handleLogin" :disabled="loading">
                    {{ loading ? '登录中...' : '登录' }}
                </button>
                <p class="link">
                    还没有账号？<router-link to="/register">立即注册</router-link>
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
            password: ''
        });
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

        const handleLogin = async () => {
            if (!form.username || !form.password) {
                showToast('请输入用户名和密码', 'error');
                return;
            }

            loading.value = true;
            const res = await API.user.login(form);
            loading.value = false;

            if (res.code === 200) {
                Storage.setToken(res.data.token);
                Storage.setUser(res.data.user);
                showToast('登录成功');
                setTimeout(() => {
                    router.push('/home');
                }, 500);
            } else {
                showToast(res.message, 'error');
            }
        };

        return { form, loading, toast, handleLogin };
    }
};
