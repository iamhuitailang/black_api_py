const StorageService = {
  saveGame(gameState) {
    try {
      const data = JSON.stringify(gameState.toJSON());
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.SAVE, data);
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.VERSION, CONSTANTS.VERSION);
      eventBus.emit(CONSTANTS.EVENTS.GAME_SAVE, { success: true });
      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      eventBus.emit(CONSTANTS.EVENTS.GAME_SAVE, { success: false, error: e });
      return false;
    }
  },

  loadGame() {
    try {
      const data = localStorage.getItem(CONSTANTS.STORAGE_KEYS.SAVE);
      if (!data) return null;

      const version = localStorage.getItem(CONSTANTS.STORAGE_KEYS.VERSION);
      if (version && version !== CONSTANTS.VERSION) {
        console.warn('Save version mismatch, attempting to load anyway');
      }

      const parsed = JSON.parse(data);
      const gameState = GameState.fromJSON(parsed);
      eventBus.emit(CONSTANTS.EVENTS.GAME_LOAD, { success: true, gameState });
      return gameState;
    } catch (e) {
      console.error('Failed to load game:', e);
      eventBus.emit(CONSTANTS.EVENTS.GAME_LOAD, { success: false, error: e });
      return null;
    }
  },

  hasSave() {
    return localStorage.getItem(CONSTANTS.STORAGE_KEYS.SAVE) !== null;
  },

  deleteSave() {
    localStorage.removeItem(CONSTANTS.STORAGE_KEYS.SAVE);
    localStorage.removeItem(CONSTANTS.STORAGE_KEYS.VERSION);
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  },

  loadSettings() {
    try {
      const data = localStorage.getItem(CONSTANTS.STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load settings:', e);
      return null;
    }
  }
};
