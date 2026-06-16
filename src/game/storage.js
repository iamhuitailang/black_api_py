const STORAGE_KEY = 'space_cleaner_save_v1'

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
  highScores: {},
  savedAt: 0
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function validateAndFill(data) {
  const def = deepClone(DEFAULT_SAVE)
  
  if (typeof data.money === 'number' && !isNaN(data.money)) {
    def.money = data.money
  }
  
  if (data.upgrades && typeof data.upgrades === 'object') {
    for (const k of Object.keys(def.upgrades)) {
      if (typeof data.upgrades[k] === 'number' && !isNaN(data.upgrades[k])) {
        def.upgrades[k] = Math.max(0, data.upgrades[k])
      }
    }
  }
  
  if (data.progress && typeof data.progress === 'object') {
    if (typeof data.progress.currentSystem === 'number' && !isNaN(data.progress.currentSystem)) {
      def.progress.currentSystem = Math.max(0, Math.min(2, data.progress.currentSystem))
    }
    if (typeof data.progress.currentZone === 'number' && !isNaN(data.progress.currentZone)) {
      def.progress.currentZone = Math.max(0, Math.min(4, data.progress.currentZone))
    }
    
    if (Array.isArray(data.progress.zoneCompleted)) {
      for (let s = 0; s < 3; s++) {
        if (Array.isArray(data.progress.zoneCompleted[s])) {
          for (let z = 0; z < 5; z++) {
            def.progress.zoneCompleted[s][z] = !!data.progress.zoneCompleted[s][z]
          }
        }
      }
    }
  }
  
  if (Array.isArray(data.collectionLog)) {
    def.collectionLog = data.collectionLog.slice(-100)
  }
  
  if (data.totalCollected && typeof data.totalCollected === 'object') {
    for (const k of Object.keys(def.totalCollected)) {
      if (typeof data.totalCollected[k] === 'number' && !isNaN(data.totalCollected[k])) {
        def.totalCollected[k] = Math.max(0, data.totalCollected[k])
      }
    }
  }
  
  return def
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      console.log('[存档] 加载成功:', {
        money: data.money,
        system: data.progress?.currentSystem,
        zone: data.progress?.currentZone,
        savedAt: data.savedAt ? new Date(data.savedAt).toLocaleString() : '未知'
      })
      return validateAndFill(data)
    } else {
      console.log('[存档] 未找到存档，使用默认数据')
    }
  } catch (e) {
    console.error('[存档] 加载失败，使用默认数据:', e)
  }
  return deepClone(DEFAULT_SAVE)
}

export function saveGame(gameState) {
  try {
    const toSave = {
      money: gameState.money,
      upgrades: { ...gameState.upgrades },
      progress: {
        currentSystem: gameState.progress.currentSystem,
        currentZone: gameState.progress.currentZone,
        zoneCompleted: gameState.progress.zoneCompleted.map(arr => [...arr])
      },
      collectionLog: [...(gameState.collectionLog || [])],
      totalCollected: { ...(gameState.totalCollected || {}) },
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    console.log('[存档] 保存成功:', {
      money: toSave.money,
      system: toSave.progress.currentSystem,
      zone: toSave.progress.currentZone,
      time: new Date(toSave.savedAt).toLocaleString()
    })
    return true
  } catch (e) {
    console.error('[存档] 保存失败:', e)
    alert('存档保存失败！请检查浏览器存储设置')
    return false
  }
}

export function resetGame() {
  localStorage.removeItem(STORAGE_KEY)
  console.log('[存档] 已清除')
  return deepClone(DEFAULT_SAVE)
}

export function addCollectionLog(logEntry, gameState) {
  const newLog = [...gameState.collectionLog, logEntry]
  if (newLog.length > 100) {
    newLog.splice(0, newLog.length - 100)
  }
  return newLog
}
