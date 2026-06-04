import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'tegong_game_save_v4'

const DEFAULT_STATE = {
  currentLevel: 1,
  unlockedLevels: [1],
  player: {
    maxHealth: 100,
    health: 100,
    maxEnergy: 100,
    energy: 100,
    learnedSkills: ['shadow_strike']
  },
  collectedScrolls: {},
  snapshot: null
}

function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed) {
        console.log('[Store] loadGameState loaded:', JSON.stringify(parsed).slice(0, 200))
        return { ...DEFAULT_STATE, ...parsed }
      }
    }
  } catch (e) {
    console.error('[Store] loadGameState error:', e)
  }
  console.log('[Store] loadGameState: using default')
  return JSON.parse(JSON.stringify(DEFAULT_STATE))
}

function saveGameState(state) {
  try {
    const toSave = {
      currentLevel: state.currentLevel,
      unlockedLevels: [...state.unlockedLevels],
      player: { ...state.player },
      collectedScrolls: JSON.parse(JSON.stringify(state.collectedScrolls)),
      snapshot: state.snapshot ? { ...state.snapshot } : null
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return true
  } catch (e) {
    console.error('[Store] saveGameState error:', e)
    return false
  }
}

export const useGameStore = defineStore('game', () => {
  const savedState = loadGameState()

  const currentLevel = ref(savedState.currentLevel)
  const unlockedLevels = ref(savedState.unlockedLevels)
  const player = ref({ ...DEFAULT_STATE.player, ...savedState.player })
  const collectedScrolls = ref(savedState.collectedScrolls || {})
  const snapshot = ref(savedState.snapshot || null)

  const isPaused = ref(false)
  const isGameOver = ref(false)
  const isLevelComplete = ref(false)

  const hasSave = computed(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null
    } catch (e) {
      return false
    }
  })

  let saveThrottleTimer = null
  let lastSaveTime = 0

  function save() {
    const now = Date.now()
    if (now - lastSaveTime < 500) {
      if (!saveThrottleTimer) {
        saveThrottleTimer = setTimeout(() => {
          saveThrottleTimer = null
          doSave()
        }, 500 - (now - lastSaveTime))
      }
      return
    }
    doSave()
  }

  function doSave() {
    lastSaveTime = Date.now()
    saveGameState({
      currentLevel: currentLevel.value,
      unlockedLevels: unlockedLevels.value,
      player: player.value,
      collectedScrolls: collectedScrolls.value,
      snapshot: snapshot.value
    })
  }

  function saveSnapshot(data) {
    snapshot.value = {
      x: data.x,
      y: data.y,
      health: data.health,
      energy: data.energy,
      velocityX: data.velocityX,
      velocityY: data.velocityY,
      facingRight: data.facingRight,
      timestamp: Date.now()
    }
    save()
  }

  function clearSnapshot() {
    snapshot.value = null
    save()
  }

  function startNewGame() {
    currentLevel.value = DEFAULT_STATE.currentLevel
    unlockedLevels.value = [...DEFAULT_STATE.unlockedLevels]
    player.value = { ...DEFAULT_STATE.player }
    collectedScrolls.value = {}
    snapshot.value = null
    isPaused.value = false
    isGameOver.value = false
    isLevelComplete.value = false
    doSave()
  }

  function continueGame() {
    const saved = loadGameState()
    currentLevel.value = saved.currentLevel
    unlockedLevels.value = saved.unlockedLevels
    player.value = { ...DEFAULT_STATE.player, ...saved.player }
    collectedScrolls.value = saved.collectedScrolls || {}
    snapshot.value = saved.snapshot || null
    isPaused.value = false
    isGameOver.value = false
    isLevelComplete.value = false
  }

  function setCurrentLevel(levelId) {
    currentLevel.value = levelId
    save()
  }

  function unlockLevel(levelId) {
    if (!unlockedLevels.value.includes(levelId)) {
      unlockedLevels.value.push(levelId)
      save()
    }
  }

  function updatePlayerHealth(health) {
    player.value.health = Math.max(0, Math.min(player.value.maxHealth, health))
    if (player.value.health <= 0) {
      isGameOver.value = true
    }
  }

  function updatePlayerEnergy(energy) {
    player.value.energy = Math.max(0, Math.min(player.value.maxEnergy, energy))
  }

  function restorePlayerStats() {
    player.value.health = player.value.maxHealth
    player.value.energy = player.value.maxEnergy
    save()
  }

  function learnSkill(skillId) {
    if (!player.value.learnedSkills.includes(skillId)) {
      player.value.learnedSkills.push(skillId)
      save()
    }
  }

  function collectScroll(levelId, scrollId) {
    if (!collectedScrolls.value[levelId]) {
      collectedScrolls.value[levelId] = []
    }
    if (!collectedScrolls.value[levelId].includes(scrollId)) {
      collectedScrolls.value[levelId].push(scrollId)
      save()
    }
  }

  function hasCollectedScroll(levelId, scrollId) {
    return collectedScrolls.value[levelId]?.includes(scrollId) || false
  }

  function setPaused(paused) {
    isPaused.value = paused
    if (paused) {
      save()
    }
  }

  function togglePaused() {
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      save()
    }
  }

  function setGameOver(over) {
    isGameOver.value = over
  }

  function setLevelComplete(complete) {
    isLevelComplete.value = complete
  }

  function resetLevelState() {
    isPaused.value = false
    isGameOver.value = false
    isLevelComplete.value = false
  }

  function saveGame() {
    doSave()
  }

  function clearSave() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('[Store] clearSave error:', e)
    }
    currentLevel.value = DEFAULT_STATE.currentLevel
    unlockedLevels.value = [...DEFAULT_STATE.unlockedLevels]
    player.value = { ...DEFAULT_STATE.player }
    collectedScrolls.value = {}
    snapshot.value = null
    resetLevelState()
  }

  return {
    currentLevel,
    unlockedLevels,
    player,
    collectedScrolls,
    snapshot,
    isPaused,
    isGameOver,
    isLevelComplete,
    hasSave,
    startNewGame,
    continueGame,
    setCurrentLevel,
    unlockLevel,
    updatePlayerHealth,
    updatePlayerEnergy,
    restorePlayerStats,
    learnSkill,
    collectScroll,
    hasCollectedScroll,
    setPaused,
    togglePaused,
    setGameOver,
    setLevelComplete,
    resetLevelState,
    saveGame,
    saveSnapshot,
    clearSnapshot,
    clearSave
  }
})
