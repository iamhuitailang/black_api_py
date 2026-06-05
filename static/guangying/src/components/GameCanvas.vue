<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { GameEngine, type GameEvent, type LevelResult } from '@/game/engine'
import { getLevelById } from '@/levels/index'
import { useGameStore } from '@/store/gameStore'
import type { PlayerShadowState } from '@/entities/player'

const props = defineProps<{
  levelId: number
}>()

const emit = defineEmits<{
  (e: 'levelComplete', result: LevelResult): void
  (e: 'gameOver', result: LevelResult): void
  (e: 'shadowStateChange', state: PlayerShadowState): void
}>()

const router = useRouter()
const gameStore = useGameStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const engine = ref<GameEngine | null>(null)
const isEngineReady = ref(false)

const currentShadowState = ref<PlayerShadowState>('light')
let stateUpdateInterval: number | null = null
let sessionSaveInterval: number | null = null

const canvasSize = computed(() => ({
  width: containerRef.value?.clientWidth ?? 1200,
  height: containerRef.value?.clientHeight ?? 675
}))

const handleResize = () => {
  if (!engine.value || !canvasRef.value) return
  const { width, height } = canvasSize.value
  canvasRef.value.width = width
  canvasRef.value.height = height
}

const syncGameState = () => {
  if (!engine.value) return

  const engineState = engine.value.getGameState()
  gameStore.updateHealth(engineState.health)
  gameStore.gameState.collectibles = engineState.collectibles
  gameStore.gameState.gameTime = engineState.gameTime
  gameStore.gameState.score = engineState.score
  gameStore.gameState.isPaused = engineState.isPaused

  const player = engine.value.getPlayer()
  if (player) {
    const newState = player.shadowState
    if (newState !== currentShadowState.value) {
      currentShadowState.value = newState
      gameStore.gameState.shadowState = newState
      emit('shadowStateChange', newState)
    }
  }
}

const saveGameSession = () => {
  if (!engine.value) return
  const session = engine.value.getGameSession()
  if (session) {
    gameStore.saveGameSession(session)
  }
}

const handleLevelComplete = (event: GameEvent) => {
  const result = event.data as LevelResult
  gameStore.completeLevel(result.stars)
  gameStore.recordHighScore(props.levelId.toString())
  gameStore.clearGameSession()
  emit('levelComplete', result)
}

const handleGameOver = (event: GameEvent) => {
  const result = event.data as LevelResult
  gameStore.gameOver()
  gameStore.clearGameSession()
  emit('gameOver', result)
}

const handlePause = () => {
  gameStore.pauseGame()
}

const handleResume = () => {
  gameStore.resumeGame()
}

const initEngine = () => {
  if (!canvasRef.value) return

  const { width, height } = canvasSize.value

  engine.value = new GameEngine({
    canvas: canvasRef.value,
    width,
    height,
    fixedTimeStep: 1 / 60,
    maxFrameAccumulator: 0.25,
    targetFPS: 60,
    quality: 'high'
  })

  engine.value.on('levelComplete', handleLevelComplete)
  engine.value.on('gameOver', handleGameOver)
  engine.value.on('pause', handlePause)
  engine.value.on('resume', handleResume)

  engine.value.init()
  isEngineReady.value = true

  stateUpdateInterval = window.setInterval(syncGameState, 100)
  sessionSaveInterval = window.setInterval(saveGameSession, 5000)

  loadLevel(props.levelId)
}

const loadLevel = (levelId: number) => {
  if (!engine.value) return

  const levelData = getLevelById(levelId)
  if (!levelData) {
    console.error(`未找到关卡: ${levelId}`)
    return
  }

  const savedSession = gameStore.loadGameSession()
  const shouldRestoreSession = savedSession && savedSession.levelId === levelId.toString()

  if (!shouldRestoreSession) {
    gameStore.clearGameSession()
  }

  gameStore.resetLevelState()
  gameStore.selectLevel(levelId.toString())
  gameStore.changeScene('playing')
  gameStore.gameState.totalCollectibles = levelData.collectibles.length
  gameStore.gameState.shadowState = 'light'

  engine.value.loadLevel(levelData as any)
  
  if (shouldRestoreSession) {
    engine.value.restoreGameSession(savedSession)
  }

  engine.value.startGame()

  currentShadowState.value = engine.value.getPlayer()?.shadowState ?? 'light'
}

const pauseGame = () => {
  engine.value?.pause()
}

const resumeGame = () => {
  engine.value?.resume()
}

const restartLevel = () => {
  engine.value?.restartLevel()
  gameStore.resetLevelState()
  gameStore.changeScene('playing')
}

const exitToMenu = () => {
  engine.value?.setScene('menu')
  gameStore.changeScene('menu')
  router.push('/')
}

const exitToLevelSelect = () => {
  engine.value?.setScene('levelSelect')
  gameStore.changeScene('levelSelect')
  router.push('/levels')
}

watch(() => props.levelId, (newLevelId) => {
  if (isEngineReady.value) {
    loadLevel(newLevelId)
  }
})

watch(() => gameStore.gameState.isPaused, (isPaused) => {
  if (!engine.value) return
  const enginePaused = engine.value.getGameState().isPaused
  if (isPaused !== enginePaused) {
    if (isPaused) {
      engine.value.pause()
    } else {
      engine.value.resume()
    }
  }
})

onMounted(() => {
  initEngine()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  if (stateUpdateInterval !== null) {
    clearInterval(stateUpdateInterval)
    stateUpdateInterval = null
  }

  if (sessionSaveInterval !== null) {
    clearInterval(sessionSaveInterval)
    sessionSaveInterval = null
  }

  if (engine.value) {
    saveGameSession()
    engine.value.off('levelComplete', handleLevelComplete)
    engine.value.off('gameOver', handleGameOver)
    engine.value.off('pause', handlePause)
    engine.value.off('resume', handleResume)
    engine.value.destroy()
    engine.value = null
  }

  isEngineReady.value = false
})

defineExpose({
  pauseGame,
  resumeGame,
  restartLevel,
  exitToMenu,
  exitToLevelSelect,
  currentShadowState
})
</script>

<template>
  <div
    ref="containerRef"
    class="game-canvas-container relative w-full h-full overflow-hidden bg-black"
  >
    <canvas
      ref="canvasRef"
      class="game-canvas block"
      :width="canvasSize.width"
      :height="canvasSize.height"
    />
  </div>
</template>

<style scoped>
.game-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #0d0620;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
