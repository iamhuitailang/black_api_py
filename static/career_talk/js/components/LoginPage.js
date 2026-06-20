(function() {
    const ref = Vue.ref;
    const reactive = Vue.reactive;

    const LoginPage = {
        name: 'LoginPage',
        emits: ['login-success'],
        setup(props, { emit }) {
            const isRegister = ref(false);
            const loading = ref(false);

            const loginForm = reactive({
                username: '',
                password: ''
            });

            const registerForm = reactive({
                username: '',
                password: '',
                confirm_password: '',
                student_id: '',
                real_name: '',
                phone: '',
                major: ''
            });

            const switchMode = () => {
                isRegister.value = !isRegister.value;
            };

            const handleLogin = async () => {
                if (!loginForm.username || !loginForm.password) {
                    Toast.warning('请输入用户名和密码');
                    return;
                }
                loading.value = true;
                try {
                    const res = await CareerTalkApi.login(loginForm.username, loginForm.password);
                    if (res.code === 0) {
                        AuthStore.setToken(res.data.token);
                        AuthStore.setUser(res.data.user);
                        Toast.success('登录成功');
                        emit('login-success', res.data.user);
                    } else {
                        Toast.error(res.message || '登录失败');
                    }
                } finally {
                    loading.value = false;
                }
            };

            const handleRegister = async () => {
                if (!registerForm.username || !registerForm.password || 
                    !registerForm.student_id || !registerForm.real_name) {
                    Toast.warning('请填写所有必填项');
                    return;
                }
                if (registerForm.password.length < 6) {
                    Toast.warning('密码至少6位');
                    return;
                }
                if (registerForm.password !== registerForm.confirm_password) {
                    Toast.warning('两次密码输入不一致');
                    return;
                }
                loading.value = true;
                try {
                    const res = await CareerTalkApi.registerUser({
                        username: registerForm.username,
                        password: registerForm.password,
                        student_id: registerForm.student_id,
                        real_name: registerForm.real_name,
                        phone: registerForm.phone,
                        major: registerForm.major
                    });
                    if (res.code === 0) {
                        Toast.success('注册成功，请登录');
                        loginForm.username = registerForm.username;
                        loginForm.password = registerForm.password;
                        isRegister.value = false;
                    } else {
                        Toast.error(res.message || '注册失败');
                    }
                } finally {
                    loading.value = false;
                }
            };

            return {
                isRegister,
                loading,
                loginForm,
                registerForm,
                switchMode,
                handleLogin,
                handleRegister
            };
        },
        template: `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h1>🎓 校园宣讲会管理系统</h1>
                        <p>{{ isRegister ? '创建学生账号' : '欢迎回来' }}</p>
                    </div>

                    <div class="auth-tabs">
                        <div 
                            class="auth-tab" 
                            :class="{ active: !isRegister }"
                            @click="switchMode"
                        >登录</div>
                        <div 
                            class="auth-tab" 
                            :class="{ active: isRegister }"
                            @click="switchMode"
                        >注册</div>
                    </div>

                    <form v-if="!isRegister" class="auth-form" @submit.prevent="handleLogin">
                        <div class="form-group">
                            <label>用户名</label>
                            <input 
                                v-model="loginForm.username" 
                                type="text" 
                                placeholder="请输入用户名"
                                autocomplete="username"
                            />
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input 
                                v-model="loginForm.password" 
                                type="password" 
                                placeholder="请输入密码"
                                autocomplete="current-password"
                                @keyup.enter="handleLogin"
                            />
                        </div>
                        <div class="form-tip">
                            管理员默认账号: admin / admin123
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                            {{ loading ? '登录中...' : '登 录' }}
                        </button>
                    </form>

                    <form v-else class="auth-form" @submit.prevent="handleRegister">
                        <div class="form-row">
                            <div class="form-group half">
                                <label>用户名 *</label>
                                <input v-model="registerForm.username" type="text" placeholder="用于登录" />
                            </div>
                            <div class="form-group half">
                                <label>学号 *</label>
                                <input v-model="registerForm.student_id" type="text" placeholder="请输入学号" />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group half">
                                <label>密码 *</label>
                                <input v-model="registerForm.password" type="password" placeholder="至少6位" />
                            </div>
                            <div class="form-group half">
                                <label>确认密码 *</label>
                                <input v-model="registerForm.confirm_password" type="password" placeholder="再次输入密码" />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group half">
                                <label>姓名 *</label>
                                <input v-model="registerForm.real_name" type="text" placeholder="真实姓名" />
                            </div>
                            <div class="form-group half">
                                <label>专业</label>
                                <input v-model="registerForm.major" type="text" placeholder="如：计算机科学" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>手机号</label>
                            <input v-model="registerForm.phone" type="tel" placeholder="选填" />
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
                            {{ loading ? '注册中...' : '注 册' }}
                        </button>
                    </form>
                </div>
            </div>
        `
    };

    window.LoginPage = LoginPage;
})();
