const STAR_SYSTEMS = [
  {
    id: 'sol',
    name: '太阳系',
    x: 50,
    y: 50,
    type: 'core',
    description: '人类的发源地，繁荣的贸易中心',
    specialty: ['electronics', 'research'],
    scarcity: ['water', 'food'],
    color: '#00d4ff'
  },
  {
    id: 'alpha',
    name: '半人马座',
    x: 25,
    y: 30,
    type: 'industrial',
    description: '重工业基地，金属和机械产量巨大',
    specialty: ['metal', 'fuel'],
    scarcity: ['medicine', 'luxuries'],
    color: '#7c3aed'
  },
  {
    id: 'beta',
    name: '贝塔星系',
    x: 75,
    y: 25,
    type: 'agricultural',
    description: '农业星球，盛产粮食和水',
    specialty: ['water', 'food'],
    scarcity: ['electronics', 'metal'],
    color: '#10b981'
  },
  {
    id: 'gamma',
    name: '伽马星云',
    x: 30,
    y: 70,
    type: 'mining',
    description: '富含稀有矿物的星云地带',
    specialty: ['crystals', 'metal'],
    scarcity: ['food', 'medicine'],
    color: '#f59e0b'
  },
  {
    id: 'delta',
    name: '德尔塔要塞',
    x: 70,
    y: 75,
    type: 'military',
    description: '军事要塞，武器和黑市交易盛行',
    specialty: ['weapons', 'slaves'],
    scarcity: ['food', 'water'],
    color: '#ef4444'
  },
  {
    id: 'epsilon',
    name: '埃普西隆',
    x: 15,
    y: 50,
    type: 'scientific',
    description: '科研殖民地，前沿技术的发源地',
    specialty: ['research', 'medicine'],
    scarcity: ['fuel', 'metal'],
    color: '#06b6d4'
  },
  {
    id: 'zeta',
    name: '泽塔绿洲',
    x: 85,
    y: 50,
    type: 'luxury',
    description: '富人的度假胜地，奢侈品需求巨大',
    specialty: ['luxuries', 'artifacts'],
    scarcity: ['fuel', 'metal'],
    color: '#ec4899'
  },
  {
    id: 'eta',
    name: '伊塔废墟',
    x: 50,
    y: 15,
    type: 'ruins',
    description: '古代文明遗迹，充满神秘和危险',
    specialty: ['artifacts', 'crystals'],
    scarcity: ['medicine', 'electronics'],
    color: '#8b5cf6'
  },
  {
    id: 'theta',
    name: '西塔边境',
    x: 50,
    y: 85,
    type: 'frontier',
    description: '无法地带，任何商品都有买家',
    specialty: ['slaves', 'weapons', 'fuel'],
    scarcity: [],
    color: '#f97316'
  }
];

const INVESTMENT_TEMPLATES = [
  {
    id: 'mine',
    name: '小行星采矿站',
    description: '开发小行星带的矿产资源',
    baseCost: 5000,
    duration: 14,
    returnRate: 0.15,
    risk: 'medium',
    icon: '⛏️'
  },
  {
    id: 'farm',
    name: '水培农场',
    description: '建设高效水培农业设施',
    baseCost: 3000,
    duration: 7,
    returnRate: 0.08,
    risk: 'low',
    icon: '🌾'
  },
  {
    id: 'factory',
    name: '电子工厂',
    description: '建立精密电子元件生产线',
    baseCost: 8000,
    duration: 21,
    returnRate: 0.20,
    risk: 'medium',
    icon: '🏭'
  },
  {
    id: 'lab',
    name: '研究实验室',
    description: '资助前沿科技研究项目',
    baseCost: 15000,
    duration: 30,
    returnRate: 0.30,
    risk: 'high',
    icon: '🔬'
  },
  {
    id: 'trade_hub',
    name: '贸易中转站',
    description: '建设星际贸易物流中心',
    baseCost: 20000,
    duration: 45,
    returnRate: 0.25,
    risk: 'high',
    icon: '🏗️'
  },
  {
    id: 'fuel_refinery',
    name: '燃料精炼厂',
    description: '建设超空间燃料精炼设施',
    baseCost: 10000,
    duration: 25,
    returnRate: 0.18,
    risk: 'medium',
    icon: '🏭'
  }
];
