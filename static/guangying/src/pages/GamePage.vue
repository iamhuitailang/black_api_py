<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore'
import GameCanvas from '@/components/GameCanvas.vue'
import GameHUD from '@/components/GameHUD.vue'
import PauseMenu from '@/components/PauseMenu.vue'
import ResultScreen from '@/components/ResultScreen.vue'
import type { LevelResult } from '@/game/engine'
import type { PlayerShadowState } from '@/entities/player'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

/** GameCanvas 引用 */
const gameCanvasRef = ref<InstanceType<typeof GameCanvas> | null>(null)

/** 当前关卡ID（数字类型） */
const levelIdNum = computed<number>(() => {
  const levelId = route.params.levelId as string
  return parseInt(levelId.replace('level_', ''), 10)
})

/** 是否显示暂停菜单 */
const showPauseMenu = computed<boolean>(() => {
  return gameStore.currentScene === 'paused'
})

/** 是否显示结算界面 */
const showResultScreen = computed<boolean>(() => {
  return gameStore.currentScene === 'victory' || gameStore.currentScene === 'gameOver'
})

/** 关卡完成回调 */
const handleLevelComplete = (result: LevelResult): void => {
  const levelId = route.params.levelId as string
  router.push(`/result/${levelId}`)
}

/** 游戏结束回调 */
const handleGameOver = (result: LevelResult): void => {
  const levelId = route.params.levelId as string
  router.push(`/result/${levelId}`)
}

/** 光影状态变化回调 */
const handleShadowStateChange = (state: PlayerShadowState): void => {
  console.log('光影状态变化:', state)
}

/** 监听游戏状态变化，自动跳转到结算页面 */
watch(
  () => gameStore.currentScene,
  (newScene) => {
    const levelId = route.params.levelId as string
    if (newScene === 'victory' || newScene === 'gameOver') {
      router.push(`/result/${levelId}`)
    }
  }
)

onMounted(() => {
  const levelId = route.params.levelId as string
  gameStore.selectLevel(levelId)
  gameStore.resetLevelState()
  gameStore.changeScene('playing')
})

onUnmounted(() => {
  if (gameStore.currentScene === 'playing' || gameStore.currentScene === 'paused') {
    gameStore.changeScene('menu')
  }
})
</script>

<template>
  <div class="w-full h-screen overflow-hidden bg-gray-900">
    <GameCanvas
      ref="gameCanvasRef"
      :level-id="levelIdNum"
      @level-complete="handleLevelComplete"
      @game-over="handleGameOver"
      @shadow-state-change="handleShadowStateChange"
    />

    <GameHUD v-if="gameStore.currentScene === 'playing'" />

    <PauseMenu v-if="showPauseMenu" />

    <ResultScreen v-if="showResultScreen" />
  </div>
</template>
