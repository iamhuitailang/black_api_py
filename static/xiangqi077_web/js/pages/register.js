const RegisterPage = {
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2>用户注册</h2>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" v-model="form.username" placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label>昵称</label>
          <input type="text" v-model="form.nickname" placeholder="请输入昵称" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" v-model="form.password" placeholder="请输入密码" />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input type="password" v-model="form.confirmPassword" placeholder="请再次输入密码" @keyup.enter="handleRegister" />
        </div>
        <div class="form-error" v-if="error">{{ error }}</div>
        <button class="btn btn-primary btn-block" @click="handleRegister" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <div class="auth-footer">
          已有账号？<a href="#/login">立即登录</a>
        </div>
      </div>
    </div>
  `,
  setup() {
    const form = Vue.reactive({ username: '', nickname: '', password: '', confirmPassword: '' });
    const error = Vue.ref('');
    const loading = Vue.ref(false);

    async function handleRegister() {
      error.value = '';
      if (!form.username || !form.password || !form.nickname) {
        error.value = '请填写所有字段';
        return;
      }
      if (form.password !== form.confirmPassword) {
        error.value = '两次密码不一致';
        return;
      }
      if (form.password.length < 6) {
        error.value = '密码至少6位';
        return;
      }
      loading.value = true;
      try {
        const res = await XiangqiApi.register({
          username: form.username,
          nickname: form.nickname,
          password: form.password
        });
        if (res.code === 0) {
          window.location.hash = '#/login';
        } else {
          error.value = res.msg || '注册失败';
        }
      } catch (e) {
        error.value = '网络错误，请重试';
      }
      loading.value = false;
    }

    return { form, error, loading, handleRegister };
  }
};

window.RegisterPage = RegisterPage;
