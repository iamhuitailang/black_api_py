<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-section">
          <el-icon :size="48" color="#409eff"><Check /></el-icon>
          <h1 class="title">Todo任务管理系统</h1>
          <p class="subtitle">高效管理你的每一天</p>
        </div>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="login_name">
          <el-input
            v-model="loginForm.login_name"
            placeholder="请输入用户名或邮箱"
            size="large"
            :prefix-icon="User"
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
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="login-button"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>

        <div class="login-footer">
          <span class="text">还没有账号？</span>
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { LoginParams } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive<LoginParams>({
  login_name: '',
  password: ''
})

const loginRules: FormRules = {
  login_name: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await userStore.login(loginForm)
    if (res.code === 0) {
      ElMessage.success('登录成功')
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    }
  } catch (e) {
    console.error('Login error:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  .logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;

    .title {
      margin: 16px 0 8px;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    .subtitle {
      font-size: 14px;
      color: #909399;
    }
  }
}

.login-form {
  .login-button {
    width: 100%;
    margin-top: 8px;
    height: 44px;
    font-size: 16px;
  }

  .login-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;

    .text {
      color: #909399;
    }

    .link {
      color: #409eff;
      margin-left: 4px;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
