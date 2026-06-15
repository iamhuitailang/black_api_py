import { Zombie, ZombieType } from '@/types/game';
import { ZOMBIE_CONFIGS, SPAWN_DISTANCE } from '@/constants/gameConfig';

let idCounter = 0;

export function generateId(): string {
  return `z_${Date.now()}_${idCounter++}`;
}

export function createZombie(type: ZombieType): Zombie {
  const config = ZOMBIE_CONFIGS[type];
  return {
    id: generateId(),
    type,
    x: 15 + Math.random() * 70,
    distance: SPAWN_DISTANCE,
    health: config.health,
    maxHealth: config.health,
    speed: config.speed,
    size: config.size,
    score: config.score,
    isDead: false,
    hitFlash: 0,
    deathAnimation: 0,
  };
}
