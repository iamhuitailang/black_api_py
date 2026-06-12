export interface HamsterSkin {
  id: string
  name: string
  color: string
  bellyColor: string
  price: number
  currency: 'coins' | 'diamonds'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description: string
  emoji: string
}

export interface SnowballEffect {
  id: string
  name: string
  trailColor: string
  particleColor: string
  price: number
  currency: 'coins' | 'diamonds'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description: string
}

export interface Decoration {
  id: string
  name: string
  type: 'hat' | 'accessory' | 'back'
  price: number
  currency: 'coins' | 'diamonds'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description: string
  emoji: string
}

export interface Item {
  id: string
  name: string
  description: string
  price: number
  currency: 'coins' | 'diamonds'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  effect: ItemEffect
  emoji: string
  duration?: number
}

export interface ItemEffect {
  type: 'speed' | 'bomb' | 'shield' | 'slow' | 'magnet' | 'double' | 'teleport' | 'shrink'
  value: number
  duration?: number
}

export interface MapData {
  id: string
  name: string
  description: string
  bgGradient: string[]
  groundColor: string
  width: number
  height: number
  obstacles: ObstacleConfig[]
  itemSpawnPoints: { x: number; y: number }[]
  weather: 'snow' | 'clear' | 'blizzard' | 'aurora'
  difficulty: 1 | 2 | 3 | 4 | 5
  unlockCondition: string
  unlockLevel: number
  previewEmoji: string
}

export interface ObstacleConfig {
  type: 'snowdrift' | 'ice_crack' | 'ice_ramp' | 'bounce_pad' | 'rock'
  x: number
  y: number
  width: number
  height: number
  effect: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  reward: { type: 'coins' | 'diamonds'; amount: number }
  condition: AchievementCondition
  emoji: string
}

export interface AchievementCondition {
  type: 'win_count' | 'total_games' | 'max_snowball' | 'total_coins' | 'level'
  value: number
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert'
export type AIType = 'aggressive' | 'defensive' | 'balanced' | 'tricky'
