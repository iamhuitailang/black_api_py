var Storage = (function() {
  var KEY_PREFIX = 'juzhong_';
  var STATE_KEY = KEY_PREFIX + 'game_state';
  var RECORDS_KEY = KEY_PREFIX + 'records';
  var SETTINGS_KEY = KEY_PREFIX + 'settings';

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  }

  function load(key, defaultValue) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  }

  function saveGameState(state) {
    return save(STATE_KEY, state);
  }

  function loadGameState() {
    return load(STATE_KEY, null);
  }

  function clearGameState() {
    remove(STATE_KEY);
  }

  function saveRecords(records) {
    return save(RECORDS_KEY, records);
  }

  function loadRecords() {
    return load(RECORDS_KEY, {
      bestSnatch: 0,
      bestCleanJerk: 0,
      bestTotal: 0,
      bestScore: 0,
      opponentsBeaten: []
    });
  }

  function saveSettings(settings) {
    return save(SETTINGS_KEY, settings);
  }

  function loadSettings() {
    return load(SETTINGS_KEY, {
      soundEnabled: true,
      vibrationEnabled: true,
      showTutorial: true
    });
  }

  function updateRecord(type, value) {
    var records = loadRecords();
    var changed = false;
    if (type === 'snatch' && value > records.bestSnatch) {
      records.bestSnatch = value;
      changed = true;
    }
    if (type === 'cleanjerk' && value > records.bestCleanJerk) {
      records.bestCleanJerk = value;
      changed = true;
    }
    if (type === 'total') {
      var total = records.bestSnatch + records.bestCleanJerk;
      if (total > records.bestTotal) {
        records.bestTotal = total;
        changed = true;
      }
    }
    if (changed) saveRecords(records);
    return records;
  }

  function markOpponentBeaten(opponentId) {
    var records = loadRecords();
    if (records.opponentsBeaten.indexOf(opponentId) === -1) {
      records.opponentsBeaten.push(opponentId);
      saveRecords(records);
    }
    return records;
  }

  return {
    save: save,
    load: load,
    remove: remove,
    saveGameState: saveGameState,
    loadGameState: loadGameState,
    clearGameState: clearGameState,
    saveRecords: saveRecords,
    loadRecords: loadRecords,
    saveSettings: saveSettings,
    loadSettings: loadSettings,
    updateRecord: updateRecord,
    markOpponentBeaten: markOpponentBeaten
  };
})();
