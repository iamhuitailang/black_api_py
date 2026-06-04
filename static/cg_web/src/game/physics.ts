import type { Vector2, GameEntity, Platform, Player } from '@/types/game';
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, FRICTION, ICE_FRICTION, BOUNCE_FORCE } from '@/utils/constants';

export interface PhysicsConfig {
  gravity?: number;
  jumpForce?: number;
  moveSpeed?: number;
  friction?: number;
  iceFriction?: number;
  bounceForce?: number;
  maxFallSpeed?: number;
  airControl?: number;
}

const DEFAULT_CONFIG: Required<PhysicsConfig> = {
  gravity: GRAVITY,
  jumpForce: JUMP_FORCE,
  moveSpeed: MOVE_SPEED,
  friction: FRICTION,
  iceFriction: ICE_FRICTION,
  bounceForce: BOUNCE_FORCE,
  maxFallSpeed: 15,
  airControl: 0.6
};

export function createPhysicsConfig(config: Partial<PhysicsConfig> = {}): Required<PhysicsConfig> {
  return { ...DEFAULT_CONFIG, ...config };
}

export function applyGravity(entity: GameEntity, config: Required<PhysicsConfig>): void {
  entity.velocity.y += config.gravity;
  if (entity.velocity.y > config.maxFallSpeed) {
    entity.velocity.y = config.maxFallSpeed;
  }
}

export function applyJump(player: Player, config: Required<PhysicsConfig>): void {
  if (player.isGrounded) {
    player.velocity.y = config.jumpForce;
    player.isGrounded = false;
    player.isJumping = true;
  }
}

export function applyVariableJump(player: Player, config: Required<PhysicsConfig>, jumpHeld: boolean): void {
  if (!jumpHeld && player.velocity.y < config.jumpForce * 0.5) {
    player.velocity.y = config.jumpForce * 0.5;
  }
}

export function applyHorizontalMovement(
  entity: GameEntity,
  direction: number,
  isGrounded: boolean,
  config: Required<PhysicsConfig>
): void {
  const controlFactor = isGrounded ? 1 : config.airControl;
  const targetVelocity = direction * config.moveSpeed;
  const acceleration = isGrounded ? 0.5 : 0.3;
  
  entity.velocity.x += (targetVelocity - entity.velocity.x) * acceleration * controlFactor;
  
  if (direction > 0) {
    entity.facing = 'right';
  } else if (direction < 0) {
    entity.facing = 'left';
  }
}

export function applyFriction(
  entity: GameEntity,
  isGrounded: boolean,
  isOnIce: boolean,
  config: Required<PhysicsConfig>
): void {
  if (isGrounded) {
    const frictionValue = isOnIce ? config.iceFriction : config.friction;
    entity.velocity.x *= frictionValue;
    if (Math.abs(entity.velocity.x) < 0.1) {
      entity.velocity.x = 0;
    }
  } else {
    entity.velocity.x *= 0.98;
  }
}

export function applyBounce(entity: GameEntity, config: Required<PhysicsConfig>): void {
  entity.velocity.y = config.bounceForce;
}

export function updatePosition(entity: GameEntity): Vector2 {
  const previousPosition: Vector2 = {
    x: entity.x,
    y: entity.y
  };
  
  entity.x += entity.velocity.x;
  entity.y += entity.velocity.y;
  
  return previousPosition;
}

export function clampPosition(
  entity: GameEntity,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): void {
  if (entity.x < minX) {
    entity.x = minX;
    entity.velocity.x = 0;
  }
  if (entity.x + entity.width > maxX) {
    entity.x = maxX - entity.width;
    entity.velocity.x = 0;
  }
  if (entity.y < minY) {
    entity.y = minY;
    entity.velocity.y = 0;
  }
  if (entity.y + entity.height > maxY) {
    entity.y = maxY - entity.height;
    entity.velocity.y = 0;
  }
}

export function isOnIce(entity: GameEntity, platforms: Platform[]): boolean {
  const feetY = entity.y + entity.height + 1;
  const feetX1 = entity.x + 2;
  const feetX2 = entity.x + entity.width - 2;
  
  return platforms.some(platform => {
    if (platform.platformType !== 'ice' || !platform.active) {
      return false;
    }
    return (
      feetY >= platform.y &&
      feetY <= platform.y + 5 &&
      feetX2 >= platform.x &&
      feetX1 <= platform.x + platform.width
    );
  });
}

export function resetVelocity(entity: GameEntity): void {
  entity.velocity.x = 0;
  entity.velocity.y = 0;
}

export function resetHorizontalVelocity(entity: GameEntity): void {
  entity.velocity.x = 0;
}

export function resetVerticalVelocity(entity: GameEntity): void {
  entity.velocity.y = 0;
}

export function applyKnockback(
  entity: GameEntity,
  direction: Vector2,
  force: number
): void {
  const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  if (length > 0) {
    entity.velocity.x = (direction.x / length) * force;
    entity.velocity.y = (direction.y / length) * force;
  }
}

export function applyTerminalVelocity(entity: GameEntity, config: Required<PhysicsConfig>): void {
  const speed = Math.sqrt(entity.velocity.x * entity.velocity.x + entity.velocity.y * entity.velocity.y);
  const maxSpeed = config.maxFallSpeed * 1.5;
  
  if (speed > maxSpeed) {
    const ratio = maxSpeed / speed;
    entity.velocity.x *= ratio;
    entity.velocity.y *= ratio;
  }
}
