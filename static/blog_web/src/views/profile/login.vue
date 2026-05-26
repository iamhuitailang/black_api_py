<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = ref({ username: '', password: '' })
const loading = ref(false)

const redirect = computed(() => (route.query.redirect ? String(route.query.redirect) : '/'))

const handleLogin = async () => {
  if (!form.value.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!form.value.password) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    const res = await authApi.login(form.value.username.trim(), form.value.password)
    userStore.setLogin(res.data)
    ElMessage.success('登录成功')
    router.replace(redirect.value)
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
        <h1 class="title-1">欢迎回来</h1>
        <p class="soft">登录后开始你的创作之旅</p>
      </div>
      <div class="auth-form">
        <el-form :model="form" label-position="top" @submit.prevent="handleLogin">
          <el-form-item label="用户名">
            <el-input v-model="form.username" :prefix-icon="User" placeholder="请输入用户名" size="large" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              :prefix-icon="Lock"
              placeholder="请输入密码"
              size="large"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="submit-btn" @click="handleLogin">登录</el-button>
        </el-form>
        <div class="auth-footer">
          <span class="soft">还没有账号？</span>
          <RouterLink to="/register">立即注册</RouterLink>
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
  max-width: 420px;
  padding: 40px 48px;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;

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
    font-size: 26px;
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
