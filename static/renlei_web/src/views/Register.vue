<template>
  <div class="register-container">
    <div class="card register-card">
      <h1 class="title">🎪 创建账号</h1>
      <p class="subtitle">加入马戏闯关大冒险</p>
      
      <form @submit.prevent="handleRegister" class="form">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" class="input" placeholder="请输入用户名" required />
        </div>
        
        <div class="form-group">
          <label>昵称</label>
          <input v-model="nickname" type="text" class="input" placeholder="请输入昵称" />
        </div>
        
        <div class="form-group">
          <label>邮箱（选填）</label>
          <input v-model="email" type="email" class="input" placeholder="请输入邮箱" />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" class="input" placeholder="请输入密码" required />
        </div>
        
        <div class="form-group">
          <label>确认密码</label>
          <input v-model="confirmPassword" type="password" class="input" placeholder="请再次输入密码" required />
        </div>
        
        <button type="submit" class="btn btn-success" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <p class="login-link">
        已有账号？<router-link to="/login">立即登录</router-link>
      </p>
      
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const nickname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleRegister = async () => {
  error.value = ''
  success.value = ''
  
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  if (password.value.length < 6) {
    error.value = '密码长度至少6位'
    return
  }
  
  loading.value = true
  
  try {
    const res = await userStore.register(username.value, password.value, email.value, nickname.value)
    if (res.code === 200) {
      success.value = '注册成功！正在跳转登录页...'
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      error.value = res.message
    }
  } catch (e) {
    error.value = '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

.form {
  text-align: left;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.btn-success {
  width: 100%;
  margin-top: 8px;
}

.login-link {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #11998e;
  text-decoration: none;
  font-weight: 600;
}

.error {
  margin-top: 16px;
  color: #f5576c;
  font-size: 14px;
}

.success {
  margin-top: 16px;
  color: #11998e;
  font-size: 14px;
}
</style>
