import type { Star as StarType, Particle } from '../types';

export class Star implements StarType {
  x: number;
  y: number;
  collected: boolean;
  rotation: number;
  particles: Particle[];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.collected = false;
    this.rotation = 0;
    this.particles = [];
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    const spikes = 5;
    const outerRadius = 12;
    const innerRadius = 5;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius * 1.5);
    gradient.addColorStop(0, 'rgba(255, 221, 51, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 221, 51, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 221, 51, 0)');
    
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    const starGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
    starGradient.addColorStop(0, '#ffffff');
    starGradient.addColorStop(0.3, '#ffff66');
    starGradient.addColorStop(0.7, '#ffdd33');
    starGradient.addColorStop(1, '#cc9900');
    
    ctx.fillStyle = starGradient;
    ctx.shadowColor = '#ffdd33';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
