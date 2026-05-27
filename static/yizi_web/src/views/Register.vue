<template>
  <div class="auth-container">
    <div class="card auth-card">
      <h1 class="title">🪑 椅子大战</h1>
      <p class="subtitle">注册成为椅子斗士</p>
      
      <form @submit.prevent="handleRegister">
        <div class="input-group">
          <label>用户名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" required />
        </div>
        
        <div class="input-group">
          <label>昵称</label>
          <input v-model="form.nickname" type="text" placeholder="请输入昵称（选填）" />
        </div>
        
        <div class="input-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" required />
        </div>
        
        <div class="input-group">
          <label>确认密码</label>
          <input v-model="confirmPassword" type="password" placeholder="请再次输入密码" required />
        </div>
        
        <button type="submit" class="btn btn-secondary w-full" :disabled="loading">
          {{ loading ? '注册中...' : '注 册' }}
        </button>
      </form>
      
      <div class="footer">
        已有账号？
        <router-link to="/login" class="link">立即登录</router-link>
      </div>
      
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'

const router = useRouter()
const form = ref({
  username: '',
  nickname: '',
  password: ''
})
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  error.value = ''
  
  if (form.value.password !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  if (form.value.password.length < 6) {
    error.value = '密码至少需要6位'
    return
  }
  
  loading.value = true
  try {
    const res = await userApi.register(form.value)
    if (res.code === 200) {
      alert('注册成功！请登录')
      router.push('/login')
    } else {
      error.value = res.message
    }
  } catch (e) {
    error.value = '注册失败，请稍后重试'
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
