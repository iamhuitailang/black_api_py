const RegisterPage = {
  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">🏨</div>
            <h1 class="auth-title">酒店预订系统</h1>
            <p class="auth-subtitle">创建您的账户</p>
          </div>
          <form id="registerForm">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input type="text" class="form-input" id="username" placeholder="请输入用户名">
            </div>
            <div class="form-group">
              <label class="form-label">昵称</label>
              <input type="text" class="form-input" id="nickname" placeholder="请输入昵称（选填）">
            </div>
            <div class="form-group">
              <label class="form-label">手机号</label>
              <input type="tel" class="form-input" id="phone" placeholder="请输入手机号" maxlength="11">
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <input type="password" class="form-input" id="password" placeholder="请输入密码（至少6位）">
            </div>
            <div class="form-group">
              <label class="form-label">确认密码</label>
              <input type="password" class="form-input" id="confirmPassword" placeholder="请再次输入密码">
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="registerBtn">注册</button>
          </form>
          <div class="auth-footer">
            已有账号？<a href="javascript:;" onclick="Router.navigate('/login')">立即登录</a>
          </div>
        </div>
      </div>
    `;
    this.bindEvents();
  },

  bindEvents() {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });
  },

  async handleRegister() {
    const username = document.getElementById('username').value.trim();
    const nickname = document.getElementById('nickname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerBtn = document.getElementById('registerBtn');

    if (!username) {
      Toast.error('请输入用户名');
      return;
    }

    if (!phone) {
      Toast.error('请输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Toast.error('请输入正确的手机号');
      return;
    }

    if (!password) {
      Toast.error('请输入密码');
      return;
    }

    if (password.length < 6) {
      Toast.error('密码至少6位');
      return;
    }

    if (password !== confirmPassword) {
      Toast.error('两次密码输入不一致');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 8px; display: inline-block; vertical-align: middle;"></span> 注册中...';

    try {
      const result = await UserApi.register({ username, phone, password, nickname });

      if (result.code === 0) {
        TokenStorage.setToken(result.data.token);
        TokenStorage.setUser(result.data.user);
        Toast.success('注册成功');
        Router.navigate('/');
      } else {
        Toast.error(result.msg || '注册失败');
      }
    } catch (error) {
      Toast.error('注册失败，请检查网络');
    } finally {
      registerBtn.disabled = false;
      registerBtn.innerHTML = '注册';
    }
  }
};
