import type { Particle, BackgroundStar } from '../types';
import { GAME_CONFIG, COLORS } from '../config';

export class ParticleSystem {
  private particles: Particle[] = [];
  private backgroundStars: BackgroundStar[] = [];
  private maxParticles: number;

  constructor(maxParticles: number = GAME_CONFIG.MAX_PARTICLES) {
    this.maxParticles = maxParticles;
    this.initBackgroundStars();
  }

  private initBackgroundStars(): void {
    for (let i = 0; i < 100; i++) {
      this.backgroundStars.push({
        x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
        y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }
  }

  emit(x: number, y: number, color: string, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 4 + 2;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  }

  emitStarCollect(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: '#ffdd33',
        size: Math.random() * 6 + 3,
      });
    }
  }

  emitHit(x: number, y: number): void {
    for (let i = 0; i < 15; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 5 + 3,
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.02;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (const star of this.backgroundStars) {
      star.alpha += star.twinkleSpeed;
      if (star.alpha > 1 || star.alpha < 0.2) {
        star.twinkleSpeed *= -1;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const star of this.backgroundStars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fill();
    }

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  getBackgroundStars(): BackgroundStar[] {
    return this.backgroundStars;
  }
}
