(function() {
    'use strict';

    var RegisterPage = {
        onShow: function(params) {
            if (Auth.isLoggedIn()) {
                Router.navigate('home');
            }
        },

        render: function() {
            var app = document.getElementById('app');
            app.innerHTML = this.getTemplate();
            this.bindEvents();
        },

        getTemplate: function() {
            return [
                '<div class="login-page no-tabbar">',
                    '<div class="header">',
                        '<button class="header-back" onclick="Router.back();">&#8592;</button>',
                        '<h1 class="header-title">注册账号</h1>',
                    '</div>',
                    '<div class="login-body" style="margin-top: 60px;">',
                        '<form class="login-form" id="registerForm">',
                            '<div class="form-group">',
                                '<label class="form-label">用户名</label>',
                                '<input type="text" class="form-control" id="username" placeholder="请输入用户名（3-20位）" autocomplete="username">',
                            '</div>',
                            '<div class="form-group">',
                                '<label class="form-label">密码</label>',
                                '<input type="password" class="form-control" id="password" placeholder="请输入密码（6-20位）" autocomplete="new-password">',
                            '</div>',
                            '<div class="form-group">',
                                '<label class="form-label">确认密码</label>',
                                '<input type="password" class="form-control" id="confirmPassword" placeholder="请再次输入密码" autocomplete="new-password">',
                            '</div>',
                            '<div class="form-group mt-2">',
                                '<button type="submit" class="btn btn-primary btn-block btn-lg">注 册</button>',
                            '</div>',
                        '</form>',
                        '<div class="login-links">',
                            '已有账号？',
                            '<a href="#login" onclick="Router.navigate(\'login\'); return false;">立即登录</a>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');
        },

        bindEvents: function() {
            var self = this;
            var form = document.getElementById('registerForm');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    self.handleRegister();
                });
            }
        },

        handleRegister: function() {
            var username = document.getElementById('username').value.trim();
            var password = document.getElementById('password').value;
            var confirmPassword = document.getElementById('confirmPassword').value;

            if (!username) {
                Utils.showToast('请输入用户名');
                return;
            }
            if (username.length < 3 || username.length > 20) {
                Utils.showToast('用户名需3-20位字符');
                return;
            }
            if (!password) {
                Utils.showToast('请输入密码');
                return;
            }
            if (password.length < 6 || password.length > 20) {
                Utils.showToast('密码需6-20位字符');
                return;
            }
            if (password !== confirmPassword) {
                Utils.showToast('两次输入的密码不一致');
                return;
            }

            Auth.register(username, password)
                .then(function(data) {
                    Utils.showToast('注册成功！');
                    setTimeout(function() {
                        Router.navigate('home');
                    }, 500);
                })
                .catch(function(error) {
                    Utils.showToast(error.message || '注册失败');
                });
        },

        onHide: function() {
        }
    };

    Router.register('register', RegisterPage);
})();
