<template>
  <div class="game-container">
    <div class="canvas-wrapper" ref="canvasWrapper">
      <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
      
      <HudPanel
        :money="gameState.state.money"
        :fuel="shipStats.fuel"
        :fuel-max="shipStats.fuelMax"
        :hp="shipStats.hp"
        :hp-max="shipStats.hpMax"
        :speed="shipStats.speed"
        :max-speed="shipStats.maxSpeed"
        :session-score="gameState.state.sessionScore"
        :system-name="currentSystem?.name || ''"
        :zone-name="currentZone?.name || ''"
        :collected-value="collectedValue"
        :required-value="currentZone?.requiredValue || 0"
        :remaining-debris="remainingDebris"
        :zone-completed="zoneCompleted"
      />
      
      <MenuButtons
        :sound-enabled="soundEnabled"
        @upgrade="openUpgrade"
        @mission="openMission"
        @restart="restartGame"
        @sound="toggleSound"
      />
      
      <PauseOverlay 
        :visible="gameState.state.isPaused && !gameState.state.showUpgradePanel && !gameState.state.showMissionPanel"
        @resume="resumeGame"
      />
      
      <GameOver
        :visible="gameState.state.isGameOver"
        :session-score="gameState.state.sessionScore"
        :debris-collected="gameState.state.sessionCollected"
        :total-money="gameState.state.money"
        @restart="restartGame"
        @upgrade="openUpgradeFromGameOver"
      />
    </div>
    
    <UpgradePanel
      :visible="gameState.state.showUpgradePanel"
      :money="gameState.state.money"
      :levels="gameState.state.upgrades"
      @close="closeUpgrade"
      @buy="handleBuyUpgrade"
    />
    
    <MissionPanel
      :visible="gameState.state.showMissionPanel"
      :current-system-id="gameState.state.progress.currentSystem"
      :current-zone-id="gameState.state.progress.currentZone"
      :zone-completed="gameState.state.progress.zoneCompleted"
      @close="closeMission"
      @select="handleSelectZone"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { createGameState } from './game/gameState.js'
import { GameEngine } from './game/gameEngine.js'
import { soundManager } from './game/soundManager.js'
import { SYSTEMS } from './constants/systems.js'
import { saveScene, loadScene, clearScene } from './game/storage.js'

import HudPanel from './components/HudPanel.vue'
import MenuButtons from './components/MenuButtons.vue'
import UpgradePanel from './components/UpgradePanel.vue'
import MissionPanel from './components/MissionPanel.vue'
import GameOver from './components/GameOver.vue'
import PauseOverlay from './components/PauseOverlay.vue'

const canvasWrapper = ref(null)
const gameCanvas = ref(null)
const canvasWidth = ref(900)
const canvasHeight = ref(600)

const gameState = createGameState()

let engine = null
let animationFrame = null
let lastSaveTime = 0

const soundEnabled = ref(true)

const shipStats = reactive({
  fuel: 100,
  fuelMax: 100,
  hp: 100,
  hpMax: 100,
  speed: 0,
  maxSpeed: 6
})

const collectedValue = ref(0)
const remainingDebris = ref(0)
const zoneCompleted = ref(false)

const currentSystem = computed(() => {
  return SYSTEMS[gameState.state.progress.currentSystem]
})

const currentZone = computed(() => {
  const sys = SYSTEMS[gameState.state.progress.currentSystem]
  return sys?.zones[gameState.state.progress.currentZone]
})

function initGame() {
  if (!gameCanvas.value) return
  
  soundManager.init()
  
  console.log('[游戏] 初始化开始，当前存档数据:', {
    money: gameState.state.money,
    upgrades: gameState.state.upgrades,
    system: gameState.state.progress.currentSystem,
    zone: gameState.state.progress.currentZone
  })
  
  engine = new GameEngine(gameCanvas.value, gameState)
  
  const sys = SYSTEMS[gameState.state.progress.currentSystem]
  
  const savedScene = loadScene()
  if (savedScene) {
    const restored = engine.restoreFromSave(savedScene, sys)
    if (restored) {
      console.log('[游戏] 从场景存档恢复成功')
    } else {
      console.log('[游戏] 场景存档恢复失败，重新初始化')
      clearScene()
      const zone = sys.zones[gameState.state.progress.currentZone]
      engine.initZone(sys, zone)
    }
  } else {
    console.log('[游戏] 无场景存档，全新初始化')
    const zone = sys.zones[gameState.state.progress.currentZone]
    engine.initZone(sys, zone)
  }
  
  engine.start()
  
  updateStats()
  startStatsLoop()
  
  gameState.saveToStorage()
  saveFullScene()
  console.log('[游戏] 初始化完成')
}

