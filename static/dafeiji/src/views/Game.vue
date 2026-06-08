<template>
  <div class="game-page">
    <div class="game-container">
      <canvas ref="gameCanvas" class="game-canvas"></canvas>
      
      <div v-if="gameEngine && showAchievementPopup" class="achievement-popup" @transitionend="onPopupEnd">
        <div class="achievement-icon">{{ currentAchievement?.icon }}</div>
        <div class="achievement-info">
          <div class="achievement-title">成就解锁</div>
          <div class="achievement-name">{{ currentAchievement?.name }}</div>
        </div>
      </div>
    </div>

    <div v-if="gameEngine && isGameOver" class="game-over-overlay">
      <div class="game-over-panel">
        <h2 class="title title-neon">任务结束</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ finalScore }}</span>
            <span class="stat-label">最终分数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ finalWave }}</span>
            <span class="stat-label">到达波次</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ finalKills }}</span>
            <span class="stat-label">击杀数</span>
          </div>
        </div>

        <div v-if="newAchievements.length > 0" class="new-achievements">
          <h4>新解锁成就</h4>
          <div class="ach-list">
            <div v-for="ach in newAchievements" :key="ach.id" class="ach-item">
              <span class="ach-icon">{{ ach.icon }}</span>
              <span class="ach-name">{{ ach.name }}</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary" @click="restartGame">再次挑战</button>
          <button class="btn" @click="backToHome">返回机库</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gameApi } from '@/api/game'
import { GameEngine } from '@/game/GameEngine'
import type { Plane, Achievement, GameState } from '@/types'

const route = useRoute()
const router = useRouter()

const gameCanvas = ref<HTMLCanvasElement | null>(null)
let gameEngine: GameEngine | null = null

const isGameOver = ref(false)
const finalScore = ref(0)
const finalWave = ref(1)
const finalKills = ref(0)
const newAchievements = ref<Achievement[]>([])

const showAchievementPopup = ref(false)
const currentAchievement = ref<Achievement | null>(null)

let saveTimer: number | null = null
let currentPlane: Plane | null = null
let savedState: GameState | null = null

onMounted(async () => {
  if (!gameCanvas.value) return

  gameEngine = new GameEngine(gameCanvas.value)

  gameEngine.onGameOver = handleGameOver
  gameEngine.onStateSave = handleStateSave
  gameEngine.onWaveComplete = handleWaveComplete

  await initGame()

  saveTimer = window.setInterval(() => {
    if (gameEngine && gameEngine.gameState.isRunning && !gameEngine.gameState.isPaused) {
      handleStateSave()
    }
  }, 30000)

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (saveTimer) {
    clearInterval(saveTimer)
  }
  if (gameEngine) {
    handleStateSave()
    gameEngine.destroy()
  }
  window.removeEventListener('keydown', handleKeyDown)
})

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isGameOver.value) {
    backToHome()
  }
}

const initGame = async () => {
  try {
    const planesRes = await gameApi.getPlanes()
    if (planesRes.code !== 0 || !planesRes.data) return

    const planes = planesRes.data
    const isContinue = route.query.continue === '1'

    if (isContinue) {
      const stateRes = await gameApi.loadState()
      if (stateRes.code === 0 && stateRes.data) {
        savedState = stateRes.data
        currentPlane = planes.find(p => p.plane_id === savedState!.plane_id) || planes[0]
      } else {
        currentPlane = planes[0]
      }
    } else {
      const planeId = route.query.plane as string
      currentPlane = planes.find(p => p.plane_id === planeId) || planes[0]
    }

    const waveRes = await gameApi.getWave(1)
    const waveConfig = waveRes.data || null

    if (gameEngine && currentPlane) {
      gameEngine.start(currentPlane, waveConfig as any, savedState?.state_data)
    }
  } catch (e) {
    console.error('初始化游戏失败', e)
  }
}

