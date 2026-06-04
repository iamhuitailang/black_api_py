export const INITIAL_MAP_SIZE = 20;
export const MAP_SIZE = 30;

export const DEVELOPMENT_STAGES = {
  village: {
    name: '村庄',
    minPopulation: 0,
    maxPopulation: 100,
    unlocks: ['road', 'residential', 'commercial', 'power_plant', 'water_tower'],
    color: '#8BC34A'
  },
  town: {
    name: '小镇',
    minPopulation: 100,
    maxPopulation: 500,
    unlocks: ['industrial', 'hospital', 'school', 'police'],
    color: '#FF9800'
  },
  city: {
    name: '城市',
    minPopulation: 500,
    maxPopulation: 2000,
    unlocks: ['fire_station', 'stadium', 'mall'],
    color: '#2196F3'
  },
  metropolis: {
    name: '大都市',
    minPopulation: 2000,
    maxPopulation: 10000,
    unlocks: ['airport', 'skyscraper', 'landmark'],
    color: '#9C27B0'
  }
};

export const BUILDING_TYPES: Record<string, BuildingConfig> = {
  road: {
    name: '道路',
    icon: '🛤️',
    cost: 100,
    category: 'infrastructure',
    description: '连接各个区域，促进交通'
  },
  residential: {
    name: '住宅区',
    icon: '🏠',
    cost: 500,
    category: 'zone',
    description: '提供居住空间，增加人口',
    populationCapacity: 20,
    taxIncome: 10
  },
  commercial: {
    name: '商业区',
    icon: '🏪',
    cost: 800,
    category: 'zone',
    description: '提供商业服务，增加税收',
    populationCapacity: 5,
    taxIncome: 50
  },
  industrial: {
    name: '工业区',
    icon: '🏭',
    cost: 1000,
    category: 'zone',
    description: '创造就业，增加税收（降低幸福度）',
    populationCapacity: 10,
    taxIncome: 100,
    happinessEffect: -5
  },
  power_plant: {
    name: '发电站',
    icon: '⚡',
    cost: 2000,
    category: 'infrastructure',
    description: '提供电力供应',
    electricityOutput: 100
  },
  water_tower: {
    name: '水塔',
    icon: '💧',
    cost: 1500,
    category: 'infrastructure',
    description: '提供水资源供应',
    waterOutput: 100
  },
  hospital: {
    name: '医院',
    icon: '🏥',
    cost: 3000,
    category: 'service',
    description: '提升市民健康和幸福度',
    maintenanceCost: 50,
    happinessEffect: 10
  },
  school: {
    name: '学校',
    icon: '🏫',
    cost: 2500,
    category: 'service',
    description: '提供教育，提升幸福度',
    maintenanceCost: 30,
    happinessEffect: 8
  },
  police: {
    name: '警察局',
    icon: '🚓',
    cost: 2000,
    category: 'service',
    description: '维护治安，提升幸福度',
    maintenanceCost: 40,
    happinessEffect: 7
  },
  fire_station: {
    name: '消防站',
    icon: '🚒',
    cost: 2500,
    category: 'service',
    description: '应对火灾，保护城市',
    maintenanceCost: 45,
    happinessEffect: 5
  },
  stadium: {
    name: '体育馆',
    icon: '🏟️',
    cost: 5000,
    category: 'service',
    description: '娱乐设施，大幅提升幸福度',
    maintenanceCost: 80,
    happinessEffect: 15
  },
  mall: {
    name: '购物中心',
    icon: '🛍️',
    cost: 4000,
    category: 'service',
    description: '商业中心，增加税收和幸福度',
    maintenanceCost: 60,
    taxIncome: 200,
    happinessEffect: 10
  },
  airport: {
    name: '机场',
    icon: '✈️',
    cost: 10000,
    category: 'infrastructure',
    description: '促进旅游业，大幅增加收入',
    maintenanceCost: 200,
    taxIncome: 500
  },
  skyscraper: {
    name: '摩天大楼',
    icon: '🏙️',
    cost: 8000,
    category: 'zone',
    description: '高密度住宅和商业',
    populationCapacity: 100,
    taxIncome: 300
  },
  park: {
    name: '公园',
    icon: '🌳',
    cost: 1000,
    category: 'service',
    description: '绿色空间，提升幸福度',
    maintenanceCost: 20,
    happinessEffect: 12
  }
};

