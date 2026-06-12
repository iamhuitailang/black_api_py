<template>
  <div class="game-container" :style="{ background: levelConfig?.background }">
    <div class="game-hud">
      <div class="hud-left">
        <button class="hud-btn" @click="goBack">← 退出</button>
        <div class="level-info">
          <span class="level-emoji">{{ levelConfig?.emoji }}</span>
          <span class="level-name">{{ levelConfig?.name }}</span>
        </div>
      </div>
      
      <div class="hud-center">
        <div class="mode-indicator" :class="{ light: isLightMode, shadow: !isLightMode }">
          <span class="mode-icon">{{ isLightMode ? '☀️' : '🌑' }}</span>
          <span class="mode-text">{{ isLightMode ? '光模式' : '影模式' }}</span>
        </div>
      </div>

      <div class="hud-right">
        <div class="stat lives">
          <span class="stat-icon">❤️</span>
          <span class="stat-value">{{ lives }}</span>
        </div>
        <div class="stat particles">
          <span class="stat-icon">✨</span>
          <span class="stat-value">{{ collectedCount }}/{{ totalParticles }}</span>
        </div>
        <div v-if="totalTorches > 0" class="stat torches">
          <span class="stat-icon">🔥</span>
          <span class="stat-value">{{ torchesLit }}/{{ totalTorches }}</span>
        </div>
        <div class="stat score">
          <span class="stat-icon">⭐</span>
          <span class="stat-value">{{ score }}</span>
        </div>
      </div>
    </div>

    <div class="canvas-wrapper">
      <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
    </div>

    <div class="controls-hint">
      <div class="hint-item">
        <kbd>←</kbd><kbd>→</kbd> 移动
      </div>
      <div class="hint-item">
        <kbd>↑</kbd> 跳跃
      </div>
      <div class="hint-item">
        <kbd>空格</kbd> 切换光/影
      </div>
      <div class="hint-item mobile-hint">
        📱 点击屏幕切换模式
      </div>
    </div>

    <div v-if="showWin" class="win-modal">
      <div class="modal-content">
        <div class="win-celebration">
          <span v-for="i in 6" :key="i" class="confetti">🎉</span>
        </div>
        <h2 class="win-title">关卡通过！</h2>
        <div class="win-stats">
          <div class="win-stat">
            <span class="win-stat-icon">⭐</span>
            <span class="win-stat-label">得分</span>
            <span class="win-stat-value">{{ score }}</span>
          </div>
          <div class="win-stat">
            <span class="win-stat-icon">✨</span>
            <span class="win-stat-label">光粒子</span>
            <span class="win-stat-value">{{ collectedCount }}/{{ totalParticles }}</span>
          </div>
        </div>
        <div class="win-actions">
          <button v-if="hasNextLevel" class="win-btn primary" @click="nextLevel">
            下一关 →
          </button>
          <button class="win-btn" @click="restartLevel">
            重玩本关
          </button>
          <button class="win-btn" @click="goToLevels">
            关卡选择
          </button>
        </div>
      </div>
    </div>

    <div v-if="showTutorial" class="tutorial-overlay" @click="dismissTutorial">
      <div class="tutorial-content" @click.stop>
        <h2>{{ levelConfig?.name }}</h2>
        <p class="tutorial-desc">{{ getTutorialText() }}</p>
        <div class="tutorial-tips">
          <div class="tip light">
            <span class="tip-icon">☀️</span>
            <span class="tip-text">光模式：速度快，收集范围大，但碰到陷阱会受伤</span>
          </div>
          <div class="tip shadow">
            <span class="tip-icon">🌑</span>
            <span class="tip-text">影模式：可以穿过陷阱，但移动较慢</span>
          </div>
          <div v-if="levelId === 3" class="tip torch">
            <span class="tip-icon">🔥</span>
            <span class="tip-text">靠近火把可以点亮它，照亮周围的区域</span>
          </div>
        </div>
        <button class="start-btn" @click="dismissTutorial">开始游戏</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/game'
import { GameEngine } from '../game/engine'
import { getLevelConfig } from '../game/levels'
import { playSound, setSoundEnabled } from '../game/audio'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const levelId = computed(() => parseInt(route.params.levelId))
const levelConfig = computed(() => getLevelConfig(levelId.value))
const hasNextLevel = computed(() => levelId.value < 3)

const gameCanvas = ref(null)
const canvasWidth = ref(1200)
const canvasHeight = ref(600)

const isLightMode = ref(true)
const score = ref(0)
const lives = ref(3)
const collectedCount = ref(0)
const totalParticles = ref(0)
const torchesLit = ref(0)
const totalTorches = ref(0)

const showWin = ref(false)
const showTutorial = ref(true)

let gameEngine = null

const getTutorialText = () => {
  const texts = {
    1: '在晨光森林中，利用树影的掩护躲避危险的陷阱。收集所有光粒子，到达终点！',
    2: '黄昏峡谷的阴影平台在不断移动，踩准时机跳跃穿越！',
    3: '午夜城堡一片漆黑，点亮所有火把照亮道路，找到通往宝藏的路径！'
  }
  return texts[levelId.value] || texts[1]
}

const initGame = () => {
  if (!gameCanvas.value || !levelConfig.value) return

  setSoundEnabled(gameStore.soundEnabled)

  if (gameEngine) {
    gameEngine.stop()
  }

  totalParticles.value = levelConfig.value.lightParticles?.length || 0
  totalTorches.value = levelConfig.value.torches?.length || 0

  gameEngine = new GameEngine(
    gameCanvas.value,
    levelConfig.value,
    gameStore.character,
    handleStateChange
  )

  gameEngine.notifyState()
}

