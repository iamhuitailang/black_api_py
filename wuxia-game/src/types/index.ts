export type SectId = 'jian' | 'quan' | 'zhen' | 'nei'

export interface Sect {
  id: SectId
  name: string
  baseAttack: number
  maxHp: number
  maxQi: number
  description: string
  color: string
  icon: string
}

export type SkillType = 'attack' | 'heal' | 'defense' | 'poison'

export interface Skill {
  id: string
  name: string
  sect: SectId
  qiCost: number
  damage: number
  type: SkillType
  effect: string
  soundType: 'sword' | 'fist' | 'needle' | 'inner'
  selfDamage?: number
  heal?: number
  reflectPercent?: number
  poisonDamage?: number
  poisonDuration?: number
  shieldDuration?: number
}

export interface Buff {
  id: string
  name: string
  type: 'buff' | 'debuff'
  duration: number
  effect: {
    reflectPercent?: number
    poisonDamage?: number
  }
}

export interface Equipment {
  id: string
  name: string
  quality: 'bronze' | 'silver' | 'gold'
  type: 'weapon' | 'armor' | 'accessory'
  attackBonus?: number
  hpBonus?: number
  qiBonus?: number
  description: string
}

export interface Player {
  name: string
  sect: SectId
  hp: number
  maxHp: number
  qi: number
  maxQi: number
  baseAttack: number
  skills: string[]
  equipment: Equipment[]
  buffs: Buff[]
}

export interface Enemy {
  id: string
  name: string
  hp: number
  maxHp: number
  attack: number
  aiType: 'aggressive' | 'defensive' | 'balanced'
  description: string
  skillDamage: number
  buffs?: Buff[]
}

export interface StoryChoice {
  id: string
  text: string
  nextNodeId: string
}

export interface StoryNode {
  id: string
  chapter: 1 | 2 | 3
  speaker: string
  dialogue: string
  choices?: StoryChoice[]
  nextBattleId?: string
  nextNodeId?: string
  isEnding?: boolean
  endingId?: string
}

export interface Ending {
  id: string
  title: string
  description: string
  branchKey: string
}

export interface ArenaRecord {
  winStreak: number
  maxWinStreak: number
  medal: 'none' | 'bronze' | 'silver' | 'gold'
  rewards: Equipment[]
}

export interface BattleLogEntry {
  id: number
  text: string
  type: 'player' | 'enemy' | 'system' | 'damage' | 'heal'
}

export type GameScene = 'menu' | 'select-sect' | 'story' | 'battle' | 'arena' | 'ending'
