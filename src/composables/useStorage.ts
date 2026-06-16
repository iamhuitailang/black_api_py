
import { GAME_CONFIG } from '../data/characters'

export interface PlayerSaveData {
  characterId: string
  hp: number
  maxHp: number
  energy: number
  x: number
  y: number
  facing: number
}

export interface GameSaveData {
  phase: 'select' | 'battle' | 'result'
  round: number
  p1Score: number
  p2Score: number
  timer: number
  p1: PlayerSaveData
  p2: PlayerSaveData
  winner: string | null
  savedAt: number
}

export function useStorage() {
  function saveGame(data: GameSaveData) {
    try {
      localStorage.setItem(GAME_CONFIG.STORAGE_KEY, JSON.stringify({
        ...data,
        savedAt: Date.now()
      }))
    } catch (e) {
      console.warn('Save failed:', e)
    }
  }

  function loadGame(): GameSaveData | null {
    try {
      const raw = localStorage.getItem(GAME_CONFIG.STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw) as GameSaveData
      return data
    } catch (e) {
      console.warn('Load failed:', e)
      return null
    }
  }

  function clearSave() {
    try {
      localStorage.removeItem(GAME_CONFIG.STORAGE_KEY)
    } catch (e) {
      // ignore
    }
  }

  function hasValidSave(): boolean {
    const data = loadGame()
    if (!data) return false
    // 存档有效期：24小时内有效，或者处于战斗中/选择阶段
    const now = Date.now()
    return now - data.savedAt < 24 * 60 * 60 * 1000
  }

  return { saveGame, loadGame, clearSave, hasValidSave }
}
