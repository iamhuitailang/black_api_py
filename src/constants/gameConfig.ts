import { ZombieType, WaveConfig, ZombieConfig } from '@/types/game';

export const MAX_MAGAZINE = 8;
export const RELOAD_TIME = 2000;
export const MAX_LIVES = 3;
export const TOTAL_WAVES = 10;
export const SPAWN_DISTANCE = 100;
export const DANGER_DISTANCE = 0;
export const BASE_ZOMBIE_SPEED = 0.15;

export const ZOMBIE_CONFIGS: Record<ZombieType, ZombieConfig> = {
  [ZombieType.WALKER]: {
    type: ZombieType.WALKER,
    health: 3,
    speed: 1,
    size: 1,
    score: 10,
    headMultiplier: 3,
  },
  [ZombieType.RUNNER]: {
    type: ZombieType.RUNNER,
    health: 1,
    speed: 3,
    size: 0.85,
    score: 25,
    headMultiplier: 2,
  },
  [ZombieType.TANK]: {
    type: ZombieType.TANK,
    health: 8,
    speed: 0.4,
    size: 1.6,
    score: 100,
    headMultiplier: 2,
  },
};

export const WAVE_CONFIGS: WaveConfig[] = [
  { wave: 1, walkers: 5, runners: 0, tanks: 0, spawnInterval: 2000 },
  { wave: 2, walkers: 7, runners: 0, tanks: 0, spawnInterval: 1800 },
  { wave: 3, walkers: 5, runners: 3, tanks: 0, spawnInterval: 1600 },
  { wave: 4, walkers: 6, runners: 4, tanks: 0, spawnInterval: 1500 },
  { wave: 5, walkers: 8, runners: 5, tanks: 0, spawnInterval: 1400 },
  { wave: 6, walkers: 6, runners: 4, tanks: 1, spawnInterval: 1500 },
  { wave: 7, walkers: 7, runners: 5, tanks: 2, spawnInterval: 1400 },
  { wave: 8, walkers: 8, runners: 6, tanks: 2, spawnInterval: 1300 },
  { wave: 9, walkers: 10, runners: 8, tanks: 3, spawnInterval: 1200 },
  { wave: 10, walkers: 8, runners: 10, tanks: 3, spawnInterval: 1000 },
];

export const SAVE_KEY = 'zombie_shooter_save';
