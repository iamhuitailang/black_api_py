export interface User {
  id: number
  username: string
  role: string
  total_score?: number
  total_kills?: number
  highest_wave?: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface Plane {
  id: number
  plane_id: string
  name: string
  type: string
  description: string
  speed: number
  hp: number
  weapon_type: string
  weapon_damage: number
  weapon_fire_rate: number
  skill_name: string
  skill_description: string
  skill_cooldown: number
  color: string
}

export interface WaveEnemy {
  type: string
  count: number
}

export interface Wave {
  id: number
  wave_number: number
  is_boss_wave: number
  enemies: WaveEnemy[]
  spawn_interval: number
  difficulty_multiplier: number
  description: string
}

export interface ScoreItem {
  id: number
  user_id: number
  username: string
  score: number
  wave: number
  plane_id: string
  kills: number
  play_time: number
  date: string
  rank?: number
}

export interface Achievement {
  id: number
  achievement_id: string
  name: string
  description: string
  icon: string
  category: string
  unlocked?: boolean
  unlocked_at?: string
}

export interface GameStateData {
  playerX: number
  playerY: number
  hp: number
  maxHp: number
  weaponLevel: number
  score: number
  wave: number
  kills: number
  playTime: number
  shieldTime: number
  speedBoostTime: number
  collectedItems: string[]
  usedPlanes: string[]
  perfectWaves: number
  currentWaveKills: number
  enemies: any[]
  bullets: any[]
  powerups: any[]
}

export interface GameState {
  id: number
  user_id: number
  plane_id: string
  state_data: GameStateData
  score: number
  wave: number
  is_active: number
  created_at: string
  updated_at: string
}
