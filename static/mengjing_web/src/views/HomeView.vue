<template>
  <div class="home-view">
    <div class="dream-bg"></div>
    
    <div class="content">
      <div class="title-section">
        <h1 class="game-title">梦境旅人</h1>
        <p class="game-subtitle">Dream Traveler</p>
        <p class="game-tagline">穿越梦境，治愈心灵</p>
      </div>
      
      <div v-if="!gameStarted" class="start-section">
        <div class="name-input-wrapper">
          <input 
            v-model="playerNameInput" 
            type="text" 
            placeholder="请输入你的名字..."
            class="name-input"
            maxlength="12"
          />
        </div>
        
        <div class="button-group">
          <button class="btn btn-primary" @click="startNewGame" :disabled="!playerNameInput.trim()">
            开始新旅程
          </button>
          <button v-if="hasSaveData" class="btn btn-secondary" @click="continueGame">
            继续旅程
          </button>
        </div>
      </div>
      
      <div v-else class="menu-section">
        <p class="welcome-text">欢迎回来，{{ playerName }}</p>
        <div class="menu-buttons">
          <button class="btn menu-btn" @click="goToPatients">
            <span class="btn-icon">💭</span>
            <span>进入梦境</span>
          </button>
          <button class="btn menu-btn" @click="goToMemories">
            <span class="btn-icon">📜</span>
            <span>记忆收藏 ({{ totalMemoriesCollected }})</span>
          </button>
        </div>
      </div>
      
      <div class="game-intro">
        <div class="intro-card">
          <h3>🎮 游戏说明</h3>
          <ul>
            <li>你是一名能够进入他人梦境的特殊能力者</li>
            <li>接受委托，进入患者的内心世界</li>
            <li>收集记忆碎片，解开象征性谜题</li>
            <li>帮助患者面对内心的恐惧</li>
            <li>每个患者都有多种结局等你发现</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="floating-particles">
      <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const playerNameInput = ref('')

const gameStarted = computed(() => gameStore.gameStarted)
const playerName = computed(() => gameStore.playerName)
const hasSaveData = computed(() => gameStore.hasSaveData)
const totalMemoriesCollected = computed(() => gameStore.totalMemoriesCollected)

const startNewGame = () => {
  if (playerNameInput.value.trim()) {
    gameStore.startGame(playerNameInput.value.trim())
  }
}

const continueGame = () => {
  gameStore.loadGame()
}

const goToPatients = () => {
  router.push('/patients')
}

const goToMemories = () => {
  router.push('/memories')
}

const getParticleStyle = (index) => {
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${5 + Math.random() * 5}s`
  }
}
</script>

<style scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-y: auto;
}

.content {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.title-section {
  text-align: center;
  margin-bottom: 60px;
}

.game-title {
  font-size: 72px;
  font-weight: 700;
  background: linear-gradient(135deg, #c8a2e8, #8b5cf6, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(139, 92, 246, 0.5);
  margin-bottom: 10px;
  letter-spacing: 8px;
}

.game-subtitle {
  font-size: 24px;
  color: rgba(200, 162, 232, 0.8);
  letter-spacing: 6px;
  margin-bottom: 15px;
}

.game-tagline {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 3px;
}

.start-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
}

.name-input-wrapper {
  position: relative;
}

.name-input {
  width: 300px;
  padding: 16px 24px;
  background: rgba(40, 30, 60, 0.8);
  border: 1px solid rgba(180, 140, 220, 0.5);
  border-radius: 8px;
  color: #e0d0f0;
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  text-align: center;
  letter-spacing: 2px;
  outline: none;
  transition: all 0.3s ease;
}

.name-input:focus {
  border-color: rgba(200, 160, 240, 0.8);
  box-shadow: 0 0 20px rgba(150, 100, 200, 0.3);
}

.name-input::placeholder {
  color: rgba(200, 162, 232, 0.5);
}

.button-group {
  display: flex;
  gap: 20px;
}

.btn-primary {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(80, 60, 120, 0.8), rgba(60, 40, 100, 0.9));
}

.menu-section {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-text {
  font-size: 24px;
  color: #e0d0f0;
  margin-bottom: 40px;
  letter-spacing: 2px;
}

.menu-buttons {
  display: flex;
  gap: 30px;
}

.menu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 48px;
  font-size: 18px;
}

.btn-icon {
  font-size: 32px;
}

.game-intro {
  max-width: 600px;
  width: 100%;
}

.intro-card {
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.7), rgba(30, 20, 50, 0.8));
  border: 1px solid rgba(100, 80, 150, 0.3);
  border-radius: 12px;
  padding: 30px;
  backdrop-filter: blur(10px);
}

.intro-card h3 {
  color: #c8a2e8;
  margin-bottom: 20px;
  text-align: center;
  letter-spacing: 2px;
}

.intro-card ul {
  list-style: none;
  padding: 0;
}

.intro-card li {
  color: rgba(255, 255, 255, 0.8);
  padding: 10px 0;
  padding-left: 24px;
  position: relative;
  line-height: 1.6;
}

.intro-card li::before {
  content: '✧';
  position: absolute;
  left: 0;
  color: #8b5cf6;
}

.floating-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(200, 162, 232, 0.6);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(50px);
    opacity: 0;
  }
}
</style>
