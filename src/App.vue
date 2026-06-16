
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import CharacterSelect from './components/CharacterSelect.vue'
import BattleArena from './components/BattleArena.vue'
import GameResult from './components/GameResult.vue'
import { useGameEngine } from './composables/useGameEngine'
import { GAME_CONFIG } from './data/characters'

const {
  gameState,
  lastInputTime,
  startBattle,
  continueFromSave,
  stopGameLoop,
  restart,
  backToSelect,
  cleanup,
  checkIdleTimeout,
  hasValidSave,
  loadGame,
  autoSave
} = useGameEngine()

const isIdle = ref(false)
let idleCheckId: number | null = null

function handleSelect(player: 1 | 2, id: string) {
  if (player === 1) gameState.p1Selected = id
  else gameState.p2Selected = id
  autoSave()
}

function handleStart() {
  startBattle()
}

function handleContinue() {
  if (hasValidSave()) {
    const data = loadGame()
    if (data) continueFromSave(data)
  }
}

function handleClearSave() {
  if (confirm('确定要清除存档吗？')) {
    localStorage.removeItem(GAME_CONFIG.STORAGE_KEY)
    alert('存档已清除')
  }
}

function handleRestart() {
  restart()
}

function handleBack() {
  backToSelect()
}

function startIdleCheck() {
  idleCheckId = window.setInterval(() => {
    const idle = checkIdleTimeout()
    if (idle !== isIdle.value) {
      isIdle.value = idle
    }
  }, 3000)
}

const phase = computed(() => gameState.phase)

onMounted(() => {
  if (hasValidSave()) {
    const data = loadGame()
    if (data) {
      continueFromSave(data)
    }
  }
  startIdleCheck()
})

onUnmounted(() => {
  cleanup()
  if (idleCheckId !== null) clearInterval(idleCheckId)
})
</script>

<template>
  <div class="app-root">
    <CharacterSelect
      v-if="phase === 'select'"
      :p1-selected="gameState.p1Selected"
      :p2-selected="gameState.p2Selected"
      @select="handleSelect"
      @start="handleStart"
      @continue="handleContinue"
      @clear-save="handleClearSave"
    />
    <BattleArena
      v-else-if="phase === 'battle'"
      :p1="gameState.p1"
      :p2="gameState.p2"
      :round="gameState.round"
      :p1-score="gameState.p1Score"
      :p2-score="gameState.p2Score"
      :timer="gameState.timer"
      :particles="gameState.particles"
      :screen-shake="gameState.screenShake"
      :flash-color="gameState.flashColor"
      :flash-alpha="gameState.flashAlpha"
      :is-idle="isIdle"
    />
    <GameResult
      v-else-if="phase === 'result'"
      :winner-id="gameState.winner as string"
      :p1-score="gameState.p1Score"
      :p2-score="gameState.p2Score"
      :p1-selected="gameState.p1Selected"
      :p2-selected="gameState.p2Selected"
      @restart="handleRestart"
      @back="handleBack"
    />
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  width: 100%;
  background: #05060f;
}
</style>
