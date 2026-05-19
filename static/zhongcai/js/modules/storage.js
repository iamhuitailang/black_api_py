const Storage = {
  save(gameState) {
    try {
      const saveData = {
        state: gameState.state,
        plots: gameState.plots,
        inventory: gameState.inventory,
        crops: gameState.crops,
        savedAt: Date.now()
      };
      localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error('保存游戏失败:', e);
      return false;
    }
  },

  load() {
    try {
      const saved = localStorage.getItem(Config.STORAGE_KEY);
      if (!saved) return null;
      const data = JSON.parse(saved);
      return data;
    } catch (e) {
      console.error('加载游戏失败:', e);
      return null;
    }
  },

  clear() {
    try {
      localStorage.removeItem(Config.STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('清除存档失败:', e);
      return false;
    }
  },

  hasSave() {
    return localStorage.getItem(Config.STORAGE_KEY) !== null;
  }
};

window.Storage = Storage;
