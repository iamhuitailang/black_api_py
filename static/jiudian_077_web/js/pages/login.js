const LoginPage = {
  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">🏨</div>
            <h1 class="auth-title">酒店预订系统</h1>
            <p class="auth-subtitle">欢迎登录您的账户</p>
          </div>
          <form id="loginForm">
            <div class="form-group">
              <label class="form-label">账号</label>
              <input type="text" class="form-input" id="account" placeholder="请输入用户名或手机号">
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <input type="password" class="form-input" id="password" placeholder="请输入密码">
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="loginBtn">登录</button>
          </form>
          <div class="auth-footer">
            还没有账号？<a href="javascript:;" onclick="Router.navigate('/register')">立即注册</a>
          </div>
        </div>
      </div>
    `;
    this.bindEvents();
  },

  bindEvents() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  },

  async handleLogin() {
    const account = document.getElementById('account').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!account) {
      Toast.error('请输入账号');
      return;
    }

    if (!password) {
      Toast.error('请输入密码');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 8px; display: inline-block; vertical-align: middle;"></span> 登录中...';

    try {
      const result = await UserApi.login({ account, password });

      if (result.code === 0) {
        TokenStorage.setToken(result.data.token);
        TokenStorage.setUser(result.data.user);
        Toast.success('登录成功');
        
        if (result.data.user.role === 'admin') {
          Router.navigate('/admin/dashboard');
        } else {
          Router.navigate('/');
        }
      } else {
        Toast.error(result.msg || '登录失败');
      }
    } catch (error) {
      Toast.error('登录失败，请检查网络');
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '登录';
    }
  }
};
