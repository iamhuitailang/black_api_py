<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-left">
        <h1>宠物领养信息平台</h1>
        <p>用爱心为流浪宠物找到温暖的家</p>
        <div class="features">
          <div class="feature">
            <el-icon size="24"><Heart /></el-icon>
            <span>关爱流浪动物</span>
          </div>
          <div class="feature">
            <el-icon size="24"><User /></el-icon>
            <span>实名认真保障</span>
          </div>
          <div class="feature">
            <el-icon size="24"><Shield /></el-icon>
            <span>严格审核流程</span>
          </div>
        </div>
      </div>
      <div class="register-right">
        <h2>注册</h2>
        <p class="subtitle">创建账号，开始您的领养之旅</p>
        <el-form ref="formRef" :model="form" :rules="rules" class="register-form">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" size="large">
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="nickname">
            <el-input v-model="form.nickname" placeholder="请输入昵称" size="large">
              <template #prefix>
                <el-icon><Avatar /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号" size="large">
              <template #prefix>
                <el-icon><Phone /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="请确认密码" size="large" show-password>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" class="register-btn" :loading="loading" @click="handleRegister">
              注册
            </el-button>
          </el-form-item>
        </el-form>
        <div class="register-footer">
          已有账号？
          <router-link to="/login">立即登录</router-link>
        </div>
        <div class="register-footer">
          <router-link to="/home">返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'user'
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function handleRegister() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const { confirmPassword, ...userData } = form
        const res = await userApi.register(userData)
        userStore.setUser(res.data)
        ElMessage.success('注册成功')
        router.push('/home')
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  display: flex;
  width: 100%;
  max-width: 1000px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-left {
  width: 45%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.register-left h1 {
  font-size: 28px;
  margin-bottom: 16px;
}

.register-left > p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}

.register-right {
  width: 55%;
  padding: 50px 40px;
}

.register-right h2 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin-bottom: 24px;
}

.register-form {
  margin-bottom: 20px;
}

.register-btn {
  width: 100%;
}

.register-footer {
  text-align: center;
  color: #909399;
  margin-top: 12px;
}

.register-footer a {
  color: #409eff;
}

@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
  }
  .register-left,
  .register-right {
    width: 100%;
  }
  .register-left {
    padding: 40px 20px;
  }
  .register-right {
    padding: 40px 20px;
  }
}
</style>
