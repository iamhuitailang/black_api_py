const StorageManager = {
  STORAGE_KEY: 'jianghu_leidai_game_state',

  saveGame(state) {
    try {
      const data = JSON.stringify(state);
      localStorage.setItem(this.STORAGE_KEY, data);
      return true;
    } catch (e) {
      console.error('保存游戏状态失败:', e);
      return false;
    }
  },

  loadGame() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error('加载游戏状态失败:', e);
      return null;
    }
  },

  save(state) {
    return this.saveGame(state);
  },

  load() {
    return this.loadGame();
  },

  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('清除游戏状态失败:', e);
      return false;
    }
  },

  hasSavedState() {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