export const LANDMARKS: Record<string, LandmarkConfig> = {
  statue_of_liberty: {
    name: '自由女神像',
    icon: '🗽',
    cost: 15000,
    description: '象征自由与希望，大幅提升城市形象',
    happinessEffect: 20,
    unlockStage: 'city'
  },
  eiffel_tower: {
    name: '埃菲尔铁塔',
    icon: '🗼',
    cost: 20000,
    description: '浪漫地标，吸引大量游客',
    happinessEffect: 25,
    taxBonus: 200,
    unlockStage: 'city'
  },
  ferris_wheel: {
    name: '摩天轮',
    icon: '🎡',
    cost: 8000,
    description: '城市地标，提升市民幸福度',
    happinessEffect: 15,
    unlockStage: 'town'
  },
  castle: {
    name: '城堡',
    icon: '🏰',
    cost: 25000,
    description: '古老城堡，历史文化象征',
    happinessEffect: 30,
    taxBonus: 300,
    unlockStage: 'metropolis'
  },
  space_needle: {
    name: '太空针塔',
    icon: '🛸',
    cost: 30000,
    description: '未来科技地标',
    happinessEffect: 35,
    taxBonus: 400,
    unlockStage: 'metropolis'
  }
};

export const POLICIES: Record<string, PolicyConfig> = {
  low_tax: {
    name: '低税收政策',
    description: '降低税率，吸引更多居民（税收-20%，人口增长+30%）',
    effect: { taxMultiplier: 0.8, populationGrowthMultiplier: 1.3 },
    cost: 0
  },
  high_tax: {
    name: '高税收政策',
    description: '提高税率，增加财政收入（税收+30%，人口增长-15%）',
    effect: { taxMultiplier: 1.3, populationGrowthMultiplier: 0.85 },
    cost: 0
  },
  green_initiative: {
    name: '绿色环保计划',
    description: '保护环境，提升幸福度（幸福度+10，维护成本+15%）',
    effect: { happinessBonus: 10, maintenanceMultiplier: 1.15 },
    cost: 100
  },
  tech_fund: {
    name: '科技发展基金',
    description: '投资科技，促进商业发展（商业收入+25%，维护成本+20%）',
    effect: { commercialMultiplier: 1.25, maintenanceMultiplier: 1.2 },
    cost: 200
  },
  tourism_boost: {
    name: '旅游业振兴',
    description: '发展旅游业，增加地标收入（地标收入+50%）',
    effect: { landmarkMultiplier: 1.5 },
    cost: 150
  }
};

export const DISASTERS = {
  fire: {
    name: '火灾',
    icon: '🔥',
    probability: 0.02,
    damage: 0.1,
    description: '建筑起火，需要消防站应对'
  },
  earthquake: {
    name: '地震',
    icon: '🌋',
    probability: 0.01,
    damage: 0.25,
    description: '强烈地震，造成大面积破坏'
  },
  flood: {
    name: '洪水',
    icon: '🌊',
    probability: 0.015,
    damage: 0.15,
    description: '洪水来袭，低洼地区受灾'
  }
};

export interface BuildingConfig {
  name: string;
  icon: string;
  cost: number;
  category: string;
  description: string;
  populationCapacity?: number;
  taxIncome?: number;
  electricityOutput?: number;
  waterOutput?: number;
  maintenanceCost?: number;
  happinessEffect?: number;
}

export interface LandmarkConfig {
  name: string;
  icon: string;
  cost: number;
  description: string;
  happinessEffect: number;
  taxBonus?: number;
  unlockStage: string;
}

export interface PolicyConfig {
  name: string;
  description: string;
  effect: Record<string, number>;
  cost: number;
}

export interface TileData {
  type: string;
  zone: string | null;
  building: string | null;
  level: number;
}
