import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const COMBO_MULTIPLIERS = [1, 2, 3, 5, 10] as const

export const useGameStore = defineStore('game', () => {
  const score = ref(0)
  const combo = ref(0)
  const highestCombo = ref(0)
  const ballsLeft = ref(5)
  const totalBalls = 5
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const isGameOver = ref(false)
  const lastGadgetType = ref<string | null>(null)
  const comboTimer = ref<number | null>(null)
  const multiplierActive = ref(false)
  const multiplierEndTime = ref(0)
  const scorePopups = ref<Array<{ id: number; x: number; y: number; score: number }>>([])

  const comboMultiplier = computed(() => {
    const idx = Math.min(combo.value, COMBO_MULTIPLIERS.length - 1)
    return COMBO_MULTIPLIERS[idx] || 1
  })

  const scoreMultiplier = computed(() => {
    if (multiplierActive.value && Date.now() < multiplierEndTime.value) {
      return 2
    }
    return 1
  })

  function startGame() {
    score.value = 0
    combo.value = 0
    highestCombo.value = 0
    ballsLeft.value = totalBalls
    isPlaying.value = true
    isPaused.value = false
    isGameOver.value = false
    lastGadgetType.value = null
    multiplierActive.value = false
    scorePopups.value = []
  }

  function addScore(baseScore: number, gadgetType: string, x: number, y: number) {
    if (!isPlaying.value) return

    const totalMultiplier = comboMultiplier.value * scoreMultiplier.value
    const actualScore = Math.floor(baseScore * totalMultiplier)
    score.value += actualScore

    const id = Date.now() + Math.random()
    scorePopups.value.push({ id, x, y, score: actualScore })
    setTimeout(() => {
      scorePopups.value = scorePopups.value.filter(p => p.id !== id)
    }, 1500)

    if (gadgetType !== lastGadgetType.value) {
      combo.value++
      if (combo.value > highestCombo.value) {
        highestCombo.value = combo.value
      }
      lastGadgetType.value = gadgetType

      if (comboTimer.value) {
        clearTimeout(comboTimer.value)
      }
      comboTimer.value = window.setTimeout(() => {
        combo.value = 0
        lastGadgetType.value = null
      }, 3000)
    }
  }

  function loseBall() {
    ballsLeft.value--
    combo.value = 0
    lastGadgetType.value = null
    if (comboTimer.value) {
      clearTimeout(comboTimer.value)
      comboTimer.value = null
    }
    if (ballsLeft.value <= 0) {
      isGameOver.value = true
      isPlaying.value = false
    }
  }

  function activateMultiplier(durationSec: number) {
    multiplierActive.value = true
    multiplierEndTime.value = Date.now() + durationSec * 1000
  }

  function pauseGame() {
    isPaused.value = true
  }

  function resumeGame() {
    isPaused.value = false
  }

  function resetCombo() {
    combo.value = 0
    lastGadgetType.value = null
    if (comboTimer.value) {
      clearTimeout(comboTimer.value)
      comboTimer.value = null
    }
  }

  return {
    score,
    combo,
    highestCombo,
    ballsLeft,
    totalBalls,
    isPlaying,
    isPaused,
    isGameOver,
    comboMultiplier,
    scoreMultiplier,
    multiplierActive,
    lastGadgetType,
    scorePopups,
    startGame,
    addScore,
    loseBall,
    activateMultiplier,
    pauseGame,
    resumeGame,
    resetCombo,
  }
})
