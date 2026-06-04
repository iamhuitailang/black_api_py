export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

export type EntityType = 'player' | 'enemy' | 'boss' | 'item' | 'platform' | 'projectile' | 'obstacle';

export type ItemType = 'coin' | 'health' | 'invincible' | 'speed' | 'power' | 'shield';

export type EnemyType = 'wolf' | 'bee' | 'vine' | 'slime' | 'lavaworm' | 'dragon' | 'snowball' | 'bat' | 'giant' | 'robot' | 'turret' | 'blackhole';

export type BossType = 'forest_king' | 'volcano_lord' | 'ice_queen' | 'space_emperor';

export type LevelTheme = 'forest' | 'volcano' | 'ice' | 'space';

export type PlatformType = 'normal' | 'moving' | 'breakable' | 'ice' | 'bounce';

export type ObstacleType = 'spike' | 'lava' | 'pit' | 'laser' | 'wind' | 'meteor';

export interface CharacterStats {
  id: string;
  name: string;
  health: number;
  speed: number;
  attack: number;
  ranged?: boolean;
  price?: number;
  description: string;
}

export interface GameEntity extends Rect {
  id: string;
  type: EntityType;
  velocity: Vector2;
  active: boolean;
  facing: Direction;
}

export interface Player extends GameEntity {
  type: 'player';
  characterId: string;
  health: number;
  maxHealth: number;
  speed: number;
  attackPower: number;
  isGrounded: boolean;
  isJumping: boolean;
  isAttacking: boolean;
  attackCooldown: number;
  invincible: boolean;
  invincibleTimer: number;
  hasShield: boolean;
  speedBoost: boolean;
  powerBoost: boolean;
  boostTimer: number;
  coins: number;
  score: number;
}

export interface Enemy extends GameEntity {
  type: 'enemy';
  enemyType: EnemyType;
  health: number;
  maxHealth: number;
  damage: number;
  behavior: 'patrol' | 'chase' | 'fly' | 'stationary';
  patrolPoints?: Vector2[];
  currentPatrolIndex?: number;
  attackCooldown: number;
}

export interface Boss extends GameEntity {
  type: 'boss';
  bossType: BossType;
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  phase: number;
  attackPattern: number;
  attackTimer: number;
  patterns: BossPattern[];
}

export interface BossPattern {
  name: string;
  duration: number;
  damage: number;
  projectile?: boolean;
}

export interface Item extends GameEntity {
  type: 'item';
  itemType: ItemType;
  value: number;
  collected: boolean;
  bobOffset: number;
}

export interface Platform extends Rect {
  type: 'platform';
  platformType: PlatformType;
  active: boolean;
  moveDirection?: Vector2;
  moveRange?: number;
  originalPosition?: Vector2;
  breakTimer?: number;
}

export interface Obstacle extends Rect {
  type: 'obstacle';
  obstacleType: ObstacleType;
  damage: number;
  active: boolean;
  timer?: number;
  interval?: number;
}

export interface Projectile extends GameEntity {
  type: 'projectile';
  damage: number;
  owner: 'player' | 'enemy' | 'boss';
  lifetime: number;
}

export interface LevelData {
  id: number;
  name: string;
  theme: LevelTheme;
  width: number;
  height: number;
  spawnPoint: Vector2;
  platforms: Platform[];
  enemies: Enemy[];
  items: Item[];
  obstacles: Obstacle[];
  boss: Boss | null;
  bossSpawnPoint: Vector2;
  backgroundColor: string;
  groundColor: string;
  accentColor: string;
}

export interface GameState {
  unlockedLevels: number[];
  levelStars: Record<number, number>;
  levelScores: Record<number, number>;
  totalCoins: number;
  unlockedCharacters: string[];
  currentCharacter: string;
  inventory: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'item' | 'character';
  price: number;
  description: string;
  owned: boolean;
  icon: string;
}

export interface GameSaveData {
  version: string;
  timestamp: number;
  gameState: GameState;
  settings: {
    soundEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
  };
}

export interface KeyboardState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  attack: boolean;
  pause: boolean;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory' | 'boss' | 'loading' | 'custom';
