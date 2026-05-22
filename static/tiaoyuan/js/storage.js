var TiaoyuanStorage = {
  KEY: 'tiaoyuan_save_v2',
  _data: null,

  _default: function() {
    return {
      bestDistance: 0,
      bestScore: 0,
      totalJumps: 0,
      totalScore: 0,
      worldRecord: TiaoyuanConfig.WORLD_RECORD,
      gameState: null
    };
  },

  load: function() {
    try {
      var raw = localStorage.getItem(this.KEY);
      if (raw) {
        this._data = JSON.parse(raw);
        if (!this._data.gameState) this._data.gameState = null;
      }
    } catch (e) {}
    if (!this._data) {
      this._data = this._default();
      this.save();
    }
    return this._data;
  },

  save: function() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this._data));
    } catch (e) {}
  },

  get: function(key) {
    if (!this._data) this.load();
    return this._data[key];
  },

  set: function(key, value) {
    if (!this._data) this.load();
    this._data[key] = value;
    this.save();
  },

  updateBest: function(distance, score) {
    if (!this._data) this.load();
    var changed = false;
    if (distance > (this._data.bestDistance || 0)) {
      this._data.bestDistance = distance;
      changed = true;
    }
    if (score > (this._data.bestScore || 0)) {
      this._data.bestScore = score;
      changed = true;
    }
    this._data.totalJumps = (this._data.totalJumps || 0) + 1;
    this._data.totalScore = (this._data.totalScore || 0) + score;
    if (changed) this.save();
    return changed;
  },

  saveGameState: function(state) {
    if (!this._data) this.load();
    this._data.gameState = state;
    this.save();
  },

  loadGameState: function() {
    if (!this._data) this.load();
    return this._data.gameState;
  },

  clearGameState: function() {
    if (!this._data) this.load();
    this._data.gameState = null;
    this.save();
  },

  reset: function() {
    this._data = this._default();
    this.save();
  }
};
