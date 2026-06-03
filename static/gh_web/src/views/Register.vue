<template>
  <div class="register-page">
    <div class="register-card card">
      <h1 class="text-center mb-20">👻 加入幽灵猎人</h1>
      <p class="text-center mb-20" style="color: var(--text-secondary)">成为猎鬼者，探索未知的灵异世界</p>
      
      <form @submit.prevent="handleRegister">
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
          <label>邮箱</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱"
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
            minlength="6"
          />
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <p class="text-center mt-20">
        已有账号？
        <router-link to="/login" style="color: var(--accent-primary)">立即登录</router-link>
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
  email: '',
  password: '',
  confirmPassword: ''
})
const loading = ref(false)

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    toastStore.error('两次输入的密码不一致')
    return
  }
  
  loading.value = true
  try {
    const res = await authStore.register(form.value.username, form.value.email, form.value.password)
    if (res.code === 200) {
      toastStore.success('注册成功！请登录')
      router.push('/login')
    } else {
      toastStore.error(res.message)
    }
  } catch (e) {
    toastStore.error('注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 400px;
}
</style>
