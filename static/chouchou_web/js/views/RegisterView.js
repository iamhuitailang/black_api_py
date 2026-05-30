
const RegisterView = Vue.defineComponent({
    name: 'RegisterView',
    setup() {
        const router = window.ChouchouRouter;
        
        const form = Vue.reactive({
            username: '',
            password: '',
            confirmPassword: '',
            nickname: '',
            phone: ''
        });

        const loading = Vue.ref(false);
        const showPassword = Vue.ref(false);

        const handleRegister = async () => {
            if (!form.username.trim()) {
                Utils.warning('请输入用户名');
                return;
            }
            if (!Utils.isValidUsername(form.username)) {
                Utils.warning('用户名只能包含字母、数字和下划线，3-20位');
                return;
            }
            if (!form.password) {
                Utils.warning('请输入密码');
                return;
            }
            if (!Utils.isValidPassword(form.password)) {
                Utils.warning('密码长度需要6-20位');
                return;
            }
            if (form.password !== form.confirmPassword) {
                Utils.warning('两次输入的密码不一致');
                return;
            }
            if (form.phone && !Utils.isValidPhone(form.phone)) {
                Utils.warning('请输入正确的手机号');
                return;
            }

            loading.value = true;
            try {
                const result = await API.user.register(
                    form.username.trim(),
                    form.password,
                    form.nickname.trim(),
                    form.phone.trim() || undefined
                );
                if (result) {
                    Utils.success('注册成功！请登录');
                    setTimeout(() => {
                        router.push('/login');
                    }, 500);
                }
            } finally {
                loading.value = false;
            }
        };

        const goToLogin = () => {
            router.push('/login');
        };

        return {
            Store,
            Utils,
            form,
            loading,
            showPassword,
            handleRegister,
            goToLogin
        };
    },
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <h2>🎪 注册账号</h2>
                <p style="text-align: center; color: var(--text-light); margin-bottom: 24px;">
                    加入国王游戏，开启马戏对决
                </p>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>用户名 *</label>
                        <input 
                            type="text" 
                            v-model="form.username" 
                            placeholder="3-20位字母数字下划线"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label>昵称</label>
                        <input 
                            type="text" 
                            v-model="form.nickname" 
                            placeholder="显示的昵称"
                        />
                    </div>
                </div>
                
                <div class="form-group">
                    <label>密码 *</label>
                    <div style="position: relative;">
                        <input 
                            :type="showPassword ? 'text' : 'password'" 
                            v-model="form.password" 
                            placeholder="6-20位密码"
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
                
                <div class="form-group">
                    <label>确认密码 *</label>
                    <input 
                        type="password" 
                        v-model="form.confirmPassword" 
                        placeholder="再次输入密码"
                    />
                </div>
                
                <div class="form-group">
                    <label>手机号</label>
                    <input 
                        type="tel" 
                        v-model="form.phone" 
                        placeholder="可选，用于找回密码"
                    />
                </div>
                
                <button 
                    class="btn btn-primary btn-lg" 
                    :disabled="loading"
                    @click="handleRegister"
                >
                    {{ loading ? '注册中...' : '注 册' }}
                </button>
                
                <div class="auth-footer">
                    已有账号？
                    <a href="#" @click.prevent="goToLogin">立即登录</a>
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

window.RegisterView = RegisterView;
