<template>
  <div class="game-container">
    <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>

    <!-- HUD Overlay -->
    <div class="hud-overlay" v-if="gameState === 'PLAYING'">
      <div class="hud-top">
        <div class="hp-bar">
          <span class="hud-label">气血</span>
          <div class="hp-container">
            <div
              v-for="i in 5"
              :key="i"
              class="hp-pip"
              :class="{ filled: i <= hp, damaged: i > hp && i - hp <= 1 }"
            ></div>
          </div>
        </div>
        <div class="hud-center">
          <div class="level-info">{{ levelName }}</div>
          <div class="time-info">{{ formatTime(time) }}</div>
        </div>
        <div class="hud-right">
          <div class="collect-info">
            <span class="collect-icon">📜</span>
            <span>{{ collectibles }} / {{ maxCollectibles }}</span>
          </div>
          <div class="damage-info">受伤: {{ damageTaken }}</div>
        </div>
      </div>

      <!-- Boss HP Bar -->
      <div class="boss-hud" v-if="showBossHp">
        <div class="boss-name">{{ bossName }}</div>
        <div class="boss-hp-bar">
          <div class="boss-hp-fill" :style="{ width: bossHpPercent + '%' }"></div>
        </div>
        <div class="boss-phase">第 {{ bossPhase }} 阶段</div>
      </div>

      <div class="controls-hint-small">
        J 挥剑 · K 跳跃 · L 冲刺 · P 暂停
      </div>
    </div>

    <!-- Pause Menu -->
    <div class="menu-overlay" v-if="gameState === 'PAUSED'">
      <div class="menu-panel">
        <h2 class="menu-title">暂停</h2>
        <button class="ink-btn" @click="resume">继续</button>
        <button class="ink-btn" @click="restart">重新开始</button>
        <button class="ink-btn" @click="quit">返回选关</button>
      </div>
    </div>

    <!-- Level Complete -->
    <div class="menu-overlay" v-if="gameState === 'LEVEL_COMPLETE'">
      <div class="menu-panel result-panel">
        <h2 class="menu-title">通关！</h2>
        <div class="grade-display" :class="'grade-' + grade">
          <span class="grade-letter">{{ grade }}</span>
          <span class="grade-label">评分</span>
        </div>
        <div class="stats-display">
          <div class="stat-row"><span>用时</span><span>{{ formatTime(time) }}</span></div>
          <div class="stat-row"><span>受伤</span><span>{{ damageTaken }} 次</span></div>
          <div class="stat-row"><span>收集</span><span>{{ collectibles }} / {{ maxCollectibles }}</span></div>
          <div class="stat-row"><span>总分</span><span class="score-num">{{ score }}</span></div>
        </div>
        <div class="result-actions">
          <button class="ink-btn" @click="restart">再战</button>
          <button class="ink-btn" @click="nextLevel" v-if="levelId < 10">下一关</button>
          <button class="ink-btn" @click="quit">返回选关</button>
        </div>
      </div>
    </div>

    <!-- Game Over -->
    <div class="menu-overlay" v-if="gameState === 'GAME_OVER'">
      <div class="menu-panel">
        <h2 class="menu-title game-over">失败</h2>
        <p class="game-over-text">你倒下了...</p>
        <button class="ink-btn" @click="restart">重新挑战</button>
        <button class="ink-btn" @click="quit">返回选关</button>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-screen" v-if="loading">
      <div class="loading-text">正在加载...</div>
      <div class="loading-sub">{{ levelName }}</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { GameEngine } from '../game/engine.js'
import { getLevel } from '../game/levels.js'
import { submitScore } from '../api/index.js'

