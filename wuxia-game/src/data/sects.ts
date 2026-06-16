import type { Sect } from '../types'

export const SECTS: Sect[] = [
  {
    id: 'jian',
    name: '剑宗',
    baseAttack: 28,
    maxHp: 200,
    maxQi: 100,
    description: '剑走偏锋，剑气纵横。以灵巧剑术见长，一击必杀，攻守兼备。',
    color: '#c23b22',
    icon: '⚔️'
  },
  {
    id: 'quan',
    name: '拳宗',
    baseAttack: 32,
    maxHp: 240,
    maxQi: 100,
    description: '拳破山河，气势如虹。以刚猛拳法著称，伤敌一千自损八百。',
    color: '#d4a574',
    icon: '👊'
  },
  {
    id: 'zhen',
    name: '针宗',
    baseAttack: 18,
    maxHp: 180,
    maxQi: 100,
    description: '暗器如星，毒针夺命。以诡异毒针见长，绵绵不绝，蚀骨销魂。',
    color: '#4a7c59',
    icon: '📍'
  },
  {
    id: 'nei',
    name: '内宗',
    baseAttack: 15,
    maxHp: 220,
    maxQi: 100,
    description: '太极生两仪，四两拨千斤。以内功心法见长，护己反弹，源远流长。',
    color: '#6b4c9a',
    icon: '☯️'
  }
]

export function getSect(id: string): Sect | undefined {
  return SECTS.find(s => s.id === id)
}
