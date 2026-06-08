<template>
  <div class="auth-page">
    <div class="auth-container neon-card">
      <h1 class="auth-title neon-text">🎉 创建账号</h1>
      <p class="auth-subtitle">加入霓虹弹珠台的世界</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label class="form-label">用户名 (3-20字符)</label>
          <input
            v-model="username"
            type="text"
            class="input-neon"
            placeholder="请输入用户名"
            required
            minlength="3"
            maxlength="20"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码 (6-32字符)</label>
          <input
            v-model="password"
            type="password"
            class="input-neon"
            placeholder="请输入密码"
            required
            minlength="6"
            maxlength="32"
          />
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="input-neon"
            placeholder="请再次输入密码"
            required
          />
        </div>

        <button type="submit" class="neon-btn register-btn" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="success" class="success-message">{{ success }}</p>
      </form>

      <div class="auth-footer">
        <span>已有账号？</span>
        <router-link to="/login" class="auth-link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleRegister() {
  error.value = ''
  success.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (username.value.length < 3 || username.value.length > 20) {
    error.value = '用户名长度需在3-20字符之间'
    return
  }

  if (password.value.length < 6 || password.value.length > 32) {
    error.value = '密码长度需在6-32字符之间'
    return
  }

  loading.value = true

  try {
    await userStore.register(username.value.trim(), password.value)
    success.value = '注册成功！正在跳转到登录...'
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (e: any) {
    error.value = e.message || '注册失败'
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
  font-size: 28px;
  margin-bottom: 8px;
  color: var(--neon-green);
}

.auth-subtitle {
  color: var(--text-secondary);
  margin-bottom: 32px;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.register-btn {
  width: 100%;
  padding: 14px;
  margin-top: 10px;
  background: linear-gradient(135deg, var(--neon-green), var(--neon-blue));
}

.error-message {
  color: #ff4466;
  font-size: 13px;
  margin: 0;
  text-align: center;
}

.success-message {
  color: var(--neon-green);
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
