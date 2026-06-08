<template>
  <div class="page-container">
    <h1 class="page-title neon-text">🏅 成就</h1>

    <div class="achievement-stats neon-card">
      <div class="stat-item">
        <div class="stat-num">{{ unlockedCount }}</div>
        <div class="stat-label">已解锁</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-num">{{ achievements.length }}</div>
        <div class="stat-label">总数</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-num">{{ completionRate }}%</div>
        <div class="stat-label">完成度</div>
      </div>
    </div>

    <div class="achievement-grid">
      <div
        v-for="ach in achievements"
        :key="ach.id"
        class="achievement-card neon-card"
        :class="{ unlocked: ach.is_unlocked }"
      >
        <div class="ach-icon" :class="{ locked: !ach.is_unlocked }">
          {{ ach.icon }}
        </div>
        <div class="ach-info">
          <div class="ach-name">{{ ach.name }}</div>
          <div class="ach-desc">{{ ach.description }}</div>
          <div v-if="ach.is_unlocked && ach.unlocked_at" class="ach-date">
            解锁于 {{ formatDate(ach.unlocked_at) }}
          </div>
        </div>
        <div v-if="ach.is_unlocked" class="ach-badge">✓</div>
        <div v-else class="ach-lock">🔒</div>
      </div>
    </div>

    <div v-if="!userStore.isLoggedIn" class="login-hint neon-card">
      <p>登录后可追踪你的成就进度</p>
      <router-link to="/login" class="neon-btn">去登录</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAchievementStore, useUserStore } from '@/stores'

const achievementStore = useAchievementStore()
const userStore = useUserStore()

const achievements = computed(() => achievementStore.achievements)

const unlockedCount = computed(() => {
  return achievements.value.filter(a => a.is_unlocked).length
})

const completionRate = computed(() => {
  if (achievements.value.length === 0) return 0
  return Math.round((unlockedCount.value / achievements.value.length) * 100)
})

onMounted(async () => {
  await achievementStore.fetchAchievements()
})

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  text-align: center;
  font-size: 32px;
  margin-bottom: 24px;
  color: var(--neon-orange);
}

.achievement-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 24px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, var(--neon-orange), var(--neon-yellow));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  position: relative;
  transition: all 0.3s ease;
  opacity: 0.6;
  filter: grayscale(0.5);
}

.achievement-card.unlocked {
  opacity: 1;
  filter: none;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.3);
}

.ach-icon {
  font-size: 42px;
  flex-shrink: 0;
}

.ach-icon.locked {
  filter: grayscale(1);
  opacity: 0.5;
}

.ach-info {
  flex: 1;
  min-width: 0;
}

.ach-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.ach-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.ach-date {
  font-size: 11px;
  color: var(--neon-green);
  margin-top: 6px;
}

.ach-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: var(--neon-green);
  color: var(--bg-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.ach-lock {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 16px;
  opacity: 0.5;
}

.login-hint {
  margin-top: 32px;
  padding: 32px;
  text-align: center;
}

.login-hint p {
  color: var(--text-secondary);
  margin-bottom: 16px;
}
</style>
