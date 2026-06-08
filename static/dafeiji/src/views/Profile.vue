<template>
  <div class="profile-page">
    <div class="top-nav">
      <div class="nav-left">
        <button class="btn btn-sm" @click="goBack">← 返回</button>
        <h2 class="nav-title">驾驶员档案</h2>
      </div>
      <div class="nav-right">
        <button class="btn btn-sm btn-danger" @click="handleLogout">退出登录</button>
      </div>
    </div>

    <div class="content">
      <div class="profile-grid">
        <div class="panel info-panel">
          <div class="panel-header">驾驶员信息</div>
          <div class="panel-body">
            <div class="info-row">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ userStore.user?.username }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">角色</span>
              <span class="badge" :class="userStore.user?.role === 'admin' ? 'badge-admin' : 'badge-user'">
                {{ userStore.user?.role === 'admin' ? '管理员' : '普通用户' }}
              </span>
            </div>

            <div class="stats-section">
              <h4>战绩统计</h4>
              <div class="stats-grid">
                <div class="stat-box">
                  <span class="stat-num">{{ formatNumber(userStats?.total_score || 0) }}</span>
                  <span class="stat-label">总分数</span>
                </div>
                <div class="stat-box">
                  <span class="stat-num">{{ userStats?.total_kills || 0 }}</span>
                  <span class="stat-label">总击杀</span>
                </div>
                <div class="stat-box">
                  <span class="stat-num">{{ userStats?.highest_wave || 0 }}</span>
                  <span class="stat-label">最高波次</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel password-panel">
          <div class="panel-header">修改密码</div>
          <div class="panel-body">
            <form @submit.prevent="handleChangePassword">
              <div class="form-group">
                <label class="form-label">当前密码</label>
                <input v-model="oldPassword" type="password" class="input" />
              </div>
              <div class="form-group">
                <label class="form-label">新密码</label>
                <input v-model="newPassword" type="password" class="input" />
              </div>
              <div class="form-group">
                <label class="form-label">确认新密码</label>
                <input v-model="confirmPassword" type="password" class="input" />
              </div>

              <div v-if="pwdError" class="error-msg">{{ pwdError }}</div>
              <div v-if="pwdSuccess" class="success-msg">{{ pwdSuccess }}</div>

              <button type="submit" class="btn btn-primary btn-block" :disabled="pwdLoading">
                {{ pwdLoading ? '修改中...' : '确认修改' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { gameApi } from '@/api/game'

const router = useRouter()
const userStore = useUserStore()

const userStats = ref<any>(null)

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwdLoading = ref(false)
const pwdError = ref('')
const pwdSuccess = ref('')

onMounted(async () => {
  await loadUserStats()
})

const loadUserStats = async () => {
  try {
    const res = await gameApi.getUserStats()
    if (res.code === 0 && res.data) {
      userStats.value = res.data.user_info
    }
  } catch (e) {
    console.error('加载用户统计失败', e)
  }
}

const handleChangePassword = async () => {
  pwdError.value = ''
  pwdSuccess.value = ''

  if (!oldPassword.value) {
    pwdError.value = '请输入当前密码'
    return
  }
  if (!newPassword.value || newPassword.value.length < 6 || newPassword.value.length > 32) {
    pwdError.value = '新密码长度需在6-32个字符之间'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }

  pwdLoading.value = true
  try {
    const success = await userStore.changePassword(oldPassword.value, newPassword.value)
    if (success) {
      pwdSuccess.value = '密码修改成功，请重新登录'
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      pwdError.value = '密码修改失败，请检查当前密码是否正确'
    }
  } catch (e: any) {
    pwdError.value = e.message || '修改失败'
  } finally {
    pwdLoading.value = false
  }
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const goBack = () => {
  router.push('/home')
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #050710;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(18, 26, 43, 0.9);
  border-bottom: 2px solid var(--color-border);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  color: var(--color-neon-blue);
  letter-spacing: 3px;
}

.btn-sm {
  padding: 6px 16px;
  font-size: 12px;
}

.content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  max-width: 900px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.info-label {
  font-size: 13px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-value {
  font-size: 14px;
  color: var(--color-text-primary);
}

.stats-section {
  margin-top: 20px;
}

.stats-section h4 {
  font-size: 14px;
  color: var(--color-neon-blue);
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-box {
  text-align: center;
  padding: 15px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
}

.stat-num {
  display: block;
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: bold;
  color: var(--color-neon-orange);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.form-group {
  margin-bottom: 16px;
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
  padding: 12px;
  font-size: 14px;
  margin-top: 10px;
}

.error-msg {
  color: var(--color-neon-red);
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 51, 51, 0.1);
  border: 1px solid rgba(255, 51, 51, 0.3);
}

.success-msg {
  color: var(--color-neon-green);
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
}
</style>
