<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Pause, Play, Home, RotateCcw, Trophy, Coins } from 'lucide-vue-next'
import { GameEngine, type GameState } from '@/game/GameEngine'
import { GameRenderer } from '@/game/GameRenderer'
import { Vector2 } from '@/game/utils'
import { usePlayerStore } from '@/stores/player'
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'
import { ITEMS } from '@/data/gameData'
import BaseModal from '@/components/BaseModal.vue'

const router = useRouter()
const playerStore = usePlayerStore()
const gameStore = useGameStore()
const { selectedMap, selectedDifficulty, selectedItems } = storeToRefs(gameStore)
const { player, levelInfo } = storeToRefs(playerStore)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameEngine = ref<GameEngine | null>(null)
const gameRenderer = ref<GameRenderer | null>(null)
const gameState = ref<GameState | null>(null)
const showPause = ref(false)
const showResult = ref(false)
const keys = ref<Set<string>>(new Set())

const formattedTime = computed(() => {
  if (!gameState.value) return '01:30'
  const time = Math.ceil(gameState.value.timeRemaining)
  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const playerRank = computed(() => {
  if (!gameState.value) return 1
  const rank = gameState.value.rankings.findIndex(r => r.isPlayer)
  return rank + 1
})

const playerSize = computed(() => {
  if (!gameState.value?.player) return 0
  return Math.round(gameState.value.player.getSnowballSize())
})

const rewardCoins = computed(() => {
  if (!gameState.value) return 0
  const rank = playerRank.value
  const base = 100
  const rankBonus = Math.max(0, (5 - rank) * 50)
  const sizeBonus = Math.floor(playerSize.value / 10)
  return base + rankBonus + sizeBonus
})

const rewardExp = computed(() => {
  if (!gameState.value) return 0
  return 50 + Math.floor(playerSize.value / 5)
})

const isWin = computed(() => {
  return gameState.value?.isPlayerWin || false
})

function handleKeyDown(e: KeyboardEvent) {
  keys.value.add(e.key.toLowerCase())
  
  if (e.key === 'Escape') {
    togglePause()
  }
  
  if (['1', '2', '3', '4'].includes(e.key)) {
    const index = parseInt(e.key) - 1
    useItem(index)
  }
}

function handleKeyUp(e: KeyboardEvent) {
  keys.value.delete(e.key.toLowerCase())
}

function getMoveDirection(): Vector2 {
  let dx = 0
  let dy = 0
  
  if (keys.value.has('w') || keys.value.has('arrowup')) dy -= 1
  if (keys.value.has('s') || keys.value.has('arrowdown')) dy += 1
  if (keys.value.has('a') || keys.value.has('arrowleft')) dx -= 1
  if (keys.value.has('d') || keys.value.has('arrowright')) dx += 1
  
  if (dx !== 0 && dy !== 0) {
    const factor = 1 / Math.sqrt(2)
    dx *= factor
    dy *= factor
  }
  
  return new Vector2(dx, dy)
}

function useItem(index: number) {
  if (!gameEngine.value || gameState.value?.status !== 'playing') return
  if (index >= selectedItems.value.length) return
  
  const itemId = selectedItems.value[index]
  const item = ITEMS.find(i => i.id === itemId)
  if (!item) return
  
  const count = player.value.unlocked.items[itemId] || 0
  if (count <= 0) return
  
  if (playerStore.useItem(itemId)) {
    if (gameState.value?.player) {
      applyItemToPlayer(itemId)
    }
  }
}

function applyItemToPlayer(itemId: string) {
  if (!gameState.value?.player) return
  const item = ITEMS.find(i => i.id === itemId)
  if (!item) return
  
  const hamster = gameState.value.player
  
  switch (item.effect.type) {
    case 'speed':
      hamster.addBuff({ type: 'speed', value: item.effect.value, duration: item.effect.duration || 5000 })
      break
    case 'shield':
      hamster.addBuff({ type: 'shield', value: 1, duration: item.effect.duration || 3000 })
      break
    case 'double':
      hamster.addBuff({ type: 'double_growth', value: item.effect.value, duration: item.effect.duration || 8000 })
      break
    case 'magnet':
      hamster.addBuff({ type: 'magnet', value: item.effect.value, duration: item.effect.duration || 6000 })
      break
  }
}

let animationFrameId = 0

function gameLoop() {
  if (!gameEngine.value || !gameRenderer.value) return
  
  const direction = getMoveDirection()
  if (gameState.value?.status === 'playing') {
    gameEngine.value.movePlayer(direction)
  }
  
  if (gameState.value && gameEngine.value) {
    gameRenderer.value.render(gameState.value, gameEngine.value.camera)
  }
  
  animationFrameId = requestAnimationFrame(gameLoop)
}

function togglePause() {
  if (!gameEngine.value) return
  
  if (gameState.value?.status === 'playing') {
    gameEngine.value.pause()
    showPause.value = true
  } else if (gameState.value?.status === 'paused') {
    gameEngine.value.resume()
    showPause.value = false
  }
}

function resumeGame() {
  if (gameEngine.value) {
    gameEngine.value.resume()
    showPause.value = false
  }
}

function quitGame() {
  if (gameEngine.value) {
    gameEngine.value.destroy()
  }
  router.push('/')
}

function restartGame() {
  showPause.value = false
  showResult.value = false
  initGame()
}

function finishGame(state: GameState) {
  showResult.value = true
  
  const win = state.isPlayerWin
  const maxSnowball = Math.round(state.player?.getSnowballSize() || 0)
  const coins = rewardCoins.value
  const exp = rewardExp.value
  
  playerStore.addCoins(coins)
  playerStore.addExp(exp)
  playerStore.updateStats(win, maxSnowball, coins)
}

function initGame() {
  if (!canvasRef.value) return
  
  const container = canvasRef.value.parentElement
  if (!container) return
  
  const width = container.clientWidth
  const height = container.clientHeight
  
  canvasRef.value.width = width
  canvasRef.value.height = height
  
  gameEngine.value = new GameEngine({
    mapId: selectedMap.value.id,
    difficulty: selectedDifficulty.value,
    playerSkin: player.value.equipped.hamsterSkin,
    playerName: player.value.nickname,
    selectedItems: selectedItems.value
  })
  
  gameRenderer.value = new GameRenderer(canvasRef.value)
  gameRenderer.value.resize(width, height)
  gameEngine.value.setCanvasSize(width, height)
  
  gameEngine.value.onUpdate((state) => {
    gameState.value = state
  })
  
  gameEngine.value.onFinish((state) => {
    finishGame(state)
  })
  
  gameEngine.value.start()
  gameLoop()
}

function handleResize() {
  if (!canvasRef.value || !gameRenderer.value || !gameEngine.value) return
  
  const container = canvasRef.value.parentElement
  if (!container) return
  
  const width = container.clientWidth
  const height = container.clientHeight
  
  canvasRef.value.width = width
  canvasRef.value.height = height
  gameRenderer.value.resize(width, height)
  gameEngine.value.setCanvasSize(width, height)
}

onMounted(() => {
  playerStore.loadPlayer()
  
  setTimeout(() => {
    initGame()
  }, 100)
  
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (gameEngine.value) {
    gameEngine.value.destroy()
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', handleResize)
})

function getItemEmoji(itemId: string): string {
  return ITEMS.find(i => i.id === itemId)?.emoji || '❓'
}

function getItemCount(itemId: string): number {
  return player.value.unlocked.items[itemId] || 0
}
</script>

<template>
  <div class="w-full h-full bg-gray-900 relative overflow-hidden">
    <div class="absolute inset-0">
      <canvas ref="canvasRef" class="w-full h-full"></canvas>
    </div>
    
    <div class="absolute top-0 left-0 right-0 p-4 pointer-events-none">
      <div class="max-w-4xl mx-auto flex items-start justify-between">
        <div class="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2 text-white pointer-events-auto">
          <div class="text-2xl font-bold font-mono">{{ formattedTime }}</div>
        </div>
        
        <div class="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2 text-white pointer-events-auto">
          <div class="text-sm text-gray-300">当前排名</div>
          <div class="text-xl font-bold">
            <span class="text-yellow-400">第 {{ playerRank }} 名</span>
            <span class="text-gray-400 text-sm"> / {{ gameState?.rankings.length || 0 }}</span>
          </div>
        </div>
        
        <button 
          @click="togglePause"
          class="bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-colors pointer-events-auto"
        >
          <Pause :size="24" />
        </button>
      </div>
    </div>
    
    <div class="absolute top-20 right-4 bg-black/40 backdrop-blur-md rounded-xl p-3 text-white min-w-[140px]">
      <div class="text-xs text-gray-300 mb-2">排行榜</div>
      <div class="space-y-1">
        <div 
          v-for="(rank, index) in (gameState?.rankings || []).slice(0, 5)" 
          :key="rank.id"
          class="flex items-center gap-2 text-sm"
          :class="rank.isPlayer ? 'text-yellow-400 font-bold' : 'text-gray-200'"
        >
          <span class="w-5 text-center">{{ index + 1 }}</span>
          <span class="flex-1 truncate">{{ rank.name }}</span>
          <span class="text-xs">{{ Math.round(rank.size) }}</span>
        </div>
      </div>
    </div>
    
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2">
      <div class="flex gap-3">
        <button
          v-for="(itemId, index) in selectedItems"
          :key="index"
          @click="useItem(index)"
          class="relative w-16 h-16 rounded-xl bg-black/50 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl hover:bg-black/70 hover:border-white/50 transition-all active:scale-95"
          :class="getItemCount(itemId) > 0 ? '' : 'opacity-50'"
        >
          {{ getItemEmoji(itemId) }}
          <div class="absolute -top-2 -left-2 w-6 h-6 bg-ice-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
            {{ index + 1 }}
          </div>
          <div class="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs px-1.5 rounded-full font-bold">
            {{ getItemCount(itemId) }}
          </div>
        </button>
      </div>
    </div>
    
    <div class="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 text-white">
      <div class="text-sm text-gray-300">我的雪球</div>
      <div class="text-2xl font-bold text-ice-400">{{ playerSize }}</div>
    </div>
    
    <div class="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 text-white text-xs">
      <div class="text-gray-300">操作提示</div>
      <div>WASD / 方向键 移动</div>
      <div>1-4 使用道具</div>
      <div>ESC 暂停</div>
    </div>
    
    <BaseModal :show="showPause" title="游戏暂停" @close="resumeGame">
      <div class="space-y-4">
        <button
          @click="resumeGame"
          class="w-full py-4 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all"
        >
          <Play :size="24" fill="white" />
          继续游戏
        </button>
        <button
          @click="restartGame"
          class="w-full py-4 rounded-xl bg-gradient-to-r from-ice-400 to-ice-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all"
        >
          <RotateCcw :size="24" />
          重新开始
        </button>
        <button
          @click="quitGame"
          class="w-full py-4 rounded-xl bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-300 transition-all"
        >
          <Home :size="24" />
          返回大厅
        </button>
      </div>
    </BaseModal>
    
    <BaseModal :show="showResult">
      <div class="text-center py-4">
        <div class="text-6xl mb-4">{{ isWin ? '🏆' : '😢' }}</div>
        <h2 class="text-2xl font-bold mb-2" :class="isWin ? 'text-yellow-500' : 'text-gray-600'">
          {{ isWin ? '恭喜获胜！' : '再接再厉！' }}
        </h2>
        <p class="text-gray-500 mb-6">第 {{ playerRank }} 名</p>
        
        <div class="bg-gray-50 rounded-2xl p-4 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-ice-500">{{ playerSize }}</div>
              <div class="text-sm text-gray-500">最大雪球</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-yellow-500">{{ rewardCoins }}</div>
              <div class="text-sm text-gray-500">获得金币</div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex items-center justify-center gap-2 text-purple-500">
              <span class="font-bold">+{{ rewardExp }} 经验</span>
              <span class="text-sm text-gray-400">Lv.{{ levelInfo.level }}</span>
            </div>
          </div>
        </div>
        
        <div class="space-y-3">
          <button
            @click="restartGame"
            class="w-full py-4 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-lg hover:shadow-lg transition-all"
          >
            再来一局
          </button>
          <button
            @click="quitGame"
            class="w-full py-4 rounded-xl bg-gray-200 text-gray-700 font-bold text-lg hover:bg-gray-300 transition-all"
          >
            返回大厅
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