function updateStats() {
  const stats = engine?.getShipStats()
  if (stats) {
    shipStats.fuel = stats.fuel
    shipStats.fuelMax = stats.fuelMax
    shipStats.hp = stats.hp
    shipStats.hpMax = stats.hpMax
    shipStats.speed = stats.speed
    shipStats.maxSpeed = stats.maxSpeed
  }
  
  collectedValue.value = engine?.getCollectedValue() || 0
  remainingDebris.value = engine?.getRemainingDebris() || 0
  zoneCompleted.value = engine?.zoneCompleted || false
}

function saveFullScene() {
  if (engine) {
    const sceneData = engine.serialize()
    if (sceneData) {
      saveScene(sceneData)
    }
  }
}

function startStatsLoop() {
  function loop() {
    updateStats()
    
    const now = Date.now()
    if (now - lastSaveTime > 2000) {
      gameState.saveToStorage()
      saveFullScene()
      lastSaveTime = now
    }
    
    animationFrame = requestAnimationFrame(loop)
  }
  loop()
}

function restartGame() {
  if (!engine) return
  
  clearScene()
  gameState.resetSession()
  
  const sys = SYSTEMS[gameState.state.progress.currentSystem]
  const zone = sys.zones[gameState.state.progress.currentZone]
  engine.initZone(sys, zone)
  
  gameState.saveToStorage()
  saveFullScene()
}

function openUpgrade() {
  soundManager.playPickup()
  gameState.toggleUpgradePanel()
}

function closeUpgrade() {
  gameState.closePanels()
}

function handleBuyUpgrade(upgradeId) {
  const success = gameState.buyUpgrade(upgradeId)
  if (success && engine) {
    const level = gameState.getUpgradeLevel(upgradeId)
    engine.ship.applyUpgrade(upgradeId, level)
  }
}

function openUpgradeFromGameOver() {
  gameState.state.showUpgradePanel = true
  gameState.state.isPaused = true
}

function openMission() {
  soundManager.playPickup()
  gameState.toggleMissionPanel()
}

function closeMission() {
  gameState.closePanels()
}

function handleSelectZone({ systemId, zoneId }) {
  const success = gameState.selectZone(systemId, zoneId)
  if (success && engine) {
    clearScene()
    gameState.resetSession()
    const sys = SYSTEMS[systemId]
    const zone = sys.zones[zoneId]
    engine.initZone(sys, zone)
    engine.bgColor = sys.bgColor
    saveFullScene()
  }
  gameState.closePanels()
}

function resumeGame() {
  gameState.togglePause()
}

function toggleSound() {
  soundEnabled.value = soundManager.toggle()
}

function handleResize() {
  if (!canvasWrapper.value) return
  
  const wrapper = canvasWrapper.value
  const maxWidth = Math.min(wrapper.clientWidth - 40, 1200)
  const maxHeight = Math.min(wrapper.clientHeight - 40, 800)
  
  const ratio = 3 / 2
  let width = maxWidth
  let height = width / ratio
  
  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }
  
  canvasWidth.value = Math.floor(width)
  canvasHeight.value = Math.floor(height)
  
  if (engine) {
    engine.resize(canvasWidth.value, canvasHeight.value)
  }
}

watch(() => gameState.state.isGameOver, (newVal) => {
  if (newVal) {
    gameState.saveToStorage()
  }
})

function handleBeforeUnload() {
  gameState.saveToStorage()
  saveFullScene()
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handleBeforeUnload)
  
  setTimeout(() => {
    initGame()
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('pagehide', handleBeforeUnload)
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  if (engine) {
    engine.stop()
  }
  gameState.saveToStorage()
})
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  background: #050510;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.canvas-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(74, 158, 255, 0.2);
}

canvas {
  display: block;
}
</style>
