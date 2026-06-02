const LoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">劲乐团</h1>
                <p class="auth-subtitle">登录你的音乐之旅</p>
                
                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            v-model="username" 
                            placeholder="请输入用户名"
                            :disabled="loading"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input 
                            type="password" 
                            class="form-input" 
                            v-model="password" 
                            placeholder="请输入密码"
                            :disabled="loading"
                        />
                    </div>
                    
                    <div v-if="error" class="form-error">{{ error }}</div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;" :disabled="loading">
                        <span v-if="loading">登录中...</span>
                        <span v-else>登录</span>
                    </button>
                </form>
                
                <div class="auth-link">
                    还没有账号？<a @click="$emit('navigate', 'register')">立即注册</a>
                </div>
            </div>
        </div>
    `,
    emits: ['navigate', 'login'],
    setup(props, { emit }) {
        const { ref } = Vue;
        
        const username = ref('');
        const password = ref('');
        const error = ref('');
        const loading = ref(false);
        
        const handleLogin = async () => {
            if (!username.value.trim()) {
                error.value = '请输入用户名';
                return;
            }
            if (!password.value.trim()) {
                error.value = '请输入密码';
                return;
            }
            
            error.value = '';
            loading.value = true;
            
            try {
                const result = await AuthService.login(username.value.trim(), password.value);
                
                if (result && result.code === 0 && result.data) {
                    emit('login', result.data.user);
                    emit('navigate', 'home');
                } else {
                    error.value = result?.msg || '登录失败，请检查用户名和密码';
                }
            } catch (e) {
                error.value = '网络错误，请稍后重试';
            } finally {
                loading.value = false;
            }
        };
        
        return {
            username,
            password,
            error,
            loading,
            handleLogin
        };
    }
};
