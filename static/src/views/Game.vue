<template>
  <div class="game-page">
    <div class="game-wrapper">
      <div class="game-canvas-container">
        <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>

        <div class="score-popups">
          <div
            v-for="popup in gameStore.scorePopups"
            :key="popup.id"
            class="score-popup"
            :style="{ left: popup.x + 'px', top: popup.y + 'px' }"
          >
            +{{ popup.score }}
          </div>
        </div>

        <div v-if="gameStore.combo >= 2" class="combo-overlay">
          <div class="combo-number">{{ gameStore.combo }}x</div>
          <div class="combo-label">COMBO</div>
        </div>

        <div v-if="!gameStore.isPlaying && !gameStore.isGameOver" class="start-overlay">
          <div class="start-content">
            <h2 class="start-title">🎱 霓虹弹珠台</h2>
            <p class="start-desc">按住空格蓄力，松开发射</p>
            <p class="start-desc">A/D 或 ←/→ 控制挡板</p>
            <button @click="startGame" class="neon-btn start-btn">开始游戏</button>
          </div>
        </div>

        <div v-if="gameStore.isGameOver" class="gameover-overlay">
          <div class="gameover-content">
            <h2 class="gameover-title">游戏结束</h2>
            <div class="final-score">
              <div class="score-label">最终得分</div>
              <div class="score-value neon-text">{{ gameStore.score }}</div>
            </div>
            <div class="final-stats">
              <div class="stat-item">
                <span class="stat-label">最高连击</span>
                <span class="stat-value">{{ gameStore.highestCombo }}x</span>
              </div>
            </div>
            <button @click="restartGame" class="neon-btn restart-btn">再来一局</button>
          </div>
        </div>

        <div class="spring-power-bar">
          <div class="spring-label">蓄力</div>
          <div class="spring-bar">
            <div
              class="spring-fill"
              :style="{ height: springPowerPercent + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="hud-panel neon-card">
        <div class="hud-item">
          <div class="hud-label">得分</div>
          <div class="hud-value score-value">{{ gameStore.score }}</div>
        </div>

        <div class="hud-item">
          <div class="hud-label">连击倍率</div>
          <div class="combo-display" :class="{ 'combo-active': gameStore.combo > 0 }">
            {{ gameStore.comboMultiplier }}x
          </div>
          <div class="combo-count">{{ gameStore.combo }} 连击</div>
        </div>

        <div class="hud-item">
          <div class="hud-label">剩余弹珠</div>
          <div class="balls-display">
            <span v-for="i in gameStore.totalBalls" :key="i" class="ball-icon" :class="{ active: i <= gameStore.ballsLeft }">
              🎱
            </span>
          </div>
        </div>

        <div class="hud-item">
          <div class="hud-label">最高分</div>
          <div class="hud-value small">{{ leaderboardStore.myBest?.score || 0 }}</div>
        </div>

        <div v-if="multiplierActive" class="effect-badge multiplier">
          ⚡ 双倍得分中
        </div>

        <div class="controls-hint">
          <div class="hint-item"><kbd>A</kbd> / <kbd>←</kbd> 左挡板</div>
          <div class="hint-item"><kbd>D</kbd> / <kbd>→</kbd> 右挡板</div>
          <div class="hint-item"><kbd>空格</kbd> 蓄力发射</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useGameStore, useConfigStore, useLeaderboardStore, useAchievementStore, useUserStore } from '@/stores'
import { PinballEngine } from '@/game/PinballEngine'
import type { GadgetConfig } from '@/game/types'
import { submitScore, saveGameState, getGameState } from '@/api/game'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = 400
const canvasHeight = 711

const gameStore = useGameStore()
const configStore = useConfigStore()
const leaderboardStore = useLeaderboardStore()
const achievementStore = useAchievementStore()
const userStore = useUserStore()

let engine: PinballEngine | null = null
let uiUpdateFrame: number | null = null

const springPowerPercent = ref(0)
const multiplierActive = ref(false)

function startUiUpdateLoop() {
  const update = () => {
    if (engine) {
      springPowerPercent.value = (engine.getSpringPower() / engine.getMaxSpringPower()) * 100
      multiplierActive.value = engine.isMultiplierActive()
    }
    uiUpdateFrame = requestAnimationFrame(update)
  }
  update()
}

