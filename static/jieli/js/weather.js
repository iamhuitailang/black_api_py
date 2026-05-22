const Weather = (function() {
  function random() {
    const r = Math.random();
    let cumulative = 0;
    for (const [key, weather] of Object.entries(CONFIG.WEATHER)) {
      cumulative += weather.probability;
      if (r <= cumulative) {
        return { type: key, ...weather };
      }
    }
    return { type: 'sunny', ...CONFIG.WEATHER.sunny };
  }

  function getEffect(weather) {
    if (!weather) return 0;
    return weather.effect || 0;
  }

  function getDropChance(weather) {
    if (!weather) return 0;
    return weather.dropChance || 0;
  }

  return { random, getEffect, getDropChance };
})();