import type { Rect, Vector2, GameEntity, Platform, Player, Enemy, Boss, Item, Obstacle, Projectile } from '@/types/game';
import { resetVerticalVelocity, resetHorizontalVelocity } from './physics';

export interface CollisionResult {
  collided: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
  overlap?: number;
  normal?: Vector2;
}

export function checkAABB(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function checkAABBWithInfo(a: Rect, b: Rect): CollisionResult {
  if (!checkAABB(a, b)) {
    return { collided: false };
  }

  const overlapX = Math.min(a.x + a.width - b.x, b.x + b.width - a.x);
  const overlapY = Math.min(a.y + a.height - b.y, b.y + b.height - a.y);

  if (overlapX < overlapY) {
    if (a.x < b.x) {
      return {
        collided: true,
        side: 'right',
        overlap: overlapX,
        normal: { x: 1, y: 0 }
      };
    }
    return {
      collided: true,
      side: 'left',
      overlap: overlapX,
      normal: { x: -1, y: 0 }
    };
  }

  if (a.y < b.y) {
    return {
      collided: true,
      side: 'bottom',
      overlap: overlapY,
      normal: { x: 0, y: 1 }
    };
  }

  return {
    collided: true,
    side: 'top',
    overlap: overlapY,
    normal: { x: 0, y: -1 }
  };
}

export function resolveCollision(entity: GameEntity, collision: CollisionResult): void {
  if (!collision.collided || !collision.side || !collision.overlap) {
    return;
  }

  switch (collision.side) {
    case 'top':
      entity.y -= collision.overlap;
      resetVerticalVelocity(entity);
      if ('isGrounded' in entity) {
        (entity as Player).isGrounded = true;
        (entity as Player).isJumping = false;
      }
      break;
    case 'bottom':
      entity.y += collision.overlap;
      resetVerticalVelocity(entity);
      break;
    case 'left':
      entity.x -= collision.overlap;
      resetHorizontalVelocity(entity);
      break;
    case 'right':
      entity.x += collision.overlap;
      resetHorizontalVelocity(entity);
      break;
  }
}

export function checkPlatformCollision(
  entity: GameEntity,
  platforms: Platform[],
  previousPosition: Vector2
): CollisionResult {
  let nearestCollision: CollisionResult = { collided: false };
  let minOverlap = Infinity;

  for (const platform of platforms) {
    if (!platform.active) {
      continue;
    }

    if (platform.platformType === 'breakable' && platform.breakTimer !== undefined && platform.breakTimer <= 0) {
      continue;
    }

    const collision = checkAABBWithInfo(entity, platform);
    if (!collision.collided) {
      continue;
    }

    if (collision.side === 'top' && entity.velocity.y >= 0) {
      const entityBottom = previousPosition.y + entity.height;
      if (entityBottom <= platform.y + 2) {
        if (collision.overlap && collision.overlap < minOverlap) {
          minOverlap = collision.overlap;
          nearestCollision = { ...collision, side: 'top' };
        }
      }
    } else if (collision.side === 'bottom' && entity.velocity.y < 0) {
      if (collision.overlap && collision.overlap < minOverlap) {
        minOverlap = collision.overlap;
        nearestCollision = collision;
      }
    } else if (collision.side === 'left' || collision.side === 'right') {
      if (collision.overlap && collision.overlap < minOverlap) {
        minOverlap = collision.overlap;
        nearestCollision = collision;
      }
    }
  }

  return nearestCollision;
}

export function resolvePlatformCollision(
  entity: GameEntity,
  platforms: Platform[],
  previousPosition: Vector2
): Platform | null {
  const collision = checkPlatformCollision(entity, platforms, previousPosition);
  if (!collision.collided) {
    return null;
  }

  resolveCollision(entity, collision);

  for (const platform of platforms) {
    if (!platform.active) {
      continue;
    }
    if (checkAABB(entity, platform)) {
      return platform;
    }
  }

  return null;
}

export function checkEntityCollision(a: GameEntity, b: GameEntity): boolean {
  if (!a.active || !b.active) {
    return false;
  }
  return checkAABB(a, b);
}

export function checkEntityCollisionWithInfo(a: GameEntity, b: GameEntity): CollisionResult {
  if (!a.active || !b.active) {
    return { collided: false };
  }
  return checkAABBWithInfo(a, b);
}

export function checkPlayerEnemyCollision(player: Player, enemies: Enemy[]): Enemy | null {
  for (const enemy of enemies) {
    if (!enemy.active) {
      continue;
    }
    if (checkAABB(player, enemy)) {
      return enemy;
    }
  }
  return null;
}

export function checkPlayerBossCollision(player: Player, boss: Boss | null): boolean {
  if (!boss || !boss.active) {
    return false;
  }
  return checkAABB(player, boss);
}

export function checkPlayerItemCollision(player: Player, items: Item[]): Item[] {
  const collected: Item[] = [];
  for (const item of items) {
    if (!item.active || item.collected) {
      continue;
    }
    if (checkAABB(player, item)) {
      collected.push(item);
    }
  }
  return collected;
}

export function checkPlayerObstacleCollision(player: Player, obstacles: Obstacle[]): Obstacle | null {
  for (const obstacle of obstacles) {
    if (!obstacle.active) {
      continue;
    }
    if (checkAABB(player, obstacle)) {
      return obstacle;
    }
  }
  return null;
}

export function checkProjectileEntityCollision(
  projectile: Projectile,
  entities: GameEntity[]
): GameEntity | null {
  if (!projectile.active) {
    return null;
  }
  for (const entity of entities) {
    if (!entity.active || entity.id === projectile.id) {
      continue;
    }
    if (checkAABB(projectile, entity)) {
      return entity;
    }
  }
  return null;
}

export function checkProjectilePlatformCollision(
  projectile: Projectile,
  platforms: Platform[]
): Platform | null {
  if (!projectile.active) {
    return null;
  }
  for (const platform of platforms) {
    if (!platform.active) {
      continue;
    }
    if (checkAABB(projectile, platform)) {
      return platform;
    }
  }
  return null;
}

export function getCenter(entity: Rect): Vector2 {
  return {
    x: entity.x + entity.width / 2,
    y: entity.y + entity.height / 2
  };
}

export function getDistance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getEntitiesInRange(
  center: Vector2,
  entities: GameEntity[],
  range: number
): GameEntity[] {
  return entities.filter(entity => {
    if (!entity.active) {
      return false;
    }
    const entityCenter = getCenter(entity);
    return getDistance(center, entityCenter) <= range;
  });
}

export function isAbove(entity: GameEntity, other: Rect): boolean {
  return entity.y + entity.height <= other.y;
}

export function isBelow(entity: GameEntity, other: Rect): boolean {
  return entity.y >= other.y + other.height;
}

export function isLeftOf(entity: GameEntity, other: Rect): boolean {
  return entity.x + entity.width <= other.x;
}

export function isRightOf(entity: GameEntity, other: Rect): boolean {
  return entity.x >= other.x + other.width;
}

export function expandRect(rect: Rect, amount: number): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2
  };
}

