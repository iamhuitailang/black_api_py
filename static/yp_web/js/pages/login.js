const LoginPage = {
    data: function() {
        return {
            username: '',
            password: '',
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
                    h('p', '跟随节奏，突破极限')
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
                    h('label', '密码'),
                    h('input', {
                        type: 'password',
                        placeholder: '请输入密码',
                        value: self.password,
                        onInput: function(e) { self.password = e.target.value; }
                    })
                ]),
                
                h('button', {
                    class: 'btn btn-primary btn-block',
                    disabled: self.loading,
                    onClick: function() { self.handleLogin(); }
                }, self.loading ? '登录中...' : '登 录'),
                
                h('div', { class: 'auth-footer' }, [
                    '还没有账号？',
                    h('a', {
                        href: '#',
                        onClick: function(e) { e.preventDefault(); self.goToRegister(); }
                    }, '立即注册')
                ])
            ])
        ]);
    },
    methods: {
        handleLogin: async function() {
            console.log('LoginPage: handleLogin called');
            console.log('Username:', this.username);
            
            var self = this;
            
            if (!self.username || !self.password) {
                console.log('Validation failed: empty fields');
                if (Utils && Utils.showToast) {
                    Utils.showToast('请输入用户名和密码', 'error');
                } else {
                    alert('请输入用户名和密码');
                }
                return;
            }

            self.loading = true;
            console.log('Calling Auth.login...');
            
            try {
                var response = await Auth.login(self.username, self.password);
                console.log('Login response:', response);
                self.loading = false;

                if (response.code === 0) {
                    console.log('Login successful!');
                    if (Utils && Utils.showToast) {
                        Utils.showToast('登录成功', 'success');
                    }
                    console.log('Navigating to home...');
                    Router.navigate('home');
                } else {
                    console.log('Login failed:', response.msg);
                    if (Utils && Utils.showToast) {
                        Utils.showToast(response.msg || '登录失败', 'error');
                    } else {
                        alert(response.msg || '登录失败');
                    }
                }
            } catch (e) {
                console.error('Login error:', e);
                self.loading = false;
                alert('登录出错: ' + e.message);
            }
        },
        goToRegister: function() {
            console.log('Going to register page');
            Router.navigate('register');
        }
    },
    mounted: function() {
        console.log('LoginPage mounted');
        if (Auth.isAuthenticated()) {
            console.log('Already authenticated, going to home');
            Router.navigate('home');
        }
    }
};
