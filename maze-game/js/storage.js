class GameStorage {
  constructor() {
    this.storageKey = GameConstants.STORAGE_KEY;
  }

  save(gameState) {
    try {
      const data = {
        currentFloor: gameState.currentFloor,
        maxFloor: gameState.maxFloor,
        totalTime: gameState.totalTime,
        floorBestTimes: gameState.floorBestTimes,
        player: gameState.player ? gameState.player.toJSON() : null,
        maze: gameState.maze ? gameState.maze.toJSON() : null,
        keys: gameState.keys ? gameState.keys.map(k => ({ ...k })) : null,
        guards: gameState.guards ? gameState.guards.map(g => g.toJSON()) : null,
        fog: gameState.fog ? gameState.fog.toJSON() : null,
        floorStartTime: gameState.floorStartTime,
        savedAt: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;

      const data = JSON.parse(raw);
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  hasSave() {
    return localStorage.getItem(this.storageKey) !== null;
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }

  getMaxFloor() {
    const data = this.load();
    return data ? data.maxFloor : 0;
  }

  getTotalTime() {
    const data = this.load();
    return data ? data.totalTime : 0;
  }

  getFloorBestTimes() {
    const data = this.load();
    return data ? data.floorBestTimes || {} : {};
  }
}

if (typeof window !== 'undefined') {
  window.GameStorage = GameStorage;
}
