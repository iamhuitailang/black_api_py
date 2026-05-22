var Storage = (function () {
  var PREFIX = 'motuo_stunt_';

  var KEYS = {
    BEST_SCORE: 'best_score',
    BEST_DISTANCE: 'best_distance',
    SETTINGS: 'settings',
    GAME_STATE: 'game_state'
  };

  function key(k) {
    return PREFIX + k;
  }

  function get(k, defaultValue) {
    try {
      var raw = localStorage.getItem(key(k));
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      return defaultValue;
    }
  }

  function set(k, value) {
    try {
      localStorage.setItem(key(k), JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set failed:', k, e);
    }
  }

  function remove(k) {
    try {
      localStorage.removeItem(key(k));
    } catch (e) {}
  }

  function getBestScore() {
    return get(KEYS.BEST_SCORE, 0);
  }

  function setBestScore(score) {
    var current = getBestScore();
    if (score > current) {
      set(KEYS.BEST_SCORE, score);
      return true;
    }
    return false;
  }

  function getBestDistance() {
    return get(KEYS.BEST_DISTANCE, 0);
  }

  function setBestDistance(dist) {
    var current = getBestDistance();
    if (dist > current) {
      set(KEYS.BEST_DISTANCE, dist);
      return true;
    }
    return false;
  }

  function getSettings() {
    return get(KEYS.SETTINGS, {
      bikeId: 'light',
      themeId: 'city',
      levelId: 'level1'
    });
  }

  function setSettings(settings) {
    set(KEYS.SETTINGS, settings);
  }

  function saveGameState(state) {
    set(KEYS.GAME_STATE, state);
  }

  function getGameState() {
    return get(KEYS.GAME_STATE, null);
  }

  function clearGameState() {
    remove(KEYS.GAME_STATE);
  }

  return {
    get: get,
    set: set,
    remove: remove,
    getBestScore: getBestScore,
    setBestScore: setBestScore,
    getBestDistance: getBestDistance,
    setBestDistance: setBestDistance,
    getSettings: getSettings,
    setSettings: setSettings,
    saveGameState: saveGameState,
    getGameState: getGameState,
    clearGameState: clearGameState
  };
})();
