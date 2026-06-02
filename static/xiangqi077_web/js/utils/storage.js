const Storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  },

  saveGameState(gameId, state) {
    this.set('game_state_' + gameId, state);
  },
  getGameState(gameId) {
    return this.get('game_state_' + gameId);
  },
  removeGameState(gameId) {
    this.remove('game_state_' + gameId);
  },
  getAllGameStates() {
    const states = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('game_state_')) {
        states[key.replace('game_state_', '')] = this.get(key);
      }
    }
    return states;
  }
};

window.XiangqiStorage = Storage;
