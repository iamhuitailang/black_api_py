const LoginPage = {
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">喝彩争夺</h1>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="username" type="text" placeholder="请输入用户名" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="password" type="password" placeholder="请输入密码" required />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        <div class="auth-switch">
          还没有账号？<a @click="goToRegister">立即注册</a>
        </div>
        <p v-if="error" style="color: #f5576c; text-align: center; margin-top: 15px;">{{ error }}</p>
      </div>
    </div>
  `,
  setup() {
    const username = Vue.ref('');
    const password = Vue.ref('');
    const loading = Vue.ref(false);
    const error = Vue.ref('');

    const handleLogin = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const result = await api.login(username.value, password.value);
        if (result.code === 200) {
          store.setUser(result.data.user, result.data.token);
          window.location.hash = '#/home';
        } else {
          error.value = result.message;
        }
      } catch (e) {
        error.value = '登录失败，请重试';
      } finally {
        loading.value = false;
      }
    };

    const goToRegister = () => {
      window.location.hash = '#/register';
    };

    return {
      username,
      password,
      loading,
      error,
      handleLogin,
      goToRegister
    };
  }
};
