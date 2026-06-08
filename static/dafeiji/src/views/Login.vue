<template>
  <div class="login-page">
    <ParticleBackground />
    
    <div class="login-container">
      <div class="login-header">
        <h1 class="title title-neon">末日机甲</h1>
        <p class="subtitle">APOCALYPSE MECHA</p>
      </div>

      <div class="panel login-panel">
        <div class="panel-header">
          <span>驾驶员登录</span>
        </div>
        <div class="panel-body">
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input
                v-model="username"
                type="text"
                class="input"
                placeholder="请输入用户名"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <input
                v-model="password"
                type="password"
                class="input"
                placeholder="请输入密码"
                autocomplete="current-password"
              />
            </div>

            <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

            <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
              {{ loading ? '登录中...' : '启动机甲' }}
            </button>
          </form>

          <div class="login-footer">
            <span class="text-muted">还没有账号？</span>
            <router-link to="/register" class="link">立即注册</router-link>
          </div>
        </div>
      </div>

      <div class="tip-text">
        <p>管理员账号: admin / admin123</p>
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
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  
  if (!username.value.trim()) {
    errorMsg.value = '请输入用户名'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }

  loading.value = true
  try {
    const success = await userStore.login(username.value.trim(), password.value)
    if (success) {
      router.push('/home')
    } else {
      errorMsg.value = '用户名或密码错误'
    }
  } catch (e: any) {
    errorMsg.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.login-container {
  width: 400px;
  text-align: center;
  z-index: 1;
}

.login-header {
  margin-bottom: 30px;
}

.login-header .title {
  font-size: 36px;
  letter-spacing: 8px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  letter-spacing: 4px;
  text-transform: uppercase;
}

.login-panel {
  text-align: left;
}

.form-group {
  margin-bottom: 20px;
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

.login-footer {
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

.tip-text {
  margin-top: 20px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.tip-text p {
  margin: 4px 0;
}
</style>
