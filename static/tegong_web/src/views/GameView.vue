<template>
  <div class="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
    <canvas ref="canvasRef" 
            :width="canvasWidth" 
            :height="canvasHeight"
            class="block border-2 border-yellow-600">
    </canvas>

    <GameHUD 
      :health="playerHealth"
      :maxHealth="playerMaxHealth"
      :energy="playerEnergy"
      :maxEnergy="playerMaxEnergy"
      :levelName="levelName"
      :skills="displaySkills"
      :getSkillCooldown="getSkillCooldown"
    />

    <PauseMenu 
      v-if="isPaused"
      @resume="resumeGame"
      @restart="restartLevel"
      @levelSelect="goToLevelSelect"
      @mainMenu="goToMainMenu"
    />

    <div v-if="showScrollNotification" 
         class="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-50 panel-border p-6 text-center animate-float">
      <div class="text-4xl mb-2">📜</div>
      <h3 class="font-wuxia text-2xl text-yellow-500 mb-2">获得新技能！</h3>
      <p class="text-white text-xl">{{ scrollNotificationName }}</p>
    </div>

    <div v-if="isLevelComplete" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div class="panel-border p-10 text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="font-wuxia text-5xl text-yellow-500 mb-4">关卡完成！</h2>
        <p class="text-white text-xl mb-8">{{ levelName }} 通关成功</p>
        
        <div class="flex flex-col gap-4">
          <button v-if="hasNextLevel" @click="nextLevel" class="btn-gold">
            下一关
          </button>
          <button @click="restartLevel" class="btn-gold">
            再玩一次
          </button>
          <button @click="goToLevelSelect" class="btn-gold">
            关卡选择
          </button>
          <button @click="goToMainMenu" class="btn-gold">
            返回主菜单
          </button>
        </div>
      </div>
    </div>

    <div v-if="isGameOver" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div class="panel-border p-10 text-center">
        <div class="text-6xl mb-4">💀</div>
        <h2 class="font-wuxia text-5xl text-red-500 mb-4">任务失败</h2>
        <p class="text-white text-xl mb-8">特工已阵亡</p>
        
        <div class="flex flex-col gap-4">
          <button @click="restartLevel" class="btn-gold">
            重新挑战
          </button>
          <button @click="goToLevelSelect" class="btn-gold">
            关卡选择
          </button>
          <button @click="goToMainMenu" class="btn-gold">
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { GameEngine } from '../game/Engine.js'
import { getLevelInfo, LEVEL_INFO } from '../game/levels/index.js'
import GameHUD from '../components/GameHUD.vue'
import PauseMenu from '../components/PauseMenu.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const canvasRef = ref(null)
const canvasWidth = ref(1200)
const canvasHeight = ref(600)

const playerHealth = ref(100)
const playerMaxHealth = ref(100)
const playerEnergy = ref(100)
const playerMaxEnergy = ref(100)
const learnedSkills = ref([])

const isPaused = computed(() => gameStore.isPaused)
const isLevelComplete = computed(() => gameStore.isLevelComplete)
const isGameOver = computed(() => gameStore.isGameOver)

const levelId = computed(() => parseInt(route.params.levelId))
const levelName = computed(() => getLevelInfo(levelId.value)?.name || '')
const hasNextLevel = computed(() => levelId.value < LEVEL_INFO.length)

const showScrollNotification = ref(false)
const scrollNotificationName = ref('')

let engine = null

const displaySkills = computed(() => {
  return learnedSkills.value.slice(0, 4).map((skill, index) => ({
    ...skill,
    key: ['K', 'U', 'I', 'O'][index] || ''
  }))
})

function getSkillCooldown(skillId) {
  return engine?.getSkillCooldown(skillId) || 0
}

onMounted(() => {
  initGame()
  window.addEventListener('resize', handleResize)
  handleResize()
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('resize', handleResize)
})

watch(levelId, () => {
  restartLevel()
})

function handleResize() {
  const maxWidth = Math.min(window.innerWidth - 40, 1400)
  const maxHeight = Math.min(window.innerHeight - 40, 700)
  
  const ratio = 1200 / 600
  if (maxWidth / maxHeight > ratio) {
    canvasHeight.value = maxHeight
    canvasWidth.value = maxHeight * ratio
  } else {
    canvasWidth.value = maxWidth
    canvasHeight.value = maxWidth / ratio
  }
}