const handleStateSave = async () => {
  if (!gameEngine || !currentPlane) return

  const stateData = gameEngine.getStateData()
  if (!stateData) return

  try {
    const res = await gameApi.saveState(
      currentPlane.plane_id,
      stateData as any,
      gameEngine.gameState.score,
      gameEngine.gameState.wave,
      gameEngine.gameState.isPaused
    )
    if (res.code === 0 && res.data) {
      gameEngine.gameState.stateId = res.data.state_id
    }
  } catch (e) {
    console.error('保存状态失败', e)
  }
}

const handleWaveComplete = () => {
}

const handleGameOver = async () => {
  if (!gameEngine || !currentPlane) return

  isGameOver.value = true
  finalScore.value = gameEngine.gameState.score
  finalWave.value = gameEngine.gameState.wave
  finalKills.value = gameEngine.gameState.kills

  try {
    const res = await gameApi.endGame(
      gameEngine.gameState.stateId || 0,
      gameEngine.gameState.score,
      gameEngine.gameState.wave,
      gameEngine.gameState.kills,
      Math.floor(gameEngine.gameState.playTime),
      currentPlane.plane_id,
      gameEngine.gameState.collectedItems,
      gameEngine.gameState.usedPlanes,
      gameEngine.gameState.perfectWaves
    )

    if (res.code === 0 && res.data) {
      newAchievements.value = res.data.new_achievements || []
      
      if (newAchievements.value.length > 0) {
        showAchievementPopup.value = true
        currentAchievement.value = newAchievements.value[0]
      }
    }
  } catch (e) {
    console.error('提交分数失败', e)
  }
}

const onPopupEnd = () => {
  setTimeout(() => {
    showAchievementPopup.value = false
  }, 2000)
}

const restartGame = () => {
  if (!gameEngine || !currentPlane) return
  
  isGameOver.value = false
  newAchievements.value = []
  
  gameEngine.start(currentPlane, null as any)
}

const backToHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.game-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #050710;
  position: relative;
}

.game-container {
  position: relative;
  box-shadow: 0 0 50px rgba(0, 212, 255, 0.2);
  border: 3px solid var(--color-border-light);
  clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
}

.game-canvas {
  display: block;
  max-height: 100vh;
}

.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(5, 7, 16, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.game-over-panel {
  width: 420px;
  padding: 30px;
  text-align: center;
}

.game-over-panel h2 {
  font-size: 32px;
  letter-spacing: 6px;
  margin-bottom: 25px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-item {
  background: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  padding: 15px 10px;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}

.stat-value {
  display: block;
  font-family: 'Orbitron', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-neon-blue);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.new-achievements {
  margin-bottom: 25px;
  text-align: left;
}

.new-achievements h4 {
  font-size: 14px;
  color: var(--color-neon-orange);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.ach-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ach-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: rgba(255, 140, 0, 0.1);
  border: 1px solid rgba(255, 140, 0, 0.3);
}

.ach-icon {
  font-size: 20px;
}

.ach-name {
  font-size: 13px;
  color: var(--color-text-primary);
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.action-buttons .btn {
  flex: 1;
}

.achievement-popup {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 25px;
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.3) 0%, rgba(255, 140, 0, 0.1) 100%);
  border: 2px solid var(--color-neon-orange);
  box-shadow: 0 0 20px rgba(255, 140, 0, 0.5);
  z-index: 50;
  animation: slideDown 0.5s ease, fadeOut 0.5s ease 1.5s forwards;
}

@keyframes slideDown {
  from { transform: translateX(-50%) translateY(-30px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

@keyframes fadeOut {
  to { opacity: 0; }
}

.achievement-icon {
  font-size: 28px;
}

.achievement-info {
  text-align: left;
}

.achievement-title {
  font-size: 11px;
  color: var(--color-neon-orange);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 3px;
}

.achievement-name {
  font-size: 15px;
  color: var(--color-text-primary);
  font-weight: 600;
}
</style>