function stopUiUpdateLoop() {
  if (uiUpdateFrame) {
    cancelAnimationFrame(uiUpdateFrame)
    uiUpdateFrame = null
  }
}

onMounted(async () => {
  await configStore.fetchActiveConfigs()
  await leaderboardStore.fetchMyBest()

  if (canvasRef.value) {
    initEngine()
    startUiUpdateLoop()
  }

  if (userStore.isLoggedIn && engine) {
    await tryRestoreGameState()
  }
})

async function tryRestoreGameState() {
  if (!engine) return

  try {
    const res = await getGameState()
    if (res.code === 0 && res.data && res.data.state_json) {
      const gameState = JSON.parse(res.data.state_json)
      if (gameState.isPlaying && !gameStore.isGameOver) {
        gameStore.score = res.data.score || 0
        gameStore.combo = res.data.combo || 0
        gameStore.highestCombo = res.data.highest_combo || 0
        gameStore.ballsLeft = res.data.balls_left || 5
        gameStore.isPlaying = true
        gameStore.isGameOver = false
        gameStore.lastGadgetType = null
        gameStore.multiplierActive = false

        engine.startGame(res.data.balls_left || 5)
        engine.setState(gameState)

        startAutoSave()
      }
    }
  } catch (e) {
    console.error('Restore game state error:', e)
  }
}

onUnmounted(() => {
  stopUiUpdateLoop()
  if (engine) {
    engine.destroy()
    engine = null
  }
})

function initEngine() {
  if (!canvasRef.value) return

  engine = new PinballEngine(canvasRef.value, {
    onGadgetTriggered: (gadgetType, baseScore, x, y) => {
      gameStore.addScore(baseScore, gadgetType, x, y)
    },
    onBallLost: () => {
      gameStore.loseBall()
    },
    onGameOver: () => {
      handleGameOver()
    },
    onMultiplierActivated: (duration) => {
      gameStore.activateMultiplier(duration)
    },
    onSplitterActivated: (duration) => {
      console.log('Splitter activated for', duration, 'seconds')
    },
  })

  const gadgetConfigs: GadgetConfig[] = configStore.activeConfigs.map((cfg) => ({
    id: cfg.id,
    name: cfg.name,
    type: cfg.type,
    config: safeJsonParse(cfg.config_json, {}),
    position: safeJsonParse(cfg.position_json, { x: 200, y: 300 }),
    score: cfg.score,
  }))

  engine.setGadgets(gadgetConfigs)
}

function safeJsonParse(str: string, fallback: any) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

function startGame() {
  if (!engine) return
  gameStore.startGame()
  engine.startGame()
  startAutoSave()
}

function restartGame() {
  if (!engine) return
  gameStore.startGame()
  engine.startGame()
}

let autoSaveTimer: number | null = null

function startAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  autoSaveTimer = window.setInterval(() => {
    saveGameStateToServer()
  }, 5000)
}

async function saveGameStateToServer() {
  if (!engine || !userStore.isLoggedIn) return

  const state = engine.getState()
  try {
    await saveGameState({
      state_json: JSON.stringify(state),
      score: gameStore.score,
      combo: gameStore.combo,
      balls_left: gameStore.ballsLeft,
      highest_combo: gameStore.highestCombo,
    })
  } catch (e) {
    console.error('Save state error:', e)
  }
}

async function handleGameOver() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }

  if (userStore.isLoggedIn) {
    try {
      await submitScore({
        score: gameStore.score,
        highest_combo: gameStore.highestCombo,
        balls_used: gameStore.totalBalls - gameStore.ballsLeft,
      })

      await achievementStore.checkAndUnlock({
        score: gameStore.score,
        highest_combo: gameStore.highestCombo,
        gadget_types: engine?.getTriggeredGadgetTypes() || [],
        launch_count: engine?.getLaunchCount() || 0,
      })

      await leaderboardStore.fetchMyBest()
    } catch (e) {
      console.error('Game over submit error:', e)
    }
  }
}

watch(
  () => gameStore.score,
  (newScore) => {
    if (engine) {
    }
  }
)
</script>

