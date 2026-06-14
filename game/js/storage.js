const Storage = {
  getDefaultSaveData() {
    return {
      highScore: 0,
      unlockedSkins: ['default'],
      totalFoodsEaten: 0,
      currentSkin: 'default',
      lastGameState: null
    };
  },

  load() {
    try {
      const data = localStorage.getItem(GameConfig.STORAGE_KEY);
      if (!data) {
        return this.getDefaultSaveData();
      }
      const parsed = JSON.parse(data);
      return Object.assign(this.getDefaultSaveData(), parsed);
    } catch (e) {
      console.warn('Failed to load save data:', e);
      return this.getDefaultSaveData();
    }
  },

  save(data) {
    try {
      localStorage.setItem(GameConfig.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Failed to save data:', e);
      return false;
    }
  },

  updateHighScore(score) {
    const data = this.load();
    if (score > data.highScore) {
      data.highScore = score;
      this.save(data);
      return true;
    }
    return false;
  },

  addFoodsEaten(count) {
    const data = this.load();
    data.totalFoodsEaten += count;
    GameConfig.WORM_SKINS.forEach(skin => {
      if (data.totalFoodsEaten >= skin.unlockAt && !data.unlockedSkins.includes(skin.id)) {
        data.unlockedSkins.push(skin.id);
      }
    });
    this.save(data);
    return data;
  },

  setCurrentSkin(skinId) {
    const data = this.load();
    if (data.unlockedSkins.includes(skinId)) {
      data.currentSkin = skinId;
      this.save(data);
      return true;
    }
    return false;
  },

  saveGameState(state) {
    const data = this.load();
    data.lastGameState = state;
    this.save(data);
  },

  loadGameState() {
    const data = this.load();
    return data.lastGameState;
  },

  clearGameState() {
    const data = this.load();
    data.lastGameState = null;
    this.save(data);
  }
};
