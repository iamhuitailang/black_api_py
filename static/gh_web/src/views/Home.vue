<template>
  <div class="home container">
    <div class="welcome-section">
      <h1>欢迎回来，{{ authStore.user?.username }} 👻</h1>
      <p class="subtitle">准备好探索灵异世界了吗？</p>
    </div>

    <div class="stats-grid grid grid-4 mb-20">
      <div class="stat-card card">
        <div class="stat-icon">⭐</div>
        <div class="stat-content">
          <h3>{{ authStore.user?.level }}</h3>
          <p>等级</p>
          <div class="progress-bar exp-bar mt-10">
            <div class="progress-bar-fill" :style="{ width: expPercent + '%' }"></div>
          </div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3>{{ authStore.user?.coins }}</h3>
          <p>金币</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">❤️</div>
        <div class="stat-content">
          <h3>{{ gameState?.sanity || 100 }}%</h3>
          <p>理智值</p>
          <div class="progress-bar sanity-bar mt-10">
            <div class="progress-bar-fill" :style="{ width: (gameState?.sanity || 100) + '%' }"></div>
          </div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <h3>{{ completedTasks }}</h3>
          <p>已完成任务</p>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2 class="mb-20">快速开始</h2>
      <div class="grid grid-3">
        <router-link to="/explore" class="action-card card">
          <div class="action-icon">🔍</div>
          <h3>开始探索</h3>
          <p>进入闹鬼地点寻找线索</p>
        </router-link>
        <router-link to="/tasks" class="action-card card">
          <div class="action-icon">📜</div>
          <h3>查看任务</h3>
          <p>接受委托获取奖励</p>
        </router-link>
        <router-link to="/inventory" class="action-card card">
          <div class="action-icon">🎒</div>
          <h3>装备管理</h3>
          <p>升级你的法器和设备</p>
        </router-link>
      </div>
    </div>

    <div class="recent-activity mt-20">
      <h2 class="mb-20">最近活动</h2>
      <div class="card">
        <div v-if="recentEvidence.length > 0" class="activity-list">
          <div v-for="item in recentEvidence" :key="item.id" class="activity-item">
            <span class="activity-icon">🔍</span>
            <span>收集了证据 - {{ item.collected_at }}</span>
          </div>
        </div>
        <div v-else class="text-center" style="color: var(--text-secondary)">
          暂无活动记录，开始你的第一次探索吧！
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore, useToastStore } from '../store'
import { gameAPI } from '../services/api'

const authStore = useAuthStore()
const toastStore = useToastStore()

const gameState = computed(() => authStore.gameState)
const recentEvidence = ref([])
const completedTasks = ref(0)

const expPercent = computed(() => {
  if (!authStore.user) return 0
  const expNeeded = authStore.user.level * 100
  return (authStore.user.exp / expNeeded) * 100
})

const loadData = async () => {
  try {
    const [evidenceRes, tasksRes] = await Promise.all([
      gameAPI.getMyEvidence(),
      gameAPI.getMyTasks('completed')
    ])
    if (evidenceRes.code === 200) {
      recentEvidence.value = evidenceRes.data.slice(0, 5)
    }
    if (tasksRes.code === 200) {
      completedTasks.value = tasksRes.data.length
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.welcome-section {
  text-align: center;
  padding: 40px 0;
}

.welcome-section h1 {
  font-size: 32px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
  font-size: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 32px;
}

.stat-content h3 {
  font-size: 24px;
  margin-bottom: 5px;
  color: var(--accent-primary);
}

.stat-content p {
  color: var(--text-secondary);
  font-size: 14px;
}

.action-card {
  text-align: center;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.action-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.action-card h3 {
  margin-bottom: 10px;
  color: var(--text-primary);
}

.action-card p {
  color: var(--text-secondary);
  font-size: 14px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.activity-icon {
  font-size: 20px;
}

.mt-10 {
  margin-top: 10px;
}
</style>
