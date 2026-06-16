import type { Equipment } from '../types'

export const EQUIPMENTS: Equipment[] = [
  {
    id: 'bronze-sword',
    name: '青铜宝剑',
    quality: 'bronze',
    type: 'weapon',
    attackBonus: 5,
    description: '以青铜铸就的寻常宝剑，江湖中颇为常见。'
  },
  {
    id: 'bronze-armor',
    name: '牛皮护心甲',
    quality: 'bronze',
    type: 'armor',
    hpBonus: 30,
    description: '厚实牛皮所制，可挡寻常兵刃。'
  },
  {
    id: 'bronze-ring',
    name: '聚气铜戒',
    quality: 'bronze',
    type: 'accessory',
    qiBonus: 10,
    description: '略微提升真气恢复的铜制戒指。'
  },
  {
    id: 'silver-sword',
    name: '冷月银锋',
    quality: 'silver',
    type: 'weapon',
    attackBonus: 12,
    description: '银辉似月华流动的利剑，削铁如泥。'
  },
  {
    id: 'silver-armor',
    name: '银丝软甲',
    quality: 'silver',
    type: 'armor',
    hpBonus: 70,
    description: '以千年冰蚕丝混合银线编织，轻便坚韧。'
  },
  {
    id: 'silver-ring',
    name: '灵玉扳指',
    quality: 'silver',
    type: 'accessory',
    qiBonus: 20,
    attackBonus: 3,
    description: '蕴含灵气的古玉扳指，可增益真气。'
  },
  {
    id: 'gold-sword',
    name: '轩辕神剑',
    quality: 'gold',
    type: 'weapon',
    attackBonus: 25,
    description: '上古神器传闻所化，剑气冲斗牛。'
  },
  {
    id: 'gold-armor',
    name: '天蚕宝甲',
    quality: 'gold',
    type: 'armor',
    hpBonus: 150,
    description: '以天山神蚕之丝织就，刀枪不入，水火不侵。'
  },
  {
    id: 'gold-ring',
    name: '乾坤戒',
    quality: 'gold',
    type: 'accessory',
    qiBonus: 40,
    attackBonus: 8,
    hpBonus: 50,
    description: '内藏乾坤的上古异宝，属性全面提升。'
  }
]

export function getEquipment(id: string): Equipment | undefined {
  return EQUIPMENTS.find(e => e.id === id)
}

export function getEquipmentsByQuality(quality: 'bronze' | 'silver' | 'gold'): Equipment[] {
  return EQUIPMENTS.filter(e => e.quality === quality)
}

export const ARENA_REWARDS: Record<string, { equipmentId: string; medal: 'none' | 'bronze' | 'silver' | 'gold' }> = {
  '3': { equipmentId: 'bronze-ring', medal: 'none' },
  '5': { equipmentId: 'bronze-sword', medal: 'bronze' },
  '7': { equipmentId: 'bronze-armor', medal: 'none' },
  '10': { equipmentId: 'silver-sword', medal: 'silver' },
  '13': { equipmentId: 'silver-armor', medal: 'none' },
  '15': { equipmentId: 'silver-ring', medal: 'none' },
  '20': { equipmentId: 'gold-sword', medal: 'gold' },
  '25': { equipmentId: 'gold-armor', medal: 'none' },
  '30': { equipmentId: 'gold-ring', medal: 'none' }
}
