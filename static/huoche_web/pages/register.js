const RegisterPage = {
    setup() {
        const username = ref('');
        const password = ref('');
        const confirmPassword = ref('');
        const loading = ref(false);

        const handleRegister = async () => {
            if (!username.value || !password.value) {
                alert('请输入用户名和密码');
                return;
            }

            if (password.value !== confirmPassword.value) {
                alert('两次输入的密码不一致');
                return;
            }

            if (password.value.length < 6) {
                alert('密码长度至少6位');
                return;
            }

            loading.value = true;
            const result = await API.huoche.register(username.value, password.value);
            loading.value = false;

            if (result.code === 0) {
                alert('注册成功！请登录');
                Router.navigate('login');
            } else {
                alert(result.message || '注册失败');
            }
        };

        const goToLogin = () => {
            Router.navigate('login');
        };

        return {
            username,
            password,
            confirmPassword,
            loading,
            handleRegister,
            goToLogin
        };
    },
    template: `
        <div class="auth-page">
            <div class="auth-card">
                <h1>🚂 火车司机</h1>
                <p class="subtitle">注册成为火车司机</p>
                
                <div class="form-group">
                    <label>用户名</label>
                    <input 
                        type="text" 
                        v-model="username" 
                        placeholder="请输入用户名"
                    />
                </div>
                
                <div class="form-group">
                    <label>密码</label>
                    <input 
                        type="password" 
                        v-model="password" 
                        placeholder="请输入密码（至少6位）"
                    />
                </div>
                
                <div class="form-group">
                    <label>确认密码</label>
                    <input 
                        type="password" 
                        v-model="confirmPassword" 
                        placeholder="请再次输入密码"
                    />
                </div>
                
                <button 
                    class="btn btn-primary" 
                    @click="handleRegister"
                    :disabled="loading"
                >
                    {{ loading ? '注册中...' : '注册' }}
                </button>
                
                <div class="auth-footer">
                    已有账号？ <a href="#" @click.prevent="goToLogin">立即登录</a>
                </div>
            </div>
        </div>
    `
};
