const LoginPage = {
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>用户登录</h2>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" v-model="form.username" placeholder="请输入用户名" @keyup.enter="handleLogin" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" v-model="form.password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </div>
        <div class="form-error" v-if="error">{{ error }}</div>
        <button class="btn btn-primary btn-block" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div class="auth-footer">
          还没有账号？<a href="#/register">立即注册</a>
        </div>
      </div>
    </div>
  `,
  setup() {
    const form = Vue.reactive({ username: '', password: '' });
    const error = Vue.ref('');
    const loading = Vue.ref(false);

    async function handleLogin() {
      error.value = '';
      if (!form.username || !form.password) {
        error.value = '请填写用户名和密码';
        return;
      }
      loading.value = true;
      try {
        const res = await XiangqiApi.login({ username: form.username, password: form.password });
        if (res.code === 0) {
          XiangqiAuth.setToken(res.data.token);
          XiangqiAuth.setUser(res.data.user);
          window.location.hash = '#/hall';
        } else {
          error.value = res.msg || '登录失败';
        }
      } catch (e) {
        error.value = '网络错误，请重试';
      }
      loading.value = false;
    }

    return { form, error, loading, handleLogin };
  }
};

window.LoginPage = LoginPage;
