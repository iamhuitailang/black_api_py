const Config = {
  STORAGE_KEY: 'farm_game_save_v1',
  
  INITIAL_STATE: {
    coins: 100,
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    selectedTool: 'hand',
    selectedSeed: null,
    isPaused: false,
    isGameStarted: false,
    showShop: false,
    showMenu: false,
    showMessage: null,
    messageTimer: 0
  },
  
  CROPS: {
    qingcai: {
      id: 'qingcai',
      name: '青菜',
      growTime: 10000,
      sellPrice: 10,
      unlockCost: 0,
      unlockLevel: 1,
      unlocked: true,
      stages: ['播种', '发芽', '长叶', '开花', '成熟'],
      color: '#4CAF50',
      emoji: '🥬'
    },
    luobo: {
      id: 'luobo',
      name: '萝卜',
      growTime: 20000,
      sellPrice: 25,
      unlockCost: 50,
      unlockLevel: 1,
      unlocked: false,
      stages: ['播种', '发芽', '长叶', '开花', '成熟'],
      color: '#FF9800',
      emoji: '🥕'
    },
    yumi: {
      id: 'yumi',
      name: '玉米',
      growTime: 40000,
      sellPrice: 60,
      unlockCost: 150,
      unlockLevel: 1,
      unlocked: false,
      stages: ['播种', '发芽', '长叶', '开花', '成熟'],
      color: '#FFC107',
      emoji: '🌽'
    },
    fanqie: {
      id: 'fanqie',
      name: '番茄',
      growTime: 60000,
      sellPrice: 100,
      unlockCost: 300,
      unlockLevel: 1,
      unlocked: false,
      stages: ['播种', '发芽', '长叶', '开花', '成熟'],
      color: '#F44336',
      emoji: '🍅'
    },
    xigua: {
      id: 'xigua',
      name: '西瓜',
      growTime: 120000,
      sellPrice: 220,
      unlockCost: 0,
      unlockLevel: 3,
      unlocked: false,
      stages: ['播种', '发芽', '长叶', '开花', '成熟'],
      color: '#8BC34A',
      emoji: '🍉'
    }
  },
  
  PLOT_TYPES: {
    normal: {
      id: 'normal',
      name: '普通地块',
      speedBonus: 0,
      yieldBonus: 0,
      unlockCost: 0,
      color: '#8B7355'
    },
    fertile: {
      id: 'fertile',
      name: '肥沃地块',
      speedBonus: 0.2,
      yieldBonus: 1,
      unlockCost: 200,
      color: '#6B5344'
    },
    greenhouse: {
      id: 'greenhouse',
      name: '温室地块',
      speedBonus: 0.5,
      yieldBonus: 2,
      unlockCost: 500,
      color: '#9B8365'
    }
  },
  
  TOOLS: {
    hand: {
      id: 'hand',
      name: '手',
      description: '选择、收获作物'
    },
    water: {
      id: 'water',
      name: '浇水壶',
      description: '浇水加速生长10%',
      speedBoost: 0.1
    },
    fertilizer: {
      id: 'fertilizer',
      name: '肥料',
      description: '施肥加速生长25%',
      speedBoost: 0.25,
      cost: 5
    },
    ripening: {
      id: 'ripening',
      name: '催熟剂',
      description: '立即减少30秒生长时间',
      timeReduce: 30000,
      cost: 20
    },
    shovel: {
      id: 'shovel',
      name: '铲子',
      description: '开垦荒地或清除作物'
    }
  },
  
  INITIAL_PLOTS: [
    { id: 0, type: 'normal', unlocked: true, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 },
    { id: 1, type: 'normal', unlocked: true, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 },
    { id: 2, type: 'normal', unlocked: false, unlockCost: 100, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 },
    { id: 3, type: 'normal', unlocked: false, unlockCost: 200, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 },
    { id: 4, type: 'normal', unlocked: false, unlockCost: 400, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 },
    { id: 5, type: 'fertile', unlocked: false, unlockCost: 600, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 },
    { id: 6, type: 'fertile', unlocked: false, unlockCost: 800, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 },
    { id: 7, type: 'greenhouse', unlocked: false, unlockCost: 1200, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 },
    { id: 8, type: 'greenhouse', unlocked: false, unlockCost: 1800, crop: null, plantedAt: 0, watered: false, fertilized: false, growthProgress: 0 }
  ],
  
  INVENTORY: {
    seeds: {},
    harvested: {},
    items: {
      water: 999,
      fertilizer: 10,
      ripening: 5
    }
  },
  
  COLORS: {
    sky: '#87CEEB',
    grass: '#7CB342',
    grassDark: '#558B2F',
    wood: '#8D6E63',
    woodDark: '#5D4037',
    soil: '#8B7355',
    soilDark: '#6B5344',
    uiBg: 'rgba(255, 248, 220, 0.95)',
    uiBorder: '#8B4513',
    text: '#3E2723',
    gold: '#FFD700'
  },
  
  CANVAS: {
    WIDTH: 900,
    HEIGHT: 600,
    PLOT_SIZE: 80,
    PLOT_GAP: 15,
    PLOT_START_X: 100,
    PLOT_START_Y: 180,
    PLOTS_PER_ROW: 3
  }
};

window.Config = Config;
