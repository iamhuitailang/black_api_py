
const LoginView = Vue.defineComponent({
    name: 'LoginView',
    setup() {
        const router = window.ChouchouRouter;
        
        const form = Vue.reactive({
            username: '',
            password: ''
        });

        const loading = Vue.ref(false);
        const showPassword = Vue.ref(false);

        const handleLogin = async () => {
            if (!form.username.trim()) {
                Utils.warning('请输入用户名');
                return;
            }
            if (!form.password) {
                Utils.warning('请输入密码');
                return;
            }

            loading.value = true;
            try {
                const result = await API.user.login(form.username.trim(), form.password);
                if (result) {
                    Store.setToken(result.token);
                    Store.setUser(result.user);
                    Utils.success('登录成功！欢迎回来');
                    
                    setTimeout(() => {
                        router.push('/lobby');
                    }, 500);
                }
            } finally {
                loading.value = false;
            }
        };

        const goToRegister = () => {
            router.push('/register');
        };

        return {
            Store,
            Utils,
            form,
            loading,
            showPassword,
            handleLogin,
            goToRegister
        };
    },
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h2>🎪 国王游戏</h2>
                <p style="text-align: center; color: var(--text-light); margin-bottom: 24px;">
                    马戏对决，趣味无限
                </p>
                
                <div class="form-group">
                    <label>用户名</label>
                    <input 
                        type="text" 
                        v-model="form.username" 
                        placeholder="请输入用户名"
                        @keyup.enter="handleLogin"
                    />
                </div>
                
                <div class="form-group">
                    <label>密码</label>
                    <div style="position: relative;">
                        <input 
                            :type="showPassword ? 'text' : 'password'" 
                            v-model="form.password" 
                            placeholder="请输入密码"
                            @keyup.enter="handleLogin"
                        />
                        <button 
                            type="button"
                            style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; font-size: 18px;"
                            @click="showPassword = !showPassword"
                        >
                            {{ showPassword ? '🙈' : '👁️' }}
                        </button>
                    </div>
                </div>
                
                <button 
                    class="btn btn-primary btn-lg" 
                    :disabled="loading"
                    @click="handleLogin"
                >
                    {{ loading ? '登录中...' : '登 录' }}
                </button>
                
                <div class="auth-footer">
                    还没有账号？
                    <a href="#" @click.prevent="goToRegister">立即注册</a>
                </div>
                
                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
                    <div class="theme-switcher" style="justify-content: center;">
                        <span style="margin-right: 12px; color: var(--text-light);">选择主题:</span>
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
        </div>
    `
});

window.LoginView = LoginView;
