import type { Platform, PlatformType, Vector2 } from '@/types/game';
import { TILE_SIZE } from '@/utils/constants';
import { generateId, clamp } from '../utils';

export class PlatformEntity implements Platform {
  type: 'platform' = 'platform';
  platformType: PlatformType;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean = true;

  moveDirection?: Vector2;
  moveRange?: number;
  originalPosition?: Vector2;
  breakTimer?: number;

  private moveSpeed: number = 1;
  private currentOffset: number = 0;
  private isBreaking: boolean = false;
  private breakProgress: number = 0;
  private originalActive: boolean = true;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number = TILE_SIZE * 0.5,
    platformType: PlatformType = 'normal',
    moveDirection?: Vector2,
    moveRange?: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.platformType = platformType;
    this.originalPosition = { x, y };
    this.originalActive = true;

    if (platformType === 'moving' && moveDirection && moveRange) {
      this.moveDirection = moveDirection;
      this.moveRange = moveRange;
    }
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    if (this.platformType === 'moving' && this.moveDirection && this.moveRange && this.originalPosition) {
      this.currentOffset += this.moveSpeed * deltaTime * 0.05;

      const offset = Math.sin(this.currentOffset) * this.moveRange;
      this.x = this.originalPosition.x + this.moveDirection.x * offset;
      this.y = this.originalPosition.y + this.moveDirection.y * offset;
    }

    if (this.platformType === 'breakable' && this.breakTimer !== undefined) {
      this.breakTimer -= deltaTime * 0.06;
      this.isBreaking = true;
      this.breakProgress = clamp(1 - this.breakTimer / 30, 0, 1);

      if (this.breakTimer <= 0) {
        this.active = false;
        setTimeout(() => {
          this.reset();
        }, 3000);
      }
    }
  }

  startBreaking(): void {
    if (this.platformType === 'breakable' && this.breakTimer === undefined) {
      this.breakTimer = 30;
    }
  }

  getBreakProgress(): number {
    return this.breakProgress;
  }

  isShaking(): boolean {
    return this.isBreaking && this.breakProgress < 1;
  }

  getShakeOffset(): { x: number; y: number } {
    if (!this.isShaking()) return { x: 0, y: 0 };

    const intensity = this.breakProgress * 3;
    return {
      x: (Math.random() - 0.5) * intensity,
      y: (Math.random() - 0.5) * intensity
    };
  }

  getBounceForce(): number {
    if (this.platformType === 'bounce') {
      return -18;
    }
    return 0;
  }

  isIce(): boolean {
    return this.platformType === 'ice';
  }

  reset(): void {
    if (this.originalPosition) {
      this.x = this.originalPosition.x;
      this.y = this.originalPosition.y;
    }
    this.active = this.originalActive;
    this.breakTimer = undefined;
    this.isBreaking = false;
    this.breakProgress = 0;
    this.currentOffset = 0;
  }

  static createGround(x: number, y: number, width: number): PlatformEntity {
    return new PlatformEntity(x, y, width, TILE_SIZE, 'normal');
  }

  static createNormal(x: number, y: number, width: number, height?: number): PlatformEntity {
    return new PlatformEntity(x, y, width, height, 'normal');
  }

  static createMoving(
    x: number,
    y: number,
    width: number,
    moveDirection: Vector2,
    moveRange: number,
    height?: number
  ): PlatformEntity {
    return new PlatformEntity(x, y, width, height, 'moving', moveDirection, moveRange);
  }

  static createBreakable(x: number, y: number, width: number, height?: number): PlatformEntity {
    return new PlatformEntity(x, y, width, height, 'breakable');
  }

  static createIce(x: number, y: number, width: number, height?: number): PlatformEntity {
    return new PlatformEntity(x, y, width, height, 'ice');
  }

  static createBounce(x: number, y: number, width: number, height?: number): PlatformEntity {
    return new PlatformEntity(x, y, width, height, 'bounce');
  }

  static createStaircase(
    startX: number,
    startY: number,
    steps: number,
    stepWidth: number = TILE_SIZE * 2,
    stepHeight: number = TILE_SIZE,
    direction: 'up' | 'down' = 'up',
    platformType: PlatformType = 'normal'
  ): PlatformEntity[] {
    const platforms: PlatformEntity[] = [];

    for (let i = 0; i < steps; i++) {
      const x = startX + i * stepWidth;
      const y = direction === 'up'
        ? startY - i * stepHeight
        : startY + i * stepHeight;

      platforms.push(new PlatformEntity(x, y, stepWidth, stepHeight * 0.5, platformType));
    }

    return platforms;
  }

  static createFloatingPlatforms(
    startX: number,
    startY: number,
    count: number,
    spacingX: number = TILE_SIZE * 4,
    spacingY: number = TILE_SIZE * 2,
    width: number = TILE_SIZE * 3,
    platformType: PlatformType = 'normal'
  ): PlatformEntity[] {
    const platforms: PlatformEntity[] = [];

    for (let i = 0; i < count; i++) {
      const x = startX + i * spacingX;
      const y = startY + (i % 2 === 0 ? 0 : -spacingY);
      platforms.push(new PlatformEntity(x, y, width, TILE_SIZE * 0.5, platformType));
    }

    return platforms;
  }
}
