<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <span class="logo-emoji">🐱</span>
        <h1 class="title">猫咪咖啡馆</h1>
        <p class="subtitle">欢迎来到温馨的猫咪世界~</p>
      </div>
      
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <span class="input-icon">👤</span>
          <input 
            v-model="username" 
            type="text" 
            placeholder="请输入用户名" 
            class="form-input"
            required
          />
        </div>
        
        <div class="form-group">
          <span class="input-icon">🔒</span>
          <input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码" 
            class="form-input"
            required
          />
        </div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
      
      <div class="footer-links">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { api } from '../api'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    alert('请填写用户名和密码')
    return
  }
  
  loading.value = true
  try {
    const res = await api.login(username.value, password.value)
    if (res?.code === 0) {
      userStore.setToken(res.data.token)
      userStore.setUserInfo(res.data.user || { username: username.value })
      if (res.data.game_status) {
        userStore.setGameStatus(res.data.game_status)
      }
      router.push('/')
    } else {
      alert(res?.message || '登录失败，请重试')
    }
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 24px;
  padding: 40px 30px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(255, 182, 193, 0.3);
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 10px;
}

.title {
  font-size: 28px;
  color: #FF69B4;
  margin: 0 0 8px 0;
  font-weight: 700;
}

.subtitle {
  color: #999;
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  position: relative;
  margin-bottom: 20px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
}

.form-input {
  width: 100%;
  padding: 14px 14px 14px 48px;
  border: 2px solid #FFE4E1;
  border-radius: 12px;
  font-size: 15px;
  box-sizing: border-box;
  transition: all 0.3s;
  outline: none;
}

.form-input:focus {
  border-color: #FFB6C1;
  box-shadow: 0 0 0 3px rgba(255, 182, 193, 0.2);
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 105, 180, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.footer-links {
  text-align: center;
  color: #999;
  font-size: 14px;
}

.link {
  color: #FF69B4;
  text-decoration: none;
  margin-left: 5px;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}
</style>
