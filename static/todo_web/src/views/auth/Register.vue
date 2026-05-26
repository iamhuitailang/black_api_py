<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="logo-section">
          <el-icon :size="48" color="#409eff"><Check /></el-icon>
          <h1 class="title">创建账号</h1>
          <p class="subtitle">加入Todo任务管理系统</p>
        </div>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="请输入昵称（选填）"
            size="large"
            :prefix-icon="UserFilled"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="register-button"
          :loading="loading"
          @click="handleRegister"
        >
          注 册
        </el-button>

        <div class="register-footer">
          <span class="text">已有账号？</span>
          <router-link to="/login" class="link">立即登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, UserFilled, Lock, Message } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { RegisterParams } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const confirmPassword = ref('')

const registerForm = reactive<RegisterParams>({
  username: '',
  email: '',
  password: '',
  nickname: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (confirmPassword.value !== registerForm.password) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const res = await userStore.register(registerForm)
    if (res.code === 0) {
      ElMessage.success('注册成功')
      router.push('/')
    }
  } catch (e) {
    console.error('Register error:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;

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

.register-form {
  .register-button {
    width: 100%;
    margin-top: 8px;
    height: 44px;
    font-size: 16px;
  }

  .register-footer {
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
