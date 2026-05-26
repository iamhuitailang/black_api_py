<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()

const form = ref({ username: '', password: '', confirm: '', nickname: '', email: '' })
const loading = ref(false)

const handleRegister = async () => {
  if (!form.value.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!form.value.password || form.value.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  if (form.value.password !== form.value.confirm) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  loading.value = true
  try {
    const res = await authApi.register({
      username: form.value.username.trim(),
      password: form.value.password,
      nickname: form.value.nickname.trim() || form.value.username.trim(),
      email: form.value.email.trim()
    })
    userStore.setLogin(res.data)
    ElMessage.success('注册成功')
    router.replace('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-header">
        <div class="logo">B</div>
        <h1 class="title-1">创建账号</h1>
        <p class="soft">加入博客，开始记录与分享</p>
      </div>
      <div class="auth-form">
        <el-form :model="form" label-position="top" @submit.prevent="handleRegister">
          <el-form-item label="用户名">
            <el-input v-model="form.username" :prefix-icon="User" placeholder="请输入用户名" size="large" />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="form.nickname" placeholder="请输入昵称（可选）" size="large" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="请输入邮箱（可选）" size="large" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              :prefix-icon="Lock"
              placeholder="请输入密码，至少 6 位"
              size="large"
            />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input
              v-model="form.confirm"
              type="password"
              show-password
              :prefix-icon="Lock"
              placeholder="请再次输入密码"
              size="large"
              @keyup.enter="handleRegister"
            />
          </el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="submit-btn" @click="handleRegister">注册</el-button>
        </el-form>
        <div class="auth-footer">
          <span class="soft">已有账号？</span>
          <RouterLink to="/login">去登录</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 36px 40px;
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;

  .logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    background: var(--color-primary);
    color: #fff;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    box-shadow: var(--shadow-md);
  }

  h1 {
    margin: 0 0 6px;
    font-size: 24px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.submit-btn {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  gap: 6px;
  display: flex;
  justify-content: center;
}
</style>
