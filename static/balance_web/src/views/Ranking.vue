<template>
  <div class="ranking-container">
    <div class="cloud cloud1"></div>
    <div class="cloud cloud2"></div>
    
    <div class="content">
      <h1 class="title">🏆 排行榜</h1>
      
      <div class="ranking-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'score' }"
          @click="activeTab = 'score'"
        >
          🎯 总分排行
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'height' }"
          @click="activeTab = 'height'"
        >
          📏 高度排行
        </button>
      </div>

      <div class="ranking-list card">
        <div 
          v-for="(item, index) in displayList" 
          :key="item.id"
          class="ranking-item"
          :class="{ top3: index < 3 }"
        >
          <span class="rank">{{ getRankIcon(index) }}</span>
          <span class="name">{{ item.name || '匿名玩家' }}</span>
          <span class="value">{{ activeTab === 'score' ? item.score + '分' : item.height + 'px' }}</span>
        </div>
        <div v-if="displayList.length === 0" class="empty">
          暂无记录，快来挑战吧！
        </div>
      </div>

      <button class="btn btn-secondary back-btn" @click="goBack">
        ← 返回主页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('score')

const mockScores = [
  { id: 1, name: '建筑大师', score: 2850, height: 580 },
  { id: 2, name: '平衡达人', score: 2680, height: 540 },
  { id: 3, name: '积木王者', score: 2450, height: 510 },
  { id: 4, name: '创意玩家', score: 2100, height: 480 },
  { id: 5, name: '新手小白', score: 1850, height: 420 },
  { id: 6, name: '探索者', score: 1600, height: 380 },
  { id: 7, name: '梦想家', score: 1400, height: 350 },
  { id: 8, name: '挑战者', score: 1200, height: 300 },
  { id: 9, name: '学习者', score: 900, height: 250 },
  { id: 10, name: '初来乍到', score: 500, height: 180 }
]

const displayList = computed(() => {
  if (activeTab.value === 'score') {
    return [...mockScores].sort((a, b) => b.score - a.score)
  }
  return [...mockScores].sort((a, b) => b.height - a.height)
})

function getRankIcon(index) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return index + 1
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.ranking-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(180deg, #87CEEB 0%, #98FB98 50%, #90EE90 100%);
  padding: 20px;
}

.content {
  text-align: center;
  z-index: 10;
  max-width: 600px;
  width: 100%;
}

.title {
  margin-bottom: 20px;
}

.ranking-tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
  color: white;
}

.ranking-list {
  margin-bottom: 30px;
  max-height: 400px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px dashed #eee;
  transition: all 0.3s ease;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item.top3 {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%);
  border-radius: 10px;
}

.rank {
  width: 50px;
  font-size: 24px;
  font-weight: bold;
}

.name {
  flex: 1;
  text-align: left;
  font-size: 16px;
  color: #333;
}

.value {
  font-weight: bold;
  color: #FF6B9D;
  font-size: 18px;
}

.empty {
  padding: 40px;
  color: #999;
  font-size: 16px;
}

.back-btn {
  padding: 15px 40px;
  font-size: 18px;
}
</style>
