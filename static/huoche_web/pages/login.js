const LoginPage = {
    emits: ['login'],
    setup(props, { emit }) {
        const username = ref('');
        const password = ref('');
        const loading = ref(false);

        const handleLogin = async () => {
            if (!username.value || !password.value) {
                alert('请输入用户名和密码');
                return;
            }

            loading.value = true;
            const result = await API.auth.login(username.value, password.value);
            loading.value = false;

            if (result.code === 0) {
                emit('login', result.data.user, result.data.token);
            } else {
                alert(result.message || '登录失败');
            }
        };

        const goToRegister = () => {
            Router.navigate('register');
        };

        return {
            username,
            password,
            loading,
            handleLogin,
            goToRegister
        };
    },
    template: `
        <div class="auth-page">
            <div class="auth-card">
                <h1>🚂 火车司机</h1>
                <p class="subtitle">登录开始你的驾驶之旅</p>
                
                <div class="form-group">
                    <label>用户名</label>
                    <input 
                        type="text" 
                        v-model="username" 
                        placeholder="请输入用户名"
                        @keyup.enter="handleLogin"
                    />
                </div>
                
                <div class="form-group">
                    <label>密码</label>
                    <input 
                        type="password" 
                        v-model="password" 
                        placeholder="请输入密码"
                        @keyup.enter="handleLogin"
                    />
                </div>
                
                <button 
                    class="btn btn-primary" 
                    @click="handleLogin"
                    :disabled="loading"
                >
                    {{ loading ? '登录中...' : '登录' }}
                </button>
                
                <div class="auth-footer">
                    还没有账号？ <a href="#" @click.prevent="goToRegister">立即注册</a>
                </div>
            </div>
        </div>
    `
};
