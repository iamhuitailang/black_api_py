const RegisterPage = {
  name: 'RegisterPage',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">📚</div>
        <h1 class="auth-title">注册账号</h1>
        <p class="auth-subtitle">加入漫画屋，开启精彩漫画之旅</p>

        <el-form :model="form" :rules="rules" ref="formRef" class="auth-form" label-position="top">
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="3-20个字符，支持字母、数字、中文"
              size="large"
              :prefix-icon="'User'"
            />
          </el-form-item>

          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="form.nickname"
              placeholder="选填，显示在评论等位置"
              size="large"
              :prefix-icon="'UserFilled'"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="至少6位"
              size="large"
              :prefix-icon="'Lock'"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="再次输入密码"
              size="large"
              :prefix-icon="'Lock'"
              show-password
              @keyup.enter="handleRegister"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            style="width: 100%; margin-top: 16px;"
            @click="handleRegister"
            :loading="loading"
          >注册</el-button>
        </el-form>

        <div class="auth-footer">
          已有账号？
          <a @click="Router.navigate('/login')">立即登录</a>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      form: {
        username: '',
        nickname: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名3-20个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value !== this.form.password) {
                callback(new Error('两次输入的密码不一致'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
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
    async handleRegister() {
      try {
        const valid = await this.$refs.formRef.validate().catch(() => false);
        if (!valid) return;
      } catch (e) {
        return;
      }

      this.loading = true;
      const res = await ApiService.register(
        this.form.username,
        this.form.password,
        this.form.nickname
      );
      if (res.code === 0 && res.data) {
        Storage.setToken(res.data.token);
        Storage.setUser(res.data.user);
        ElementPlus.ElMessage.success('注册成功');
        Router.navigate('/home');
      } else {
        ElementPlus.ElMessage.error(res.msg || '注册失败');
      }
      this.loading = false;
    }
  }
};