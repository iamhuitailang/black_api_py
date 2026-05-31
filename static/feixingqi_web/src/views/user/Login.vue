<template>
  <div class="login-container">
    <div class="login-box game-card">
      <h1 class="title">🎮 飞行棋对战</h1>
      <h2 class="subtitle">登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-button type="primary" class="btn-primary" size="large" @click="handleLogin" :loading="loading">
          登录
        </el-button>
      </el-form>
      <p class="register-link">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api'
import { setUser } from '@/utils/storage'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = reactive({
  username: '',
  password: ''
})
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    const user = await login(form)
    setUser(user)
    ElMessage.success('登录成功')
    if (user.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch (e) {
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
.login-box {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  text-align: center;
}
.title {
  font-size: 32px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  font-size: 24px;
  color: #666;
  margin-bottom: 30px;
}
.login-form {
  margin-bottom: 20px;
}
.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}
.btn-primary {
  width: 100%;
  height: 48px;
  font-size: 18px;
}
.register-link {
  color: #999;
}
.register-link a {
  color: #667eea;
  text-decoration: none;
}
</style>