export default {
  name: 'GameView',
  props: {
    levelId: { type: Number, required: true }
  },
  emits: ['complete', 'back'],
  setup(props, { emit }) {
    const gameCanvas = ref(null)
    const canvasWidth = 960
    const canvasHeight = 540
    let engine = null

    const loading = ref(true)
    const gameState = ref('PLAYING')
    const hp = ref(5)
    const time = ref(0)
    const collectibles = ref(0)
    const maxCollectibles = ref(0)
    const damageTaken = ref(0)
    const grade = ref('C')
    const score = ref(0)
    const showBossHp = ref(false)
    const bossHpPercent = ref(100)
    const bossPhase = ref(1)
    const bossName = ref('')

    const levelData = getLevel(props.levelId)
    const levelName = computed(() => `第${props.levelId}关 · ${levelData?.name || ''}`)

    function formatTime(seconds) {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0')
      const s = (seconds % 60).toFixed(1).padStart(4, '0')
      return `${m}:${s}`
    }

    function onHudUpdate(stats) {
      hp.value = stats.hp
      time.value = stats.time
      collectibles.value = stats.collectibles
      maxCollectibles.value = stats.maxCollectibles
      damageTaken.value = stats.damageTaken
      if (stats.boss) {
        showBossHp.value = true
        bossHpPercent.value = stats.boss.hpPercent
        bossPhase.value = stats.boss.phase
        bossName.value = stats.boss.name
      } else {
        showBossHp.value = false
      }
    }

    async function onLevelComplete(result) {
      gameState.value = 'LEVEL_COMPLETE'
      grade.value = result.grade
      score.value = result.score
      time.value = result.time
      collectibles.value = result.collectibles
      damageTaken.value = result.damageTaken
      maxCollectibles.value = result.maxCollectibles

      const playerName = localStorage.getItem('playerName') || '剑客'
      await submitScore({
        player_name: playerName,
        level_id: props.levelId,
        completion_time: result.time,
        damage_taken: result.damageTaken,
        collectibles: result.collectibles,
        max_collectibles: result.maxCollectibles
      })
    }

    function onGameOver() {
      gameState.value = 'GAME_OVER'
    }

    function resume() {
      if (engine) {
        engine.resume()
        gameState.value = 'PLAYING'
      }
    }

    function restart() {
      if (engine) {
        engine.destroy()
      }
      initEngine()
    }

    function nextLevel() {
      emit('complete')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('next-level', { detail: props.levelId + 1 }))
      }, 100)
    }

    function quit() {
      if (engine) {
        engine.destroy()
        engine = null
      }
      emit('back')
    }

    function initEngine() {
      loading.value = true
      gameState.value = 'PLAYING'
      hp.value = 5
      time.value = 0
      collectibles.value = 0
      damageTaken.value = 0
      grade.value = 'C'
      score.value = 0

      setTimeout(() => {
        engine = new GameEngine(gameCanvas.value, {
          onHudUpdate,
          onLevelComplete,
          onGameOver,
          onStateChange: (state) => {
            if (state === 'PAUSED') {
              gameState.value = 'PAUSED'
            } else if (state === 'PLAYING') {
              gameState.value = 'PLAYING'
            }
          }
        })
        engine.loadLevel(props.levelId)
        engine.start()
        loading.value = false
      }, 300)
    }

    onMounted(() => {
      initEngine()
    })

    onBeforeUnmount(() => {
      if (engine) {
        engine.destroy()
        engine = null
      }
    })

    return {
      gameCanvas,
      canvasWidth,
      canvasHeight,
      loading,
      gameState,
      hp,
      time,
      collectibles,
      maxCollectibles,
      damageTaken,
      grade,
      score,
      showBossHp,
      bossHpPercent,
      bossPhase,
      bossName,
      levelName,
      formatTime,
      resume,
      restart,
      nextLevel,
      quit
    }
  }
}
</script>

<style scoped>
.game-container {
  position: relative;
  width: 960px;
  height: 540px;
  border: 1px solid #2a2218;
  background: #0a0a0a;
}

canvas {
  display: block;
  image-rendering: pixelated;
}

