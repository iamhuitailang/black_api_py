<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    
    <div class="game-ui">
      <div class="top-bar">
        <button class="back-btn" @click="backToHome">
          ← 返回
        </button>
        
        <div class="player-info left">
          <div class="player-name">{{ gameStore.playerName }}</div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: player1Health + '%', background: 'linear-gradient(90deg, #4a90d9, #3498db)' }"></div>
            <span class="health-text">{{ Math.round(player1Health) }}/100</span>
          </div>
          <div class="charge-bar">
            <div class="charge-fill" :style="{ width: player1Charge + '%' }"></div>
          </div>
          <div class="skill-cooldown" v-if="player1SkillCooldown > 0">
            <span>技能冷却: {{ (player1SkillCooldown / 1000).toFixed(1) }}s</span>
          </div>
          <div class="skill-ready" v-else>
            <span>双击释放追踪飞弹!</span>
          </div>
        </div>
        
        <div class="game-info">
          <div class="scene-name">{{ sceneDisplayName }}</div>
          <div class="game-time">{{ formatTime(gameTime) }}</div>
          <div class="game-buttons">
            <button class="pause-btn" @click="togglePause">
              {{ isPaused ? '继续' : '暂停' }}
            </button>
          </div>
        </div>
        
        <div class="player-info right">
          <div class="player-name">{{ gameStore.gameMode === 'single' ? '敌方AI' : '玩家2' }}</div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: player2Health + '%', background: 'linear-gradient(90deg, #ff6b6b, #e74c3c)' }"></div>
            <span class="health-text">{{ Math.round(player2Health) }}/100</span>
          </div>
          <div class="charge-bar">
            <div class="charge-fill enemy" :style="{ width: player2Charge + '%' }"></div>
          </div>
          <div class="skill-cooldown" v-if="gameStore.gameMode === 'double' && player2SkillCooldown > 0">
            <span>技能冷却: {{ (player2SkillCooldown / 1000).toFixed(1) }}s</span>
          </div>
        </div>
      </div>
      
      <div class="scene-selector">
        <button 
          v-for="scene in scenes" 
          :key="scene.name"
          class="scene-btn"
          :class="{ active: gameStore.currentScene === scene.name }"
          @click="changeScene(scene.name)"
        >
          {{ scene.displayName }}
        </button>
      </div>
      
      <div class="controls-hint" v-if="gameStore.gameMode === 'double'">
        <span>玩家1: 方向键+空格 | 玩家2: WASD+J键</span>
      </div>
    </div>
    
    <div class="game-over-modal" v-if="gameOver">
      <div class="modal-content">
        <h2>{{ winner === 'player1' ? '🎉 胜利!' : '💀 失败!' }}</h2>
        <p class="winner-text">{{ getWinnerText() }}</p>
        <p class="game-stats">游戏时长: {{ formatTime(gameTime) }}</p>
        <div class="modal-buttons">
          <button class="btn primary" @click="restartGame">再来一局</button>
          <button class="btn secondary" @click="backToHome">返回主页</button>
        </div>
      </div>
    </div>
    
    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { GameEngine } from '../game/GameEngine'
import { SCENE_CONFIGS, GAME_CONFIG } from '../game/constants'
import { gameSaveApi, gameRecordApi, playerApi } from '../services/api'

const router = useRouter()
const gameStore = useGameStore()

const gameCanvas = ref(null)
const gameEngine = ref(null)
const loading = ref(true)

const player1Health = ref(100)
const player2Health = ref(100)
const player1Charge = ref(0)
const player2Charge = ref(0)
const player1SkillCooldown = ref(0)
const player2SkillCooldown = ref(0)
const gameTime = ref(0)
const isPaused = ref(false)
const gameOver = ref(false)
const winner = ref(null)

const scenes = Object.values(SCENE_CONFIGS)

const sceneDisplayName = computed(() => {
  return SCENE_CONFIGS[gameStore.currentScene]?.displayName || '星空战场'
})

