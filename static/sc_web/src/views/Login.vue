<template>
  <div class="login-container">
    <div class="login-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="grid-pattern"></div>
    </div>
    
    <div class="login-content">
      <div class="login-card">
        <div class="logo-section">
          <div class="logo-icon">
            <el-icon :size="48" color="#ff6b00">
              <Monitor />
            </el-icon>
          </div>
          <h1 class="logo-title">SpeedCraft</h1>
          <p class="logo-subtitle">极速赛车设计工坊</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              class="form-input"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="form-input"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="register-link">
          <span>还没有账号？</span>
          <router-link to="/register" class="link-text">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Monitor } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const response = await userStore.login(loginForm.username, loginForm.password)
    
    if (response.code === 0) {
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(response.msg || '登录失败')
    }
  } catch (error) {
    if (error !== false) {
      ElMessage.error(error.msg || '登录失败，请重试')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 8s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 107, 0, 0.3) 0%, transparent 70%);
  top: -100px;
  right: -100px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 140, 0, 0.2) 0%, transparent 70%);
  bottom: -150px;
  left: -150px;
  animation-delay: -4s;
}

.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 107, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 107, 0, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, -30px);
  }
}

.login-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  padding: 20px;
}

.login-card {
  background: rgba(26, 26, 46, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 107, 0, 0.2);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 107, 0, 0.1) inset;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 107, 0, 0.3);
  box-shadow: 0 8px 32px rgba(255, 107, 0, 0.2);
}

.logo-title {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.logo-subtitle {
  font-size: 14px;
  color: #888;
  letter-spacing: 4px;
}

.login-form {
  margin-bottom: 24px;
}

.form-input {
  margin-bottom: 4px;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 4px 16px;
  box-shadow: none;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #3a3a5e;
  background: rgba(255, 255, 255, 0.08);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #ff6b00;
  box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
}

:deep(.el-input__inner) {
  color: #fff;
  font-size: 15px;
}

:deep(.el-input__inner::placeholder) {
  color: #555;
}

:deep(.el-input__prefix-inner) {
  color: #666;
}

.submit-btn {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

:deep(.el-button.is-loading) {
  opacity: 0.8;
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #888;
}

.link-text {
  color: #ff6b00;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.link-text:hover {
  color: #ff8c00;
  text-decoration: underline;
}

:deep(.el-form-item__error) {
  color: #ff4757;
  font-size: 12px;
  padding-top: 4px;
}
</style>
