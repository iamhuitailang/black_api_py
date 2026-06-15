import { Zombie, DamageNumber } from '@/types/game';
import { ZOMBIE_CONFIGS, MAX_MAGAZINE } from '@/constants/gameConfig';
import { generateId } from './zombieFactory';

interface HitResult {
  hitZombie: Zombie | null;
  isHeadshot: boolean;
}

export function detectHit(
  zombies: Zombie[],
  targetX: number,
  targetY: number,
  sceneWidth: number,
  sceneHeight: number
): HitResult {
  let hitZombie: Zombie | null = null;
  let isHeadshot = false;
  let closestDistance = Infinity;

  for (const zombie of zombies) {
    if (zombie.isDead) continue;

    const scale = Math.max(0.3, 1 - zombie.distance / 150);
    const baseWidth = 80 * zombie.size * scale;
    const baseHeight = 140 * zombie.size * scale;

    const zombieScreenX = (zombie.x / 100) * sceneWidth;
    const zombieBottomY = sceneHeight * 0.85;
    const zombieTopY = zombieBottomY - baseHeight;
    const zombieLeft = zombieScreenX - baseWidth / 2;
    const zombieRight = zombieScreenX + baseWidth / 2;

    if (
      targetX >= zombieLeft &&
      targetX <= zombieRight &&
      targetY >= zombieTopY &&
      targetY <= zombieBottomY
    ) {
      if (zombie.distance < closestDistance) {
        closestDistance = zombie.distance;
        hitZombie = zombie;

        const headTop = zombieTopY;
        const headBottom = zombieTopY + baseHeight * 0.25;
        isHeadshot = targetY >= headTop && targetY <= headBottom;
      }
    }
  }

  return { hitZombie, isHeadshot };
}

export function applyDamage(
  zombie: Zombie,
  isHeadshot: boolean
): { updatedZombie: Zombie; damageDealt: number; killed: boolean } {
  const config = ZOMBIE_CONFIGS[zombie.type];
  const damage = isHeadshot ? config.headMultiplier : 1;
  const updatedZombie = { ...zombie };
  updatedZombie.health -= damage;
  updatedZombie.hitFlash = 1;

  const killed = updatedZombie.health <= 0;
  if (killed) {
    updatedZombie.isDead = true;
    updatedZombie.deathAnimation = 1;
  }

  return { updatedZombie, damageDealt: damage, killed };
}

export function createDamageNumber(
  targetX: number,
  targetY: number,
  isHeadshot: boolean,
  score: number
): DamageNumber {
  return {
    id: generateId(),
    x: targetX,
    y: targetY,
    value: isHeadshot ? score * 2 : score,
    isHeadshot,
    life: 1,
  };
}

export function calculateScore(killed: boolean, isHeadshot: boolean, baseScore: number): number {
  if (!killed) return 0;
  return isHeadshot ? baseScore * 2 : baseScore;
}

export function canShoot(magazine: number, isReloading: boolean): boolean {
  return !isReloading && magazine > 0;
}

export function isMagazineEmpty(magazine: number): boolean {
  return magazine <= 0;
}

export function isMagazineFull(magazine: number): boolean {
  return magazine >= MAX_MAGAZINE;
}
