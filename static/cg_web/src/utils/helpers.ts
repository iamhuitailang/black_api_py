import type { Rect, Vector2 } from '@/types/game';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function rectIntersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function rectContainsPoint(rect: Rect, point: Vector2): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function getCollisionSide(
  player: Rect,
  platform: Rect,
  velocityY: number
): 'top' | 'bottom' | 'left' | 'right' | null {
  const overlapX = Math.min(
    player.x + player.width - platform.x,
    platform.x + platform.width - player.x
  );
  const overlapY = Math.min(
    player.y + player.height - platform.y,
    platform.y + platform.height - player.y
  );

  if (overlapX < overlapY) {
    return player.x < platform.x ? 'left' : 'right';
  } else {
    if (velocityY > 0 && player.y + player.height - velocityY <= platform.y + 5) {
      return 'top';
    } else if (velocityY < 0 && player.y - velocityY >= platform.y + platform.height - 5) {
      return 'bottom';
    }
    return velocityY > 0 ? 'top' : 'bottom';
  }
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
