import { ref } from 'vue'
import Api from '../api.js'
import Store from '../store.js'

export default {
  setup() {
    const username = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)

    async function handleLogin() {
      error.value = ''
      if (!username.value || !password.value) {
        error.value = '请输入用户名和密码'
        return
      }
      loading.value = true
      try {
        const res = await Api.login({ username: username.value, password: password.value })
        Store.setToken(res.data.token)
        Store.setUser(res.data.user)
        window.location.hash = '#/'
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    return { username, password, error, loading, handleLogin }
  },
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h2 class="auth-title">👤 用户登录</h2>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" @keyup.enter="handleLogin" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </div>
        <button class="btn btn-primary btn-block" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div class="auth-footer">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </div>
    </div>
  `
}
