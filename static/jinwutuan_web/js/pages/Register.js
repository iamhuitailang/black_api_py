const RegisterPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h1 class="auth-title">创建账号</h1>
                <p class="auth-subtitle">开启你的音乐之旅</p>
                
                <form @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label class="form-label">用户名</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            v-model="username" 
                            placeholder="请输入用户名(3-20位字母数字)"
                            :disabled="loading"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            v-model="nickname" 
                            placeholder="请输入昵称"
                            :disabled="loading"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">密码</label>
                        <input 
                            type="password" 
                            class="form-input" 
                            v-model="password" 
                            placeholder="请输入密码(至少6位)"
                            :disabled="loading"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">确认密码</label>
                        <input 
                            type="password" 
                            class="form-input" 
                            v-model="confirmPassword" 
                            placeholder="请再次输入密码"
                            :disabled="loading"
                        />
                    </div>
                    
                    <div v-if="error" class="form-error">{{ error }}</div>
                    
                    <div v-if="success" style="padding: 12px; background: rgba(0, 255, 136, 0.1); border: 1px solid var(--neon-green); border-radius: 8px; color: var(--neon-green); margin-bottom: 15px;">
                        {{ success }}
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;" :disabled="loading">
                        <span v-if="loading">注册中...</span>
                        <span v-else>注册</span>
                    </button>
                </form>
                
                <div class="auth-link">
                    已有账号？<a @click="$emit('navigate', 'login')">立即登录</a>
                </div>
            </div>
        </div>
    `,
    emits: ['navigate', 'login'],
    setup(props, { emit }) {
        const { ref } = Vue;
        
        const username = ref('');
        const nickname = ref('');
        const password = ref('');
        const confirmPassword = ref('');
        const error = ref('');
        const success = ref('');
        const loading = ref(false);
        
        const handleRegister = async () => {
            if (!username.value.trim()) {
                error.value = '请输入用户名';
                return;
            }
            if (!nickname.value.trim()) {
                error.value = '请输入昵称';
                return;
            }
            if (!password.value.trim()) {
                error.value = '请输入密码';
                return;
            }
            if (password.value.length < 6) {
                error.value = '密码长度不能少于6位';
                return;
            }
            if (password.value !== confirmPassword.value) {
                error.value = '两次输入的密码不一致';
                return;
            }
            
            error.value = '';
            success.value = '';
            loading.value = true;
            
            try {
                const result = await AuthService.register(
                    username.value.trim(),
                    password.value,
                    nickname.value.trim()
                );
                
                if (result && result.code === 0) {
                    success.value = '注册成功！正在跳转登录...';
                    setTimeout(() => {
                        emit('navigate', 'login');
                    }, 1500);
                } else {
                    error.value = result?.msg || '注册失败，请稍后重试';
                }
            } catch (e) {
                error.value = '网络错误，请稍后重试';
            } finally {
                loading.value = false;
            }
        };
        
        return {
            username,
            nickname,
            password,
            confirmPassword,
            error,
            success,
            loading,
            handleRegister
        };
    }
};
