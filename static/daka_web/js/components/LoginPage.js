(function() {
const { ref, h } = Vue;

const LoginPage = {
    emits: ['login-success'],
    setup(props, { emit }) {
        const activeTab = ref('login');
        const loading = ref(false);
        
        const loginForm = ref({
            phone: '',
            password: ''
        });
        
        const registerForm = ref({
            phone: '',
            nickname: '',
            password: ''
        });

        const validatePhone = (phone) => {
            return /^1[3-9]\d{9}$/.test(phone);
        };

        const handleLogin = async () => {
            if (!validatePhone(loginForm.value.phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }
            if (!loginForm.value.password) {
                Toast.error('请输入密码');
                return;
            }

            loading.value = true;
            try {
                const result = await Api.user.login(loginForm.value.phone, loginForm.value.password);
                if (result.code === 0) {
                    Storage.setToken(result.data.token);
                    Storage.setUser(result.data.user);
                    Toast.success('登录成功');
                    emit('login-success', result.data.user);
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error('登录失败，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        const handleRegister = async () => {
            if (!validatePhone(registerForm.value.phone)) {
                Toast.error('请输入正确的手机号');
                return;
            }
            if (!registerForm.value.password || registerForm.value.password.length < 6) {
                Toast.error('密码长度至少6位');
                return;
            }

            loading.value = true;
            try {
                const result = await Api.user.register(
                    registerForm.value.phone,
                    registerForm.value.password,
                    registerForm.value.nickname
                );
                if (result.code === 0) {
                    Storage.setToken(result.data.token);
                    Storage.setUser(result.data.user);
                    Toast.success('注册成功');
                    emit('login-success', result.data.user);
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error('注册失败，请稍后重试');
            } finally {
                loading.value = false;
            }
        };

        return {
            activeTab,
            loading,
            loginForm,
            registerForm,
            handleLogin,
            handleRegister
        };
    },
    render() {
        const renderLoginForm = () => {
            return h('div', { class: 'login-form' }, [
                h('div', { class: 'form-group' }, [
                    h('label', { class: 'form-label' }, '手机号'),
                    h('input', {
                        class: 'form-input',
                        type: 'tel',
                        placeholder: '请输入手机号',
                        maxlength: 11,
                        value: this.loginForm.phone,
                        onInput: (e) => { this.loginForm.phone = e.target.value; }
                    })
                ]),
                h('div', { class: 'form-group' }, [
                    h('label', { class: 'form-label' }, '密码'),
                    h('input', {
                        class: 'form-input',
                        type: 'password',
                        placeholder: '请输入密码',
                        value: this.loginForm.password,
                        onInput: (e) => { this.loginForm.password = e.target.value; }
                    })
                ]),
                h('button', {
                    class: 'btn btn-primary btn-block',
                    onClick: this.handleLogin,
                    disabled: this.loading
                }, this.loading ? '登录中...' : '登 录')
            ]);
        };

        const renderRegisterForm = () => {
            return h('div', { class: 'login-form' }, [
                h('div', { class: 'form-group' }, [
                    h('label', { class: 'form-label' }, '手机号'),
                    h('input', {
                        class: 'form-input',
                        type: 'tel',
                        placeholder: '请输入手机号',
                        maxlength: 11,
                        value: this.registerForm.phone,
                        onInput: (e) => { this.registerForm.phone = e.target.value; }
                    })
                ]),
                h('div', { class: 'form-group' }, [
                    h('label', { class: 'form-label' }, '昵称'),
                    h('input', {
                        class: 'form-input',
                        type: 'text',
                        placeholder: '请输入昵称（选填）',
                        value: this.registerForm.nickname,
                        onInput: (e) => { this.registerForm.nickname = e.target.value; }
                    })
                ]),
                h('div', { class: 'form-group' }, [
                    h('label', { class: 'form-label' }, '密码'),
                    h('input', {
                        class: 'form-input',
                        type: 'password',
                        placeholder: '请输入密码（至少6位）',
                        value: this.registerForm.password,
                        onInput: (e) => { this.registerForm.password = e.target.value; }
                    })
                ]),
                h('button', {
                    class: 'btn btn-primary btn-block',
                    onClick: this.handleRegister,
                    disabled: this.loading
                }, this.loading ? '注册中...' : '注 册')
            ]);
        };

        return h('div', { class: 'login-page' }, [
            h('div', { class: 'login-logo' }, '🌱'),
            h('h1', { class: 'login-title' }, '每日打卡'),
            h('p', { class: 'login-subtitle' }, '自律养成好习惯'),
            h('div', { class: 'login-card' }, [
                h('div', { class: 'login-tabs' }, [
                    h('div', {
                        class: ['login-tab', this.activeTab === 'login' ? 'active' : ''],
                        onClick: () => { this.activeTab = 'login'; }
                    }, '登录'),
                    h('div', {
                        class: ['login-tab', this.activeTab === 'register' ? 'active' : ''],
                        onClick: () => { this.activeTab = 'register'; }
                    }, '注册')
                ]),
                this.activeTab === 'login' ? renderLoginForm() : renderRegisterForm()
            ])
        ]);
    }
};

window.LoginPage = LoginPage;
})();
