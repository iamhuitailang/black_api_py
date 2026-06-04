window.GameStore = (function () {
  var STORAGE_KEY = 'hamster_snowball_game';

  var DEFAULT_DATA = {
    coins: 500,
    gems: 10,
    level: 1,
    exp: 0,
    playerName: '小仓鼠',
    currentSkin: 'default',
    currentSnowballEffect: 'default',
    currentMapDecor: 'default',
    unlockedSkins: ['default'],
    unlockedSnowballEffects: ['default'],
    unlockedMapDecors: ['default'],
    unlockedMaps: ['ice_world'],
    props: { freeze: 2, speed: 2, split: 1, obstacle: 1, invisible: 1 },
    stats: { wins: 0, losses: 0, totalGames: 0, biggestSnowball: 0, totalCoinsEarned: 0 },
    achievements: [],
    dailyRewardClaimed: null,
    specialGuestMet: [],
    settings: { musicVolume: 80, sfxVolume: 80, difficulty: 'normal' }
  };

  var SKINS = {
    default: { name: '默认仓鼠', color: '#F4A460', price: 0, type: 'coin' },
    polar: { name: '极地仓鼠', color: '#E0E0E0', price: 300, type: 'coin' },
    golden: { name: '黄金仓鼠', color: '#FFD700', price: 800, type: 'coin' },
    ninja: { name: '忍者仓鼠', color: '#2F2F2F', price: 600, type: 'coin' },
    santa: { name: '圣诞仓鼠', color: '#FF0000', price: 500, type: 'coin' },
    rainbow: { name: '彩虹仓鼠', color: 'rainbow', price: 20, type: 'gem' },
    robot: { name: '机甲仓鼠', color: '#708090', price: 15, type: 'gem' },
    dragon: { name: '龙年仓鼠', color: '#DC143C', price: 30, type: 'gem' },
    special_penguin: { name: '企鹅嘉宾', color: '#1C1C1C', price: 0, type: 'special' },
    special_snowman: { name: '雪人嘉宾', color: '#FFFACD', price: 0, type: 'special' }
  };

  var SNOWBALL_EFFECTS = {
    default: { name: '普通雪球', effect: 'none', price: 0, type: 'coin' },
    sparkle: { name: '闪耀雪球', effect: 'sparkle', price: 200, type: 'coin' },
    flame: { name: '火焰雪球', effect: 'flame', price: 400, type: 'coin' },
    ice: { name: '冰晶雪球', effect: 'ice', price: 500, type: 'coin' },
    rainbow: { name: '彩虹雪球', effect: 'rainbow', price: 10, type: 'gem' }
  };

  var MAP_DECORS = {
    default: { name: '默认装饰', price: 0, type: 'coin' },
    christmas: { name: '圣诞装饰', price: 300, type: 'coin' },
    lantern: { name: '灯笼装饰', price: 250, type: 'coin' },
    aurora: { name: '极光装饰', price: 8, type: 'gem' }
  };

  var PROP_DEFS = {
    freeze: { name: '冰冻射线', desc: '冻结对手3秒', icon: '❄️', price: 100, type: 'coin' },
    speed: { name: '加速靴', desc: '加速5秒', icon: '⚡', price: 80, type: 'coin' },
    split: { name: '雪球分裂', desc: '让对手雪球分裂缩小', icon: '💥', price: 150, type: 'coin' },
    obstacle: { name: '障碍陷阱', desc: '放置障碍物', icon: '🪨', price: 60, type: 'coin' },
    invisible: { name: '隐身衣', desc: '隐身4秒', icon: '👻', price: 120, type: 'coin' }
  };

  var PROP_KEYS = Object.keys(PROP_DEFS);

  var data = {};

  function deepMerge(target, source) {
    var result = JSON.parse(JSON.stringify(target));
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
          result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])
        ) {
          result[key] = deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }

  function init() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        data = deepMerge(DEFAULT_DATA, parsed);
      } else {
        data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
    } catch (e) {
      data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function get(key) {
    return data[key];
  }

  function set(key, value) {
    data[key] = value;
    save();
  }

  function addCoins(amount) {
    data.coins += amount;
    save();
  }

  function spendCoins(amount) {
    if (data.coins < amount) return false;
    data.coins -= amount;
    save();
    return true;
  }

  function addGems(amount) {
    data.gems += amount;
    save();
  }

  function spendGems(amount) {
    if (data.gems < amount) return false;
    data.gems -= amount;
    save();
    return true;
  }

  function addExp(amount) {
    data.exp += amount;
    var leveledUp = false;
    while (data.exp >= 100) {
      data.exp -= 100;
      data.level += 1;
      leveledUp = true;
    }
    save();
    return leveledUp;
  }

  function unlockSkin(skinId) {
    if (data.unlockedSkins.indexOf(skinId) === -1) {
      data.unlockedSkins.push(skinId);
      save();
    }
  }

  function unlockSnowballEffect(effectId) {
    if (data.unlockedSnowballEffects.indexOf(effectId) === -1) {
      data.unlockedSnowballEffects.push(effectId);
      save();
    }
  }

  function unlockMapDecor(decorId) {
    if (data.unlockedMapDecors.indexOf(decorId) === -1) {
      data.unlockedMapDecors.push(decorId);
      save();
    }
  }

  function unlockMap(mapId) {
    if (data.unlockedMaps.indexOf(mapId) === -1) {
      data.unlockedMaps.push(mapId);
      save();
    }
  }

  function useProp(propId) {
    if (!data.props[propId] || data.props[propId] <= 0) return false;
    data.props[propId] -= 1;
    save();
    return true;
  }

  function addProp(propId, count) {
    if (!data.props[propId]) data.props[propId] = 0;
    data.props[propId] += count;
    save();
  }

  function updateStats(result) {
    data.stats.totalGames += 1;
    if (result.won) {
      data.stats.wins += 1;
    } else {
      data.stats.losses += 1;
    }
    if (result.snowballSize > data.stats.biggestSnowball) {
      data.stats.biggestSnowball = result.snowballSize;
    }
    data.stats.totalCoinsEarned += result.coinsEarned;
    save();
  }

  function addAchievement(achievementId) {
    if (data.achievements.indexOf(achievementId) === -1) {
      data.achievements.push(achievementId);
      save();
    }
  }

  function claimDailyReward() {
    var today = new Date().toISOString().slice(0, 10);
    if (data.dailyRewardClaimed === today) return null;
    data.dailyRewardClaimed = today;
    data.coins += 100;
    var randomPropKey = PROP_KEYS[Math.floor(Math.random() * PROP_KEYS.length)];
    if (!data.props[randomPropKey]) data.props[randomPropKey] = 0;
    data.props[randomPropKey] += 1;
    save();
    return { coins: 100, prop: randomPropKey };
  }

  function metSpecialGuest(guestId) {
    if (data.specialGuestMet.indexOf(guestId) === -1) {
      data.specialGuestMet.push(guestId);
      save();
    }
  }

  function resetData() {
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    save();
  }

  function getAll() {
    return data;
  }

  init();

  return {
    SKINS: SKINS,
    SNOWBALL_EFFECTS: SNOWBALL_EFFECTS,
    MAP_DECORS: MAP_DECORS,
    PROP_DEFS: PROP_DEFS,
    init: init,
    save: save,
    get: get,
    set: set,
    addCoins: addCoins,
    spendCoins: spendCoins,
    addGems: addGems,
    spendGems: spendGems,
    addExp: addExp,
    unlockSkin: unlockSkin,
    unlockSnowballEffect: unlockSnowballEffect,
    unlockMapDecor: unlockMapDecor,
    unlockMap: unlockMap,
    useProp: useProp,
    addProp: addProp,
    updateStats: updateStats,
    addAchievement: addAchievement,
    claimDailyReward: claimDailyReward,
    metSpecialGuest: metSpecialGuest,
    resetData: resetData,
    getAll: getAll
  };
})();