export function getSweepCollision(
  entity: GameEntity,
  velocity: Vector2,
  obstacles: Rect[]
): { collision: boolean; time: number; normal: Vector2 } {
  let earliestCollision = 1;
  let collisionNormal: Vector2 = { x: 0, y: 0 };

  for (const obstacle of obstacles) {
    const expandedObstacle = expandRect(obstacle, 0);

    const t1 = (expandedObstacle.x - (entity.x + entity.width)) / velocity.x;
    const t2 = (expandedObstacle.x + expandedObstacle.width - entity.x) / velocity.x;
    const t3 = (expandedObstacle.y - (entity.y + entity.height)) / velocity.y;
    const t4 = (expandedObstacle.y + expandedObstacle.height - entity.y) / velocity.y;

    const tMin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tMax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    if (tMax < 0 || tMin > tMax) {
      continue;
    }

    if (tMin < earliestCollision && tMin >= 0) {
      earliestCollision = tMin;
      if (tMin === Math.min(t1, t2)) {
        collisionNormal = { x: velocity.x > 0 ? -1 : 1, y: 0 };
      } else {
        collisionNormal = { x: 0, y: velocity.y > 0 ? -1 : 1 };
      }
    }
  }

  return {
    collision: earliestCollision < 1,
    time: earliestCollision,
    normal: collisionNormal
  };
}
