<template>
  <div class="levels-container">
    <div class="cloud cloud1"></div>
    <div class="cloud cloud2"></div>
    
    <div class="content">
      <h1 class="title">🗺️ 选择关卡</h1>
      
      <div class="levels-grid">
        <div 
          v-for="level in levels" 
          :key="level.id"
          class="level-card card"
          :class="{ locked: level.difficulty > 1 && !unlockedLevels.includes(level.id) }"
          @click="selectLevel(level)"
        >
          <div class="level-header">
            <span class="level-number">{{ level.id }}</span>
            <span class="level-difficulty">{{ '⭐'.repeat(level.difficulty) }}</span>
          </div>
          <h3>{{ level.name }}</h3>
          <p class="level-desc">{{ level.description }}</p>
          <div class="level-info">
            <span>🎯 目标高度: {{ level.target_height }}px</span>
            <span>🌬️ 风力: {{ level.wind_force }}</span>
          </div>
        </div>
      </div>

      <button class="btn btn-secondary back-btn" @click="goBack">
        ← 返回主页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { levelApi } from '@/utils/api'

const router = useRouter()
const levels = ref([])
const unlockedLevels = ref([1])

onMounted(async () => {
  try {
    levels.value = await levelApi.getLevels()
  } catch (e) {
    levels.value = [
      { id: 1, name: '新手村 - 初次尝试', description: '学习基础搭建', difficulty: 1, target_height: 200, wind_force: 0 },
      { id: 2, name: '微风平原', description: '轻微侧风', difficulty: 2, target_height: 300, wind_force: 5 },
      { id: 3, name: '彩虹桥', description: '中等风压', difficulty: 3, target_height: 400, wind_force: 10 },
      { id: 4, name: '云端高塔', description: '强风压挑战', difficulty: 4, target_height: 500, wind_force: 15 },
      { id: 5, name: '风暴之巅', description: '终极挑战', difficulty: 5, target_height: 600, wind_force: 25 }
    ]
  }
})

function selectLevel(level) {
  router.push(`/game/${level.id}`)
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.levels-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(180deg, #87CEEB 0%, #98FB98 50%, #90EE90 100%);
  padding: 20px;
  overflow-y: auto;
}

.content {
  text-align: center;
  z-index: 10;
  max-width: 900px;
  width: 100%;
}

.title {
  margin-bottom: 30px;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.level-card {
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.level-card:hover:not(.locked) {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.level-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.level-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.level-difficulty {
  color: #FFD700;
  font-size: 16px;
}

.level-card h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 18px;
}

.level-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  color: #888;
}

.back-btn {
  padding: 15px 40px;
  font-size: 18px;
}
</style>
