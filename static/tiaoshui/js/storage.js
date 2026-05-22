const Storage = {
  KEYS: {
    GAME_STATE: 'diving_game_state',
    PLAYER_DATA: 'diving_player_data',
    HIGH_SCORE: 'diving_high_score'
  },

  save(key, data) {
    try {
      const jsonStr = JSON.stringify(data);
      localStorage.setItem(key, jsonStr);
      console.log('[Storage] 保存成功:', key);
      return true;
    } catch (e) {
      console.error('[Storage] 保存失败:', key, e);
      return false;
    }
  },

  load(key) {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        console.log('[Storage] 未找到数据:', key);
        return null;
      }
      const parsed = JSON.parse(data);
      console.log('[Storage] 加载成功:', key);
      return parsed;
    } catch (e) {
      console.error('[Storage] 加载失败:', key, e);
      return null;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  saveGameState(state) {
    return this.save(this.KEYS.GAME_STATE, state);
  },

  loadGameState() {
    return this.load(this.KEYS.GAME_STATE);
  },

  clearGameState() {
    return this.remove(this.KEYS.GAME_STATE);
  },

  savePlayerData(data) {
    return this.save(this.KEYS.PLAYER_DATA, data);
  },

  loadPlayerData() {
    return this.load(this.KEYS.PLAYER_DATA);
  },

  saveHighScore(score) {
    const current = this.load(this.KEYS.HIGH_SCORE) || 0;
    if (score > current) {
      return this.save(this.KEYS.HIGH_SCORE, score);
    }
    return false;
  },

  loadHighScore() {
    return this.load(this.KEYS.HIGH_SCORE) || 0;
  }
};
