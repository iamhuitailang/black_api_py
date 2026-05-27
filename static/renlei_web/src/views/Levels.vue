<template>
  <div class="levels-container">
    <div class="header">
      <router-link to="/home" class="back-btn">← 返回首页</router-link>
      <h1>🗺️ 选择关卡</h1>
      <div></div>
    </div>

    <div class="content">
      <div class="levels-grid">
        <div 
          v-for="(level, index) in levels" 
          :key="level.id"
          class="level-card"
          :class="{ completed: isCompleted(level.id), locked: isLocked(index) }"
          @click="selectLevel(level, index)"
        >
          <div class="level-number">{{ index + 1 }}</div>
          <div class="level-preview" :class="'theme-' + level.level_type">
            <div class="level-icon">{{ getLevelIcon(level.level_type) }}</div>
          </div>
          <div class="level-info">
            <h3>{{ level.name }}</h3>
            <p class="description">{{ level.description }}</p>
            <div class="level-meta">
              <span class="difficulty">难度: {{ '⭐'.repeat(level.difficulty) }}</span>
              <span v-if="isCompleted(level.id)" class="completed-badge">✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

const levels = ref([])
const progress = ref([])

onMounted(async () => {
  await userStore.getLevels()
  await userStore.getProgress()
  levels.value = userStore.levels
  progress.value = userStore.progress
})

const isCompleted = (levelId) => {
  const p = progress.value.find(p => p.level_id === levelId)
  return p?.is_completed
}

const isLocked = (index) => {
  if (index === 0) return false
  const prevLevel = levels.value[index - 1]
  if (!prevLevel) return true
  const p = progress.value.find(p => p.level_id === prevLevel.id)
  return !p?.is_completed
}

const selectLevel = (level, index) => {
  if (isLocked(index)) return
  router.push(`/game/${level.id}`)
}

const getLevelIcon = (type) => {
  const icons = {
    balloon: '🎈',
    bridge: '🌉',
    trampoline: '🤸',
    tightrope: '🎪'
  }
  return icons[type] || '🎮'
}
</script>

<style scoped>
.levels-container {
  min-height: 100vh;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto 30px;
  color: white;
}

.back-btn {
  color: white;
  text-decoration: none;
  font-weight: 600;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header h1 {
  font-size: 28px;
}

.content {
  max-width: 1000px;
  margin: 0 auto;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.level-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  gap: 16px;
  border: 3px solid transparent;
}

.level-card:hover:not(.locked) {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.level-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.level-card.completed {
  border-color: #38ef7d;
}

.level-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.level-preview {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.theme-balloon {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.theme-bridge {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.theme-trampoline {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.theme-tightrope {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.level-icon {
  font-size: 48px;
}

.level-info {
  flex: 1;
}

.level-info h3 {
  color: #333;
  margin-bottom: 8px;
  font-size: 18px;
}

.level-info .description {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.4;
}

.level-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.difficulty {
  color: #f5a623;
  font-size: 14px;
}

.completed-badge {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

@media (max-width: 768px) {
  .levels-grid {
    grid-template-columns: 1fr;
  }
}
</style>
