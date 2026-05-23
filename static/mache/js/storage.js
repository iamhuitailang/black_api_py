var Storage = (function() {
  function get(key, defaultValue) {
    try {
      var item = localStorage.getItem(key);
      if (item === null || item === undefined) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (e) {
      console.warn('Storage get error for key ' + key + ':', e);
      return defaultValue;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage set error for key ' + key + ':', e);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Storage remove error for key ' + key + ':', e);
      return false;
    }
  }

  function getHighScore() {
    return get(CONFIG.STATE_KEYS.HIGH_SCORE, 0);
  }

  function setHighScore(score) {
    var current = getHighScore();
    if (score > current) {
      set(CONFIG.STATE_KEYS.HIGH_SCORE, score);
      return true;
    }
    return false;
  }

  function getHighDistance() {
    return get(CONFIG.STATE_KEYS.HIGH_DISTANCE, 0);
  }

  function setHighDistance(distance) {
    var current = getHighDistance();
    if (distance > current) {
      set(CONFIG.STATE_KEYS.HIGH_DISTANCE, distance);
      return true;
    }
    return false;
  }

  function getSelectedCarriage() {
    return get(CONFIG.STATE_KEYS.SELECTED_CARRIAGE, 'wooden');
  }

  function setSelectedCarriage(carriageId) {
    return set(CONFIG.STATE_KEYS.SELECTED_CARRIAGE, carriageId);
  }

  function saveGameState(state) {
    return set(CONFIG.STATE_KEYS.GAME_STATE, state);
  }

  function loadGameState() {
    return get(CONFIG.STATE_KEYS.GAME_STATE, null);
  }

  function clearGameState() {
    return remove(CONFIG.STATE_KEYS.GAME_STATE);
  }

  return {
    get: get,
    set: set,
    remove: remove,
    getHighScore: getHighScore,
    setHighScore: setHighScore,
    getHighDistance: getHighDistance,
    setHighDistance: setHighDistance,
    getSelectedCarriage: getSelectedCarriage,
    setSelectedCarriage: setSelectedCarriage,
    saveGameState: saveGameState,
    loadGameState: loadGameState,
    clearGameState: clearGameState
  };
})();
