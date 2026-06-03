const RegisterPage = {
    name: 'RegisterPage',
    template: `
        <div class="page register-page">
            <div class="login-card">
                <div class="login-logo">⏳</div>
                <h1 class="login-title">冒险者登记</h1>
                <p class="login-subtitle">在时间之塔留下你的名字</p>
                <div class="form-group">
                    <input type="text" v-model="username" placeholder="用户名（3-20位）" class="form-input" />
                </div>
                <div class="form-group">
                    <input type="password" v-model="password" placeholder="密码（至少6位）" class="form-input" />
                </div>
                <div class="form-group">
                    <input type="text" v-model="nickname" placeholder="昵称（选填）" class="form-input" />
                </div>
                <button class="btn btn-primary btn-block" @click="handleRegister" :disabled="loading">
                    {{ loading ? '注册中...' : '注 册' }}
                </button>
                <div class="login-footer">
                    已有账号？<a href="#login" class="link">返回登录</a>
                </div>
            </div>
        </div>
    `,
    setup() {
        const username = Vue.ref('')
        const password = Vue.ref('')
        const nickname = Vue.ref('')
        const loading = Vue.ref(false)

        const handleRegister = async () => {
            if (!username.value || !password.value) {
                SjStore.showToast('请填写用户名和密码', 'error')
                return
            }
            loading.value = true
            const result = await SjAuth.register(username.value, password.value, nickname.value)
            loading.value = false
            if (result.success) {
                SjStore.setUser(result.data.user)
                SjStore.setToken(result.data.token)
                SjStore.showToast('注册成功', 'success')
                SjRouter.navigate('home')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        return { username, password, nickname, loading, handleRegister }
    }
}
