var Storage = (function () {

  var KEY = CONFIG.GAME.storageKey;
  var DEFAULT_STATE = {
    settings: {
      characterId: CONFIG.GAME.defaultCharacter,
      themeId: CONFIG.GAME.defaultTheme,
      difficulty: CONFIG.GAME.defaultDifficulty,
      aiCount: CONFIG.GAME.defaultAiCount
    },
    bestRecords: [],
    lastGame: null
  };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return deepClone(DEFAULT_STATE);
      var data = JSON.parse(raw);
      return Object.assign(deepClone(DEFAULT_STATE), data);
    } catch (e) {
      console.warn('Storage load failed, using defaults', e);
      return deepClone(DEFAULT_STATE);
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Storage save failed', e);
      return false;
    }
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      console.warn('Storage clear failed', e);
    }
  }

  function addRecord(record) {
    var state = load();
    state.bestRecords.push(record);
    state.bestRecords.sort(function (a, b) {
      return b.score - a.score;
    });
    if (state.bestRecords.length > 10) {
      state.bestRecords = state.bestRecords.slice(0, 10);
    }
    save(state);
    return state.bestRecords;
  }

  function getRecords() {
    var state = load();
    return state.bestRecords || [];
  }

  function saveSettings(settings) {
    var state = load();
    state.settings = Object.assign({}, state.settings, settings);
    save(state);
  }

  function getSettings() {
    var state = load();
    return state.settings || {};
  }

  function saveLastGame(gameState) {
    var state = load();
    state.lastGame = gameState;
    save(state);
  }

  function getLastGame() {
    var state = load();
    return state.lastGame || null;
  }

  function clearLastGame() {
    var state = load();
    state.lastGame = null;
    save(state);
  }

  return {
    load: load,
    save: save,
    clear: clear,
    addRecord: addRecord,
    getRecords: getRecords,
    saveSettings: saveSettings,
    getSettings: getSettings,
    saveLastGame: saveLastGame,
    getLastGame: getLastGame,
    clearLastGame: clearLastGame
  };

})();
