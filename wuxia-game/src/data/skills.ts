import type { Skill } from '../types'

export const SKILLS: Skill[] = [
  {
    id: 'jianqi-zongheng',
    name: '剑气纵横',
    sect: 'jian',
    qiCost: 15,
    damage: 55,
    type: 'attack',
    effect: '凝聚真气化为剑气，对敌人造成55点伤害',
    soundType: 'sword'
  },
  {
    id: 'bengshan-ji',
    name: '崩山击',
    sect: 'quan',
    qiCost: 18,
    damage: 65,
    type: 'attack',
    effect: '蓄力一击山崩地裂，造成65点伤害，自身受10点反伤',
    soundType: 'fist',
    selfDamage: 10
  },
  {
    id: 'qiansi-wanlv',
    name: '千丝万缕',
    sect: 'zhen',
    qiCost: 12,
    damage: 35,
    type: 'poison',
    effect: '毒针漫空而至，造成35点伤害，并附加3回合每回合12点毒伤',
    soundType: 'needle',
    poisonDamage: 12,
    poisonDuration: 3
  },
  {
    id: 'taiji-hudun',
    name: '太极护盾',
    sect: 'nei',
    qiCost: 20,
    damage: 0,
    type: 'defense',
    effect: '运转太极内力，回复40点生命，并获得反弹30%伤害的护盾',
    soundType: 'inner',
    heal: 40,
    reflectPercent: 30,
    shieldDuration: 2
  }
]

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find(s => s.id === id)
}

export function getSkillsBySect(sectId: string): Skill[] {
  return SKILLS.filter(s => s.sect === sectId)
}
