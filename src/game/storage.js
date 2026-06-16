const STORAGE_KEY = 'space_cleaner_save'

const DEFAULT_SAVE = {
  money: 0,
  upgrades: {
    engine: 0,
    fuel_tank: 0,
    armor: 0,
    pick_radius: 0
  },
  progress: {
    currentSystem: 0,
    currentZone: 0,
    zoneCompleted: [
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false]
    ]
  },
  collectionLog: [],
  totalCollected: {
    small_screw: 0,
    medium_panel: 0,
    large_wreck: 0,
    dangerous: 0,
    rare_part: 0
  },
  highScores: {}
}

export function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      return { ...DEFAULT_SAVE, ...data }
    }
  } catch (e) {
    console.warn('加载存档失败:', e)
  }
  return { ...DEFAULT_SAVE }
}

export function saveGame(gameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState))
    return true
  } catch (e) {
    console.warn('保存存档失败:', e)
    return false
  }
}

export function resetGame() {
  localStorage.removeItem(STORAGE_KEY)
  return { ...DEFAULT_SAVE }
}

export function addCollectionLog(logEntry, gameState) {
  const newLog = [...gameState.collectionLog, logEntry]
  if (newLog.length > 100) {
    newLog.shift()
  }
  return newLog
}
