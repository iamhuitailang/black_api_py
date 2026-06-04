import type { Item, ItemType, Vector2 } from '@/types/game';
import { TILE_SIZE } from '@/utils/constants';
import { generateId } from '../utils';

export class ItemEntity implements Item {
  id: string;
  type: 'item' = 'item';
  itemType: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: Vector2 = { x: 0, y: 0 };
  active: boolean = true;
  facing: 'left' | 'right' | 'up' | 'down' = 'right';

  value: number;
  collected: boolean = false;
  bobOffset: number = 0;

  private originalY: number;
  private bobSpeed: number = 0.003;
  private bobAmplitude: number = 5;
  private rotateOffset: number = 0;

  constructor(x: number, y: number, itemType: ItemType, value?: number) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.originalY = y;
    this.itemType = itemType;

    this.width = TILE_SIZE * 0.6;
    this.height = TILE_SIZE * 0.6;

    if (itemType === 'coin') {
      this.width = TILE_SIZE * 0.5;
      this.height = TILE_SIZE * 0.5;
    }

    this.value = value ?? this.getDefaultValue(itemType);
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  private getDefaultValue(itemType: ItemType): number {
    const values: Record<ItemType, number> = {
      coin: 1,
      health: 1,
      invincible: 1,
      speed: 1,
      power: 1,
      shield: 1
    };
    return values[itemType] || 1;
  }

  update(deltaTime: number): void {
    if (!this.active || this.collected) return;

    this.bobOffset += deltaTime * this.bobSpeed;
    this.y = this.originalY + Math.sin(this.bobOffset) * this.bobAmplitude;

    if (this.itemType === 'coin') {
      this.rotateOffset += deltaTime * 0.01;
    }
  }

  collect(): void {
    this.collected = true;
    this.active = false;
  }

  reset(): void {
    this.collected = false;
    this.active = true;
    this.y = this.originalY;
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  getRotationAngle(): number {
    return this.rotateOffset;
  }

  getBobPhase(): number {
    return Math.sin(this.bobOffset);
  }

  getDisplaySize(): { width: number; height: number } {
    if (this.itemType === 'coin') {
      const scale = 0.8 + Math.abs(Math.sin(this.bobOffset * 2)) * 0.2;
      return {
        width: this.width * scale,
        height: this.height
      };
    }
    return { width: this.width, height: this.height };
  }

  static createCoin(x: number, y: number, value: number = 1): ItemEntity {
    return new ItemEntity(x, y, 'coin', value);
  }

  static createHealth(x: number, y: number, value: number = 1): ItemEntity {
    return new ItemEntity(x, y, 'health', value);
  }

  static createPowerUp(x: number, y: number, type: 'invincible' | 'speed' | 'power' | 'shield'): ItemEntity {
    return new ItemEntity(x, y, type, 1);
  }

  static createCoinRow(startX: number, y: number, count: number, spacing: number = 32): ItemEntity[] {
    const coins: ItemEntity[] = [];
    for (let i = 0; i < count; i++) {
      coins.push(new ItemEntity(startX + i * spacing, y, 'coin', 1));
    }
    return coins;
  }

  static createCoinArc(centerX: number, centerY: number, count: number, radius: number = 60): ItemEntity[] {
    const coins: ItemEntity[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * i) / (count - 1);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY - Math.sin(angle) * radius;
      coins.push(new ItemEntity(x, y, 'coin', 1));
    }
    return coins;
  }
}
