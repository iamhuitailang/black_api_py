<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { GitBranch, Lock, User, Loader2 } from 'lucide-vue-next'
import { api, setToken } from '@/utils/api'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入用户名和密码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const res = await api.login(username.value.trim(), password.value)
    if (res.code === 0) {
      setToken(res.data.token)
      router.push('/')
    } else {
      error.value = res.message || '登录失败'
    }
  } catch {
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon-wrapper">
          <GitBranch :size="28" class="login-icon" />
        </div>
        <h1 class="login-title">GitHub Star Favorites</h1>
        <p class="login-subtitle">请登录你的账户</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <div class="input-wrapper">
            <User :size="16" class="input-icon" />
            <input
              v-model="username"
              type="text"
              class="form-input"
              placeholder="用户名"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <div class="input-wrapper">
            <Lock :size="16" class="input-icon" />
            <input
              v-model="password"
              type="password"
              class="form-input"
              placeholder="密码"
              autocomplete="current-password"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <Loader2 v-if="loading" :size="18" class="spin" />
          <span v-else>登 录</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e1e2e;
}

.login-card {
  width: 400px;
  background: #181825;
  border: 1px solid #313244;
  border-radius: 12px;
  padding: 40px 36px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-icon-wrapper {
  width: 56px;
  height: 56px;
  background: rgba(137, 180, 250, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.login-icon {
  color: #89b4fa;
}

.login-title {
  margin: 0;
  color: #cdd6f4;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.login-subtitle {
  margin: 6px 0 0;
  color: #7f849c;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #6c7086;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 8px;
  color: #cdd6f4;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #89b4fa;
  box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.15);
}

.form-input::placeholder {
  color: #6c7086;
}

.error-message {
  background: rgba(243, 139, 168, 0.1);
  border: 1px solid rgba(243, 139, 168, 0.3);
  color: #f38ba8;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #89b4fa;
  color: #1e1e2e;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
}

.login-btn:hover:not(:disabled) {
  background: #74c7ec;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
