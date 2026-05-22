var TiaoyuanWeather = {
  current: null,

  roll: function() {
    var r = Math.random();
    var cumulative = 0;
    for (var i = 0; i < TiaoyuanConfig.WEATHER.length; i++) {
      var w = TiaoyuanConfig.WEATHER[i];
      cumulative += w.probability;
      if (r <= cumulative) {
        this.current = w;
        return w;
      }
    }
    this.current = TiaoyuanConfig.WEATHER[0];
    return this.current;
  },

  get: function() {
    return this.current || TiaoyuanConfig.WEATHER[0];
  },

  applyEffect: function(distance) {
    return distance * this.get().effect;
  },

  set: function(weatherId) {
    for (var i = 0; i < TiaoyuanConfig.WEATHER.length; i++) {
      if (TiaoyuanConfig.WEATHER[i].id === weatherId) {
        this.current = TiaoyuanConfig.WEATHER[i];
        return;
      }
    }
  }
};
