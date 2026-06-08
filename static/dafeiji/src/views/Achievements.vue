<template>
  <div class="achievements-page">
    <div class="top-nav">
      <div class="nav-left">
        <button class="btn btn-sm" @click="goBack">← 返回</button>
        <h2 class="nav-title">战绩成就</h2>
      </div>
      <div class="nav-right">
        <span class="progress-text">{{ unlockedCount }} / {{ totalCount }} 已解锁</span>
      </div>
    </div>

    <div class="content">
      <div class="progress-bar-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="achievement-grid">
        <div
          v-for="ach in achievements"
          :key="ach.id"
          class="achievement-card"
          :class="{ unlocked: ach.unlocked }"
        >
          <div class="ach-icon">
            <span>{{ ach.icon }}</span>
          </div>
          <div class="ach-info">
            <h4 class="ach-name">{{ ach.name }}</h4>
            <p class="ach-desc">{{ ach.description }}</p>
            <div v-if="ach.unlocked" class="ach-status unlocked">
              ✓ 已解锁
            </div>
            <div v-else class="ach-status locked">
              🔒 未解锁
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameApi } from '@/api/game'
import type { Achievement } from '@/types'

const router = useRouter()

const achievements = ref<Achievement[]>([])
const unlockedCount = ref(0)
const totalCount = ref(0)

const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((unlockedCount.value / totalCount.value) * 100)
})

onMounted(async () => {
  try {
    const res = await gameApi.getAchievements()
    if (res.code === 0 && res.data) {
      if (Array.isArray(res.data)) {
        achievements.value = res.data
        totalCount.value = res.data.length
      } else {
        achievements.value = res.data.achievements
        totalCount.value = res.data.stats?.total_count || res.data.achievements.length
        unlockedCount.value = res.data.stats?.unlocked_count || 0
      }
      
      if (unlockedCount.value === 0) {
        unlockedCount.value = achievements.value.filter(a => a.unlocked).length
      }
    }
  } catch (e) {
    console.error('加载成就失败', e)
  }
})

const goBack = () => {
  router.push('/home')
}
</script>

<style scoped>
.achievements-page {
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

.progress-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  color: var(--color-neon-orange);
}

.content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.progress-bar-section {
  max-width: 800px;
  margin: 0 auto 30px;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-neon-blue), var(--color-neon-green));
  box-shadow: 0 0 10px var(--color-neon-blue);
  transition: width 0.5s ease;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.achievement-card {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: var(--color-bg-panel);
  border: 2px solid var(--color-border);
  transition: all 0.3s ease;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  opacity: 0.5;
  filter: grayscale(0.8);
}

.achievement-card.unlocked {
  opacity: 1;
  filter: none;
  border-color: var(--color-neon-orange);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.2);
}

.ach-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--color-border);
  flex-shrink: 0;
}

.achievement-card.unlocked .ach-icon {
  border-color: var(--color-neon-orange);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.5);
}

.ach-info {
  flex: 1;
}

.ach-name {
  font-size: 15px;
  color: var(--color-text-primary);
  margin-bottom: 5px;
  font-weight: 600;
}

.ach-desc {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
  margin-bottom: 8px;
}

.ach-status {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ach-status.unlocked {
  color: var(--color-neon-green);
}

.ach-status.locked {
  color: var(--color-text-muted);
}
</style>
