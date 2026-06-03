const RegisterPage = {
    template: `
    <div class="login-page">
        <div class="login-header">
            <div class="login-logo">🦁</div>
            <div class="login-title">加入动物园</div>
            <div class="login-subtitle">开始你的动物园冒险之旅</div>
        </div>
        <div class="login-body">
            <div class="login-form">
                <div class="form-group">
                    <label class="form-label">👤 用户名</label>
                    <input class="form-control" type="text" v-model="username" placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label class="form-label">🐱 昵称</label>
                    <input class="form-control" type="text" v-model="nickname" placeholder="给自己取个昵称">
                </div>
                <div class="form-group">
                    <label class="form-label">🔑 密码</label>
                    <input class="form-control" type="password" v-model="password" placeholder="请输入密码">
                </div>
                <div class="form-group">
                    <label class="form-label">🔑 确认密码</label>
                    <input class="form-control" type="password" v-model="confirmPassword" placeholder="请再次输入密码" @keyup.enter="handleRegister">
                </div>
                <button class="btn btn-primary btn-block btn-lg" @click="handleRegister" :disabled="loading">
                    <span v-if="loading" class="loading-spinner"></span>
                    <span v-else>🐣 注册</span>
                </button>
            </div>
            <div class="login-links">
                <a @click="goLogin">已有账号？去登录 🌿</a>
            </div>
        </div>
    </div>
    `,
    setup() {
        const username = ref('');
        const nickname = ref('');
        const password = ref('');
        const confirmPassword = ref('');
        const loading = ref(false);

        async function handleRegister() {
            if (!username.value || !password.value) {
                DwUtils.showToast('请输入用户名和密码', 'warning');
                return;
            }
            if (password.value !== confirmPassword.value) {
                DwUtils.showToast('两次密码不一致', 'warning');
                return;
            }
            if (password.value.length < 4) {
                DwUtils.showToast('密码至少4位', 'warning');
                return;
            }
            loading.value = true;
            try {
                const result = await DwAuth.register(username.value, password.value, nickname.value);
                if (result.code === 0) {
                    DwUtils.showToast('注册成功！欢迎加入 🎉', 'success');
                    DwRouter.navigate('dashboard');
                } else {
                    DwUtils.showToast(result.msg || '注册失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('网络错误，请重试', 'error');
            } finally {
                loading.value = false;
            }
        }

        function goLogin() {
            DwRouter.navigate('login');
        }

        return { username, nickname, password, confirmPassword, loading, handleRegister, goLogin };
    }
};
