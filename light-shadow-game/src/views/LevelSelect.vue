<template>
  <div class="level-select-container">
    <button class="back-btn" @click="goBack">← 返回</button>
    
    <h1 class="page-title">选择关卡</h1>

    <div class="levels-grid">
      <div v-for="(level, index) in levels" :key="level.id"
        class="level-card"
        :class="{ 
          locked: !gameStore.isLevelUnlocked(level.id),
          completed: gameStore.isLevelCompleted(level.id)
        }"
        @click="selectLevel(level)">
        <div class="level-number">{{ index + 1 }}</div>
        <div class="level-visual" :style="{ background: level.background }">
          <span class="level-emoji">{{ level.emoji }}</span>
        </div>
        <div class="level-info">
          <h3 class="level-name">{{ level.name }}</h3>
          <p class="level-desc">{{ level.description }}</p>
          <div v-if="gameStore.isLevelCompleted(level.id)" class="score-info">
            <span>🌟 {{ gameStore.getScore(level.id) }} 分</span>
          </div>
        </div>
        <div v-if="!gameStore.isLevelUnlocked(level.id)" class="lock-overlay">
          <span class="lock-icon">🔒</span>
          <span class="lock-text">完成上一关解锁</span>
        </div>
        <div v-if="gameStore.isLevelCompleted(level.id)" class="completion-badge">
          ✓
        </div>
      </div>
    </div>

    <div class="tips-section">
      <h3>🎮 游戏提示</h3>
      <ul>
        <li>☀️ <strong>光模式</strong>：移动速度翻倍，收集光粒子更高效</li>
        <li>🌑 <strong>影模式</strong>：可以穿过障碍物，但移动较慢</li>
        <li>⌨️ 按 <kbd>空格</kbd> 或点击屏幕切换光影模式</li>
        <li>🎯 收集所有光粒子并到达终点即可过关</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { playSound } from '../game/audio'

const router = useRouter()
const gameStore = useGameStore()

const levels = [
  {
    id: 1,
    name: '晨光森林',
    emoji: '🌲',
    description: '利用树影躲避陷阱，开启你的光影之旅',
    background: 'linear-gradient(135deg, #56ab2f, #a8e6cf)'
  },
  {
    id: 2,
    name: '黄昏峡谷',
    emoji: '🏜️',
    description: '快速穿越移动的阴影平台，考验你的反应',
    background: 'linear-gradient(135deg, #f46b45, #eea849)'
  },
  {
    id: 3,
    name: '午夜城堡',
    emoji: '🏰',
    description: '操控火把制造光影路径，找到通往宝藏的路',
    background: 'linear-gradient(135deg, #434343, #000000)'
  }
]

const goBack = () => {
  playSound('click')
  router.push({ name: 'Home' })
}

const selectLevel = (level) => {
  if (gameStore.isLevelUnlocked(level.id)) {
    playSound('select')
    gameStore.setCurrentLevel(level.id)
    router.push({ name: 'Game', params: { levelId: level.id } })
  }
}
</script>

<style scoped>
.level-select-container {
  width: 100%;
  height: 100%;
  padding: 40px;
  background: linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 50%, #4a2c6d 100%);
  overflow-y: auto;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 30px;
  left: 30px;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-5px);
}

.page-title {
  text-align: center;
  color: white;
  font-size: 48px;
  margin-bottom: 50px;
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.levels-grid {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 50px;
  flex-wrap: wrap;
}

.level-card {
  width: 280px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
}

.level-card:not(.locked):hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
}

.level-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.level-number {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #FFD700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  z-index: 5;
}

.level-visual {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.level-emoji {
  font-size: 80px;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
  animation: float 4s ease-in-out infinite;
}

.level-info {
  padding: 24px;
}

.level-name {
  color: white;
  font-size: 24px;
  margin-bottom: 8px;
}

.level-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.score-info {
  color: #FFD700;
  font-weight: bold;
  font-size: 16px;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  backdrop-filter: blur(3px);
}

.lock-icon {
  font-size: 48px;
}

.lock-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.completion-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  z-index: 5;
  animation: pulse 2s ease-in-out infinite;
}

.tips-section {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tips-section h3 {
  color: #FFD700;
  margin-bottom: 20px;
  font-size: 22px;
  text-align: center;
}

.tips-section ul {
  list-style: none;
}

.tips-section li {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  font-size: 16px;
  line-height: 1.6;
}

.tips-section kbd {
  background: rgba(255, 215, 0, 0.2);
  padding: 4px 10px;
  border-radius: 6px;
  color: #FFD700;
  font-family: monospace;
  border: 1px solid rgba(255, 215, 0, 0.4);
}
</style>
