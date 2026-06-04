<template>
  <div class="register-container">
    <div class="register-card">
      <div class="logo-section">
        <span class="logo-emoji">🐾</span>
        <h1 class="title">注册账号</h1>
        <p class="subtitle">加入猫咪咖啡馆，开启温馨之旅~</p>
      </div>
      
      <form class="register-form" @submit.prevent="handleRegister">
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
          <span class="input-icon">🏷️</span>
          <input 
            v-model="nickname" 
            type="text" 
            placeholder="请输入昵称" 
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
        
        <div class="form-group">
          <span class="input-icon">🔐</span>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="请确认密码" 
            class="form-input"
            required
          />
        </div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '注 册' }}
        </button>
      </form>
      
      <div class="footer-links">
        <span>已有账号？</span>
        <router-link to="/login" class="link">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()

const username = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (!username.value || !nickname.value || !password.value || !confirmPassword.value) {
    alert('请填写完整信息')
    return
  }
  
  if (password.value !== confirmPassword.value) {
    alert('两次输入的密码不一致')
    return
  }
  
  if (password.value.length < 6) {
    alert('密码长度至少6位')
    return
  }
  
  loading.value = true
  try {
    const res = await api.register(username.value, password.value, nickname.value)
    if (res?.code === 0) {
      alert('注册成功！请登录')
      router.push('/login')
    } else {
      alert(res?.message || '注册失败，请重试')
    }
  } catch (error) {
    console.error('Register error:', error)
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

.register-form {
  margin-bottom: 20px;
}

.form-group {
  position: relative;
  margin-bottom: 16px;
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
  margin-top: 10px;
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
