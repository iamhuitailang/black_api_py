var GameData = {
  ores: [
    { id: 'iron', name: '铁矿', tier: 'common', basePrice: 5, color: '#8B7355', icon: '●', minArea: 0 },
    { id: 'copper', name: '铜矿', tier: 'common', basePrice: 8, color: '#B87333', icon: '●', minArea: 0 },
    { id: 'silicon', name: '硅矿', tier: 'common', basePrice: 6, color: '#6C7A89', icon: '●', minArea: 0 },
    { id: 'aluminum', name: '铝矿', tier: 'common', basePrice: 7, color: '#A8A9AD', icon: '●', minArea: 0 },
    { id: 'titanium', name: '钛矿', tier: 'uncommon', basePrice: 25, color: '#778899', icon: '◆', minArea: 1 },
    { id: 'tungsten', name: '钨矿', tier: 'uncommon', basePrice: 30, color: '#4A4A4A', icon: '◆', minArea: 1 },
    { id: 'nickel', name: '镍矿', tier: 'uncommon', basePrice: 22, color: '#72706E', icon: '◆', minArea: 1 },
    { id: 'cobalt', name: '钴矿', tier: 'uncommon', basePrice: 28, color: '#3D5B8E', icon: '◆', minArea: 1 },
    { id: 'platinum', name: '铂矿', tier: 'rare', basePrice: 80, color: '#E5E4E2', icon: '★', minArea: 2 },
    { id: 'iridium', name: '铱矿', tier: 'rare', basePrice: 100, color: '#C0C0C0', icon: '★', minArea: 2 },
    { id: 'palladium', name: '钯矿', tier: 'rare', basePrice: 90, color: '#CECECE', icon: '★', minArea: 2 },
    { id: 'osmium', name: '锇矿', tier: 'rare', basePrice: 120, color: '#BCC6CC', icon: '★', minArea: 2 },
    { id: 'dark_matter', name: '暗物质', tier: 'legendary', basePrice: 300, color: '#6A0DAD', icon: '◈', minArea: 3 },
    { id: 'antimatter', name: '反物质', tier: 'legendary', basePrice: 400, color: '#FF1493', icon: '◈', minArea: 3 },
    { id: 'quantum_crystal', name: '量子晶', tier: 'legendary', basePrice: 500, color: '#00FFFF', icon: '◈', minArea: 3 },
    { id: 'starstone', name: '星辰石', tier: 'legendary', basePrice: 800, color: '#FFD700', icon: '◈', minArea: 4 }
  ],

  areas: [
    { id: 0, name: '太阳系', desc: '最基础的采矿区域，富含常见矿物', danger: 1, unlockCost: 0, color: '#FFA500', bgGradient: 'linear-gradient(135deg, #1a1a3e 0%, #2d1b4e 50%, #1a1a3e 100%)', oreTiers: ['common'], asteroidCount: 5 },
    { id: 1, name: '半人马座', desc: '蕴藏稀有钛矿和钨矿的星系', danger: 2, unlockCost: 500, color: '#4169E1', bgGradient: 'linear-gradient(135deg, #0d1b3e 0%, #1b2d5e 50%, #0d1b3e 100%)', oreTiers: ['common', 'uncommon'], asteroidCount: 6 },
    { id: 2, name: '猎户座', desc: '危险但富含铂族金属的星域', danger: 3, unlockCost: 2000, color: '#9370DB', bgGradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)', oreTiers: ['uncommon', 'rare'], asteroidCount: 7 },
    { id: 3, name: '天琴座', desc: '传说中的暗物质产地，极度危险', danger: 4, unlockCost: 8000, color: '#FF69B4', bgGradient: 'linear-gradient(135deg, #2a0a2e 0%, #4d1b5e 50%, #2a0a2e 100%)', oreTiers: ['rare', 'legendary'], asteroidCount: 8 },
    { id: 4, name: '仙女座', desc: '银河系最富饶也最危险的星系', danger: 5, unlockCost: 25000, color: '#FFD700', bgGradient: 'linear-gradient(135deg, #1a1a0a 0%, #3d3d1a 50%, #1a1a0a 100%)', oreTiers: ['rare', 'legendary'], asteroidCount: 10 }
  ],

  equipment: {
    laser: [
      { id: 'laser_0', name: '基础激光', level: 1, damage: 1, price: 0, desc: '标准配置采矿激光' },
      { id: 'laser_1', name: '增强激光', level: 2, damage: 2, price: 300, desc: '功率提升50%的采矿激光' },
      { id: 'laser_2', name: '等离子切割器', level: 3, damage: 4, price: 1500, desc: '等离子技术的强力切割器' },
      { id: 'laser_3', name: '量子激光', level: 4, damage: 8, price: 6000, desc: '量子纠缠技术的终极激光' }
    ],
    shield: [
      { id: 'shield_0', name: '基础护盾', level: 1, defense: 5, maxShield: 50, price: 0, desc: '标准能量护盾' },
      { id: 'shield_1', name: '增强护盾', level: 2, defense: 10, maxShield: 80, price: 400, desc: '双层能量护盾' },
      { id: 'shield_2', name: '重装护盾', level: 3, defense: 20, maxShield: 120, price: 2000, desc: '军用级重型护盾' },
      { id: 'shield_3', name: '量子护盾', level: 4, defense: 40, maxShield: 200, price: 8000, desc: '量子态不可穿透护盾' }
    ],
    cargo: [
      { id: 'cargo_0', name: '小型货舱', level: 1, capacity: 20, price: 0, desc: '20单位货物空间' },
      { id: 'cargo_1', name: '中型货舱', level: 2, capacity: 40, price: 500, desc: '40单位货物空间' },
      { id: 'cargo_2', name: '大型货舱', level: 3, capacity: 80, price: 2500, desc: '80单位货物空间' },
      { id: 'cargo_3', name: '巨型货舱', level: 4, capacity: 150, price: 10000, desc: '150单位货物空间' }
    ],
    engine: [
      { id: 'engine_0', name: '基础引擎', level: 1, evasion: 5, price: 0, desc: '标准离子推进引擎' },
      { id: 'engine_1', name: '增强引擎', level: 2, evasion: 12, price: 350, desc: '升级版脉冲引擎' },
      { id: 'engine_2', name: '超光速引擎', level: 3, evasion: 25, price: 1800, desc: '超光速巡航引擎' },
      { id: 'engine_3', name: '跃迁引擎', level: 4, evasion: 50, price: 7000, desc: '空间跃迁引擎' }
    ]
  },

  shipColors: [
    { id: 'cyan', name: '星际蓝', color: '#00d4ff', price: 0 },
    { id: 'red', name: '烈焰红', color: '#ff3366', price: 200 },
    { id: 'green', name: '极光绿', color: '#00ff88', price: 200 },
    { id: 'gold', name: '皇家金', color: '#ffd700', price: 500 },
    { id: 'purple', name: '暗影紫', color: '#9b59b6', price: 500 },
    { id: 'white', name: '月光白', color: '#ffffff', price: 1000 },
    { id: 'rainbow', name: '彩虹', color: 'rainbow', price: 3000 }
  ],

  weatherTypes: [
    { id: 'calm', name: '宁静', icon: '🌙', effect: 'none', desc: '天气晴朗，适合采矿', miningMod: 1.0, dangerMod: 0, duration: [30, 60] },
    { id: 'meteor', name: '陨石雨', icon: '☄️', effect: 'damage', desc: '陨石雨来袭！注意规避！', miningMod: 0.6, dangerMod: 2, duration: [15, 30] },
    { id: 'solar_storm', name: '太阳风暴', icon: '☀️', effect: 'shield_drain', desc: '太阳风暴正在侵蚀护盾！', miningMod: 0.4, dangerMod: 3, duration: [10, 25] },
    { id: 'ion_storm', name: '离子风暴', icon: '⚡', effect: 'cargo_loss', desc: '离子风暴干扰了货舱锁定！', miningMod: 0.3, dangerMod: 4, duration: [8, 20] },
    { id: 'nebula', name: '星云', icon: '🌌', effect: 'rare_boost', desc: '星云中的稀有矿物浓度上升！', miningMod: 1.5, dangerMod: 0, duration: [20, 40] }
  ],

  achievements: [
    { id: 'first_ore', name: '初出茅庐', desc: '开采第一块矿石', icon: '⛏️', reward: 50, condition: function(s) { return s.stats.totalOresMined >= 1; } },
    { id: 'miner_10', name: '实习矿工', desc: '累计开采10块矿石', icon: '💪', reward: 100, condition: function(s) { return s.stats.totalOresMined >= 10; } },
    { id: 'miner_100', name: '熟练矿工', desc: '累计开采100块矿石', icon: '🏆', reward: 500, condition: function(s) { return s.stats.totalOresMined >= 100; } },
    { id: 'miner_500', name: '采矿大师', desc: '累计开采500块矿石', icon: '👑', reward: 2000, condition: function(s) { return s.stats.totalOresMined >= 500; } },
    { id: 'coins_1k', name: '小有积蓄', desc: '累计赚取1000金币', icon: '💰', reward: 200, condition: function(s) { return s.stats.totalCoinsEarned >= 1000; } },
    { id: 'coins_10k', name: '星际富商', desc: '累计赚取10000金币', icon: '💎', reward: 1000, condition: function(s) { return s.stats.totalCoinsEarned >= 10000; } },
    { id: 'coins_100k', name: '银河首富', desc: '累计赚取100000金币', icon: '🏦', reward: 5000, condition: function(s) { return s.stats.totalCoinsEarned >= 100000; } },
    { id: 'first_rare', name: '稀有发现', desc: '首次发现稀有矿石', icon: '✨', reward: 300, condition: function(s) { return s.stats.rareOresFound >= 1; } },
    { id: 'first_legend', name: '传说猎人', desc: '首次发现传说矿石', icon: '🌟', reward: 1000, condition: function(s) { return s.stats.legendaryOresFound >= 1; } },
    { id: 'area_1', name: '远方来客', desc: '解锁半人马座', icon: '🚀', reward: 200, condition: function(s) { return s.unlockedAreas.length >= 2; } },
    { id: 'area_2', name: '星际探险家', desc: '解锁猎户座', icon: '🔭', reward: 800, condition: function(s) { return s.unlockedAreas.length >= 3; } },
    { id: 'area_3', name: '深渊行者', desc: '解锁天琴座', icon: '🌀', reward: 2000, condition: function(s) { return s.unlockedAreas.length >= 4; } },
    { id: 'area_4', name: '银河征服者', desc: '解锁仙女座', icon: '🌌', reward: 5000, condition: function(s) { return s.unlockedAreas.length >= 5; } },
    { id: 'full_cargo', name: '满载而归', desc: '货舱装满返回空间站', icon: '📦', reward: 150, condition: function(s) { return s.stats.fullCargoTrips >= 1; } },
    { id: 'upgrade_1', name: '技术升级', desc: '首次升级装备', icon: '🔧', reward: 100, condition: function(s) { return s.stats.equipmentUpgrades >= 1; } },
    { id: 'max_equip', name: '武装到牙齿', desc: '所有装备升到满级', icon: '⚡', reward: 10000, condition: function(s) { return s.equipment.laser === 3 && s.equipment.shield === 3 && s.equipment.cargo === 3 && s.equipment.engine === 3; } },
    { id: 'survive_storm', name: '风暴幸存者', desc: '在太阳风暴中存活', icon: '🌪️', reward: 300, condition: function(s) { return s.stats.stormsSurvived >= 1; } },
    { id: 'survive_5_storm', name: '风暴猎人', desc: '累计在5次风暴中存活', icon: '🔥', reward: 1500, condition: function(s) { return s.stats.stormsSurvived >= 5; } },
    { id: 'sell_50', name: '精明商人', desc: '单次出售50块以上矿石', icon: '📈', reward: 800, condition: function(s) { return s.stats.biggestSale >= 50; } },
    { id: 'trip_20', name: '常旅客', desc: '完成20次采矿航行', icon: '🛸', reward: 600, condition: function(s) { return s.stats.totalTrips >= 20; } }
  ],

  tierColors: {
    common: '#8B9467',
    uncommon: '#4FC3F7',
    rare: '#CE93D8',
    legendary: '#FFD700'
  },

  tierNames: {
    common: '普通',
    uncommon: '稀有',
    rare: '珍品',
    legendary: '传说'
  },

  marketFluctuation: 0.3,

  defaultState: function() {
    return {
      player: {
        name: '星际矿工',
        coins: 100,
        level: 1,
        experience: 0
      },
      ship: {
        name: '探索者号',
        color: '#00d4ff',
        hull: 100,
        maxHull: 100,
        shield: 50,
        maxShield: 50,
        cargo: {},
        maxCargo: 20
      },
      equipment: {
        laser: 0,
        shield: 0,
        cargo: 0,
        engine: 0
      },
      unlockedAreas: [0],
      currentArea: 0,
      currentAsteroid: null,
      stats: {
        totalOresMined: 0,
        totalCoinsEarned: 0,
        totalTrips: 0,
        rareOresFound: 0,
        legendaryOresFound: 0,
        fullCargoTrips: 0,
        equipmentUpgrades: 0,
        stormsSurvived: 0,
        biggestSale: 0,
        asteroidsDestroyed: 0
      },
      achievements: [],
      marketPrices: {},
      weather: 'calm',
      weatherTimer: 0,
      isMining: false,
      lastSaveTime: Date.now()
    };
  }
};
