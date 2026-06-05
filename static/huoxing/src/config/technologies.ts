import type { TechConfig } from './types'

export const TECHNOLOGIES: TechConfig[] = [
  {
    id: 'basic_mining',
    name: '基础采矿技术',
    description: '提升矿场效率20%，解锁更多建筑类型。',
    icon: '⛏️',
    tier: 1,
    cost: { techFragment: 5, energy: 30 },
    researchTime: 45,
    prerequisites: [],
    effects: [
      { type: 'production_modifier', target: 'iron', value: 0.2 }
    ]
  },
  {
    id: 'water_purification',
    name: '水资源净化',
    description: '提升水资源提取效率30%，降低消耗。',
    icon: '💧',
    tier: 1,
    cost: { techFragment: 5, energy: 30 },
    researchTime: 45,
    prerequisites: [],
    effects: [
      { type: 'production_modifier', target: 'water', value: 0.3 }
    ]
  },
  {
    id: 'solar_efficiency',
    name: '太阳能优化',
    description: '太阳能发电效率提升25%，夜间发电损失降低。',
    icon: '☀️',
    tier: 1,
    cost: { techFragment: 5, energy: 30 },
    researchTime: 45,
    prerequisites: [],
    effects: [
      { type: 'production_modifier', target: 'energy', value: 0.25 }
    ]
  },
  {
    id: 'hydroponics',
    name: '水培种植技术',
    description: '温室农场产量提升40%，水资源消耗降低20%。',
    icon: '🌱',
    tier: 2,
    cost: { techFragment: 10, energy: 60 },
    researchTime: 75,
    prerequisites: ['water_purification'],
    effects: [
      { type: 'production_modifier', target: 'food', value: 0.4 }
    ]
  },
  {
    id: 'storage_tech',
    name: '高级存储技术',
    description: '所有资源存储上限提升50%。',
    icon: '📦',
    tier: 2,
    cost: { techFragment: 10, energy: 60 },
    researchTime: 75,
    prerequisites: ['basic_mining'],
    effects: [
      { type: 'storage_bonus', target: 'all', value: 0.5 }
    ]
  },
  {
    id: 'rover_tech',
    name: '火星车技术',
    description: '解锁火星探索功能，可以派遣火星车探索其他区域。',
    icon: '🚗',
    tier: 2,
    cost: { techFragment: 15, energy: 80 },
    researchTime: 90,
    prerequisites: ['basic_mining', 'solar_efficiency'],
    effects: [
      { type: 'unlock_region', target: 'canyon', value: 1 }
    ]
  },
  {
    id: 'deep_mining',
    name: '深层采矿技术',
    description: '解锁稀有矿物矿场，可以开采稀有矿物。',
    icon: '💎',
    tier: 3,
    cost: { techFragment: 20, energy: 120 },
    researchTime: 120,
    prerequisites: ['storage_tech'],
    effects: [
      { type: 'unlock_building', target: 'rare_mine', value: 1 }
    ]
  },
  {
    id: 'cold_resist',
    name: '抗寒技术',
    description: '解锁极地冰盖区域，建筑抗寒能力提升。',
    icon: '🧊',
    tier: 3,
    cost: { techFragment: 20, energy: 120 },
    researchTime: 120,
    prerequisites: ['rover_tech'],
    effects: [
      { type: 'unlock_region', target: 'polar', value: 1 },
      { type: 'environment_resist', target: 'cold', value: 0.5 }
    ]
  },
  {
    id: 'geothermal_tech',
    name: '地热利用技术',
    description: '解锁地热发电站，解锁火山区域探索。',
    icon: '🌋',
    tier: 3,
    cost: { techFragment: 25, energy: 150 },
    researchTime: 150,
    prerequisites: ['deep_mining'],
    effects: [
      { type: 'unlock_region', target: 'volcano', value: 1 },
      { type: 'unlock_building', target: 'geothermal_plant', value: 1 }
    ]
  },
  {
    id: 'shield_tech',
    name: '辐射防护技术',
    description: '解锁辐射防护罩，降低环境伤害50%。',
    icon: '🛡️',
    tier: 4,
    cost: { techFragment: 30, energy: 200 },
    researchTime: 180,
    prerequisites: ['cold_resist', 'geothermal_tech'],
    effects: [
      { type: 'unlock_building', target: 'shield_generator', value: 1 },
      { type: 'environment_resist', target: 'radiation', value: 0.5 }
    ]
  },
  {
    id: 'ancient_detection',
    name: '遗迹探测技术',
    description: '可以探测到远古遗迹的位置，解锁远古遗迹区域。',
    icon: '📡',
    tier: 4,
    cost: { techFragment: 35, energy: 250 },
    researchTime: 200,
    prerequisites: ['shield_tech'],
    effects: [
      { type: 'unlock_region', target: 'ruins', value: 1 }
    ]
  },
  {
    id: 'ancient_decrypt',
    name: '远古科技解密',
    description: '破译远古文明的科技，解锁外星科技研究站。',
    icon: '🔐',
    tier: 5,
    cost: { techFragment: 50, energy: 400 },
    researchTime: 300,
    prerequisites: ['ancient_detection'],
    effects: [
      { type: 'unlock_building', target: 'alien_research', value: 1 }
    ]
  },
  {
    id: 'terraforming',
    name: '火星地球化',
    description: '终极科技！开始改造火星环境，逐步提升居住适宜度。',
    icon: '🌍',
    tier: 5,
    cost: { techFragment: 100, energy: 1000 },
    researchTime: 600,
    prerequisites: ['ancient_decrypt', 'shield_tech'],
    effects: [
      { type: 'environment_resist', target: 'all', value: 0.8 }
    ]
  }
]

export const TECH_TIER_COLORS: Record<number, string> = {
  1: '#9CA3AF',
  2: '#3B82F6',
  3: '#8B5CF6',
  4: '#F59E0B',
  5: '#EF4444'
}
