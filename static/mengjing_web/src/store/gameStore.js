import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  const playerName = ref('梦境旅人')
  const currentPatientId = ref(null)
  const currentRoomId = ref(null)
  const collectedMemories = ref({})
  const solvedPuzzles = ref({})
  const patientProgress = ref({})
  const unlockedEndings = ref({})
  const dreamDepth = ref(0)
  const gameStarted = ref(false)

  const _loadFromStorage = () => {
    const raw = localStorage.getItem('dreamTraveler_save')
    if (raw) {
      try {
        const data = JSON.parse(raw)
        playerName.value = data.playerName || '梦境旅人'
        collectedMemories.value = data.collectedMemories || {}
        solvedPuzzles.value = data.solvedPuzzles || {}
        patientProgress.value = data.patientProgress || {}
        unlockedEndings.value = data.unlockedEndings || {}
        gameStarted.value = data.gameStarted || false
        currentPatientId.value = data.currentPatientId || null
        currentRoomId.value = data.currentRoomId || null
      } catch (e) {
        console.error('存档数据损坏', e)
      }
    }
  }

  _loadFromStorage()

  const initPatientProgress = (patientId) => {
    if (!patientProgress.value[patientId]) {
      patientProgress.value[patientId] = {
        currentRoom: 'entrance',
        dreamPhase: 1,
        trustLevel: 0,
        fearLevel: 50,
        choices: [],
        unlockedRooms: ['entrance']
      }
    }
  }

  const enterDream = (patientId) => {
    currentPatientId.value = patientId
    initPatientProgress(patientId)
    dreamDepth.value = 1
    saveGame()
  }

  const resetDream = (patientId) => {
    patientProgress.value[patientId] = {
      currentRoom: 'entrance',
      dreamPhase: 1,
      trustLevel: 0,
      fearLevel: 50,
      choices: [],
      unlockedRooms: ['entrance']
    }
    collectedMemories.value[patientId] = []
    solvedPuzzles.value[patientId] = []
    currentPatientId.value = patientId
    currentRoomId.value = null
    dreamDepth.value = 1
    saveGame()
  }

  const exitDream = () => {
    currentPatientId.value = null
    currentRoomId.value = null
    dreamDepth.value = 0
    saveGame()
  }

  const enterRoom = (roomId) => {
    if (currentPatientId.value) {
      currentRoomId.value = roomId
      patientProgress.value[currentPatientId.value].currentRoom = roomId
      dreamDepth.value = Math.min(dreamDepth.value + 0.5, 5)
      saveGame()
    }
  }

  const collectMemory = (patientId, memoryId) => {
    if (!collectedMemories.value[patientId]) {
      collectedMemories.value[patientId] = []
    }
    if (!collectedMemories.value[patientId].includes(memoryId)) {
      collectedMemories.value[patientId].push(memoryId)
      adjustTrust(patientId, 5)
      adjustFear(patientId, -5)
      advanceDreamPhase(patientId)
    }
  }

  const solvePuzzle = (patientId, puzzleId) => {
    if (!solvedPuzzles.value[patientId]) {
      solvedPuzzles.value[patientId] = []
    }
    if (!solvedPuzzles.value[patientId].includes(puzzleId)) {
      solvedPuzzles.value[patientId].push(puzzleId)
      adjustTrust(patientId, 10)
      adjustFear(patientId, -10)
      advanceDreamPhase(patientId)
    }
  }

  const adjustTrust = (patientId, amount) => {
    if (patientProgress.value[patientId]) {
      patientProgress.value[patientId].trustLevel = Math.max(0, Math.min(100,
        patientProgress.value[patientId].trustLevel + amount
      ))
    }
  }

  const adjustFear = (patientId, amount) => {
    if (patientProgress.value[patientId]) {
      patientProgress.value[patientId].fearLevel = Math.max(0, Math.min(100,
        patientProgress.value[patientId].fearLevel + amount
      ))
    }
  }

  const advanceDreamPhase = (patientId) => {
    const progress = patientProgress.value[patientId]
    if (!progress) return
    
    const memories = collectedMemories.value[patientId]?.length || 0
    const puzzles = solvedPuzzles.value[patientId]?.length || 0
    const totalProgress = memories + puzzles
    
    if (totalProgress >= 8 && progress.dreamPhase < 4) {
      progress.dreamPhase = 4
    } else if (totalProgress >= 5 && progress.dreamPhase < 3) {
      progress.dreamPhase = 3
    } else if (totalProgress >= 2 && progress.dreamPhase < 2) {
      progress.dreamPhase = 2
    }
  }

  const unlockRoom = (patientId, roomId) => {
    if (patientProgress.value[patientId]) {
      if (!patientProgress.value[patientId].unlockedRooms.includes(roomId)) {
        patientProgress.value[patientId].unlockedRooms.push(roomId)
      }
    }
  }

  const makeChoice = (patientId, choiceId) => {
    if (patientProgress.value[patientId]) {
      patientProgress.value[patientId].choices.push(choiceId)
    }
  }

  const unlockEnding = (patientId, endingId) => {
    if (!unlockedEndings.value[patientId]) {
      unlockedEndings.value[patientId] = []
    }
    if (!unlockedEndings.value[patientId].includes(endingId)) {
      unlockedEndings.value[patientId].push(endingId)
    }
  }

  const getPatientProgress = (patientId) => {
    return patientProgress.value[patientId] || null
  }

  const getCollectedMemories = (patientId) => {
    return collectedMemories.value[patientId] || []
  }

  const getSolvedPuzzles = (patientId) => {
    return solvedPuzzles.value[patientId] || []
  }

  const isMemoryCollected = (patientId, memoryId) => {
    return collectedMemories.value[patientId]?.includes(memoryId) || false
  }

  const isPuzzleSolved = (patientId, puzzleId) => {
    return solvedPuzzles.value[patientId]?.includes(puzzleId) || false
  }

  const isRoomUnlocked = (patientId, roomId) => {
    return patientProgress.value[patientId]?.unlockedRooms.includes(roomId) || false
  }

  const saveGame = () => {
    const saveData = {
      playerName: playerName.value,
      collectedMemories: collectedMemories.value,
      solvedPuzzles: solvedPuzzles.value,
      patientProgress: patientProgress.value,
      unlockedEndings: unlockedEndings.value,
      gameStarted: gameStarted.value,
      currentPatientId: currentPatientId.value,
      currentRoomId: currentRoomId.value
    }
    localStorage.setItem('dreamTraveler_save', JSON.stringify(saveData))
  }

  const loadGame = () => {
    const saveData = localStorage.getItem('dreamTraveler_save')
    if (saveData) {
      const data = JSON.parse(saveData)
      playerName.value = data.playerName || '梦境旅人'
      collectedMemories.value = data.collectedMemories || {}
      solvedPuzzles.value = data.solvedPuzzles || {}
      patientProgress.value = data.patientProgress || {}
      unlockedEndings.value = data.unlockedEndings || {}
      gameStarted.value = data.gameStarted || false
      currentPatientId.value = data.currentPatientId || null
      currentRoomId.value = data.currentRoomId || null
      return true
    }
    return false
  }

  const hasSaveData = computed(() => {
    return localStorage.getItem('dreamTraveler_save') !== null
  })

  const totalMemoriesCollected = computed(() => {
    return Object.values(collectedMemories.value).reduce((sum, arr) => sum + arr.length, 0)
  })

  const startGame = (name) => {
    playerName.value = name || '梦境旅人'
    gameStarted.value = true
    saveGame()
  }

  return {
    playerName,
    currentPatientId,
    currentRoomId,
    collectedMemories,
    solvedPuzzles,
    patientProgress,
    unlockedEndings,
    dreamDepth,
    gameStarted,
    hasSaveData,
    totalMemoriesCollected,
    enterDream,
    resetDream,
    exitDream,
    enterRoom,
    collectMemory,
    solvePuzzle,
    adjustTrust,
    adjustFear,
    unlockRoom,
    makeChoice,
    unlockEnding,
    getPatientProgress,
    getCollectedMemories,
    getSolvedPuzzles,
    isMemoryCollected,
    isPuzzleSolved,
    isRoomUnlocked,
    saveGame,
    loadGame,
    startGame
  }
})