function getWinnerText() {
  if (winner.value === 'player1') {
    return gameStore.gameMode === 'single' ? '你击败了AI!' : '玩家1获胜!'
  }
  return gameStore.gameMode === 'single' ? '你被AI击败了...' : '玩家2获胜!'
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function handleStateChange(state) {
  if (state.player1Health !== undefined) player1Health.value = state.player1Health
  if (state.player2Health !== undefined) player2Health.value = state.player2Health
  if (state.player1Charge !== undefined) player1Charge.value = state.player1Charge
  if (state.player2Charge !== undefined) player2Charge.value = state.player2Charge
  if (state.player1SkillCooldown !== undefined) player1SkillCooldown.value = state.player1SkillCooldown
  if (state.player2SkillCooldown !== undefined) player2SkillCooldown.value = state.player2SkillCooldown
  if (state.gameTime !== undefined) gameTime.value = state.gameTime
  if (state.paused !== undefined) isPaused.value = state.paused
}

function clearSave() {
  try {
    localStorage.removeItem('bet_game_state_' + gameStore.playerId)
  } catch (e) {
    console.log('清除本地存档失败')
  }
}

async function handleGameOver(result) {
  gameOver.value = true
  winner.value = result.winner
  
  clearSave()
  
  try {
    const isPlayer1Win = result.winner === 'player1'
    
    if (isPlayer1Win) {
      await playerApi.addWin(gameStore.playerId).catch(() => {})
    } else {
      await playerApi.addLoss(gameStore.playerId).catch(() => {})
    }
    
    await gameRecordApi.create({
      player1_id: gameStore.playerId,
      player2_id: gameStore.gameMode === 'double' ? gameStore.playerId + 1 : 2,
      winner_id: isPlayer1Win ? gameStore.playerId : 2,
      player1_health: player1Health.value,
      player2_health: player2Health.value,
      player1_score: isPlayer1Win ? 100 : 0,
      player2_score: isPlayer1Win ? 0 : 100,
      scene: gameStore.currentScene,
      game_mode: gameStore.gameMode,
      duration: result.gameTime / 1000
    }).catch(() => {})
  } catch (e) {
    console.log('保存游戏记录失败')
  }
}

function togglePause() {
  if (gameEngine.value) {
    gameEngine.value.togglePause()
  }
}

function changeScene(sceneName) {
  gameStore.setCurrentScene(sceneName)
  if (gameEngine.value) {
    gameEngine.value.setScene(sceneName)
  }
}

function saveGameLocal(state) {
  try {
    localStorage.setItem('bet_game_state_' + gameStore.playerId, JSON.stringify({
      state,
      timestamp: Date.now(),
      gameMode: gameStore.gameMode,
      scene: gameStore.currentScene
    }))
  } catch (e) {
    console.log('本地保存失败')
  }
}

function loadGameLocal() {
  try {
    const data = localStorage.getItem('bet_game_state_' + gameStore.playerId)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.gameMode === gameStore.gameMode && parsed.scene === gameStore.currentScene) {
        return parsed.state
      }
    }
  } catch (e) {
    console.log('本地读取失败')
  }
  return null
}

async function saveGame() {
  if (!gameEngine.value) return
  
  const state = gameEngine.value.getState()
  
  saveGameLocal(state)
  
  try {
    await gameSaveApi.create({
      player_id: gameStore.playerId,
      game_mode: gameStore.gameMode,
      scene: gameStore.currentScene,
      player_health: state.player1.health,
      enemy_health: state.player2.health,
      player_x: state.player1.x,
      player_y: state.player1.y,
      enemy_x: state.player2.x,
      enemy_y: state.player2.y,
      score: 0,
      game_state: gameOver.value ? 'finished' : 'playing',
      game_data: state
    })
  } catch (e) {
    console.log('服务器保存失败，已保存到本地')
  }
}

async function loadGame() {
  let state = null
  
  try {
    const save = await gameSaveApi.getActive(gameStore.playerId)
    if (save && save.game_data && save.game_state !== 'finished') {
      state = typeof save.game_data === 'string' ? JSON.parse(save.game_data) : save.game_data
    }
  } catch (e) {
    console.log('服务器读取失败，尝试本地读取')
  }
  
  if (!state) {
    const localState = loadGameLocal()
    if (localState && !localState.gameOver) {
      state = localState
    }
  }
  
  if (state && gameEngine.value && !state.gameOver) {
    try {
      gameEngine.value.loadState(state)
      player1Health.value = state.player1.health
      player2Health.value = state.player2.health
      player1Charge.value = state.player1.charge
      player2Charge.value = state.player2.charge
      gameTime.value = state.gameTime || 0
      console.log('游戏状态已恢复')
    } catch (e) {
      console.log('状态恢复失败', e)
    }
  }
}

function restartGame() {
  gameOver.value = false
  winner.value = null
  gameTime.value = 0
  player1Health.value = 100
  player2Health.value = 100
  player1Charge.value = 0
  player2Charge.value = 0
  
  clearSave()
  
  if (gameEngine.value) {
    gameEngine.value.reset()
    gameEngine.value.setScene(gameStore.currentScene)
  }
}