.hud-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hud-top {
  position: absolute;
  top: 15px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.hud-label {
  font-size: 0.8rem;
  color: #8a7a60;
  margin-right: 8px;
}

.hp-container {
  display: flex;
  gap: 4px;
}

.hp-pip {
  width: 24px;
  height: 12px;
  background: rgba(50, 30, 30, 0.5);
  border: 1px solid #5a2a2a;
  transition: all 0.2s ease;
}

.hp-pip.filled {
  background: #c85040;
  box-shadow: 0 0 8px rgba(200, 80, 64, 0.5);
}

.hp-pip.damaged {
  animation: damageFlash 0.3s ease-out;
}

@keyframes damageFlash {
  0% { background: #c85040; }
  100% { background: rgba(50, 30, 30, 0.5); }
}

.hud-center {
  text-align: center;
}

.level-info {
  font-size: 1.2rem;
  color: #e8e0d0;
  letter-spacing: 0.15em;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
}

.time-info {
  font-size: 1.1rem;
  color: #c8b898;
  font-family: monospace;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
}

.hud-right {
  text-align: right;
  color: #a09880;
  font-size: 0.9rem;
}

.collect-info {
  margin-bottom: 2px;
}

.collect-icon {
  margin-right: 4px;
}

.controls-hint-small {
  position: absolute;
  bottom: 8px;
  width: 100%;
  text-align: center;
  color: rgba(160, 152, 128, 0.4);
  font-size: 0.75rem;
}

.boss-hud {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  text-align: center;
}

.boss-name {
  font-size: 1.3rem;
  color: #c85040;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px rgba(200, 80, 64, 0.5);
  margin-bottom: 4px;
}

.boss-hp-bar {
  width: 100%;
  height: 14px;
  background: rgba(40, 20, 20, 0.7);
  border: 1px solid #6a3030;
  position: relative;
}

.boss-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #802020, #c85040);
  box-shadow: 0 0 12px rgba(200, 80, 64, 0.6);
  transition: width 0.2s ease;
}

.boss-phase {
  margin-top: 4px;
  font-size: 0.85rem;
  color: #c8a848;
}

.menu-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 10, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.menu-panel {
  background: radial-gradient(ellipse at center, #1a1510 0%, #0a0a0a 100%);
  border: 1px solid #3a3028;
  padding: 30px 50px;
  text-align: center;
  min-width: 360px;
}

.menu-title {
  font-size: 2.5rem;
  color: #e8e0d0;
  letter-spacing: 0.2em;
  margin-bottom: 20px;
}

.menu-title.game-over {
  color: #c85040;
}

.game-over-text {
  color: #a09880;
  margin-bottom: 20px;
  font-size: 1.1rem;
}

.result-panel {
  min-width: 400px;
}

.grade-display {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.grade-letter {
  font-size: 6rem;
  font-weight: bold;
  line-height: 1;
  text-shadow: 0 0 30px currentColor;
}

.grade-label {
  font-size: 0.9rem;
  color: #6a5a4a;
  margin-top: 4px;
  letter-spacing: 0.2em;
}

.grade-S .grade-letter { color: #c8a848; }
.grade-A .grade-letter { color: #e8e0d0; }
.grade-B .grade-letter { color: #a09880; }
.grade-C .grade-letter { color: #6a5a4a; }

.stats-display {
  margin: 20px 0;
  text-align: left;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  color: #a09880;
  font-size: 1rem;
  border-bottom: 1px solid rgba(90, 74, 58, 0.3);
}

.stat-row span:last-child {
  color: #e8e0d0;
}

.score-num {
  color: #c8a848 !important;
  font-weight: bold;
  font-size: 1.2rem;
}

.result-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.result-actions .ink-btn {
  width: 140px;
  margin: 0;
}

.loading-screen {
  position: absolute;
  inset: 0;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 1.8rem;
  color: #e8e0d0;
  letter-spacing: 0.3em;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-sub {
  font-size: 1rem;
  color: #6a5a4a;
  margin-top: 8px;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
