var Game = {
  state: null,
  autoSaveInterval: null,
  weatherInterval: null,
  marketInterval: null,
  miningInterval: null,
  hazardTimeout: null,
  notifications: [],

  init: function() {
    var saved = Storage.load();
    if (saved) {
      Game.state = saved;
    } else {
      Game.state = GameData.defaultState();
    }
    Game.recalculateShipStats();
    Game.initMarketPrices();
    if (Game.state.isMining) {
      if (!Game.state.currentAsteroid) {
        Game.state.currentAsteroid = Game.generateAsteroid();
      }
      if (Game.state.weatherTimer <= 0 || Game.state.weatherTimer > 10) {
        Game.state.weatherTimer = 3 + Math.floor(Math.random() * 4);
      }
      if (!Game.state.weather) {
        Game.state.weather = 'calm';
      }
      Game.addNotification('info', '🔄 已恢复采矿状态');
      Game.addNotification('info', '天气即将变化，请做好准备...');
    }
    Game.startAutoSave();
    Game.startWeatherCycle();
    Game.startMarketFluctuation();
    Game.checkAchievements();
  },

  recalculateShipStats: function() {
    var s = Game.state;
    var shieldData = GameData.equipment.shield[s.equipment.shield];
    var cargoData = GameData.equipment.cargo[s.equipment.cargo];
    s.ship.maxShield = shieldData.maxShield;
    s.ship.maxCargo = cargoData.capacity;
    s.ship.maxHull = 100 + (s.equipment.shield * 20);
    if (s.ship.shield > s.ship.maxShield) s.ship.shield = s.ship.maxShield;
    if (s.ship.hull > s.ship.maxHull) s.ship.hull = s.ship.maxHull;
  },

  initMarketPrices: function() {
    if (Object.keys(Game.state.marketPrices).length === 0) {
      for (var i = 0; i < GameData.ores.length; i++) {
        var ore = GameData.ores[i];
        Game.state.marketPrices[ore.id] = ore.basePrice;
      }
    }
  },

  startAutoSave: function() {
    if (Game.autoSaveInterval) clearInterval(Game.autoSaveInterval);
    Game.autoSaveInterval = setInterval(function() {
      Storage.save(Game.state);
    }, 5000);
  },

  startWeatherCycle: function() {
    if (Game.weatherInterval) clearInterval(Game.weatherInterval);
    Game.weatherInterval = setInterval(function() {
      if (Game.state.isMining) {
        Game.state.weatherTimer--;
        if (Game.state.weatherTimer <= 0) {
          Game.changeWeather();
        }
        if (Game.state.weather !== 'calm') {
          Game.applyWeatherEffects();
        }
      }
    }, 1000);
  },

  startMarketFluctuation: function() {
    if (Game.marketInterval) clearInterval(Game.marketInterval);
    Game.marketInterval = setInterval(function() {
      Game.fluctuateMarket();
    }, 30000);
  },

  changeWeather: function() {
    var oldWeather = Game.state.weather;
    if (oldWeather === 'solar_storm' || oldWeather === 'ion_storm') {
      Game.state.stats.stormsSurvived++;
    }

    var area = GameData.areas[Game.state.currentArea];
    var possible = ['calm'];
    if (area.danger >= 2) possible.push('meteor');
    if (area.danger >= 3) possible.push('solar_storm');
    if (area.danger >= 4) possible.push('ion_storm');
    possible.push('nebula');

    var weights = [40];
    if (area.danger >= 2) weights.push(area.danger * 8);
    if (area.danger >= 3) weights.push(area.danger * 5);
    if (area.danger >= 4) weights.push(area.danger * 3);
    weights.push(10);

    var totalWeight = 0;
    for (var i = 0; i < weights.length; i++) totalWeight += weights[i];
    var rand = Math.random() * totalWeight;
    var cumulative = 0;
    var chosen = possible[0];
    for (var j = 0; j < possible.length; j++) {
      cumulative += weights[j];
      if (rand <= cumulative) {
        chosen = possible[j];
        break;
      }
    }

    var weatherData = Game.getWeatherData(chosen);
    var duration = weatherData.duration;
    Game.state.weather = chosen;
    Game.state.weatherTimer = duration[0] + Math.floor(Math.random() * (duration[1] - duration[0]));

    if (typeof UI !== 'undefined') {
      UI.updateWeatherDisplay();
      Game.addNotification('weather', weatherData.icon + ' ' + weatherData.name + '：' + weatherData.desc);
    }
  },

  applyWeatherEffects: function() {
    var weather = Game.getWeatherData(Game.state.weather);
    if (!weather) return;
    var s = Game.state;
    var engineData = GameData.equipment.engine[s.equipment.engine];

    if (weather.effect === 'damage') {
      var dodgeChance = engineData.evasion / 100;
      if (Math.random() > dodgeChance) {
        var dmg = Math.floor(weather.dangerMod * (1 + Math.random()));
        var shieldAbsorb = Math.min(s.ship.shield, dmg);
        s.ship.shield -= shieldAbsorb;
        s.ship.hull -= (dmg - shieldAbsorb);
        if (s.ship.hull < 0) s.ship.hull = 0;
        if (typeof UI !== 'undefined') UI.showDamageFlash();
      }
    } else if (weather.effect === 'shield_drain') {
      s.ship.shield = Math.max(0, s.ship.shield - weather.dangerMod);
      if (Math.random() < 0.1) {
        var dmg2 = Math.floor(weather.dangerMod * 0.5);
        s.ship.hull = Math.max(0, s.ship.hull - dmg2);
        if (typeof UI !== 'undefined') UI.showDamageFlash();
      }
    } else if (weather.effect === 'cargo_loss') {
      if (Math.random() < 0.05) {
        var cargoKeys = Object.keys(s.ship.cargo);
        if (cargoKeys.length > 0) {
          var randomKey = cargoKeys[Math.floor(Math.random() * cargoKeys.length)];
          var lost = Math.min(s.ship.cargo[randomKey], Math.ceil(Math.random() * 3));
          s.ship.cargo[randomKey] -= lost;
          if (s.ship.cargo[randomKey] <= 0) delete s.ship.cargo[randomKey];
          if (typeof UI !== 'undefined') UI.updateCargoDisplay();
        }
      }
    }

    if (s.ship.hull <= 0) {
      Game.emergencyReturn();
    }

    if (typeof UI !== 'undefined') UI.updateShipStatus();
  },

  emergencyReturn: function() {
    Game.state.isMining = false;
    Game.state.weather = 'calm';
    Game.state.weatherTimer = 0;
    Game.state.currentAsteroid = null;
    Game.state.ship.hull = Math.floor(Game.state.ship.maxHull * 0.2);
    Game.state.ship.shield = 0;
    var lostPercent = 0.3;
    var cargoKeys = Object.keys(Game.state.ship.cargo);
    for (var i = 0; i < cargoKeys.length; i++) {
      var lost = Math.ceil(Game.state.ship.cargo[cargoKeys[i]] * lostPercent);
      Game.state.ship.cargo[cargoKeys[i]] -= lost;
      if (Game.state.ship.cargo[cargoKeys[i]] <= 0) delete Game.state.ship.cargo[cargoKeys[i]];
    }
    Game.addNotification('danger', '🚨 飞船严重受损！紧急返回空间站，丢失了部分货物！');
    if (typeof UI !== 'undefined') {
      UI.switchView('dashboard');
      UI.updateAll();
    }
    Storage.save(Game.state);
  },

  fluctuateMarket: function() {
    for (var i = 0; i < GameData.ores.length; i++) {
      var ore = GameData.ores[i];
      var currentPrice = Game.state.marketPrices[ore.id] || ore.basePrice;
      var fluctuation = (Math.random() - 0.5) * 2 * GameData.marketFluctuation * ore.basePrice;
      var newPrice = currentPrice + fluctuation;
      newPrice = Math.max(ore.basePrice * 0.3, Math.min(ore.basePrice * 2.5, newPrice));
      Game.state.marketPrices[ore.id] = Math.round(newPrice * 10) / 10;
    }
    if (typeof UI !== 'undefined' && UI.currentView === 'station') {
      UI.renderStation();
    }
  },

  getWeatherData: function(weatherId) {
    for (var i = 0; i < GameData.weatherTypes.length; i++) {
      if (GameData.weatherTypes[i].id === weatherId) return GameData.weatherTypes[i];
    }
    return GameData.weatherTypes[0];
  },

  generateAsteroid: function() {
    var area = GameData.areas[Game.state.currentArea];
    var availableOres = [];
    for (var i = 0; i < GameData.ores.length; i++) {
      if (GameData.ores[i].minArea <= Game.state.currentArea) {
        var tier = GameData.ores[i].tier;
        if (area.oreTiers.indexOf(tier) !== -1) {
          availableOres.push(GameData.ores[i]);
        }
      }
    }

    var oreWeights = [];
    for (var j = 0; j < availableOres.length; j++) {
      var weight = 1;
      switch (availableOres[j].tier) {
        case 'common': weight = 40; break;
        case 'uncommon': weight = 25; break;
        case 'rare': weight = 10; break;
        case 'legendary': weight = 3; break;
      }
      if (Game.state.weather === 'nebula') {
        if (availableOres[j].tier === 'rare') weight *= 3;
        if (availableOres[j].tier === 'legendary') weight *= 5;
      }
      oreWeights.push(weight);
    }

    var totalWeight = 0;
    for (var k = 0; k < oreWeights.length; k++) totalWeight += oreWeights[k];

    var mainOreIdx = 0;
    var rand = Math.random() * totalWeight;
    var cumul = 0;
    for (var m = 0; m < availableOres.length; m++) {
      cumul += oreWeights[m];
      if (rand <= cumul) {
        mainOreIdx = m;
        break;
      }
    }

    var mainOre = availableOres[mainOreIdx];
    var secondaryOres = [];
    for (var n = 0; n < availableOres.length; n++) {
      if (n !== mainOreIdx && Math.random() < 0.3) {
        secondaryOres.push(availableOres[n]);
      }
    }

    var baseHP = 30 + area.danger * 20 + Math.floor(Math.random() * 20);

    var asteroidNames = ['碎裂小行星', '旋转陨石', '晶体陨星', '暗色岩块', '辉光星体', '弧形碎片', '棱角石核', '环形碎石'];
    var nameIdx = Math.floor(Math.random() * asteroidNames.length);

    return {
      name: asteroidNames[nameIdx],
      hp: baseHP,
      maxHp: baseHP,
      mainOre: mainOre,
      secondaryOres: secondaryOres,
      size: 60 + Math.floor(Math.random() * 40)
    };
  },

  startMining: function() {
    if (Game.state.isMining) return;
    Game.state.isMining = true;
    Game.state.currentAsteroid = Game.generateAsteroid();
    Game.state.weather = 'calm';
    Game.state.weatherTimer = 5 + Math.floor(Math.random() * 5);
    Game.addNotification('info', '⛏️ 开始在' + GameData.areas[Game.state.currentArea].name + '采矿...');
    Game.addNotification('info', '天气即将变化，请做好准备...');
    Storage.save(Game.state);
    if (typeof UI !== 'undefined') {
      UI.switchView('mining');
      UI.updateAll();
    }
  },

  mineAsteroid: function() {
    if (!Game.state.isMining || !Game.state.currentAsteroid) return null;
    var s = Game.state;
    var laserData = GameData.equipment.laser[s.equipment.laser];
    var weatherData = Game.getWeatherData(s.weather);
    var damage = laserData.damage * weatherData.miningMod;
    var isCrit = Math.random() < 0.1;
    if (isCrit) damage *= 2;

    damage = Math.ceil(damage);
    s.currentAsteroid.hp -= damage;

    var oreFound = null;
    var dropChance = 0.4 + (laserData.level * 0.1);
    if (weatherData.effect === 'rare_boost') dropChance += 0.2;

    if (Math.random() < dropChance) {
      if (Math.random() < 0.7) {
        oreFound = s.currentAsteroid.mainOre;
      } else if (s.currentAsteroid.secondaryOres.length > 0) {
        oreFound = s.currentAsteroid.secondaryOres[Math.floor(Math.random() * s.currentAsteroid.secondaryOres.length)];
      } else {
        oreFound = s.currentAsteroid.mainOre;
      }

      var cargoUsed = Game.getCargoUsed();
      if (cargoUsed < s.ship.maxCargo) {
        s.ship.cargo[oreFound.id] = (s.ship.cargo[oreFound.id] || 0) + 1;
        s.stats.totalOresMined++;
        if (oreFound.tier === 'rare') s.stats.rareOresFound++;
        if (oreFound.tier === 'legendary') s.stats.legendaryOresFound++;
      } else {
        oreFound = 'full';
      }
    }

    if (s.currentAsteroid.hp <= 0) {
      var bonusOres = Math.floor(3 + Math.random() * 5);
      var bonusOre = s.currentAsteroid.mainOre;
      var added = 0;
      for (var i = 0; i < bonusOres; i++) {
        if (Game.getCargoUsed() < s.ship.maxCargo) {
          s.ship.cargo[bonusOre.id] = (s.ship.cargo[bonusOre.id] || 0) + 1;
          s.stats.totalOresMined++;
          if (bonusOre.tier === 'rare') s.stats.rareOresFound++;
          if (bonusOre.tier === 'legendary') s.stats.legendaryOresFound++;
          added++;
        }
      }
      s.stats.asteroidsDestroyed++;
      s.currentAsteroid = Game.generateAsteroid();
      Game.addNotification('success', '💥 小行星摧毁！获得' + added + '块' + bonusOre.name + '！新小行星出现！');
    }

    Game.checkAchievements();
    Storage.save(Game.state);
    return { oreFound: oreFound, damage: damage, isCrit: isCrit };
  },

  getCargoUsed: function() {
    var total = 0;
    var cargo = Game.state.ship.cargo;
    var keys = Object.keys(cargo);
    for (var i = 0; i < keys.length; i++) {
      total += cargo[keys[i]];
    }
    return total;
  },

  returnToStation: function() {
    Game.state.isMining = false;
    Game.state.weather = 'calm';
    Game.state.weatherTimer = 0;
    Game.state.currentAsteroid = null;
    Game.state.stats.totalTrips++;
    if (Game.getCargoUsed() >= Game.state.ship.maxCargo) {
      Game.state.stats.fullCargoTrips++;
    }
    Game.repairShip();
    Game.checkAchievements();
    Game.addNotification('info', '🏠 返回空间站，飞船已修复');
    if (typeof UI !== 'undefined') {
      UI.switchView('dashboard');
      UI.updateAll();
    }
    Storage.save(Game.state);
  },

  repairShip: function() {
    Game.state.ship.hull = Game.state.ship.maxHull;
    Game.state.ship.shield = Game.state.ship.maxShield;
  },

  sellOre: function(oreId, amount) {
    var s = Game.state;
    if (!s.ship.cargo[oreId] || s.ship.cargo[oreId] < amount) return false;
    var price = s.marketPrices[oreId] || 0;
    var revenue = Math.floor(price * amount);
    s.ship.cargo[oreId] -= amount;
    if (s.ship.cargo[oreId] <= 0) delete s.ship.cargo[oreId];
    s.player.coins += revenue;
    s.stats.totalCoinsEarned += revenue;
    if (amount >= 50 && amount > s.stats.biggestSale) {
      s.stats.biggestSale = amount;
    }
    Game.checkAchievements();
    Game.addNotification('success', '💰 出售' + amount + '块矿石，获得' + revenue + '金币');
    Storage.save(Game.state);
    return { revenue: revenue, amount: amount };
  },

  sellAllOres: function() {
    var s = Game.state;
    var totalRevenue = 0;
    var totalAmount = 0;
    var cargoKeys = Object.keys(s.ship.cargo);
    for (var i = 0; i < cargoKeys.length; i++) {
      var oreId = cargoKeys[i];
      var amount = s.ship.cargo[oreId];
      var price = s.marketPrices[oreId] || 0;
      var revenue = Math.floor(price * amount);
      totalRevenue += revenue;
      totalAmount += amount;
    }
    if (totalAmount === 0) return false;
    s.ship.cargo = {};
    s.player.coins += totalRevenue;
    s.stats.totalCoinsEarned += totalRevenue;
    if (totalAmount >= 50 && totalAmount > s.stats.biggestSale) {
      s.stats.biggestSale = totalAmount;
    }
    Game.checkAchievements();
    Game.addNotification('success', '💰 出售全部' + totalAmount + '块矿石，获得' + totalRevenue + '金币');
    Storage.save(Game.state);
    return { revenue: totalRevenue, amount: totalAmount };
  },

  buyEquipment: function(category, level) {
    var s = Game.state;
    if (s.equipment[category] >= level) return false;
    if (level !== s.equipment[category] + 1) return false;
    var item = GameData.equipment[category][level];
    if (!item) return false;
    if (s.player.coins < item.price) return false;
    s.player.coins -= item.price;
    s.equipment[category] = level;
    s.stats.equipmentUpgrades++;
    Game.recalculateShipStats();
    Game.checkAchievements();
    Game.addNotification('success', '🔧 装备升级：' + item.name);
    Storage.save(Game.state);
    return true;
  },

  unlockArea: function(areaId) {
    var s = Game.state;
    if (s.unlockedAreas.indexOf(areaId) !== -1) return false;
    var area = GameData.areas[areaId];
    if (!area) return false;
    if (s.player.coins < area.unlockCost) return false;
    s.player.coins -= area.unlockCost;
    s.unlockedAreas.push(areaId);
    Game.checkAchievements();
    Game.addNotification('success', '🗺️ 解锁新区域：' + area.name);
    Storage.save(Game.state);
    return true;
  },

  travelToArea: function(areaId) {
    var s = Game.state;
    if (s.unlockedAreas.indexOf(areaId) === -1) return false;
    if (s.isMining) {
      Game.addNotification('warning', '⚠️ 请先返回空间站再更换区域');
      return false;
    }
    s.currentArea = areaId;
    Game.addNotification('info', '🚀 前往' + GameData.areas[areaId].name);
    if (typeof UI !== 'undefined') UI.updateAll();
    Storage.save(Game.state);
    return true;
  },

  changeShipName: function(name) {
    if (!name || name.trim().length === 0) return false;
    Game.state.ship.name = name.trim().substring(0, 12);
    Storage.save(Game.state);
    return true;
  },

  changeShipColor: function(colorId) {
    var colorData = null;
    for (var i = 0; i < GameData.shipColors.length; i++) {
      if (GameData.shipColors[i].id === colorId) {
        colorData = GameData.shipColors[i];
        break;
      }
    }
    if (!colorData) return false;
    if (colorData.price > 0 && Game.state.player.coins < colorData.price) return false;
    if (colorData.price > 0) Game.state.player.coins -= colorData.price;
    Game.state.ship.color = colorData.color;
    Game.addNotification('success', '🎨 飞船涂装更换：' + colorData.name);
    Storage.save(Game.state);
    return true;
  },

  checkAchievements: function() {
    var s = Game.state;
    for (var i = 0; i < GameData.achievements.length; i++) {
      var ach = GameData.achievements[i];
      if (s.achievements.indexOf(ach.id) !== -1) continue;
      try {
        if (ach.condition(s)) {
          s.achievements.push(ach.id);
          s.player.coins += ach.reward;
          s.stats.totalCoinsEarned += ach.reward;
          Game.addNotification('achievement', '🏆 成就解锁：' + ach.name + '！奖励' + ach.reward + '金币');
        }
      } catch (e) {}
    }
  },

  addNotification: function(type, message) {
    Game.notifications.unshift({ type: type, message: message, time: Date.now() });
    if (Game.notifications.length > 50) Game.notifications.pop();
    if (typeof UI !== 'undefined') UI.showNotification(type, message);
  },

  resetGame: function() {
    Storage.clear();
    Game.state = GameData.defaultState();
    Game.recalculateShipStats();
    Game.initMarketPrices();
    Game.addNotification('info', '🔄 游戏已重置');
    if (typeof UI !== 'undefined') UI.updateAll();
  }
};
