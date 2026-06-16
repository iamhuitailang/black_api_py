import type { Ring as RingType, RingSegment, Star as StarType } from '../types';
import { GAME_CONFIG, COLORS } from '../config';
import { Star } from './Star';

export interface RingSnapshot {
  y: number;
  rotation: number;
  rotationSpeed: number;
  passed: boolean;
  isDouble: boolean;
  segments: RingSegment[];
  hasStar: boolean;
  starCollected: boolean;
  starAngle: number;
}

export class Ring implements RingType {
  y: number;
  radius: number;
  thickness: number;
  segments: RingSegment[];
  star?: StarType;
  passed: boolean;
  isDouble: boolean;
  rotation: number;
  rotationSpeed: number;

  constructor(y: number, isDouble: boolean = false, rotationOffset: number = 0) {
    this.y = y;
    this.radius = GAME_CONFIG.RING_RADIUS;
    this.thickness = GAME_CONFIG.RING_THICKNESS;
    this.passed = false;
    this.isDouble = isDouble;
    this.rotation = rotationOffset;
    this.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * GAME_CONFIG.RING_ROTATION_SPEED;
    this.segments = this.generateSegments();

    if (Math.random() < GAME_CONFIG.STAR_CHANCE) {
      const starAngle = Math.random() * Math.PI * 2;
      const starX = GAME_CONFIG.CANVAS_WIDTH / 2 + Math.cos(starAngle) * this.radius;
      const starY = this.y + Math.sin(starAngle) * this.radius;
      this.star = new Star(starX, starY);
    }
  }

  static fromSnapshot(snap: RingSnapshot): Ring {
    const ring = new Ring(0, snap.isDouble, 0);
    ring.y = snap.y;
    ring.rotation = snap.rotation;
    ring.rotationSpeed = snap.rotationSpeed;
    ring.passed = snap.passed;
    ring.segments = snap.segments.map(s => ({ ...s }));

    if (snap.hasStar && !snap.starCollected) {
      const starAngle = snap.starAngle || 0;
      const starX = GAME_CONFIG.CANVAS_WIDTH / 2 + Math.cos(starAngle) * ring.radius;
      const starY = ring.y + Math.sin(starAngle) * ring.radius;
      ring.star = new Star(starX, starY);
    } else {
      ring.star = undefined;
    }

    return ring;
  }

  toSnapshot(): RingSnapshot {
    let starAngle = 0;
    if (this.star) {
      starAngle = Math.atan2(this.star.y - this.y, this.star.x - GAME_CONFIG.CANVAS_WIDTH / 2);
    }
    return {
      y: this.y,
      rotation: this.rotation,
      rotationSpeed: this.rotationSpeed,
      passed: this.passed,
      isDouble: this.isDouble,
      segments: this.segments.map(s => ({ ...s })),
      hasStar: !!this.star,
      starCollected: this.star?.collected || false,
      starAngle,
    };
  }

  private generateSegments(): RingSegment[] {
    const segmentAngle = Math.PI / 2;
    const shuffledColors = this.shuffleColors();
    
    return shuffledColors.map((color, index) => ({
      color,
      startAngle: index * segmentAngle,
      endAngle: (index + 1) * segmentAngle,
    }));
  }

  private shuffleColors(): string[] {
    const colors = [...COLORS];
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }
    return colors;
  }

  update(speed: number): void {
    this.y -= speed;
    this.rotation += this.rotationSpeed;

    if (this.star) {
      const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
      const starAngle = Math.atan2(this.star.y - this.y, this.star.x - centerX);
      const newAngle = starAngle + this.rotationSpeed;
      this.star.x = centerX + Math.cos(newAngle) * this.radius;
      this.star.y = this.y + Math.sin(newAngle) * this.radius;
      this.star.rotation += 0.05;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;

    for (const segment of this.segments) {
      const adjustedStart = segment.startAngle + this.rotation;
      const adjustedEnd = segment.endAngle + this.rotation;

      ctx.beginPath();
      ctx.arc(centerX, this.y, this.radius, adjustedStart, adjustedEnd);
      ctx.lineWidth = this.thickness;
      ctx.strokeStyle = segment.color;
      ctx.shadowColor = segment.color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (this.star && !this.star.collected) {
      this.star.render(ctx);
    }
  }

  isOffScreen(): boolean {
    return this.y + this.radius < -100;
  }

  collectStar(): void {
    if (this.star) {
      this.star.collected = true;
    }
  }
}
