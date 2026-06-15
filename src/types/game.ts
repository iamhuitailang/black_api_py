export enum ZombieType {
  WALKER = 'walker',
  RUNNER = 'runner',
  TANK = 'tank',
}

export interface Zombie {
  id: string;
  type: ZombieType;
  x: number;
  distance: number;
  health: number;
  maxHealth: number;
  speed: number;
  size: number;
  score: number;
  isDead: boolean;
  hitFlash: number;
  deathAnimation: number;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'victory' | 'gameover';

export interface GameState {
  status: GameStatus;
  currentWave: number;
  lives: number;
  score: number;
  magazine: number;
  maxMagazine: number;
  isReloading: boolean;
  reloadProgress: number;
  totalShots: number;
  headshots: number;
  zombies: Zombie[];
  waveZombieQueue: ZombieType[];
  waveSpawnTimer: number;
  showWaveNotice: boolean;
  waveNoticeText: string;
  screenShake: number;
  muzzleFlash: number;
  damageNumbers: DamageNumber[];
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  isHeadshot: boolean;
  life: number;
}

export interface SaveData {
  highestWave: number;
  bestScore: number;
  totalShots: number;
  totalHeadshots: number;
  headshotAccuracy: number;
  lastPlayedWave: number;
  lastPlayedScore: number;
  lastPlayedLives: number;
  savedAt: number;
}

export interface WaveConfig {
  wave: number;
  walkers: number;
  runners: number;
  tanks: number;
  spawnInterval: number;
}

export interface ZombieConfig {
  type: ZombieType;
  health: number;
  speed: number;
  size: number;
  score: number;
  headMultiplier: number;
}
