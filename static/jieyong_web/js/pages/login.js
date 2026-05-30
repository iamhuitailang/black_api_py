const LoginPage = {
  render() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <h1 class="auth-title">物品借用归还系统</h1>
          <div class="auth-tabs">
            <button class="tab-btn active" id="tab-login">登录</button>
            <button class="tab-btn" id="tab-register">注册</button>
          </div>
          
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label>账号</label>
              <input type="text" id="login-phone" placeholder="请输入手机号或admin">
            </div>
            <div class="form-group">
              <label>密码</label>
              <input type="password" id="login-password" placeholder="请输入密码">
            </div>
            <button type="button" id="login-btn" class="btn btn-primary btn-block">登录</button>
            <p class="auth-tip">管理员账号：admin / admin123</p>
          </form>
          
          <form id="register-form" class="auth-form hidden">
            <div class="form-group">
              <label>手机号</label>
              <input type="text" id="register-phone" placeholder="请输入手机号">
            </div>
            <div class="form-group">
              <label>昵称</label>
              <input type="text" id="register-nickname" placeholder="请输入昵称（可选）">
            </div>
            <div class="form-group">
              <label>密码</label>
              <input type="password" id="register-password" placeholder="请输入密码（至少6位）">
            </div>
            <div class="form-group">
              <label>确认密码</label>
              <input type="password" id="register-confirm" placeholder="请再次输入密码">
            </div>
            <button type="button" id="register-btn" class="btn btn-primary btn-block">注册</button>
          </form>
        </div>
      </div>
    `;
  },

  data() {
    return {
      loginForm: { phone: '', password: '' },
      registerForm: { phone: '', nickname: '', password: '', confirmPassword: '' }
    };
  },

  async mount(app) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const loginPhoneInput = document.getElementById('login-phone');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');

    const registerPhoneInput = document.getElementById('register-phone');
    const registerNicknameInput = document.getElementById('register-nickname');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPwdInput = document.getElementById('register-confirm');
    const registerBtn = document.getElementById('register-btn');

    tabLogin.addEventListener('click', function() {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });

    tabRegister.addEventListener('click', function() {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });

    loginBtn.addEventListener('click', async function() {
      const phone = loginPhoneInput.value.trim();
      const password = loginPasswordInput.value;
      if (!phone || !password) {
        Toast.error('请填写完整信息');
        return;
      }
      const result = await AuthService.login(phone, password);
      if (result.code === 0) {
        Toast.success('登录成功');
        Router.navigate('home');
        app.updateUserInfo();
      } else {
        Toast.error(result.msg || '登录失败');
      }
    });

    registerBtn.addEventListener('click', async function() {
      const phone = registerPhoneInput.value.trim();
      const nickname = registerNicknameInput.value.trim();
      const password = registerPasswordInput.value;
      const confirmPassword = registerConfirmPwdInput.value;
      
      if (!phone || !password) {
        Toast.error('请填写必填信息');
        return;
      }
      if (password !== confirmPassword) {
        Toast.error('两次密码输入不一致');
        return;
      }
      if (password.length < 6) {
        Toast.error('密码长度至少6位');
        return;
      }
      const result = await AuthService.register(phone, password, nickname);
      if (result.code === 0) {
        Toast.success('注册成功');
        Router.navigate('home');
        app.updateUserInfo();
      } else {
        Toast.error(result.msg || '注册失败');
      }
    });
  }
};

window.LoginPage = LoginPage;
