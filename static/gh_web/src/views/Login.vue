<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="text-center mb-20">👻 幽灵猎人</h1>
      <p class="text-center mb-20" style="color: var(--text-secondary)">登录开始你的猎鬼之旅</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            required
          />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <p class="text-center mt-20">
        还没有账号？
        <router-link to="/register" style="color: var(--accent-primary)">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useToastStore } from '../store'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const form = ref({
  username: '',
  password: ''
})
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    const res = await authStore.login(form.value.username, form.value.password)
    if (res.code === 200) {
      toastStore.success('登录成功！')
      router.push('/')
    } else {
      toastStore.error(res.message)
    }
  } catch (e) {
    toastStore.error('登录失败，请重试')
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
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
}
</style>
