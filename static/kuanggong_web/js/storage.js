var Storage = {
  SAVE_KEY: 'star_miner_save',

  save: function(state) {
    try {
      state.lastSaveTime = Date.now();
      var data = JSON.stringify(state);
      localStorage.setItem(Storage.SAVE_KEY, data);
      return true;
    } catch (e) {
      console.error('保存失败:', e);
      return false;
    }
  },

  load: function() {
    try {
      var data = localStorage.getItem(Storage.SAVE_KEY);
      if (!data) return null;
      var state = JSON.parse(data);
      return Storage.migrate(state);
    } catch (e) {
      console.error('加载失败:', e);
      return null;
    }
  },

  migrate: function(state) {
    var defaults = GameData.defaultState();
    if (!state.player) state.player = defaults.player;
    if (!state.ship) state.ship = defaults.ship;
    if (!state.equipment) state.equipment = defaults.equipment;
    if (!state.unlockedAreas) state.unlockedAreas = defaults.unlockedAreas;
    if (state.currentArea === undefined) state.currentArea = defaults.currentArea;
    if (!state.stats) state.stats = defaults.stats;
    if (!state.achievements) state.achievements = defaults.achievements;
    if (!state.marketPrices) state.marketPrices = defaults.marketPrices;
    if (!state.weather) state.weather = defaults.weather;
    if (state.weatherTimer === undefined) state.weatherTimer = defaults.weatherTimer;
    if (state.isMining === undefined) state.isMining = defaults.isMining;
    if (!state.player.name) state.player.name = defaults.player.name;
    if (state.player.coins === undefined) state.player.coins = defaults.player.coins;
    if (state.player.level === undefined) state.player.level = defaults.player.level;
    if (state.player.experience === undefined) state.player.experience = defaults.player.experience;
    if (!state.ship.name) state.ship.name = defaults.ship.name;
    if (!state.ship.color) state.ship.color = defaults.ship.color;
    if (state.ship.hull === undefined) state.ship.hull = defaults.ship.hull;
    if (state.ship.maxHull === undefined) state.ship.maxHull = defaults.ship.maxHull;
    if (state.ship.shield === undefined) state.ship.shield = defaults.ship.shield;
    if (state.ship.maxShield === undefined) state.ship.maxShield = defaults.ship.maxShield;
    if (!state.ship.cargo) state.ship.cargo = defaults.ship.cargo;
    if (state.ship.maxCargo === undefined) state.ship.maxCargo = defaults.ship.maxCargo;
    var statKeys = Object.keys(defaults.stats);
    for (var i = 0; i < statKeys.length; i++) {
      if (state.stats[statKeys[i]] === undefined) {
        state.stats[statKeys[i]] = defaults.stats[statKeys[i]];
      }
    }
    return state;
  },

  clear: function() {
    localStorage.removeItem(Storage.SAVE_KEY);
  },

  hasSave: function() {
    return localStorage.getItem(Storage.SAVE_KEY) !== null;
  }
};
