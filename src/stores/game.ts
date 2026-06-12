import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Difficulty, MapData } from '@/types/game'
import { MAPS, ITEMS } from '@/data/gameData'

export interface GameResult {
  rank: number
  maxSnowball: number
  coinsEarned: number
  expEarned: number
  isWin: boolean
  specialGuest?: string
}

export const useGameStore = defineStore('game', () => {
  const selectedMapId = ref<string>('ice_world')
  const selectedDifficulty = ref<Difficulty>('normal')
  const gameResult = ref<GameResult | null>(null)
  const isPaused = ref(false)
  const selectedItems = ref<string[]>(['speed_boots', 'shield', 'slow_slime'])
  const maxItemSlots = 4

  const selectedMap = ref<MapData>(MAPS[0])

  function setMap(mapId: string) {
    const map = MAPS.find(m => m.id === mapId)
    if (map) {
      selectedMapId.value = mapId
      selectedMap.value = map
    }
  }

  function setDifficulty(difficulty: Difficulty) {
    selectedDifficulty.value = difficulty
  }

  function setGameResult(result: GameResult) {
    gameResult.value = result
  }

  function clearGameResult() {
    gameResult.value = null
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function addSelectedItem(itemId: string) {
    if (selectedItems.value.length < maxItemSlots && !selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  }

  function removeSelectedItem(itemId: string) {
    const index = selectedItems.value.indexOf(itemId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }

  function getDifficultyName(diff: Difficulty): string {
    const names: Record<Difficulty, string> = {
      easy: '简单',
      normal: '普通',
      hard: '困难',
      expert: '专家'
    }
    return names[diff]
  }

  function getDifficultyColor(diff: Difficulty): string {
    const colors: Record<Difficulty, string> = {
      easy: 'bg-green-400',
      normal: 'bg-blue-400',
      hard: 'bg-orange-400',
      expert: 'bg-red-500'
    }
    return colors[diff]
  }

  return {
    selectedMapId,
    selectedMap,
    selectedDifficulty,
    gameResult,
    isPaused,
    selectedItems,
    maxItemSlots,
    setMap,
    setDifficulty,
    setGameResult,
    clearGameResult,
    togglePause,
    addSelectedItem,
    removeSelectedItem,
    getDifficultyName,
    getDifficultyColor
  }
})
