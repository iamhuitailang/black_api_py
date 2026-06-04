import type { Rect, Vector2, KeyboardState } from '@/types/game';
import { GRAVITY, FRICTION, ICE_FRICTION, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from '@/utils/constants';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rectCollision(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function applyGravity(velocity: Vector2, isIce: boolean = false, gravityMultiplier: number = 1): void {
  velocity.y += GRAVITY * gravityMultiplier;
}

export function applyFriction(velocity: Vector2, isIce: boolean = false): void {
  const friction = isIce ? ICE_FRICTION : FRICTION;
  velocity.x *= friction;
  if (Math.abs(velocity.x) < 0.1) {
    velocity.x = 0;
  }
}

export function checkPlatformCollision(
  entity: { x: number; y: number; width: number; height: number; velocity: Vector2 },
  platform: Rect,
  isIce: boolean = false
): { collided: boolean; fromTop: boolean } {
  const result = { collided: false, fromTop: false };

  if (!rectCollision(entity, platform)) return result;

  const prevY = entity.y - entity.velocity.y;
  const prevBottom = prevY + entity.height;

  if (entity.velocity.y >= 0 && prevBottom <= platform.y + 5) {
    entity.y = platform.y - entity.height;
    entity.velocity.y = 0;
    result.collided = true;
    result.fromTop = true;
  } else if (entity.velocity.y < 0 && prevY >= platform.y + platform.height - 5) {
    entity.y = platform.y + platform.height;
    entity.velocity.y = 0;
    result.collided = true;
  } else {
    if (entity.velocity.x > 0) {
      entity.x = platform.x - entity.width;
    } else if (entity.velocity.x < 0) {
      entity.x = platform.x + platform.width;
    }
    entity.velocity.x = 0;
    result.collided = true;
  }

  return result;
}

export function checkBounds(
  entity: { x: number; y: number; width: number; height: number; velocity: Vector2 },
  levelWidth: number,
  levelHeight: number
): void {
  if (entity.x < 0) {
    entity.x = 0;
    entity.velocity.x = 0;
  }
  if (entity.x + entity.width > levelWidth) {
    entity.x = levelWidth - entity.width;
    entity.velocity.x = 0;
  }
  if (entity.y < 0) {
    entity.y = 0;
    entity.velocity.y = 0;
  }
}

export function getMovementFromInput(input: KeyboardState, speed: number): Vector2 {
  const vel: Vector2 = { x: 0, y: 0 };

  if (input.left) vel.x -= speed;
  if (input.right) vel.x += speed;
  if (input.up) vel.y -= speed;
  if (input.down) vel.y += speed;

  return vel;
}

export function createVector(x: number, y: number): Vector2 {
  return { x, y };
}

export function addVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function multiplyVector(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}
