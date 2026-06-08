<template>
  <div class="register-page">
    <ParticleBackground />
    
    <div class="register-container">
      <div class="register-header">
        <h1 class="title title-neon">新兵招募</h1>
        <p class="subtitle">RECRUITMENT</p>
      </div>

      <div class="panel register-panel">
        <div class="panel-header">
          <span>创建账号</span>
        </div>
        <div class="panel-body">
          <form @submit.prevent="handleRegister">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input
                v-model="username"
                type="text"
                class="input"
                placeholder="3-20个字符，字母数字下划线"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <input
                v-model="password"
                type="password"
                class="input"
                placeholder="6-32个字符"
                autocomplete="new-password"
              />
            </div>

            <div class="form-group">
              <label class="form-label">确认密码</label>
              <input
                v-model="confirmPassword"
                type="password"
                class="input"
                placeholder="再次输入密码"
                autocomplete="new-password"
              />
            </div>

            <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
            <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

            <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
              {{ loading ? '注册中...' : '加入战斗' }}
            </button>
          </form>

          <div class="register-footer">
            <span class="text-muted">已有账号？</span>
            <router-link to="/login" class="link">返回登录</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ParticleBackground from '@/components/ParticleBackground.vue'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!username.value.trim()) {
    errorMsg.value = '请输入用户名'
    return
  }
  if (username.value.length < 3 || username.value.length > 20) {
    errorMsg.value = '用户名长度需在3-20个字符之间'
    return
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
    errorMsg.value = '用户名只能包含字母、数字和下划线'
    return
  }
  if (!password.value || password.value.length < 6 || password.value.length > 32) {
    errorMsg.value = '密码长度需在6-32个字符之间'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    const success = await userStore.register(username.value.trim(), password.value, confirmPassword.value)
    if (success) {
      successMsg.value = '注册成功，即将跳转到登录页...'
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      errorMsg.value = '注册失败，请重试'
    }
  } catch (e: any) {
    errorMsg.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.register-container {
  width: 420px;
  text-align: center;
  z-index: 1;
}

.register-header {
  margin-bottom: 25px;
}

.register-header .title {
  font-size: 30px;
  letter-spacing: 6px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  letter-spacing: 4px;
  text-transform: uppercase;
}

.register-panel {
  text-align: left;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.btn-block {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-top: 10px;
}

.error-msg {
  color: var(--color-neon-red);
  font-size: 13px;
  margin-bottom: 15px;
  padding: 8px 12px;
  background: rgba(255, 51, 51, 0.1);
  border: 1px solid rgba(255, 51, 51, 0.3);
}

.success-msg {
  color: var(--color-neon-green);
  font-size: 13px;
  margin-bottom: 15px;
  padding: 8px 12px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.register-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
}

.text-muted {
  color: var(--color-text-muted);
}

.link {
  color: var(--color-neon-blue);
  text-decoration: none;
  margin-left: 5px;
}

.link:hover {
  text-decoration: underline;
}
</style>
