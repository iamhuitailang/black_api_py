const RegisterPage = {
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">喝彩争夺 - 注册</h1>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="username" type="text" placeholder="请输入用户名" required />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="nickname" type="text" placeholder="请输入昵称" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="password" type="password" placeholder="请输入密码" required />
          </div>
          <div class="form-group">
            <label>确认密码</label>
            <input v-model="confirmPassword" type="password" placeholder="请确认密码" required />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
        <div class="auth-switch">
          已有账号？<a @click="goToLogin">立即登录</a>
        </div>
        <p v-if="error" style="color: #f5576c; text-align: center; margin-top: 15px;">{{ error }}</p>
      </div>
    </div>
  `,
  setup() {
    const username = Vue.ref('');
    const nickname = Vue.ref('');
    const password = Vue.ref('');
    const confirmPassword = Vue.ref('');
    const loading = Vue.ref(false);
    const error = Vue.ref('');

    const handleRegister = async () => {
      if (password.value !== confirmPassword.value) {
        error.value = '两次密码输入不一致';
        return;
      }

      loading.value = true;
      error.value = '';
      
      try {
        const result = await api.register(username.value, password.value, nickname.value || username.value);
        if (result.code === 200) {
          store.setUser(result.data.user, result.data.token);
          window.location.hash = '#/home';
        } else {
          error.value = result.message;
        }
      } catch (e) {
        error.value = '注册失败，请重试';
      } finally {
        loading.value = false;
      }
    };

    const goToLogin = () => {
      window.location.hash = '#/login';
    };

    return {
      username,
      nickname,
      password,
      confirmPassword,
      loading,
      error,
      handleRegister,
      goToLogin
    };
  }
};
