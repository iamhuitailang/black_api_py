import type { BuildingConfig } from './types'

export const BUILDINGS: BuildingConfig[] = [
  {
    id: 'habitat_basic',
    name: '基础居住舱',
    description: '为殖民者提供基本的生活空间，消耗氧气和能源，维持人口生存。',
    icon: '🏠',
    category: 'habitat',
    cost: { iron: 50, energy: 20 },
    production: {},
    consumption: { oxygen: 2, energy: 3, food: 1 },
    buildTime: 30,
    maxLevel: 5
  },
  {
    id: 'solar_panel',
    name: '太阳能电站',
    description: '利用火星太阳光发电，是基地的主要能源来源。夜间效率降低。',
    icon: '☀️',
    category: 'power',
    cost: { iron: 40, water: 10 },
    production: { energy: 8 },
    consumption: {},
    buildTime: 25,
    maxLevel: 5
  },
  {
    id: 'oxygen_generator',
    name: '氧气循环系统',
    description: '通过电解水或分解二氧化碳产生氧气，维持基地大气环境。',
    icon: '🌬️',
    category: 'life',
    cost: { iron: 60, water: 20, energy: 30 },
    production: { oxygen: 6 },
    consumption: { water: 2, energy: 4 },
    buildTime: 35,
    maxLevel: 5
  },
  {
    id: 'water_extractor',
    name: '水资源提取站',
    description: '从火星土壤或冰层中提取水资源，是生存的关键设施。',
    icon: '💧',
    category: 'production',
    cost: { iron: 80, energy: 40 },
    production: { water: 5 },
    consumption: { energy: 6 },
    buildTime: 40,
    maxLevel: 5
  },
  {
    id: 'mine_basic',
    name: '基础矿场',
    description: '开采火星地表的铁矿和其他基础矿物，为建筑提供原材料。',
    icon: '⛏️',
    category: 'production',
    cost: { iron: 30, energy: 25 },
    production: { iron: 4 },
    consumption: { energy: 5 },
    buildTime: 20,
    maxLevel: 5
  },
  {
    id: 'greenhouse',
    name: '温室农场',
    description: '在受控环境中种植作物，生产食物。需要充足的水资源和能源。',
    icon: '🌱',
    category: 'life',
    cost: { iron: 70, water: 30, energy: 35 },
    production: { food: 4 },
    consumption: { water: 3, energy: 5 },
    buildTime: 45,
    maxLevel: 5
  },
  {
    id: 'research_lab',
    name: '研究实验室',
    description: '进行科学研究，加速科技研发进度。',
    icon: '🔬',
    category: 'research',
    cost: { iron: 100, water: 20, energy: 50 },
    production: {},
    consumption: { energy: 8 },
    buildTime: 60,
    maxLevel: 3
  },
  {
    id: 'storage_unit',
    name: '存储仓库',
    description: '增加所有资源的存储上限。',
    icon: '📦',
    category: 'production',
    cost: { iron: 45 },
    production: {},
    consumption: {},
    buildTime: 15,
    maxLevel: 10
  },
  {
    id: 'rover_factory',
    name: '火星车工厂',
    description: '生产和维护火星探索车，解锁区域探索功能。',
    icon: '🚗',
    category: 'production',
    cost: { iron: 150, rareMineral: 20, energy: 80 },
    production: {},
    consumption: { energy: 10 },
    buildTime: 80,
    maxLevel: 2,
    unlockCondition: { baseLevel: 2 }
  },
  {
    id: 'geothermal_plant',
    name: '地热发电站',
    description: '利用火星地热能发电，不受昼夜影响，效率稳定。',
    icon: '🌋',
    category: 'power',
    cost: { iron: 120, rareMineral: 30, energy: 60 },
    production: { energy: 15 },
    consumption: {},
    buildTime: 70,
    maxLevel: 3,
    unlockCondition: { tech: 'geothermal_tech', region: 'volcano' }
  },
  {
    id: 'ice_mining',
    name: '冰层开采站',
    description: '专门开采极地冰盖的冰层，获取大量水资源。',
    icon: '🧊',
    category: 'production',
    cost: { iron: 100, rareMineral: 25, energy: 70 },
    production: { water: 12 },
    consumption: { energy: 10 },
    buildTime: 65,
    maxLevel: 3,
    unlockCondition: { tech: 'cold_resist', region: 'polar' }
  },
  {
    id: 'rare_mine',
    name: '稀有矿物矿场',
    description: '开采稀有矿物，用于高级建筑和科技研发。',
    icon: '💎',
    category: 'production',
    cost: { iron: 130, energy: 90 },
    production: { rareMineral: 2 },
    consumption: { energy: 12 },
    buildTime: 75,
    maxLevel: 3,
    unlockCondition: { tech: 'deep_mining' }
  },
  {
    id: 'shield_generator',
    name: '辐射防护罩',
    description: '生成防护罩，降低辐射和沙尘暴对基地的影响。',
    icon: '🛡️',
    category: 'life',
    cost: { iron: 200, rareMineral: 50, energy: 150 },
    production: {},
    consumption: { energy: 20 },
    buildTime: 100,
    maxLevel: 3,
    unlockCondition: { tech: 'shield_tech' }
  },
  {
    id: 'alien_research',
    name: '外星科技研究站',
    description: '研究远古遗迹中的外星科技，解锁终极科技树。',
    icon: '🛸',
    category: 'research',
    cost: { iron: 300, rareMineral: 100, techFragment: 30, energy: 200 },
    production: { techFragment: 1 },
    consumption: { energy: 30 },
    buildTime: 120,
    maxLevel: 1,
    unlockCondition: { tech: 'ancient_decrypt', region: 'ruins' }
  }
]

export const BUILDING_CATEGORIES = {
  habitat: { name: '居住设施', icon: '🏠' },
  power: { name: '能源设施', icon: '⚡' },
  life: { name: '生命维持', icon: '❤️' },
  production: { name: '生产设施', icon: '🏭' },
  research: { name: '研究设施', icon: '🔬' }
}
