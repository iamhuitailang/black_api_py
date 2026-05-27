<template>
  <div class="auth-container">
    <div class="card auth-card">
      <h1 class="title">🪑 椅子大战</h1>
      <p class="subtitle">登录开始你的椅子斗士之旅</p>
      
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>用户名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" required />
        </div>
        
        <div class="input-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" required />
        </div>
        
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
      
      <div class="footer">
        还没有账号？
        <router-link to="/register" class="link">立即注册</router-link>
      </div>
      
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'
import { storage } from '@/utils/storage'

const router = useRouter()
const form = ref({
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await userApi.login(form.value)
    if (res.code === 200) {
      storage.setToken(res.data.token)
      storage.setUser(res.data.user)
      router.push('/')
    } else {
      error.value = res.message
    }
  } catch (e) {
    error.value = '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.title {
  text-align: center;
  font-size: 36px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.w-full {
  width: 100%;
}

.footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

.error-message {
  margin-top: 15px;
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  text-align: center;
}
</style>
