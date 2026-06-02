var LoginPage = {
  activeTab: 'login',
  error: '',

  render: function() {
    var tabLoginActive = this.activeTab === 'login' ? 'active' : '';
    var tabRegisterActive = this.activeTab === 'register' ? 'active' : '';
    var loginDisplay = this.activeTab === 'login' ? 'block' : 'none';
    var registerDisplay = this.activeTab === 'register' ? 'block' : 'none';

    return '<div class="login-page-standalone">' +
      '<div class="login-bg-grid"></div>' +
      '<div class="login-box-standalone">' +
        '<div class="card scan-line">' +
          '<div class="logo-text">末日机甲</div>' +
          '<div class="subtitle">DOOMSDAY MECHA COMBAT SYSTEM</div>' +
          '<div class="auth-tabs">' +
            '<div class="auth-tab ' + tabLoginActive + '" data-tab="login">登 录</div>' +
            '<div class="auth-tab ' + tabRegisterActive + '" data-tab="register">注 册</div>' +
          '</div>' +
          '<div id="authError" class="auth-error" style="display:' + (this.error ? 'block' : 'none') + ';">' + (this.error || '') + '</div>' +
          '<form id="loginForm" class="auth-form" style="display:' + loginDisplay + '">' +
            '<div class="form-group">' +
              '<label>用户名</label>' +
              '<input type="text" class="form-input" id="loginUsername" placeholder="输入用户名" autocomplete="username">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>密码</label>' +
              '<input type="password" class="form-input" id="loginPassword" placeholder="输入密码" autocomplete="current-password">' +
            '</div>' +
            '<button type="submit" class="btn btn-primary btn-block" id="loginBtn">登 录</button>' +
          '</form>' +
          '<form id="registerForm" class="auth-form" style="display:' + registerDisplay + '">' +
            '<div class="form-group">' +
              '<label>用户名</label>' +
              '<input type="text" class="form-input" id="regUsername" placeholder="设置用户名" autocomplete="username">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>密码</label>' +
              '<input type="password" class="form-input" id="regPassword" placeholder="设置密码（至少6位）" autocomplete="new-password">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>确认密码</label>' +
              '<input type="password" class="form-input" id="regConfirmPassword" placeholder="再次输入密码" autocomplete="new-password">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>昵称</label>' +
              '<input type="text" class="form-input" id="regNickname" placeholder="设置昵称（选填）">' +
            '</div>' +
            '<button type="submit" class="btn btn-primary btn-block" id="registerBtn">注 册</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  init: function() {
    this.error = '';
    this._bindTabEvents();
    this._bindFormEvents();
  },

  _bindTabEvents: function() {
    var self = this;
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        self.activeTab = tab.dataset.tab;
        self.error = '';
        document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById('loginForm').style.display = self.activeTab === 'login' ? 'block' : 'none';
        document.getElementById('registerForm').style.display = self.activeTab === 'register' ? 'block' : 'none';
        var errEl = document.getElementById('authError');
        errEl.style.display = 'none';
        errEl.textContent = '';
      });
    });
  },

  _bindFormEvents: function() {
    var self = this;
    var loginForm = document.getElementById('loginForm');
    var registerForm = document.getElementById('registerForm');

    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      self._handleLogin();
    });

    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      self._handleRegister();
    });
  },

  _showError: function(msg) {
    var errEl = document.getElementById('authError');
    errEl.textContent = msg;
    errEl.style.display = 'block';
  },

  _handleLogin: function() {
    var self = this;
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;
    var loginBtn = document.getElementById('loginBtn');

    if (!username) { this._showError('请输入用户名'); return; }
    if (!password) { this._showError('请输入密码'); return; }

    loginBtn.disabled = true;
    loginBtn.textContent = '登录中...';

    Api.auth.login({ username: username, password: password }).then(function(res) {
      if (res.data) {
        var user = res.data.user || res.data;
        var token = res.data.token;
        GameStorage.setToken(token);
        GameStorage.setUser(user);
        if (window.app && window.app.login) {
          window.app.login(user, token);
        } else {
          Router.navigate('game');
        }
      } else {
        self._showError(res.message || '登录失败');
      }
    }).catch(function(err) {
      self._showError(err.message || '登录失败，请检查网络');
    }).finally(function() {
      loginBtn.disabled = false;
      loginBtn.textContent = '登 录';
    });
  },

  _handleRegister: function() {
    var self = this;
    var username = document.getElementById('regUsername').value.trim();
    var password = document.getElementById('regPassword').value;
    var confirmPassword = document.getElementById('regConfirmPassword').value;
    var nickname = document.getElementById('regNickname').value.trim();
    var registerBtn = document.getElementById('registerBtn');

    if (!username) { this._showError('请输入用户名'); return; }
    if (username.length < 3) { this._showError('用户名至少3个字符'); return; }
    if (!password) { this._showError('请设置密码'); return; }
    if (password.length < 6) { this._showError('密码至少6位'); return; }
    if (password !== confirmPassword) { this._showError('两次密码输入不一致'); return; }

    registerBtn.disabled = true;
    registerBtn.textContent = '注册中...';

    Api.auth.register({
      username: username,
      password: password,
      nickname: nickname || username
    }).then(function(res) {
      Utils.showToast('注册成功', 'success');
      return Api.auth.login({ username: username, password: password });
    }).then(function(res) {
      if (res.data) {
        var user = res.data.user || res.data;
        var token = res.data.token;
        GameStorage.setToken(token);
        GameStorage.setUser(user);
        if (window.app && window.app.login) {
          window.app.login(user, token);
        } else {
          Router.navigate('game');
        }
      }
    }).catch(function(err) {
      self._showError(err.message || '注册失败，请检查网络');
    }).finally(function() {
      registerBtn.disabled = false;
      registerBtn.textContent = '注 册';
    });
  }
};

window.LoginPage = LoginPage;
