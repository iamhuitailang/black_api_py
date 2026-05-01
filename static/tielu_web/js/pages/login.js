(function() {
    'use strict';

    var LoginPage = {
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
                    '<div class="login-header">',
                        '<div class="login-logo">🚂</div>',
                        '<h1 class="login-title glitch-text" data-text="铁道大亨">铁道大亨</h1>',
                        '<p class="login-subtitle">朋克铁路帝国</p>',
                    '</div>',
                    '<div class="login-body">',
                        '<form class="login-form" id="loginForm">',
                            '<div class="form-group">',
                                '<label class="form-label">用户名</label>',
                                '<input type="text" class="form-control" id="username" placeholder="请输入用户名" autocomplete="username">',
                            '</div>',
                            '<div class="form-group">',
                                '<label class="form-label">密码</label>',
                                '<input type="password" class="form-control" id="password" placeholder="请输入密码" autocomplete="current-password">',
                            '</div>',
                            '<div class="form-group mt-2">',
                                '<button type="submit" class="btn btn-primary btn-block btn-lg">登 录</button>',
                            '</div>',
                        '</form>',
                        '<div class="login-links">',
                            '还没有账号？',
                            '<a href="#register" onclick="Router.navigate(\'register\'); return false;">立即注册</a>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');
        },

        bindEvents: function() {
            var self = this;
            var form = document.getElementById('loginForm');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    self.handleLogin();
                });
            }
        },

        handleLogin: function() {
            var username = document.getElementById('username').value.trim();
            var password = document.getElementById('password').value;

            if (!username) {
                Utils.showToast('请输入用户名');
                return;
            }
            if (!password) {
                Utils.showToast('请输入密码');
                return;
            }

            Auth.login(username, password)
                .then(function(data) {
                    Utils.showToast('登录成功！');
                    setTimeout(function() {
                        Router.navigate('home');
                    }, 500);
                })
                .catch(function(error) {
                    Utils.showToast(error.message || '登录失败');
                });
        },

        onHide: function() {
        }
    };

    Router.register('login', LoginPage);
})();
