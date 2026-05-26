const LoginPage = {
  name: 'LoginPage',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">📚</div>
        <h1 class="auth-title">漫画屋</h1>
        <p class="auth-subtitle">欢迎回来，继续你的漫画之旅</p>

        <el-form :model="form" :rules="rules" ref="formRef" class="auth-form" label-position="top">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="'User'"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="'Lock'"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            style="width: 100%; margin-top: 16px;"
            @click="handleLogin"
            :loading="loading"
          >登录</el-button>
        </el-form>

        <div class="auth-footer">
          还没有账号？
          <a @click="Router.navigate('/register')">立即注册</a>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名3-20个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6位', trigger: 'blur' }
        ]
      },
      loading: false
    };
  },
  computed: {
    Router() { return Router; },
    Storage() { return Storage; },
    ApiService() { return ApiService; }
  },
  methods: {
    async handleLogin() {
      try {
        const valid = await this.$refs.formRef.validate().catch(() => false);
        if (!valid) return;
      } catch (e) {
        return;
      }

      this.loading = true;
      const res = await ApiService.login(this.form.username, this.form.password);
      if (res.code === 0 && res.data) {
        Storage.setToken(res.data.token);
        Storage.setUser(res.data.user);
        ElementPlus.ElMessage.success('登录成功');
        Router.navigate('/home');
      } else {
        ElementPlus.ElMessage.error(res.msg || '登录失败');
      }
      this.loading = false;
    }
  }
};