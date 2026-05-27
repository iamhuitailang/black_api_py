import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
  const playerName = ref(localStorage.getItem('playerName') || '玩家')
  const playerId = ref(parseInt(localStorage.getItem('playerId') || '1'))
  const currentScene = ref(localStorage.getItem('currentScene') || 'space')
  const gameMode = ref(localStorage.getItem('gameMode') || 'single')
  const isPaused = ref(false)
  const gameOver = ref(false)
  const winner = ref(null)

  function setPlayerName(name) {
    playerName.value = name
    localStorage.setItem('playerName', name)
  }

  function setPlayerId(id) {
    playerId.value = id
    localStorage.setItem('playerId', id.toString())
  }

  function setCurrentScene(scene) {
    currentScene.value = scene
    localStorage.setItem('currentScene', scene)
  }

  function setGameMode(mode) {
    gameMode.value = mode
    localStorage.setItem('gameMode', mode)
  }

  function setPaused(paused) {
    isPaused.value = paused
  }

  function setGameOver(over, winnerData = null) {
    gameOver.value = over
    winner.value = winnerData
  }

  function resetGame() {
    isPaused.value = false
    gameOver.value = false
    winner.value = null
  }

  return {
    playerName,
    playerId,
    currentScene,
    gameMode,
    isPaused,
    gameOver,
    winner,
    setPlayerName,
    setPlayerId,
    setCurrentScene,
    setGameMode,
    setPaused,
    setGameOver,
    resetGame
  }
})
