<template>
  <div class="admin-login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>后台管理系统</h1>
        <p>简历在线制作平台</p>
      </div>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入管理员账号" 
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="login-btn" 
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
        
        <div class="login-links">
          <router-link to="/login">返回前台登录</router-link>
        </div>
      </el-form>
      
      <div class="login-tip">
        <p>默认账号：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { adminApi } from '@/api'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await adminApi.login(loginForm)
        userStore.setAdmin(res.admin, res.token)
        ElMessage.success('登录成功')
        router.push('/admin/dashboard')
      } catch (error) {
        console.error('Login error:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
}

.login-card {
  width: 400px;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 22px;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
}

.login-links {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}

.login-links a {
  color: #409eff;
  text-decoration: none;
}

.login-links a:hover {
  text-decoration: underline;
}

.login-tip {
  margin-top: 20px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  text-align: center;
}

.login-tip p {
  color: #999;
  font-size: 12px;
  margin: 0;
}
</style>
