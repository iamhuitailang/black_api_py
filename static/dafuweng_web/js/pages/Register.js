import { ref } from 'vue'
import Api from '../api.js'

export default {
  setup() {
    const username = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const nickname = ref('')
    const error = ref('')
    const loading = ref(false)

    async function handleRegister() {
      error.value = ''
      if (!username.value || !password.value || !confirmPassword.value) {
        error.value = '请填写所有必填项'
        return
      }
      if (password.value !== confirmPassword.value) {
        error.value = '两次密码不一致'
        return
      }
      loading.value = true
      try {
        await Api.register({ username: username.value, password: password.value, nickname: nickname.value || username.value })
        window.location.hash = '#/login'
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    return { username, password, confirmPassword, nickname, error, loading, handleRegister }
  },
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2 class="auth-title">📝 用户注册</h2>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label>昵称</label>
          <input v-model="nickname" type="text" placeholder="请输入昵称（选填）" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input v-model="confirmPassword" type="password" placeholder="请再次输入密码" @keyup.enter="handleRegister" />
        </div>
        <button class="btn btn-primary btn-block" @click="handleRegister" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <div class="auth-footer">
          已有账号？<router-link to="/login">去登录</router-link>
        </div>
      </div>
    </div>
  `
}