const handleStateChange = (state) => {
  if (state.event === 'win') {
    showWin.value = true
    gameStore.completeLevel(levelId.value, state.score, state.particles)
    return
  }
  if (state.event === 'state') {
    isLightMode.value = state.isLightMode
    score.value = state.score
    lives.value = state.lives
    collectedCount.value = state.collectedCount
    torchesLit.value = state.torchesLit
  }
}

const dismissTutorial = () => {
  showTutorial.value = false
  playSound('click')
  if (gameEngine) {
    gameEngine.start()
  }
}

const goBack = () => {
  playSound('click')
  if (gameEngine) gameEngine.stop()
  router.push({ name: 'LevelSelect' })
}

const goToLevels = () => {
  playSound('click')
  if (gameEngine) gameEngine.stop()
  router.push({ name: 'LevelSelect' })
}

const nextLevel = () => {
  playSound('select')
  if (gameEngine) gameEngine.stop()
  showWin.value = false
  router.push({ name: 'Game', params: { levelId: levelId.value + 1 } })
}

const restartLevel = () => {
  playSound('click')
  showWin.value = false
  score.value = 0
  lives.value = 3
  collectedCount.value = 0
  torchesLit.value = 0
  isLightMode.value = true
  showTutorial.value = true
  initGame()
}

const resizeCanvas = () => {
  const maxWidth = Math.min(window.innerWidth - 40, 1200)
  const maxHeight = Math.min(window.innerHeight - 200, 600)
  canvasWidth.value = maxWidth
  canvasHeight.value = maxHeight
}

watch(levelId, () => {
  showWin.value = false
  showTutorial.value = true
  score.value = 0
  lives.value = 3
  collectedCount.value = 0
  torchesLit.value = 0
  isLightMode.value = true
  setTimeout(() => initGame(), 100)
})

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  setTimeout(() => initGame(), 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (gameEngine) {
    gameEngine.stop()
  }
})
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: background 0.5s ease;
}

.game-hud {
  width: 100%;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.hud-left, .hud-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hud-btn {
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hud-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.level-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
}

.level-emoji {
  font-size: 28px;
}

.level-name {
  font-size: 18px;
  font-weight: bold;
}

.mode-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px;
  border-radius: 20px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.mode-indicator.light {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3));
  border: 2px solid #FFD700;
  color: #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.mode-indicator.shadow {
  background: linear-gradient(135deg, rgba(74, 74, 138, 0.3), rgba(30, 30, 60, 0.3));
  border: 2px solid #6a6aaa;
  color: #aaaaff;
  box-shadow: 0 0 20px rgba(100, 100, 180, 0.3);
}

.mode-icon {
  font-size: 24px;
}

.mode-text {
  font-size: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
}

.stat-icon {
  font-size: 18px;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
}

.stat.particles .stat-value {
  color: #FFD700;
}

.stat.score .stat-value {
  color: #FF8C00;
}

.stat.torches .stat-value {
  color: #FF6B35;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

canvas {
  border-radius: 16px;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
}

.controls-hint {
  display: flex;
  gap: 24px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

kbd {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  color: white;
}

.mobile-hint {
  opacity: 0.7;
}

.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.tutorial-content {
  background: linear-gradient(135deg, #2d1b4e, #1a0a2e);
  padding: 40px;
  border-radius: 24px;
  max-width: 550px;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.tutorial-content h2 {
  color: #FFD700;
  font-size: 32px;
  margin-bottom: 16px;
}

.tutorial-desc {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 28px;
}

.tutorial-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.tip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  text-align: left;
}

.tip.light {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.tip.shadow {
  background: rgba(100, 100, 180, 0.1);
  border: 1px solid rgba(100, 100, 180, 0.3);
}

.tip.torch {
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid rgba(255, 107, 53, 0.3);
}

.tip-icon {
  font-size: 28px;
}

.tip-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.5;
}

.start-btn {
  padding: 14px 56px;
  font-size: 20px;
  font-weight: bold;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  color: #1a1a2e;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 30px rgba(255, 140, 0, 0.5);
}

.win-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.win-modal .modal-content {
  background: linear-gradient(135deg, #2d1b4e, #4a2c6d);
  padding: 48px;
  border-radius: 24px;
  text-align: center;
  border: 2px solid rgba(255, 215, 0, 0.3);
  min-width: 420px;
  animation: popIn 0.5s ease;
}

@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.win-celebration {
  position: relative;
  height: 60px;
  margin-bottom: 16px;
}

.confetti {
  position: absolute;
  font-size: 40px;
  animation: confettiFall 2s ease-in-out infinite;
}

.confetti:nth-child(1) { left: 10%; animation-delay: 0s; }
.confetti:nth-child(2) { left: 30%; animation-delay: 0.3s; }
.confetti:nth-child(3) { left: 50%; animation-delay: 0.6s; }
.confetti:nth-child(4) { left: 70%; animation-delay: 0.9s; }
.confetti:nth-child(5) { left: 85%; animation-delay: 1.2s; }
.confetti:nth-child(6) { left: 95%; animation-delay: 1.5s; }

@keyframes confettiFall {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(40px) rotate(360deg); opacity: 0; }
}

.win-title {
  color: #FFD700;
  font-size: 40px;
  margin-bottom: 24px;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
}

.win-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 32px;
}

.win-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 28px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.win-stat-icon {
  font-size: 36px;
}

.win-stat-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.win-stat-value {
  color: #FFD700;
  font-size: 28px;
  font-weight: bold;
}

.win-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.win-btn {
  padding: 14px 32px;
  font-size: 18px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.win-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.win-btn.primary {
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  color: #1a1a2e;
}

.win-btn.primary:hover {
  box-shadow: 0 8px 30px rgba(255, 140, 0, 0.5);
}
</style>
