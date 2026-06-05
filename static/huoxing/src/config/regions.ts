import type { RegionConfig, RegionId } from './types'

export const REGIONS: Record<RegionId, RegionConfig> = {
  landing: {
    id: 'landing',
    name: '着陆点',
    description: '你的殖民之旅从这里开始。地形相对平坦，环境条件较为温和，是建立初始基地的理想位置。',
    position: { lat: -20, lng: 30 },
    environment: {
      temperature: { min: -60, max: -20, current: -40 },
      radiation: 2,
      dustLevel: 1
    },
    resources: {
      iron: { abundance: 0.8, maxExtract: 100 },
      water: { abundance: 0.3, maxExtract: 50 },
      energy: { abundance: 0.9, maxExtract: 200 }
    },
    tasks: [
      {
        id: 'landing_1',
        name: '建立首座居住舱',
        description: '建造第一座基础居住舱，为殖民者提供生存空间。',
        type: 'build',
        target: 1,
        progress: 0,
        reward: { iron: 50, techFragment: 3 },
        completed: false
      },
      {
        id: 'landing_2',
        name: '启动能源系统',
        description: '建造至少2座太阳能电站，确保基地能源供应。',
        type: 'build',
        target: 2,
        progress: 0,
        reward: { energy: 100, techFragment: 5 },
        completed: false
      },
      {
        id: 'landing_3',
        name: '生命维持系统',
        description: '建造氧气循环系统和温室农场，实现自给自足。',
        type: 'build',
        target: 2,
        progress: 0,
        reward: { oxygen: 50, food: 50, techFragment: 5 },
        completed: false
      },
      {
        id: 'landing_4',
        name: '探索周边区域',
        description: '派遣火星车探索着陆点周边100%区域。',
        type: 'explore',
        target: 100,
        progress: 0,
        reward: { rareMineral: 10, techFragment: 10 },
        completed: false
      }
    ]
  },
  canyon: {
    id: 'canyon',
    name: '峡谷探险',
    description: '巨大的水手号峡谷，深度达11公里。地质活动活跃，地下可能蕴藏丰富的水资源和稀有矿物。',
    position: { lat: -10, lng: -60 },
    unlockCondition: {
      tech: 'rover_tech',
      baseLevel: 2
    },
    environment: {
      temperature: { min: -80, max: -10, current: -45 },
      radiation: 3,
      dustLevel: 2
    },
    resources: {
      water: { abundance: 0.9, maxExtract: 200 },
      iron: { abundance: 0.7, maxExtract: 150 },
      rareMineral: { abundance: 0.4, maxExtract: 50 }
    },
    tasks: [
      {
        id: 'canyon_1',
        name: '峡谷勘探',
        description: '驾驶火星车探索峡谷50%区域。',
        type: 'explore',
        target: 50,
        progress: 0,
        reward: { water: 100, techFragment: 8 },
        completed: false
      },
      {
        id: 'canyon_2',
        name: '寻找地下水脉',
        description: '在峡谷中建造水资源提取站。',
        type: 'build',
        target: 1,
        progress: 0,
        reward: { water: 200, techFragment: 12 },
        completed: false
      },
      {
        id: 'canyon_3',
        name: '稀有矿物开采',
        description: '建造稀有矿物矿场，开采峡谷中的稀有资源。',
        type: 'build',
        target: 1,
        progress: 0,
        reward: { rareMineral: 30, techFragment: 15 },
        completed: false
      },
      {
        id: 'canyon_4',
        name: '完全探索',
        description: '100%探索峡谷区域，发现所有秘密。',
        type: 'explore',
        target: 100,
        progress: 0,
        reward: { rareMineral: 50, techFragment: 25 },
        completed: false
      }
    ]
  },
  polar: {
    id: 'polar',
    name: '极地冰盖',
    description: '火星的北极冰盖，由水冰和干冰组成。这里蕴藏着巨量的水资源，但极寒的环境是巨大的挑战。',
    position: { lat: 80, lng: 0 },
    unlockCondition: {
      tech: 'cold_resist',
      completedRegion: 'canyon'
    },
    environment: {
      temperature: { min: -125, max: -40, current: -80 },
      radiation: 4,
      dustLevel: 1
    },
    resources: {
      water: { abundance: 1.5, maxExtract: 500 },
      rareMineral: { abundance: 0.3, maxExtract: 80 }
    },
    tasks: [
      {
        id: 'polar_1',
        name: '建立前哨站',
        description: '在极地建造抗寒的居住设施。',
        type: 'build',
        target: 1,
        progress: 0,
        reward: { techFragment: 15 },
        completed: false
      },
      {
        id: 'polar_2',
        name: '冰层开采',
        description: '建造冰层开采站，开始大规模获取水资源。',
        type: 'build',
        target: 1,
        progress: 0,
        reward: { water: 500, techFragment: 20 },
        completed: false
      },
      {
        id: 'polar_3',
        name: '极夜生存',
        description: '在极夜期间维持基地正常运转100秒。',
        type: 'research',
        target: 100,
        progress: 0,
        reward: { energy: 200, techFragment: 25 },
        completed: false
      },
      {
        id: 'polar_4',
        name: '完全探索',
        description: '100%探索极地冰盖。',
        type: 'explore',
        target: 100,
        progress: 0,
        reward: { water: 1000, rareMineral: 100, techFragment: 40 },
        completed: false
      }
    ]
  },
  volcano: {
    id: 'volcano',
    name: '火山区域',
    description: '塔尔西斯火山群，火星上地质活动最活跃的区域。地热资源丰富，同时也有大量稀有矿物。',
    position: { lat: 0, lng: -110 },
    unlockCondition: {
      tech: 'geothermal_tech',
      completedRegion: 'polar'
    },
    environment: {
      temperature: { min: -30, max: 20, current: 0 },
      radiation: 5,
      dustLevel: 3
    },
    resources: {
      rareMineral: { abundance: 1.2, maxExtract: 200 },
      energy: { abundance: 1.5, maxExtract: 400 },
      iron: { abundance: 0.6, maxExtract: 150 }
    },
    tasks: [
      {
        id: 'volcano_1',
        name: '地热发电',
        description: '建造地热发电站，利用火山能源。',
        type: 'build',
        target: 1,
        progress: 0,
        reward: { energy: 300, techFragment: 20 },
        completed: false
      },
      {
        id: 'volcano_2',
        name: '稀有矿物采集',
        description: '在火山区域收集100单位稀有矿物。',
        type: 'collect',
        target: 100,
        progress: 0,
        reward: { rareMineral: 50, techFragment: 30 },
        completed: false
      },
      {
        id: 'volcano_3',
        name: '高温防护',
        description: '建造辐射防护罩，保护基地免受高温和辐射。',
        type: 'build',
        target: 1,
        progress: 0,
        reward: { techFragment: 35 },
        completed: false
      },
      {
        id: 'volcano_4',
        name: '完全探索',
        description: '100%探索火山区域。',
        type: 'explore',
        target: 100,
        progress: 0,
        reward: { rareMineral: 200, energy: 500, techFragment: 50 },
        completed: false
      }
    ]
  },
  ruins: {
    id: 'ruins',
    name: '远古遗迹',
    description: '神秘的远古文明遗迹，这里的一切都超出人类的认知。据说这里藏有改变人类命运的科技。',
    position: { lat: 30, lng: 120 },
    unlockCondition: {
      tech: 'ancient_detection',
      completedRegion: 'volcano'
    },
    environment: {
      temperature: { min: -50, max: -10, current: -30 },
      radiation: 8,
      dustLevel: 2
    },
    resources: {
      techFragment: { abundance: 2.0, maxExtract: 100 },
      rareMineral: { abundance: 0.8, maxExtract: 150 }
    },
    tasks: [
      {
        id: 'ruins_1',
        name: '遗迹外围探索',
        description: '探索遗迹外围30%区域。',
        type: 'explore',
        target: 30,
        progress: 0,
        reward: { techFragment: 30 },
        completed: false
      },
      {
        id: 'ruins_2',
        name: '破译外星符号',
        description: '研究遗迹中的神秘符号。',
        type: 'research',
        target: 200,
        progress: 0,
        reward: { techFragment: 50 },
        completed: false
      },
      {
        id: 'ruins_3',
        name: '建立外星研究站',
        description: '建造外星科技研究站，深入研究遗迹科技。',
        type: 'build',
        target: 1,
        progress: 0,
        reward: { techFragment: 80 },
        completed: false
      },
      {
        id: 'ruins_4',
        name: '完全探索',
        description: '100%探索远古遗迹，揭开火星的终极秘密。',
        type: 'explore',
        target: 100,
        progress: 0,
        reward: { techFragment: 200, rareMineral: 300 },
        completed: false
      }
    ]
  }
}

export const REGION_ORDER: RegionId[] = ['landing', 'canyon', 'polar', 'volcano', 'ruins']
