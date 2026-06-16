import type { Enemy } from '../types'

export const ENEMIES: Record<string, Enemy> = {
  'xiao-luo-luo': {
    id: 'xiao-luo-luo',
    name: '山贼小喽啰',
    hp: 80,
    maxHp: 80,
    attack: 12,
    aiType: 'aggressive',
    description: '占山为王的小毛贼，功夫平平但人多势众。',
    skillDamage: 20
  },
  'shan-zei-tou-mu': {
    id: 'shan-zei-tou-mu',
    name: '山贼头目',
    hp: 140,
    maxHp: 140,
    attack: 18,
    aiType: 'balanced',
    description: '这群山贼的首领，略有几分蛮力。',
    skillDamage: 30
  },
  'hei-feng-ke': {
    id: 'hei-feng-ke',
    name: '黑风客',
    hp: 180,
    maxHp: 180,
    attack: 22,
    aiType: 'aggressive',
    description: '江湖上臭名昭著的独行杀手，出手狠辣。',
    skillDamage: 40
  },
  'du-men-di-zi': {
    id: 'du-men-di-zi',
    name: '毒门弟子',
    hp: 120,
    maxHp: 120,
    attack: 15,
    aiType: 'defensive',
    description: '擅使毒功，令人防不胜防。',
    skillDamage: 28
  },
  'tie-bu-shan': {
    id: 'tie-bu-shan',
    name: '铁布衫武夫',
    hp: 220,
    maxHp: 220,
    attack: 20,
    aiType: 'defensive',
    description: '一身横练功夫，刀枪不入。',
    skillDamage: 35
  },
  'jian-ke': {
    id: 'jian-ke',
    name: '流浪剑客',
    hp: 160,
    maxHp: 160,
    attack: 25,
    aiType: 'balanced',
    description: '落魄江湖的剑客，剑法颇有造诣。',
    skillDamage: 42
  },
  'mo-jiao-zhang-lao': {
    id: 'mo-jiao-zhang-lao',
    name: '魔教长老',
    hp: 260,
    maxHp: 260,
    attack: 28,
    aiType: 'balanced',
    description: '魔教中的实权人物，武功深不可测。',
    skillDamage: 50
  },
  'zheng-pai-gao-shou': {
    id: 'zheng-pai-gao-shou',
    name: '正派高手',
    hp: 240,
    maxHp: 240,
    attack: 26,
    aiType: 'balanced',
    description: '名门正派的一流高手，为人刚正。',
    skillDamage: 48
  },
  'jiang-hu-bai-xiao': {
    id: 'jiang-hu-bai-xiao',
    name: '江湖百晓生',
    hp: 150,
    maxHp: 150,
    attack: 20,
    aiType: 'defensive',
    description: '通晓江湖百事，智计百出。',
    skillDamage: 38
  },
  'gui-ying-shou': {
    id: 'gui-ying-shou',
    name: '鬼影子',
    hp: 170,
    maxHp: 170,
    attack: 30,
    aiType: 'aggressive',
    description: '轻功卓绝，来去如风，杀人于无形。',
    skillDamage: 55
  },
  'mo-jiao-jiao-zhu': {
    id: 'mo-jiao-jiao-zhu',
    name: '魔教教主',
    hp: 400,
    maxHp: 400,
    attack: 35,
    aiType: 'aggressive',
    description: '一统魔道的不世枭雄，神功盖世。',
    skillDamage: 70
  },
  'zheng-pai-meng-zhu': {
    id: 'zheng-pai-meng-zhu',
    name: '正派盟主',
    hp: 380,
    maxHp: 380,
    attack: 33,
    aiType: 'balanced',
    description: '统领正道的武林泰斗，德高望重。',
    skillDamage: 65
  },
  'yin-xiong-xia': {
    id: 'yin-xiong-xia',
    name: '隐世奇侠',
    hp: 450,
    maxHp: 450,
    attack: 38,
    aiType: 'balanced',
    description: '退隐多年的传奇人物，出手必惊天地。',
    skillDamage: 80
  }
}

export function getEnemy(id: string): Enemy | undefined {
  return ENEMIES[id]
}

export function cloneEnemy(id: string): Enemy | null {
  const e = ENEMIES[id]
  if (!e) return null
  return { ...e, hp: e.maxHp, buffs: [] }
}

export const ARENA_OPPONENTS: string[] = [
  'xiao-luo-luo',
  'shan-zei-tou-mu',
  'du-men-di-zi',
  'jian-ke',
  'tie-bu-shan',
  'hei-feng-ke',
  'jiang-hu-bai-xiao',
  'gui-ying-shou',
  'zheng-pai-gao-shou',
  'mo-jiao-zhang-lao'
]
