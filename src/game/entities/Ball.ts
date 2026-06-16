import type { Ball as BallType } from '../types';
import { GAME_CONFIG, COLORS } from '../config';

export interface BallSnapshot {
  y: number;
  vy: number;
  colorIndex: number;
  colorChangeTimer: number;
  trail: { x: number; y: number; alpha: number; color: string }[];
}

export class Ball implements BallType {
  x: number;
  y: number;
  vy: number;
  radius: number;
  color: string;
  colorIndex: number;
  trail: { x: number; y: number; alpha: number; color: string }[];
  private colorChangeTimer: number = 0;
  private colorChangeInterval: number;

  constructor() {
    this.x = GAME_CONFIG.BALL_X;
    this.y = GAME_CONFIG.BALL_START_Y;
    this.vy = 0;
    this.radius = GAME_CONFIG.BALL_RADIUS;
    this.colorIndex = 0;
    this.color = COLORS[this.colorIndex];
    this.trail = [];
    this.colorChangeInterval = GAME_CONFIG.COLOR_CHANGE_INTERVAL;
  }

  toSnapshot(): BallSnapshot {
    return {
      y: this.y,
      vy: this.vy,
      colorIndex: this.colorIndex,
      colorChangeTimer: this.colorChangeTimer,
      trail: this.trail.map(t => ({ ...t })),
    };
  }

  loadSnapshot(snap: BallSnapshot): void {
    this.y = snap.y;
    this.vy = snap.vy;
    this.colorIndex = snap.colorIndex;
    this.color = COLORS[snap.colorIndex];
    this.colorChangeTimer = snap.colorChangeTimer || 0;
    this.trail = (snap.trail || []).map(t => ({ ...t }));
  }

  update(deltaTime: number): void {
    this.colorChangeTimer += deltaTime;
    if (this.colorChangeTimer >= this.colorChangeInterval) {
      this.colorChangeTimer = 0;
      this.colorIndex = (this.colorIndex + 1) % COLORS.length;
      this.color = COLORS[this.colorIndex];
    }

    this.trail.unshift({
      x: this.x,
      y: this.y,
      alpha: 1,
      color: this.color,
    });

    if (this.trail.length > GAME_CONFIG.TRAIL_LENGTH) {
      this.trail.pop();
    }

    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha = 1 - i / GAME_CONFIG.TRAIL_LENGTH;
    }
  }

  render(ctx: CanvasRenderingContext2D, skinId: string): void {
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const t = this.trail[i];
      const size = this.radius * (1 - i / GAME_CONFIG.TRAIL_LENGTH * 0.7);
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      
      const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size);
      const trailColor = this.getSkinColor(skinId, t.color, i);
      gradient.addColorStop(0, trailColor);
      gradient.addColorStop(1, this.hexToRgba(trailColor, 0));
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = t.alpha * 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    this.renderBall(ctx, skinId);
  }

  private renderBall(ctx: CanvasRenderingContext2D, skinId: string): void {
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius
    );

    const baseColor = this.getSkinColor(skinId, this.color, 0);
    
    switch (skinId) {
      case 'neon':
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, baseColor);
        gradient.addColorStop(0.7, baseColor);
        gradient.addColorStop(1, this.hexToRgba(baseColor, 0));
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 20;
        break;
      case 'rainbow':
        const hue = (Date.now() / 10) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 100%, 70%)`);
        gradient.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${(hue + 240) % 360}, 100%, 30%)`);
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 15;
        break;
      case 'fire':
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.3, '#ff6600');
        gradient.addColorStop(0.7, '#ff3300');
        gradient.addColorStop(1, '#990000');
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 25;
        break;
      default:
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, baseColor);
        gradient.addColorStop(1, this.darkenColor(baseColor, 0.3));
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private getSkinColor(skinId: string, defaultColor: string, trailIndex: number): string {
    switch (skinId) {
      case 'neon':
        return '#ff00ff';
      case 'rainbow':
        const hue = ((Date.now() / 10) + trailIndex * 10) % 360;
        return `hsl(${hue}, 100%, 50%)`;
      case 'fire':
        const fireColors = ['#ffff00', '#ffaa00', '#ff6600', '#ff3300', '#cc0000'];
        return fireColors[Math.min(trailIndex, fireColors.length - 1)];
      default:
        return defaultColor;
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private darkenColor(hex: string, amount: number): string {
    const r = Math.floor(parseInt(hex.slice(1, 3), 16) * (1 - amount));
    const g = Math.floor(parseInt(hex.slice(3, 5), 16) * (1 - amount));
    const b = Math.floor(parseInt(hex.slice(5, 7), 16) * (1 - amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  reset(): void {
    this.x = GAME_CONFIG.BALL_X;
    this.y = GAME_CONFIG.BALL_START_Y;
    this.vy = 0;
    this.colorIndex = 0;
    this.color = COLORS[this.colorIndex];
    this.trail = [];
    this.colorChangeTimer = 0;
  }
}
