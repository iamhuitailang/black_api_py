<template>
  <div class="auth-page">
    <div class="auth-container neon-card">
      <h1 class="auth-title neon-text">🎱 霓虹弹珠台</h1>
      <p class="auth-subtitle">欢迎回来！登录开始游戏</p>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="username"
            type="text"
            class="input-neon"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="password"
            type="password"
            class="input-neon"
            placeholder="请输入密码"
            required
          />
        </div>

        <button type="submit" class="neon-btn login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </form>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="auth-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await userStore.login(username.value.trim(), password.value)
    const redirect = (route.query.redirect as string) || '/game'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  text-align: center;
}

.auth-title {
  font-size: 32px;
  margin-bottom: 8px;
  color: var(--neon-blue);
}

.auth-subtitle {
  color: var(--text-secondary);
  margin-bottom: 32px;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  text-align: left;
}

.form-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  margin-top: 10px;
}

.error-message {
  color: #ff4466;
  font-size: 13px;
  margin: 0;
  text-align: center;
}

.auth-footer {
  margin-top: 24px;
  font-size: 13px;
  color: var(--text-secondary);
}

.auth-link {
  color: var(--neon-blue);
  text-decoration: none;
  margin-left: 6px;
}

.auth-link:hover {
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}
</style>
