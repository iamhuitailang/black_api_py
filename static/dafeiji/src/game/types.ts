export interface Vector2 {
  x: number
  y: number
}

export interface Entity {
  id: string
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

export interface PlayerState extends Entity {
  speed: number
  hp: number
  maxHp: number
  weaponLevel: number
  weaponDamage: number
  fireRate: number
  lastFireTime: number
  skillCooldown: number
  lastSkillTime: number
  invincible: boolean
  invincibleTime: number
  shieldTime: number
  speedBoostTime: number
  planeId: string
  color: string
}

export type EnemyType = 'small' | 'medium' | 'heavy' | 'boss' | 'elite'

export interface EnemyState extends Entity {
  type: EnemyType
  hp: number
  maxHp: number
  speed: number
  damage: number
  score: number
  dropRate: number
  fireRate: number
  lastFireTime: number
  color: string
  pattern: string
  patternTime: number
  isBoss?: boolean
  phase?: number
}

export interface BulletState extends Entity {
  speedX: number
  speedY: number
  damage: number
  isPlayerBullet: boolean
  color: string
  type: string
}

export type PowerUpType = 'shield' | 'clear' | 'weapon' | 'health' | 'speed'

export interface PowerUpState extends Entity {
  type: PowerUpType
  duration: number
  createdAt: number
}

export interface ParticleState {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: 'spark' | 'explosion' | 'trail' | 'text'
  text?: string
}

export interface WaveState {
  waveNumber: number
  isBossWave: boolean
  enemies: { type: EnemyType; count: number }[]
  spawnInterval: number
  difficultyMultiplier: number
  description: string
}

export interface GameState {
  isRunning: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  wave: number
  kills: number
  playTime: number
  stateId: number | null
  waveAnnouncement: boolean
  waveAnnouncementTime: number
  waveIntervalTime: number
  betweenWaves: boolean
  collectedItems: string[]
  usedPlanes: string[]
  perfectWaves: number
  currentWaveDamaged: boolean
  newAchievements: any[]
}
