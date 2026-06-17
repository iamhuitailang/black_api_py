<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <div class="login-logo">📊</div>
        <h1 class="login-title">团队绩效考核管理系统</h1>
        <p class="login-subtitle">Team KPI Management System</p>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-row">
          <label class="form-label">用户名</label>
          <input class="form-input" v-model="username" placeholder="请输入用户名" autocomplete="username" />
        </div>
        <div class="form-row">
          <label class="form-label">密码</label>
          <input type="password" class="form-input" v-model="password" placeholder="请输入密码" autocomplete="current-password" />
        </div>
        <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await api.login(username.value.trim(), password.value)
    if (res.code === 0 && res.data) {
      localStorage.setItem('kpi_token', res.data.token)
      localStorage.setItem('kpi_user', JSON.stringify(res.data.user))
      router.push('/')
    } else {
      errorMsg.value = res.message || '登录失败'
    }
  } catch (e) {
    errorMsg.value = e.response?.data?.detail || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
  padding: 20px;
}
.login-box {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px;
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-logo {
  font-size: 48px;
  margin-bottom: 12px;
}
.login-title {
  font-size: 24px;
  color: #1a5fb4;
  margin: 0 0 8px;
  font-weight: 600;
}
.login-subtitle {
  font-size: 13px;
  color: #8a94a6;
  margin: 0;
  letter-spacing: 1px;
}
.login-form {
  margin-bottom: 24px;
}
.login-error {
  background: #fef2f2;
  color: #c01c28;
  padding: 10px 14px;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
}
.btn-block {
  width: 100%;
  height: 44px;
  font-size: 15px;
  margin-top: 8px;
}
.login-tips {
  background: #f8fafc;
  border-radius: 6px;
  padding: 16px;
  font-size: 12px;
  color: #5e6c84;
  border: 1px solid #e2e8f0;
}
.tips-title {
  font-weight: 600;
  color: #2e3440;
  margin-bottom: 8px;
}
.login-tips ul {
  margin: 0;
  padding-left: 18px;
}
.login-tips li {
  line-height: 1.9;
}
</style>
