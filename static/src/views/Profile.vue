<template>
  <div class="page-container">
    <h1 class="page-title neon-text">👤 个人中心</h1>

    <div class="profile-card neon-card">
      <div class="avatar">
        {{ userStore.user?.username?.charAt(0).toUpperCase() }}
      </div>
      <div class="user-info">
        <div class="username">{{ userStore.user?.username }}</div>
        <div class="role-badge" :class="userStore.user?.role">
          {{ userStore.user?.role === 'admin' ? '管理员' : '普通用户' }}
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card neon-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <div class="stat-value">{{ leaderboardStore.myBest?.score || 0 }}</div>
          <div class="stat-label">最高分</div>
        </div>
      </div>

      <div class="stat-card neon-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-info">
          <div class="stat-value">#{{ leaderboardStore.myRank || '--' }}</div>
          <div class="stat-label">排名</div>
        </div>
      </div>

      <div class="stat-card neon-card">
        <div class="stat-icon">🏅</div>
        <div class="stat-info">
          <div class="stat-value">{{ achievementStore.totalUnlocked }}</div>
          <div class="stat-label">成就数</div>
        </div>
      </div>
    </div>

    <div class="section-card neon-card">
      <h3 class="section-title">修改密码</h3>
      <form @submit.prevent="handleChangePassword" class="password-form">
        <div class="form-group">
          <label class="form-label">原密码</label>
          <input
            v-model="oldPassword"
            type="password"
            class="input-neon"
            placeholder="请输入原密码"
          />
        </div>

        <div class="form-group">
          <label class="form-label">新密码 (6-32字符)</label>
          <input
            v-model="newPassword"
            type="password"
            class="input-neon"
            placeholder="请输入新密码"
          />
        </div>

        <div class="form-group">
          <label class="form-label">确认新密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="input-neon"
            placeholder="请再次输入新密码"
          />
        </div>

        <button type="submit" class="neon-btn submit-btn" :disabled="changing">
          {{ changing ? '修改中...' : '修改密码' }}
        </button>

        <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
        <p v-if="passwordSuccess" class="success-text">{{ passwordSuccess }}</p>
      </form>
    </div>

    <button @click="handleLogout" class="logout-full neon-btn neon-btn-secondary">
      退出登录
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useLeaderboardStore, useAchievementStore } from '@/stores'
import { changePassword } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const leaderboardStore = useLeaderboardStore()
const achievementStore = useAchievementStore()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const changing = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await leaderboardStore.fetchMyBest()
    await achievementStore.fetchAchievements()
  }
})

async function handleChangePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    passwordError.value = '请填写完整信息'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }

  if (newPassword.value.length < 6 || newPassword.value.length > 32) {
    passwordError.value = '密码长度需在6-32字符之间'
    return
  }

  changing.value = true

  try {
    const res = await changePassword(oldPassword.value, newPassword.value)
    if (res.code === 0) {
      passwordSuccess.value = '密码修改成功，请重新登录'
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''

      setTimeout(async () => {
        await userStore.logout()
        router.push('/login')
      }, 1500)
    } else {
      passwordError.value = res.message || '修改失败'
    }
  } catch (e: any) {
    passwordError.value = '修改失败，请稍后重试'
  } finally {
    changing.value = false
  }
}

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  text-align: center;
  font-size: 28px;
  margin-bottom: 24px;
  color: var(--neon-blue);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  margin-bottom: 24px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-pink));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.user-info {
  flex: 1;
}

.username {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.role-badge.user {
  background: rgba(0, 212, 255, 0.15);
  color: var(--neon-blue);
  border: 1px solid var(--neon-blue);
}

.role-badge.admin {
  background: rgba(255, 0, 255, 0.15);
  color: var(--neon-pink);
  border: 1px solid var(--neon-pink);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--neon-blue);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.section-card {
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.submit-btn {
  margin-top: 8px;
  padding: 12px;
}

.error-text {
  color: #ff4466;
  font-size: 13px;
  text-align: center;
  margin: 0;
}

.success-text {
  color: var(--neon-green);
  font-size: 13px;
  text-align: center;
  margin: 0;
}

.logout-full {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  border-color: var(--neon-pink);
  color: var(--neon-pink);
}

.logout-full:hover {
  background: rgba(255, 0, 255, 0.1);
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