function initGame() {
  if (!canvasRef.value) return

  gameStore.resetLevelState()

  const snapshot = gameStore.snapshot
  const shouldRestore = snapshot && snapshot.timestamp && (Date.now() - snapshot.timestamp < 300000)

  engine = new GameEngine(canvasRef.value, {
    onScrollCollected: handleScrollCollected,
    onLevelComplete: handleLevelComplete,
    onPlayerDeath: handlePlayerDeath,
    onPlayerHealthChange: (health, maxHealth) => {
      playerHealth.value = health
      playerMaxHealth.value = maxHealth
      gameStore.updatePlayerHealth(health)
    },
    onPlayerEnergyChange: (energy, maxEnergy) => {
      playerEnergy.value = energy
      playerMaxEnergy.value = maxEnergy
      gameStore.updatePlayerEnergy(energy)
    },
    onPauseToggle: (paused) => {
      if (gameStore.isPaused !== paused) {
        gameStore.setPaused(paused)
      }
    },
    onSnapshotSave: (data) => {
      gameStore.saveSnapshot(data)
    }
  })

  const learnedSkillsFromStore = gameStore.player.learnedSkills
  const restoreSnapshot = shouldRestore ? snapshot : null
  engine.loadLevel(levelId.value, learnedSkillsFromStore, restoreSnapshot)

  if (shouldRestore) {
    playerHealth.value = snapshot.health
    playerEnergy.value = snapshot.energy
    gameStore.clearSnapshot()
  } else {
    playerHealth.value = gameStore.player.health
    playerEnergy.value = gameStore.player.energy
  }
  playerMaxHealth.value = gameStore.player.maxHealth
  playerMaxEnergy.value = gameStore.player.maxEnergy
  
  updateLearnedSkills()
  engine.start()
}

function updateLearnedSkills() {
  if (engine) {
    learnedSkills.value = engine.getLearnedSkills()
  }
}

function handleScrollCollected(scroll) {
  gameStore.collectScroll(levelId.value, scroll.id)
  gameStore.learnSkill(scroll.skillId)
  
  scrollNotificationName.value = scroll.skillName
  showScrollNotification.value = true
  
  setTimeout(() => {
    showScrollNotification.value = false
  }, 2500)

  updateLearnedSkills()
}

function handleLevelComplete() {
  if (engine) {
    engine.stop()
  }
  gameStore.setLevelComplete(true)
  
  if (hasNextLevel.value) {
    gameStore.unlockLevel(levelId.value + 1)
    gameStore.setCurrentLevel(levelId.value + 1)
  }
  
  gameStore.restorePlayerStats()
  gameStore.clearSnapshot()
  gameStore.saveGame()
}

function handlePlayerDeath() {
  if (engine) {
    engine.stop()
  }
  gameStore.setGameOver(true)
  gameStore.clearSnapshot()
}

function resumeGame() {
  gameStore.setPaused(false)
  if (engine) {
    engine.setPaused(false)
  }
}

function restartLevel() {
  cleanup()
  gameStore.restorePlayerStats()
  gameStore.resetLevelState()
  gameStore.clearSnapshot()
  setTimeout(() => initGame(), 100)
}

function nextLevel() {
  if (hasNextLevel.value) {
    router.push(`/game/${levelId.value + 1}`)
  }
}

function goToLevelSelect() {
  cleanup()
  gameStore.saveGame()
  router.push('/level-select')
}

function goToMainMenu() {
  cleanup()
  gameStore.saveGame()
  router.push('/')
}

function cleanup() {
  if (engine) {
    if (engine.player && engine.player.isGrounded && engine.player.health > 0) {
      gameStore.saveSnapshot({
        x: engine.player.x,
        y: engine.player.y,
        health: engine.player.health,
        energy: engine.player.energy,
        velocityX: 0,
        velocityY: 0,
        facingRight: engine.player.facingRight
      })
    }
    engine.stop()
    engine = null
  }
}

watch(isPaused, (paused) => {
  if (engine && engine.isPaused !== paused) {
    engine.setPaused(paused)
  }
})
</script>
