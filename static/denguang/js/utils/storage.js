const STORAGE_KEYS = {
  GAME_STATE: 'dg_game_state',
  HIGH_SCORES: 'dg_high_scores',
  UNLOCKED_EQUIPMENT: 'dg_unlocked_equipment',
  SETTINGS: 'dg_settings'
}

const STORAGE = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (e) {
      console.warn('Storage get error:', e)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn('Storage set error:', e)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.warn('Storage remove error:', e)
      return false
    }
  },

  saveGameState(state) {
    return this.set(STORAGE_KEYS.GAME_STATE, state)
  },

  loadGameState() {
    return this.get(STORAGE_KEYS.GAME_STATE)
  },

  saveHighScore(sceneId, genreId, score) {
    const scores = this.get(STORAGE_KEYS.HIGH_SCORES, {})
    const key = `${sceneId}_${genreId}`
    if (!scores[key] || scores[key] < score) {
      scores[key] = score
      this.set(STORAGE_KEYS.HIGH_SCORES, scores)
      return true
    }
    return false
  },

  getHighScore(sceneId, genreId) {
    const scores = this.get(STORAGE_KEYS.HIGH_SCORES, {})
    const key = `${sceneId}_${genreId}`
    return scores[key] || 0
  },

  getAllHighScores() {
    return this.get(STORAGE_KEYS.HIGH_SCORES, {})
  },

  unlockEquipment(equipmentId) {
    const unlocked = this.get(STORAGE_KEYS.UNLOCKED_EQUIPMENT, [])
    if (!unlocked.includes(equipmentId)) {
      unlocked.push(equipmentId)
      this.set(STORAGE_KEYS.UNLOCKED_EQUIPMENT, unlocked)
      return true
    }
    return false
  },

  isEquipmentUnlocked(equipmentId) {
    const unlocked = this.get(STORAGE_KEYS.UNLOCKED_EQUIPMENT, [])
    return unlocked.includes(equipmentId)
  },

  getUnlockedEquipment() {
    return this.get(STORAGE_KEYS.UNLOCKED_EQUIPMENT, [])
  },

  saveSettings(settings) {
    return this.set(STORAGE_KEYS.SETTINGS, settings)
  },

  loadSettings() {
    return this.get(STORAGE_KEYS.SETTINGS)
  }
}

window.STORAGE = STORAGE