<style scoped>
.game-page {
  padding: 24px;
  min-height: calc(100vh - 70px);
  display: flex;
  justify-content: center;
}

.game-wrapper {
  display: flex;
  gap: 24px;
  justify-content: center;
  align-items: flex-start;
}

.game-canvas-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.3),
              0 0 80px rgba(255, 0, 255, 0.15);
  border: 2px solid var(--border-glow);
}

canvas {
  display: block;
}

.score-popups {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.score-popup {
  position: absolute;
  font-size: 22px;
  font-weight: bold;
  color: var(--neon-green);
  text-shadow: 0 0 10px var(--neon-green), 0 0 20px var(--neon-green);
  animation: scoreFloat 1.5s ease-out forwards;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

@keyframes scoreFloat {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -150%) scale(0.8);
    opacity: 0;
  }
}

.combo-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  animation: comboShake 0.3s ease-out;
}

@keyframes comboShake {
  0%, 100% { transform: translate(-50%, -50%); }
  25% { transform: translate(-52%, -50%); }
  75% { transform: translate(-48%, -50%); }
}

.combo-number {
  font-size: 72px;
  font-weight: bold;
  background: linear-gradient(135deg, var(--neon-pink), var(--neon-yellow));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  filter: drop-shadow(0 0 20px rgba(255, 0, 255, 0.5));
}

.combo-label {
  font-size: 14px;
  color: var(--neon-pink);
  letter-spacing: 4px;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.start-overlay,
.gameover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-content,
.gameover-content {
  text-align: center;
}

.start-title {
  font-size: 36px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.start-desc {
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-size: 14px;
}

.start-btn {
  margin-top: 30px;
  padding: 14px 48px;
  font-size: 18px;
}

.gameover-title {
  font-size: 32px;
  color: var(--neon-pink);
  margin-bottom: 24px;
  text-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
}

.final-score {
  margin-bottom: 24px;
}

.score-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.score-value {
  font-size: 48px;
  font-weight: bold;
  color: var(--neon-blue);
}

.final-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 20px;
  color: var(--neon-green);
  font-weight: bold;
}

.restart-btn {
  padding: 12px 36px;
  font-size: 16px;
}

.spring-power-bar {
  position: absolute;
  right: 12px;
  bottom: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.spring-label {
  font-size: 10px;
  color: var(--text-secondary);
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}

.spring-bar {
  width: 12px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 102, 0, 0.3);
}

.spring-fill {
  width: 100%;
  background: linear-gradient(to top, var(--neon-orange), var(--neon-yellow));
  transition: height 0.05s linear;
  box-shadow: 0 0 10px var(--neon-orange);
}

.hud-panel {
  width: 260px;
  padding: 24px;
}

.hud-item {
  margin-bottom: 24px;
}

.hud-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.hud-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--neon-blue);
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.hud-value.small {
  font-size: 22px;
}

.score-value {
  font-size: 36px;
}

.combo-display {
  font-size: 40px;
  font-weight: bold;
  background: linear-gradient(135deg, var(--neon-pink), var(--neon-yellow));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.combo-display.combo-active {
  animation: comboPulse 0.5s ease-out;
}

@keyframes comboPulse {
  0% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.combo-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.balls-display {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ball-icon {
  font-size: 20px;
  opacity: 0.2;
  filter: grayscale(1);
  transition: all 0.3s ease;
}

.ball-icon.active {
  opacity: 1;
  filter: none;
}

.effect-badge {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
  animation: pulse 1s ease-in-out infinite;
}

.effect-badge.multiplier {
  background: rgba(255, 255, 0, 0.15);
  color: var(--neon-yellow);
  border: 1px solid var(--neon-yellow);
  box-shadow: 0 0 15px rgba(255, 255, 0, 0.3);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.controls-hint {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hint-item {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

kbd {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid var(--neon-blue);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: var(--neon-blue);
  margin: 0 2px;
}

@media (max-width: 900px) {
  .game-wrapper {
    flex-direction: column;
    align-items: center;
  }

  .hud-panel {
    width: 100%;
    max-width: 400px;
  }
}

@media (max-width: 480px) {
  .game-canvas-container {
    transform: scale(0.85);
    transform-origin: top center;
  }
}
</style>
