var RegisterPage = {
  error: '',
  success: '',

  render: function() {
    return '<div class="login-page-standalone">' +
      '<div class="login-bg-grid"></div>' +
      '<div class="login-box-standalone">' +
        '<div class="card scan-line">' +
          '<div class="logo-text">末日机甲</div>' +
          '<div class="subtitle">DOOMSDAY MECHA - 注册</div>' +
          '<div id="regPageError" class="auth-error" style="display:' + (this.error ? 'block' : 'none') + ';">' + (this.error || '') + '</div>' +
          '<div id="regPageSuccess" class="auth-success" style="display:' + (this.success ? 'block' : 'none') + ';">' + (this.success || '') + '</div>' +
          '<form id="standaloneRegisterForm">' +
            '<div class="form-group">' +
              '<label>用户名</label>' +
              '<input type="text" class="form-input" id="regStUsername" placeholder="设置用户名（至少3个字符）" autocomplete="username">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>密码</label>' +
              '<input type="password" class="form-input" id="regStPassword" placeholder="设置密码（至少6位）" autocomplete="new-password">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>确认密码</label>' +
              '<input type="password" class="form-input" id="regStConfirmPassword" placeholder="再次输入密码" autocomplete="new-password">' +
            '</div>' +
            '<div class="form-group">' +
              '<label>昵称</label>' +
              '<input type="text" class="form-input" id="regStNickname" placeholder="设置昵称（选填）">' +
            '</div>' +
            '<button type="submit" class="btn btn-primary btn-block" id="regStBtn">注 册</button>' +
          '</form>' +
          '<div class="alt-link">' +
            '已有账号？<a id="goToLoginLink">立即登录</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  init: function() {
    this.error = '';
    this.success = '';
    var self = this;
    var form = document.getElementById('standaloneRegisterForm');
    var loginLink = document.getElementById('goToLoginLink');

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      self._handleRegister();
    });

    loginLink.addEventListener('click', function() {
      Router.navigate('login');
    });
  },

  _showError: function(msg) {
    var errEl = document.getElementById('regPageError');
    var successEl = document.getElementById('regPageSuccess');
    errEl.textContent = msg;
    errEl.style.display = 'block';
    successEl.style.display = 'none';
  },

  _showSuccess: function(msg) {
    var errEl = document.getElementById('regPageError');
    var successEl = document.getElementById('regPageSuccess');
    successEl.textContent = msg;
    successEl.style.display = 'block';
    errEl.style.display = 'none';
  },

  _handleRegister: function() {
    var self = this;
    var username = document.getElementById('regStUsername').value.trim();
    var password = document.getElementById('regStPassword').value;
    var confirmPassword = document.getElementById('regStConfirmPassword').value;
    var nickname = document.getElementById('regStNickname').value.trim();
    var btn = document.getElementById('regStBtn');

    if (!username) { this._showError('请输入用户名'); return; }
    if (username.length < 3) { this._showError('用户名至少3个字符'); return; }
    if (!password) { this._showError('请设置密码'); return; }
    if (password.length < 6) { this._showError('密码至少6位'); return; }
    if (password !== confirmPassword) { this._showError('两次密码输入不一致'); return; }

    btn.disabled = true;
    btn.textContent = '注册中...';

    Api.auth.register({
      username: username,
      password: password,
      nickname: nickname || username
    }).then(function(res) {
      self._showSuccess('注册成功！即将跳转登录页面...');
      setTimeout(function() {
        Router.navigate('login');
      }, 1500);
    }).catch(function(err) {
      self._showError(err.message || '注册失败，请检查网络');
    }).finally(function() {
      btn.disabled = false;
      btn.textContent = '注 册';
    });
  }
};

window.RegisterPage = RegisterPage;
