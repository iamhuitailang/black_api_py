var Storage = (function() {
  var KEYS = {
    HIGH_SCORE: 'tuzi_high_score',
    HIGH_LEVEL: 'tuzi_high_level',
    GAME_STATE: 'tuzi_game_state',
    SETTINGS: 'tuzi_settings'
  };

  function safeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function getHighScore() {
    return safeGet(KEYS.HIGH_SCORE, 0);
  }

  function setHighScore(score) {
    var current = getHighScore();
    if (score > current) {
      safeSet(KEYS.HIGH_SCORE, score);
      return true;
    }
    return false;
  }

  function getHighLevel() {
    return safeGet(KEYS.HIGH_LEVEL, 1);
  }

  function setHighLevel(level) {
    var current = getHighLevel();
    if (level > current) {
      safeSet(KEYS.HIGH_LEVEL, level);
      return true;
    }
    return false;
  }

  function saveGameState(state) {
    var data = {};
    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        data[key] = state[key];
      }
    }
    data.timestamp = Date.now();
    safeSet(KEYS.GAME_STATE, data);
  }

  function loadGameState() {
    var data = safeGet(KEYS.GAME_STATE, null);
    if (!data) return null;
    if (!data.hatTypes || !data.level || data.hp == null || data.timeLeft == null) {
      clearGameState();
      return null;
    }
    if (typeof data.timeLeft !== 'number' || isNaN(data.timeLeft) || data.timeLeft <= 0) {
      clearGameState();
      return null;
    }
    var elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
    data.timeLeft = Math.max(0, data.timeLeft - elapsed);
    if (data.timeLeft <= 0) {
      clearGameState();
      return null;
    }
    return data;
  }

  function clearGameState() {
    try { localStorage.removeItem(KEYS.GAME_STATE); } catch (e) {}
  }

  function saveSettings(settings) {
    safeSet(KEYS.SETTINGS, settings);
  }

  function loadSettings() {
    return safeGet(KEYS.SETTINGS, { soundEnabled: true });
  }

  return {
    getHighScore: getHighScore,
    setHighScore: setHighScore,
    getHighLevel: getHighLevel,
    setHighLevel: setHighLevel,
    saveGameState: saveGameState,
    loadGameState: loadGameState,
    clearGameState: clearGameState,
    saveSettings: saveSettings,
    loadSettings: loadSettings
  };
})();
