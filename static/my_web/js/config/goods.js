const GOODS = {
  water: {
    id: 'water',
    name: '纯净水',
    description: '经过过滤的饮用水，宇宙中的硬通货',
    basePrice: 50,
    rarity: 'common',
    icon: '💧'
  },
  food: {
    id: 'food',
    name: '营养口粮',
    description: '高能量合成食品，保质期长',
    basePrice: 80,
    rarity: 'common',
    icon: '🍞'
  },
  fuel: {
    id: 'fuel',
    name: '超空间燃料',
    description: '用于星际航行的高能燃料',
    basePrice: 120,
    rarity: 'common',
    icon: '⛽'
  },
  metal: {
    id: 'metal',
    name: '精炼金属',
    description: '工业级精炼合金，制造必需品',
    basePrice: 200,
    rarity: 'common',
    icon: '🔩'
  },
  electronics: {
    id: 'electronics',
    name: '电子元件',
    description: '精密电子元器件，用途广泛',
    basePrice: 350,
    rarity: 'uncommon',
    icon: '🔌'
  },
  medicine: {
    id: 'medicine',
    name: '医疗物资',
    description: '急救药品和医疗设备',
    basePrice: 500,
    rarity: 'uncommon',
    icon: '💊'
  },
  crystals: {
    id: 'crystals',
    name: '能量水晶',
    description: '蕴含神秘能量的稀有晶体',
    basePrice: 800,
    rarity: 'rare',
    icon: '💎'
  },
  artifacts: {
    id: 'artifacts',
    name: '古代遗物',
    description: '来自失落文明的神秘器物',
    basePrice: 2000,
    rarity: 'rare',
    icon: '🏺'
  },
  slaves: {
    id: 'slaves',
    name: '契约劳工',
    description: '有争议的商品，某些星系非法',
    basePrice: 1500,
    rarity: 'uncommon',
    icon: '👥',
    illegal: true
  },
  weapons: {
    id: 'weapons',
    name: '武器装备',
    description: '各类武器和弹药，受管制',
    basePrice: 1200,
    rarity: 'uncommon',
    icon: '🔫',
    illegal: true
  },
  luxuries: {
    id: 'luxuries',
    name: '奢侈品',
    description: '高端消费品，富人的最爱',
    basePrice: 3000,
    rarity: 'rare',
    icon: '👑'
  },
  research: {
    id: 'research',
    name: '科研数据',
    description: '珍贵的研究成果和数据',
    basePrice: 5000,
    rarity: 'legendary',
    icon: '📊'
  }
};

const GOOD_IDS = Object.keys(GOODS);
