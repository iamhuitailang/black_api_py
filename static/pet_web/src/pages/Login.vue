<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
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
      <div class="login-right">
        <h2>登录</h2>
        <p class="subtitle">欢迎回来，请登录您的账号</p>
        <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" size="large">
              <template #prefix>
                <el-icon><User /></el-icon>
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
          <el-form-item>
            <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
              登录
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-footer">
          还没有账号？
          <router-link to="/register">立即注册</router-link>
        </div>
        <div class="login-footer">
          <router-link to="/home">返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await userApi.login(form)
        userStore.setUser(res.data)
        ElMessage.success('登录成功')
        const redirect = route.query.redirect || '/home'
        router.push(redirect)
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
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-left {
  width: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-left h1 {
  font-size: 32px;
  margin-bottom: 16px;
}

.login-left > p {
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

.login-right {
  width: 50%;
  padding: 60px 40px;
}

.login-right h2 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin-bottom: 32px;
}

.login-form {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
}

.login-footer {
  text-align: center;
  color: #909399;
  margin-top: 12px;
}

.login-footer a {
  color: #409eff;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  .login-left,
  .login-right {
    width: 100%;
  }
  .login-left {
    padding: 40px 20px;
  }
  .login-right {
    padding: 40px 20px;
  }
}
</style>
