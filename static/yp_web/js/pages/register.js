const RegisterPage = {
    data: function() {
        return {
            username: '',
            email: '',
            nickname: '',
            password: '',
            confirmPassword: '',
            loading: false
        };
    },
    render: function() {
        var self = this;
        var h = Vue.h;
        
        return h('div', { class: 'auth-page' }, [
            h('div', { class: 'auth-card' }, [
                h('div', { class: 'auth-logo' }, [
                    h('h1', '🎵 音乐跑酷'),
                    h('p', '创建账号，开启节奏之旅')
                ]),
                
                h('div', { class: 'form-group' }, [
                    h('label', '用户名'),
                    h('input', {
                        type: 'text',
                        placeholder: '请输入用户名',
                        value: self.username,
                        onInput: function(e) { self.username = e.target.value; }
                    })
                ]),
                
                h('div', { class: 'form-group' }, [
                    h('label', '邮箱'),
                    h('input', {
                        type: 'email',
                        placeholder: '请输入邮箱',
                        value: self.email,
                        onInput: function(e) { self.email = e.target.value; }
                    })
                ]),
                
                h('div', { class: 'form-group' }, [
                    h('label', '昵称'),
                    h('input', {
                        type: 'text',
                        placeholder: '请输入昵称',
                        value: self.nickname,
                        onInput: function(e) { self.nickname = e.target.value; }
                    })
                ]),
                
                h('div', { class: 'form-group' }, [
                    h('label', '密码'),
                    h('input', {
                        type: 'password',
                        placeholder: '请输入密码（至少6位）',
                        value: self.password,
                        onInput: function(e) { self.password = e.target.value; }
                    })
                ]),
                
                h('div', { class: 'form-group' }, [
                    h('label', '确认密码'),
                    h('input', {
                        type: 'password',
                        placeholder: '请再次输入密码',
                        value: self.confirmPassword,
                        onInput: function(e) { self.confirmPassword = e.target.value; }
                    })
                ]),
                
                h('button', {
                    class: 'btn btn-primary btn-block',
                    disabled: self.loading,
                    onClick: function() { self.handleRegister(); }
                }, self.loading ? '注册中...' : '注 册'),
                
                h('div', { class: 'auth-footer' }, [
                    '已有账号？',
                    h('a', {
                        href: '#',
                        onClick: function(e) { e.preventDefault(); self.goToLogin(); }
                    }, '立即登录')
                ])
            ])
        ]);
    },
    methods: {
        handleRegister: async function() {
            console.log('RegisterPage: handleRegister called');
            
            var self = this;
            
            if (self.password !== self.confirmPassword) {
                console.log('Validation failed: passwords do not match');
                if (Utils && Utils.showToast) {
                    Utils.showToast('两次输入的密码不一致', 'error');
                } else {
                    alert('两次输入的密码不一致');
                }
                return;
            }

            if (self.password.length < 6) {
                console.log('Validation failed: password too short');
                if (Utils && Utils.showToast) {
                    Utils.showToast('密码至少需要6位', 'error');
                } else {
                    alert('密码至少需要6位');
                }
                return;
            }

            self.loading = true;
            console.log('Calling Auth.register...');
            
            try {
                var response = await Auth.register({
                    username: self.username,
                    email: self.email,
                    nickname: self.nickname,
                    password: self.password
                });
                console.log('Register response:', response);
                self.loading = false;

                if (response.code === 0) {
                    console.log('Register successful!');
                    if (Utils && Utils.showToast) {
                        Utils.showToast('注册成功', 'success');
                    }
                    console.log('Navigating to home...');
                    Router.navigate('home');
                } else {
                    console.log('Register failed:', response.msg);
                    if (Utils && Utils.showToast) {
                        Utils.showToast(response.msg || '注册失败', 'error');
                    } else {
                        alert(response.msg || '注册失败');
                    }
                }
            } catch (e) {
                console.error('Register error:', e);
                self.loading = false;
                alert('注册出错: ' + e.message);
            }
        },
        goToLogin: function() {
            console.log('Going to login page');
            Router.navigate('login');
        }
    }
};
