const LoginPage = {
    name: 'LoginPage',
    template: `
        <div class="page login-page">
            <div class="login-card">
                <div class="login-logo">⏳</div>
                <h1 class="login-title">时间之塔</h1>
                <p class="login-subtitle">传说中有一座时间之塔，塔顶的时间水晶拥有控制时间的力量</p>
                <div class="form-group">
                    <input type="text" v-model="username" placeholder="用户名" class="form-input"
                           @keyup.enter="handleLogin" />
                </div>
                <div class="form-group">
                    <input type="password" v-model="password" placeholder="密码" class="form-input"
                           @keyup.enter="handleLogin" />
                </div>
                <button class="btn btn-primary btn-block" @click="handleLogin" :disabled="loading">
                    {{ loading ? '登录中...' : '登 录' }}
                </button>
                <div class="login-footer">
                    还没有账号？<a href="#register" class="link">立即注册</a>
                </div>
            </div>
        </div>
    `,
    setup() {
        const username = Vue.ref('')
        const password = Vue.ref('')
        const loading = Vue.ref(false)

        const handleLogin = async () => {
            if (!username.value || !password.value) {
                SjStore.showToast('请输入用户名和密码', 'error')
                return
            }
            loading.value = true
            const result = await SjAuth.login(username.value, password.value)
            loading.value = false
            if (result.success) {
                SjStore.setUser(result.data.user)
                SjStore.setToken(result.data.token)
                SjStore.showToast('登录成功', 'success')
                SjRouter.navigate('home')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        return { username, password, loading, handleLogin }
    }
}
