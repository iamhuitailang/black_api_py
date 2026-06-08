<template>
  <div class="page-container">
    <h1 class="page-title neon-text">🏆 排行榜</h1>

    <div class="period-tabs">
      <button
        v-for="period in periods"
        :key="period.value"
        class="tab-btn"
        :class="{ active: currentPeriod === period.value }"
        @click="switchPeriod(period.value)"
      >
        {{ period.label }}
      </button>
    </div>

    <div class="leaderboard-container neon-card">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="leaderboard.length === 0" class="empty">
        暂无排行数据，快去挑战吧！
      </div>
      <div v-else class="leaderboard-list">
        <div
          v-for="(item, index) in leaderboard"
          :key="item.id"
          class="leaderboard-item"
          :class="{ 'top-3': index < 3, 'is-me': isMyScore(item) }"
        >
          <div class="rank" :class="`rank-${index + 1}`">
            <template v-if="index < 3">
              <span class="medal">{{ medals[index] }}</span>
            </template>
            <template v-else>
              {{ index + 1 }}
            </template>
          </div>

          <div class="player-info">
            <div class="username">{{ item.username }}</div>
            <div class="player-stats">
              <span>最高连击: {{ item.highest_combo }}x</span>
            </div>
          </div>

          <div class="score-section">
            <div class="score">{{ item.score }}</div>
            <div class="date">{{ formatDate(item.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="userStore.isLoggedIn && leaderboardStore.myBest" class="my-rank neon-card">
      <div class="my-rank-label">我的最佳</div>
      <div class="my-rank-info">
        <div class="my-rank-num">
          #{{ leaderboardStore.myRank || '--' }}
        </div>
        <div class="my-score">{{ leaderboardStore.myBest.score }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useLeaderboardStore, useUserStore } from '@/stores'

const leaderboardStore = useLeaderboardStore()
const userStore = useUserStore()

const periods = [
  { label: '总榜', value: 'all' as const },
  { label: '周榜', value: 'weekly' as const },
  { label: '日榜', value: 'daily' as const },
]

const currentPeriod = ref<'all' | 'daily' | 'weekly'>('all')
const loading = ref(false)

const medals = ['🥇', '🥈', '🥉']

const leaderboard = computed(() => leaderboardStore.leaderboard)

onMounted(async () => {
  await loadLeaderboard()
  if (userStore.isLoggedIn) {
    await leaderboardStore.fetchMyBest()
  }
})

async function loadLeaderboard() {
  loading.value = true
  try {
    await leaderboardStore.fetchLeaderboard(currentPeriod.value)
  } finally {
    loading.value = false
  }
}

function switchPeriod(period: 'all' | 'daily' | 'weekly') {
  currentPeriod.value = period
  loadLeaderboard()
}

function isMyScore(item: any) {
  if (!userStore.user) return false
  return item.user_id === userStore.user.id
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.page-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  text-align: center;
  font-size: 32px;
  margin-bottom: 24px;
  color: var(--neon-yellow);
}

.period-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 8px 24px;
  background: transparent;
  border: 1px solid var(--text-secondary);
  color: var(--text-secondary);
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: var(--neon-blue);
  color: var(--neon-blue);
}

.tab-btn.active {
  background: var(--neon-blue);
  color: var(--bg-primary);
  border-color: var(--neon-blue);
  font-weight: bold;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
}

.leaderboard-container {
  padding: 8px;
  max-height: 500px;
  overflow-y: auto;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.leaderboard-item:hover {
  background: rgba(0, 212, 255, 0.05);
}

.leaderboard-item.top-3 {
  background: rgba(255, 215, 0, 0.05);
}

.leaderboard-item.is-me {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--neon-green);
}

.rank {
  width: 48px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--text-secondary);
}

.medal {
  font-size: 28px;
}

.rank-1 { color: #ffd700; }
.rank-2 { color: #c0c0c0; }
.rank-3 { color: #cd7f32; }

.player-info {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.player-stats {
  font-size: 12px;
  color: var(--text-secondary);
}

.score-section {
  text-align: right;
}

.score {
  font-size: 22px;
  font-weight: bold;
  color: var(--neon-blue);
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
}

.date {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.loading,
.empty {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
}

.my-rank {
  margin-top: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.my-rank-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.my-rank-info {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.my-rank-num {
  font-size: 20px;
  font-weight: bold;
  color: var(--neon-green);
}

.my-score {
  font-size: 24px;
  font-weight: bold;
  color: var(--neon-blue);
}
</style>
