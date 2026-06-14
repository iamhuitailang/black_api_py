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
      const raw = localStorage.getItem(GameConfig.STORAGE_KEY);
      console.log('[Storage.load] Raw data from localStorage:', raw ? 'EXISTS' : 'NULL');
      if (!raw) {
        console.log('[Storage.load] No data found, returning defaults');
        return this.getDefaultSaveData();
      }
      const parsed = JSON.parse(raw);
      const result = Object.assign(this.getDefaultSaveData(), parsed);
      console.log('[Storage.load] Loaded successfully:', {
        highScore: result.highScore,
        totalFoodsEaten: result.totalFoodsEaten,
        unlockedSkins: result.unlockedSkins,
        currentSkin: result.currentSkin,
        hasLastGameState: !!result.lastGameState
      });
      return result;
    } catch (e) {
      console.error('[Storage.load] Failed to load save data:', e);
      console.warn('[Storage.load] Will return default data due to error');
      return this.getDefaultSaveData();
    }
  },

  save(data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(GameConfig.STORAGE_KEY, json);
      console.log('[Storage.save] Saved successfully. Data size:', json.length, 'bytes');
      return true;
    } catch (e) {
      console.error('[Storage.save] Failed to save data:', e);
      return false;
    }
  },

  updateHighScore(score) {
    console.log('[Storage.updateHighScore] Checking score:', score);
    const data = this.load();
    if (score > data.highScore) {
      console.log('[Storage.updateHighScore] New high score!', data.highScore, '→', score);
      data.highScore = score;
      this.save(data);
      return true;
    }
    console.log('[Storage.updateHighScore] Not a new high score. Current:', data.highScore);
    return false;
  },

  addFoodsEaten(count) {
    console.log('[Storage.addFoodsEaten] Adding', count, 'foods');
    const data = this.load();
    data.totalFoodsEaten += count;

    GameConfig.WORM_SKINS.forEach(skin => {
      if (data.totalFoodsEaten >= skin.unlockAt && !data.unlockedSkins.includes(skin.id)) {
        console.log('[Storage.addFoodsEaten] Unlocking skin:', skin.name);
        data.unlockedSkins.push(skin.id);
      }
    });

    this.save(data);
    console.log('[Storage.addFoodsEaten] New total:', data.totalFoodsEaten,
      'Unlocked skins:', data.unlockedSkins.length);
    return data;
  },

  setCurrentSkin(skinId) {
    console.log('[Storage.setCurrentSkin] Requesting skin:', skinId);
    const data = this.load();
    if (data.unlockedSkins.includes(skinId)) {
      data.currentSkin = skinId;
      this.save(data);
      console.log('[Storage.setCurrentSkin] Skin set successfully:', skinId);
      return true;
    }
    console.warn('[Storage.setCurrentSkin] Skin not unlocked:', skinId,
      'Available:', data.unlockedSkins);
    return false;
  },

  saveGameState(state) {
    try {
      console.log('[Storage.saveGameState] Saving game state...');
      const data = this.load();
      data.lastGameState = state;
      const success = this.save(data);
      if (success) {
        console.log('[Storage.saveGameState] Game state saved successfully. Score:',
          state?.score, 'Worm pos:',
          state?.worm?.x?.toFixed?.(1) || state?.worm?.x,
          state?.worm?.y?.toFixed?.(1) || state?.worm?.y);
      }
      return success;
    } catch (e) {
      console.error('[Storage.saveGameState] Failed:', e);
      return false;
    }
  },

  loadGameState() {
    try {
      const data = this.load();
      const state = data.lastGameState;
      console.log('[Storage.loadGameState] Loading game state:',
        state ? 'EXISTS' : 'NONE');
      if (state) {
        console.log('[Storage.loadGameState] Found saved state:', {
          score: state.score,
          foodsEaten: state.foodsEaten,
          savedAt: state.savedAt ? new Date(state.savedAt).toLocaleString() : 'unknown',
          hasWorm: !!state.worm,
          hasFood: !!state.food
        });
      }
      return state;
    } catch (e) {
      console.error('[Storage.loadGameState] Failed:', e);
      return null;
    }
  },

  clearGameState() {
    try {
      console.log('[Storage.clearGameState] Clearing saved game state');
      const data = this.load();
      data.lastGameState = null;
      this.save(data);
      return true;
    } catch (e) {
      console.error('[Storage.clearGameState] Failed:', e);
      return false;
    }
  },

  debugGetRaw() {
    return localStorage.getItem(GameConfig.STORAGE_KEY);
  },

  debugParse() {
    try {
      return JSON.parse(this.debugGetRaw());
    } catch (e) {
      return { error: e.message };
    }
  }
};
