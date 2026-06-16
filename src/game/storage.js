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

function deepMerge(defaultObj, dataObj) {
  const result = { ...defaultObj }
  for (const key in dataObj) {
    if (dataObj[key] && typeof dataObj[key] === 'object' && !Array.isArray(dataObj[key])) {
      result[key] = deepMerge(defaultObj[key] || {}, dataObj[key])
    } else if (Array.isArray(dataObj[key]) && Array.isArray(defaultObj[key])) {
      result[key] = dataObj[key].length >= defaultObj[key].length 
        ? dataObj[key] 
        : [...dataObj[key], ...defaultObj[key].slice(dataObj[key].length)]
    } else {
      result[key] = dataObj[key]
    }
  }
  return result
}

export function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      const merged = deepMerge(DEFAULT_SAVE, data)
      if (!merged.progress.zoneCompleted || !Array.isArray(merged.progress.zoneCompleted)) {
        merged.progress.zoneCompleted = DEFAULT_SAVE.progress.zoneCompleted.map(arr => [...arr])
      } else {
        while (merged.progress.zoneCompleted.length < 3) {
          merged.progress.zoneCompleted.push([false, false, false, false, false])
        }
        for (let i = 0; i < merged.progress.zoneCompleted.length; i++) {
          if (!Array.isArray(merged.progress.zoneCompleted[i])) {
            merged.progress.zoneCompleted[i] = [false, false, false, false, false]
          } else {
            while (merged.progress.zoneCompleted[i].length < 5) {
              merged.progress.zoneCompleted[i].push(false)
            }
          }
        }
      }
      return merged
    }
  } catch (e) {
    console.warn('加载存档失败:', e)
  }
  return JSON.parse(JSON.stringify(DEFAULT_SAVE))
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
