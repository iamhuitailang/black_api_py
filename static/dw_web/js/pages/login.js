const LoginPage = {
    template: `
    <div class="login-page">
        <div class="login-header">
            <div class="login-logo">🐾</div>
            <div class="login-title">动物园大亨</div>
            <div class="login-subtitle">建造属于你的梦幻动物园</div>
        </div>
        <div class="login-body">
            <div class="login-form">
                <div class="form-group">
                    <label class="form-label">👤 用户名</label>
                    <input class="form-control" type="text" v-model="username" placeholder="请输入用户名" @keyup.enter="handleLogin">
                </div>
                <div class="form-group">
                    <label class="form-label">🔑 密码</label>
                    <input class="form-control" type="password" v-model="password" placeholder="请输入密码" @keyup.enter="handleLogin">
                </div>
                <button class="btn btn-primary btn-block btn-lg" @click="handleLogin" :disabled="loading">
                    <span v-if="loading" class="loading-spinner"></span>
                    <span v-else>🌿 登录</span>
                </button>
            </div>
            <div class="login-links">
                <a @click="goRegister">还没有账号？立即注册 🐣</a>
            </div>
        </div>
    </div>
    `,
    setup() {
        const username = ref('');
        const password = ref('');
        const loading = ref(false);

        async function handleLogin() {
            if (!username.value || !password.value) {
                DwUtils.showToast('请输入用户名和密码', 'warning');
                return;
            }
            loading.value = true;
            try {
                const result = await DwAuth.login(username.value, password.value);
                if (result.code === 0) {
                    DwUtils.showToast('登录成功！欢迎回来 🎉', 'success');
                    DwRouter.navigate('dashboard');
                } else {
                    DwUtils.showToast(result.msg || '登录失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('网络错误，请重试', 'error');
            } finally {
                loading.value = false;
            }
        }

        function goRegister() {
            DwRouter.navigate('register');
        }

        return { username, password, loading, handleLogin, goRegister };
    }
};
