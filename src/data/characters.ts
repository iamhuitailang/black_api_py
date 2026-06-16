
export interface CharacterSpecial {
  name: string
  type: 'single' | 'multi' | 'stun' | 'charge'
  damage: number
  hits: number
  chargeTime: number
  stunTime: number
  description: string
}

export interface CharacterConfig {
  id: string
  name: string
  color: string
  hp: number
  attack: number
  defense: number
  speed: number
  special: CharacterSpecial
}

export const CHARACTERS: Record<string, CharacterConfig> = {
  longquan: {
    id: 'longquan',
    name: '龙拳',
    color: '#ff4444',
    hp: 100,
    attack: 12,
    defense: 8,
    speed: 5,
    special: {
      name: '升龙拳',
      type: 'single',
      damage: 45,
      hits: 1,
      chargeTime: 0,
      stunTime: 0,
      description: '消耗满气槽造成45伤害'
    }
  },
  jifeng: {
    id: 'jifeng',
    name: '疾风',
    color: '#44dd44',
    hp: 85,
    attack: 10,
    defense: 6,
    speed: 8,
    special: {
      name: '影分身',
      type: 'multi',
      damage: 15,
      hits: 3,
      chargeTime: 0,
      stunTime: 0,
      description: '消耗满气槽造成3×15伤害'
    }
  },
  tiebi: {
    id: 'tiebi',
    name: '铁壁',
    color: '#4488ff',
    hp: 130,
    attack: 8,
    defense: 14,
    speed: 3,
    special: {
      name: '铁山靠',
      type: 'stun',
      damage: 35,
      hits: 1,
      chargeTime: 0,
      stunTime: 2000,
      description: '消耗满气槽造成35伤害+击倒2秒'
    }
  },
  huanying: {
    id: 'huanying',
    name: '幻影',
    color: '#bb55ff',
    hp: 90,
    attack: 11,
    defense: 7,
    speed: 7,
    special: {
      name: '瞬狱杀',
      type: 'charge',
      damage: 50,
      hits: 1,
      chargeTime: 500,
      stunTime: 0,
      description: '消耗满气槽造成50伤害，蓄力0.5秒'
    }
  }
}

export const CHARACTER_LIST = Object.values(CHARACTERS)

export const GAME_CONFIG = {
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 540,
  GROUND_Y: 440,
  ATTACK_RANGE: 60,
  ATTACK_FRAMES: 8,
  ATTACK_COOLDOWN: 20,
  HURT_FRAMES: 15,
  ROUND_TIME: 60,
  WIN_ROUNDS: 2,
  ENERGY_ON_HIT: 8,
  ENERGY_ON_HURT: 12,
  IDLE_TIMEOUT: 300000,
  STORAGE_KEY: 'fighting_game_save_v1'
} as const