function backToHome() {
  clearSave()
  if (gameEngine.value) {
    gameEngine.value.destroy()
    gameEngine.value = null
  }
  gameStore.resetGame()
  router.push('/')
}

let saveInterval = null
let handleBeforeUnload = null

onMounted(async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (gameCanvas.value) {
    gameEngine.value = new GameEngine(gameCanvas.value, {
      gameMode: gameStore.gameMode,
      sceneName: gameStore.currentScene,
      onGameOver: handleGameOver,
      onStateChange: handleStateChange
    })
    
    await loadGame()
    
    gameEngine.value.start()
    loading.value = false
    
    saveInterval = setInterval(saveGame, 3000)
    
    handleBeforeUnload = (e) => {
      if (gameEngine.value && !gameOver.value) {
        saveGame()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
  }
})

onUnmounted(() => {
  if (saveInterval) {
    clearInterval(saveInterval)
    saveInterval = null
  }
  if (handleBeforeUnload) {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    handleBeforeUnload = null
  }
  if (gameEngine.value) {
    saveGame()
    gameEngine.value.destroy()
    gameEngine.value = null
  }
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: #0a0a1a;
  overflow-x: hidden;
  overflow-y: auto;
  padding-top: 10px;
}

.game-canvas {
  border-radius: 8px;
  box-shadow: 0 0 40px rgba(74, 144, 217, 0.3);
  max-width: 100%;
  height: auto;
}

.game-ui {
  width: 100%;
  max-width: 1200px;
  pointer-events: none;
  padding: 10px;
  box-sizing: border-box;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  pointer-events: auto;
  flex-wrap: wrap;
}

.back-btn {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  pointer-events: auto;
}

.back-btn:hover {
  background: rgba(74, 144, 217, 0.3);
  border-color: #4a90d9;
}

.player-info {
  flex: 1;
  min-width: 200px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  padding: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.player-info.right {
  text-align: right;
}

.player-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.health-bar {
  position: relative;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.health-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 8px;
}

.health-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.charge-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.charge-fill {
  height: 100%;
  background: linear-gradient(90deg, #f1c40f, #e67e22);
  transition: width 0.05s linear;
  box-shadow: 0 0 10px rgba(241, 196, 15, 0.5);
}

.charge-fill.enemy {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.5);
}

.skill-cooldown, .skill-ready {
  font-size: 11px;
  color: #aaa;
}

.skill-ready {
  color: #2ecc71;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.game-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  padding: 12px 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  min-width: 120px;
}

.scene-name {
  font-size: 14px;
  font-weight: bold;
  color: #4a90d9;
}

.game-time {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  font-family: 'Courier New', monospace;
}

.game-buttons {
  display: flex;
  gap: 8px;
}

.pause-btn {
  padding: 6px 16px;
  background: rgba(74, 144, 217, 0.3);
  border: 1px solid rgba(74, 144, 217, 0.5);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.pause-btn:hover {
  background: rgba(74, 144, 217, 0.5);
}

.scene-selector {
  display: flex;
  justify-content: center;
  gap: 8px;
  pointer-events: auto;
  padding: 10px;
  flex-wrap: wrap;
}

.scene-selector .scene-btn {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.scene-selector .scene-btn:hover {
  background: rgba(74, 144, 217, 0.3);
  color: #fff;
}

.scene-selector .scene-btn.active {
  background: rgba(74, 144, 217, 0.5);
  border-color: #4a90d9;
  color: #fff;
}

.controls-hint {
  text-align: center;
  padding: 10px;
  color: #888;
  font-size: 13px;
  pointer-events: none;
}

.game-over-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 100;
  pointer-events: auto;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a3e, #0a0a1a);
  border: 2px solid rgba(74, 144, 217, 0.5);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.5s ease;
  max-width: 90%;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h2 {
  font-size: 42px;
  margin-bottom: 16px;
  color: #fff;
}

.winner-text {
  font-size: 20px;
  color: #a0a0c0;
  margin-bottom: 12px;
}

.game-stats {
  font-size: 16px;
  color: #4a90d9;
  margin-bottom: 25px;
}

.modal-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn.primary {
  background: linear-gradient(135deg, #4a90d9, #9b59b6);
  color: #fff;
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(74, 144, 217, 0.5);
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.loading {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a1a;
  z-index: 200;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(74, 144, 217, 0.3);
  border-top-color: #4a90d9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  color: #a0a0c0;
  font-size: 16px;
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .player-info {
    min-width: auto;
  }
  
  .game-info {
    order: -1;
  }
  
  .back-btn {
    align-self: flex-start;
  }
}
</style>
