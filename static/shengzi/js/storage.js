const Storage = {
  saveHighScore(mode, difficulty, time) {
    const scores = this.getHighScores();
    const key = `${mode}_${difficulty}`;
    
    if (!scores[key] || time < scores[key]) {
      scores[key] = time;
      localStorage.setItem(Constants.STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
      return true;
    }
    return false;
  },
  
  getHighScores() {
    try {
      return JSON.parse(localStorage.getItem(Constants.STORAGE_KEYS.HIGH_SCORES)) || {};
    } catch (e) {
      return {};
    }
  },
  
  getHighScore(mode, difficulty) {
    const scores = this.getHighScores();
    return scores[`${mode}_${difficulty}`] || null;
  },
  
  saveGameState(state) {
    localStorage.setItem(Constants.STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
  },
  
  loadGameState() {
    try {
      return JSON.parse(localStorage.getItem(Constants.STORAGE_KEYS.GAME_STATE));
    } catch (e) {
      return null;
    }
  },
  
  clearGameState() {
    localStorage.removeItem(Constants.STORAGE_KEYS.GAME_STATE);
  }
};
