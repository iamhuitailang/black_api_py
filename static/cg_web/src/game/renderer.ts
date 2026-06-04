import type { Player, Enemy, Boss, Item, Platform, Obstacle, Projectile, LevelData, LevelTheme } from '@/types/game';
import type { Particle } from './engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLORS, CHARACTERS } from '@/utils/constants';
import { formatTime } from '@/utils/helpers';

interface RenderState {
  player: Player | null;
  enemies: Enemy[];
  boss: Boss | null;
  items: Item[];
  platforms: Platform[];
  obstacles: Obstacle[];
  projectiles: Projectile[];
  particles: Particle[];
  cameraX: number;
  cameraY: number;
  gameTime: number;
  level: LevelData | null;
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = CANVAS_WIDTH;
    this.offscreenCanvas.height = CANVAS_HEIGHT;
    const offCtx = this.offscreenCanvas.getContext('2d');
    if (!offCtx) throw new Error('Failed to get offscreen canvas context');
    this.offscreenCtx = offCtx;

    this.ctx.imageSmoothingEnabled = false;
    this.offscreenCtx.imageSmoothingEnabled = false;
  }

  render(state: RenderState): void {
    const ctx = this.offscreenCtx;
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!state.level) return;

    this.drawBackground(ctx, state);

    ctx.save();
    ctx.translate(-Math.floor(state.cameraX), -Math.floor(state.cameraY));

    this.drawGround(ctx, state);
    this.drawPlatforms(ctx, state);
    this.drawObstacles(ctx, state);
    this.drawItems(ctx, state);
    this.drawEnemies(ctx, state);
    this.drawBoss(ctx, state);
    this.drawProjectiles(ctx, state);
    this.drawPlayer(ctx, state);
    this.drawParticles(ctx, state);

    ctx.restore();

    this.drawUI(ctx, state);

    this.ctx.drawImage(
      this.offscreenCanvas,
      0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
      0, 0, this.canvas.width, this.canvas.height
    );
  }

  private drawBackground(ctx: CanvasRenderingContext2D, state: RenderState): void {
    const theme = state.level?.theme || 'forest';
    const colors = COLORS[theme];
    const time = state.gameTime;

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, colors.bg);
    gradient.addColorStop(1, this.lightenColor(colors.bg, 20));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    switch (theme) {
      case 'forest':
        this.drawForestBackground(ctx, state, time);
        break;
      case 'volcano':
        this.drawVolcanoBackground(ctx, state, time);
        break;
      case 'ice':
        this.drawIceBackground(ctx, state, time);
        break;
      case 'space':
        this.drawSpaceBackground(ctx, state, time);
        break;
    }
  }

  private drawForestBackground(ctx: CanvasRenderingContext2D, state: RenderState, time: number): void {
    const parallax = state.cameraX * 0.3;
    const colors = COLORS.forest;

    ctx.fillStyle = this.darkenColor(colors.accent, 30);
    for (let i = 0; i < 8; i++) {
      const x = ((i * 200 - parallax * 0.5) % (CANVAS_WIDTH + 200)) - 100;
      this.drawPixelTree(ctx, x, CANVAS_HEIGHT - 120, 80, 100, this.darkenColor(colors.accent, 20));
    }

    ctx.fillStyle = colors.accent;
    for (let i = 0; i < 12; i++) {
      const x = ((i * 150 - parallax) % (CANVAS_WIDTH + 150)) - 75;
      this.drawPixelTree(ctx, x, CANVAS_HEIGHT - 80, 60, 70, colors.accent);
    }

    ctx.fillStyle = this.lightenColor(colors.accent, 20);
    for (let i = 0; i < 20; i++) {
      const x = ((i * 80 - parallax * 1.5) % (CANVAS_WIDTH + 80)) - 40;
      this.drawPixelBush(ctx, x, CANVAS_HEIGHT - 50, 40, 25);
    }

    for (let i = 0; i < 15; i++) {
      const x = ((i * 100 + Math.sin(time * 0.001 + i) * 20) % CANVAS_WIDTH);
      const y = 50 + Math.sin(time * 0.002 + i * 0.5) * 30;
      this.drawPixelCloud(ctx, x, y, 40 + i * 3, 20);
    }
  }

  private drawVolcanoBackground(ctx: CanvasRenderingContext2D, state: RenderState, time: number): void {
    const parallax = state.cameraX * 0.3;
    const colors = COLORS.volcano;

    ctx.fillStyle = this.darkenColor(colors.bg, 20);
    for (let i = 0; i < 5; i++) {
      const x = ((i * 300 - parallax * 0.3) % (CANVAS_WIDTH + 300)) - 150;
      this.drawPixelMountain(ctx, x, CANVAS_HEIGHT - 150, 200, 130, this.darkenColor(colors.ground, 10));
    }

    for (let i = 0; i < 10; i++) {
      const x = ((i * 180 - parallax * 0.7) % (CANVAS_WIDTH + 180)) - 90;
      this.drawPixelVolcano(ctx, x, CANVAS_HEIGHT - 100, 100, 80, colors.ground, colors.accent);
    }

    for (let i = 0; i < 8; i++) {
      const x = ((i * 150 + Math.sin(time * 0.002 + i) * 30) % CANVAS_WIDTH);
      const y = 60 + Math.sin(time * 0.003 + i) * 20;
      this.drawPixelEmber(ctx, x, y, time + i * 500);
    }

    ctx.fillStyle = `rgba(255, 69, 0, ${0.1 + Math.sin(time * 0.005) * 0.05})`;
    ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
  }

  private drawIceBackground(ctx: CanvasRenderingContext2D, state: RenderState, time: number): void {
    const parallax = state.cameraX * 0.3;
    const colors = COLORS.ice;

    ctx.fillStyle = this.lightenColor(colors.accent, 30);
    for (let i = 0; i < 6; i++) {
      const x = ((i * 250 - parallax * 0.4) % (CANVAS_WIDTH + 250)) - 125;
      this.drawPixelMountain(ctx, x, CANVAS_HEIGHT - 180, 180, 160, this.lightenColor(colors.accent, 20));
    }

    ctx.fillStyle = colors.accent;
    for (let i = 0; i < 8; i++) {
      const x = ((i * 180 - parallax * 0.8) % (CANVAS_WIDTH + 180)) - 90;
      this.drawPixelIceSpike(ctx, x, CANVAS_HEIGHT - 70, 50, 60);
    }

    for (let i = 0; i < 50; i++) {
      const x = ((i * 50 + time * 0.05 * (i % 3 + 1)) % CANVAS_WIDTH);
      const y = ((time * 0.03 * (i % 2 + 1) + i * 40) % CANVAS_HEIGHT);
      this.drawPixelSnowflake(ctx, x, y, 3 + (i % 4));
    }

    ctx.fillStyle = `rgba(135, 206, 250, ${0.1 + Math.sin(time * 0.003) * 0.05})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawSpaceBackground(ctx: CanvasRenderingContext2D, state: RenderState, time: number): void {
    const parallax = state.cameraX * 0.2;
    const colors = COLORS.space;

    for (let i = 0; i < 100; i++) {
      const x = ((i * 47 - parallax * 0.2 + i * 10) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      const y = (i * 37) % CANVAS_HEIGHT;
      const brightness = 0.3 + Math.sin(time * 0.003 + i) * 0.3 + 0.4;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      const size = i % 4 === 0 ? 2 : 1;
      ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    }

    for (let i = 0; i < 5; i++) {
      const x = ((i * 300 - parallax * 0.3) % (CANVAS_WIDTH + 300)) - 100;
      const y = 50 + i * 80;
      this.drawPixelNebula(ctx, x, y, 100 + i * 20, 60 + i * 10, colors.accent);
    }

    for (let i = 0; i < 3; i++) {
      const x = ((i * 400 - parallax * 0.5 + time * 0.01) % (CANVAS_WIDTH + 400)) - 100;
      const y = 100 + i * 120;
      this.drawPixelPlanet(ctx, x, y, 40 + i * 10, colors.accent);
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D, state: RenderState): void {
    if (!state.level) return;
    const theme = state.level.theme;
    const colors = COLORS[theme];
    const groundY = state.level.height - TILE_SIZE;
    const levelWidth = state.level.width;

    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, groundY, levelWidth, TILE_SIZE);

    ctx.fillStyle = colors.accent;
    ctx.fillRect(0, groundY, levelWidth, 4);

    for (let x = 0; x < levelWidth; x += TILE_SIZE) {
      const shade = (x / TILE_SIZE) % 3 === 0 ? this.darkenColor(colors.ground, 10) : this.lightenColor(colors.ground, 5);
      ctx.fillStyle = shade;
      ctx.fillRect(x + 2, groundY + 6, TILE_SIZE - 4, 2);
      ctx.fillRect(x + 4, groundY + 14, TILE_SIZE - 8, 2);
      ctx.fillRect(x + 6, groundY + 22, TILE_SIZE - 12, 2);
    }

    if (theme === 'volcano') {
      ctx.fillStyle = '#ff4500';
      for (let x = 0; x < levelWidth; x += TILE_SIZE * 3) {
        ctx.fillRect(x + 8, groundY + TILE_SIZE - 4, 4, 2);
        ctx.fillRect(x + 16, groundY + TILE_SIZE - 6, 4, 4);
      }
    }

    if (theme === 'ice') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let x = 0; x < levelWidth; x += TILE_SIZE) {
        ctx.fillRect(x + 4, groundY + 4, 8, 2);
        ctx.fillRect(x + 18, groundY + 8, 6, 2);
      }
    }
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D, state: RenderState): void {
    const theme = state.level?.theme || 'forest';
    const colors = COLORS[theme];

    for (const platform of state.platforms) {
      if (!platform.active) continue;

      let color = colors.platform;
      let topColor = colors.accent;

      switch (platform.platformType) {
        case 'moving':
          color = '#4a90d9';
          topColor = '#7ab8ff';
          break;
        case 'breakable':
          color = platform.breakTimer !== undefined ? '#a0522d' : '#cd853f';
          topColor = '#deb887';
          if (platform.breakTimer !== undefined) {
            ctx.fillStyle = '#000';
            for (let i = 0; i < 3; i++) {
              ctx.fillRect(platform.x + 8 + i * 20, platform.y + 4, 4, 4);
              ctx.fillRect(platform.x + 4 + i * 20, platform.y + 12, 4, 4);
            }
          }
          break;
        case 'ice':
          color = '#b0e0e6';
          topColor = '#e0ffff';
          break;
        case 'bounce':
          color = '#ff69b4';
          topColor = '#ffb6c1';
          break;
      }

      ctx.fillStyle = color;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

      ctx.fillStyle = topColor;
      ctx.fillRect(platform.x, platform.y, platform.width, 4);

      ctx.fillStyle = this.darkenColor(color, 20);
      ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);

      ctx.fillStyle = this.darkenColor(color, 10);
      for (let px = platform.x + 4; px < platform.x + platform.width - 4; px += 16) {
        ctx.fillRect(px, platform.y + 8, 8, 2);
        if (platform.height > 16) {
          ctx.fillRect(px + 4, platform.y + 14, 6, 2);
        }
      }

      if (platform.platformType === 'moving') {
        ctx.fillStyle = '#ffff00';
        const arrowX = platform.x + platform.width / 2 - 4;
        const arrowY = platform.y + platform.height / 2 - 2;
        ctx.fillRect(arrowX, arrowY, 8, 4);
        ctx.fillRect(arrowX - 2, arrowY - 2, 2, 8);
        ctx.fillRect(arrowX + 8, arrowY - 2, 2, 8);
      }
    }
  }

  private drawObstacles(ctx: CanvasRenderingContext2D, state: RenderState): void {
    for (const obstacle of state.obstacles) {
      if (!obstacle.active) continue;

      switch (obstacle.obstacleType) {
        case 'spike':
          this.drawSpike(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          break;
        case 'lava':
          this.drawLava(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, state.gameTime);
          break;
        case 'laser':
          this.drawLaser(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, state.gameTime);
          break;
        case 'meteor':
          this.drawMeteor(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
          break;
        case 'wind':
          this.drawWind(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, state.gameTime);
          break;
      }
    }
  }

  private drawSpike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const spikeCount = Math.floor(w / 12);
    const spikeWidth = w / spikeCount;

    for (let i = 0; i < spikeCount; i++) {
      const sx = x + i * spikeWidth;
      ctx.fillStyle = '#696969';
      ctx.beginPath();
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx + spikeWidth / 2, y);
      ctx.lineTo(sx + spikeWidth, y + h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#a9a9a9';
      ctx.beginPath();
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx + spikeWidth / 2, y);
      ctx.lineTo(sx + spikeWidth / 2, y + h);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawLava(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number): void {
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, '#ff4500');
    gradient.addColorStop(0.5, '#ff6600');
    gradient.addColorStop(1, '#cc3300');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < w; i += 8) {
      const bubbleY = y + 4 + Math.sin(time * 0.005 + i * 0.2) * 4;
      ctx.fillRect(x + i, bubbleY, 4, 4);
    }
  }

  private drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number): void {
    const intensity = 0.7 + Math.sin(time * 0.01) * 0.3;

    ctx.fillStyle = `rgba(255, 0, 0, ${intensity})`;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = `rgba(255, 100, 100, ${intensity * 0.5})`;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

    ctx.fillStyle = '#fff';
    ctx.fillRect(x + w / 2 - 1, y, 2, h);
  }

  private drawMeteor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.arc(x + w / 2 - 3, y + h / 2 - 3, w / 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const ex = x + w / 2 + Math.cos(angle) * w * 0.6;
      const ey = y + h / 2 + Math.sin(angle) * h * 0.6;
      ctx.fillRect(ex - 1, ey - 1, 2, 2);
    }
  }

  private drawWind(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number): void {
    ctx.strokeStyle = `rgba(200, 200, 255, ${0.4 + Math.sin(time * 0.005) * 0.2})`;
    ctx.lineWidth = 2;

    for (let i = 0; i < 5; i++) {
      const offset = (time * 0.1 + i * 30) % w;
      const wy = y + (i * h) / 5 + h / 10;
      ctx.beginPath();
      ctx.moveTo(x + offset, wy);
      ctx.lineTo(x + offset + 20, wy);
      ctx.lineTo(x + offset + 15, wy - 5);
      ctx.moveTo(x + offset + 20, wy);
      ctx.lineTo(x + offset + 15, wy + 5);
      ctx.stroke();
    }
  }

  private drawItems(ctx: CanvasRenderingContext2D, state: RenderState): void {
    for (const item of state.items) {
      if (item.collected) continue;

      const y = item.y + item.bobOffset;
      const glow = 0.3 + Math.sin(state.gameTime * 0.005 + item.x) * 0.2;

      ctx.fillStyle = `rgba(255, 255, 255, ${glow * 0.3})`;
      ctx.beginPath();
      ctx.arc(item.x + item.width / 2, y + item.height / 2, item.width * 0.8, 0, Math.PI * 2);
      ctx.fill();

      switch (item.itemType) {
        case 'coin':
          this.drawCoin(ctx, item.x, y, item.width, item.height, state.gameTime);
          break;
        case 'health':
          this.drawHeart(ctx, item.x, y, item.width, item.height);
          break;
        case 'invincible':
          this.drawStar(ctx, item.x, y, item.width, item.height, state.gameTime);
          break;
        case 'speed':
          this.drawSpeedBoots(ctx, item.x, y, item.width, item.height);
          break;
        case 'power':
          this.drawPowerPotion(ctx, item.x, y, item.width, item.height);
          break;
        case 'shield':
          this.drawShield(ctx, item.x, y, item.width, item.height);
          break;
      }
    }
  }

  private drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number): void {
    const flip = Math.abs(Math.sin(time * 0.008 + x * 0.1));
    const width = w * (0.3 + flip * 0.7);
    const cx = x + w / 2;

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(cx - width / 2, y, width, h);

    ctx.fillStyle = '#ffed4a';
    ctx.fillRect(cx - width / 2 + 2, y + 2, width - 4, 4);

    ctx.fillStyle = '#b8860b';
    ctx.fillRect(cx - width / 2, y + h - 3, width, 3);

    if (width > w * 0.6) {
      ctx.fillStyle = '#b8860b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('$', cx, y + h / 2 + 4);
    }
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#ff4444';
    const pixelSize = 2;

    const heartPixels = [
      [1, 0], [2, 0], [4, 0], [5, 0],
      [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
      [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
      [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
      [2, 4], [3, 4], [4, 4],
      [3, 5],
    ];

    const offsetX = x + (w - 14) / 2;
    const offsetY = y + (h - 12) / 2;

    for (const [px, py] of heartPixels) {
      ctx.fillRect(offsetX + px * pixelSize, offsetY + py * pixelSize, pixelSize, pixelSize);
    }

    ctx.fillStyle = '#ff8888';
    ctx.fillRect(offsetX + 2, offsetY + 2, 2, 2);
  }

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number): void {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rotation = time * 0.003;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    ctx.fillStyle = '#ffff00';
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(angle) * w * 0.45;
      const py = Math.sin(angle) * h * 0.45;
      ctx.fillRect(px - 3, py - 3, 6, 6);
    }

    ctx.fillStyle = '#fff';
    ctx.fillRect(-3, -3, 6, 6);

    ctx.restore();
  }

  private drawSpeedBoots(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#00bfff';
    ctx.fillRect(x + 2, y + h / 2, w - 4, h / 2 - 2);

    ctx.fillStyle = '#0080ff';
    ctx.fillRect(x + 2, y + h / 2, w / 2, h / 4);

    ctx.fillStyle = '#ffff00';
    ctx.fillRect(x - 2, y + h / 2 + 4, 4, 2);
    ctx.fillRect(x - 6, y + h / 2 + 8, 4, 2);
    ctx.fillRect(x + w + 2, y + h / 2 + 4, 4, 2);
    ctx.fillRect(x + w + 6, y + h / 2 + 8, 4, 2);
  }

  private drawPowerPotion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + w / 2 - 3, y, 6, h / 4);

    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.moveTo(x, y + h / 3);
    ctx.lineTo(x + w, y + h / 3);
    ctx.lineTo(x + w - 4, y + h);
    ctx.lineTo(x + 4, y + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff88ff';
    ctx.fillRect(x + 4, y + h / 2, 4, 4);
  }

  private drawShield(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#4169e1';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 4);
    ctx.lineTo(x + w, y + h / 2);
    ctx.quadraticCurveTo(x + w, y + h, x + w / 2, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h / 2);
    ctx.lineTo(x, y + h / 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6495ed';
    ctx.fillRect(x + w / 2 - 2, y + 4, 4, h - 12);
    ctx.fillRect(x + 4, y + h / 2 - 2, w - 8, 4);

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + w / 2 - 3, y + h / 2 - 3, 6, 6);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, state: RenderState): void {
    const player = state.player;
    if (!player) return;

    if (player.invincible && Math.floor(state.gameTime / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    if (player.hasShield) {
      ctx.fillStyle = 'rgba(100, 149, 237, 0.3)';
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#4169e1';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (player.speedBoost) {
      ctx.fillStyle = 'rgba(0, 191, 255, 0.4)';
      for (let i = 0; i < 3; i++) {
        const offsetX = player.facing === 'right' ? -i * 8 : i * 8;
        ctx.fillRect(player.x + offsetX + 4, player.y + 8 + i * 4, 4, 4);
        ctx.fillRect(player.x + offsetX + 16, player.y + 8 + i * 4, 4, 4);
      }
    }

    if (player.powerBoost) {
      ctx.fillStyle = 'rgba(255, 0, 255, 0.4)';
      for (let i = 0; i < 3; i++) {
        const angle = (state.gameTime * 0.01 + i * 2) % (Math.PI * 2);
        const px = player.x + player.width / 2 + Math.cos(angle) * 20;
        const py = player.y + player.height / 2 + Math.sin(angle) * 20;
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
    }

    this.drawPixelCharacter(ctx, player, state.gameTime);

    if (player.isAttacking) {
      this.drawAttackEffect(ctx, player, state.gameTime);
    }

    ctx.globalAlpha = 1;
  }

  private drawPixelCharacter(ctx: CanvasRenderingContext2D, player: Player, time: number): void {
    const charId = player.characterId;
    const charInfo = CHARACTERS[charId] || CHARACTERS.hero;
    const facingRight = player.facing === 'right';
    const walkFrame = player.isGrounded && Math.abs(player.velocity.x) > 0.5
      ? Math.floor(time / 150) % 4
      : 0;

    ctx.save();

    if (!facingRight) {
      ctx.translate(player.x + player.width, player.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(player.x, player.y);
    }

    let skinColor = '#ffdbac';
    let hairColor = '#4a3728';
    let shirtColor = '#3498db';
    let pantsColor = '#2c3e50';
    let shoeColor = '#8b4513';

    if (charId === 'ninja') {
      shirtColor = '#2c2c2c';
      pantsColor = '#1a1a1a';
      skinColor = '#ffdbac';
      hairColor = '#000';
    } else if (charId === 'knight') {
      shirtColor = '#708090';
      pantsColor = '#4a5568';
      hairColor = '#8b4513';
    } else if (charId === 'mage') {
      shirtColor = '#9932cc';
      pantsColor = '#4b0082';
      hairColor = '#ffd700';
    }

    ctx.fillStyle = hairColor;
    ctx.fillRect(6, 0, 16, 10);
    ctx.fillRect(4, 2, 20, 8);

    ctx.fillStyle = skinColor;
    ctx.fillRect(8, 8, 12, 10);

    ctx.fillStyle = '#000';
    ctx.fillRect(12, 10, 2, 2);
    ctx.fillRect(16, 10, 2, 2);

    ctx.fillStyle = shirtColor;
    ctx.fillRect(6, 18, 16, 10);

    ctx.fillStyle = pantsColor;
    const legOffset = walkFrame === 1 ? 1 : walkFrame === 3 ? -1 : 0;
    ctx.fillRect(8, 28, 5, 8 + legOffset);
    ctx.fillRect(15, 28, 5, 8 - legOffset);

    ctx.fillStyle = shoeColor;
    ctx.fillRect(6, 34, 7, 2);
    ctx.fillRect(15, 34, 7, 2);

    ctx.fillStyle = skinColor;
    const armOffset = walkFrame === 1 ? -1 : walkFrame === 3 ? 1 : 0;
    ctx.fillRect(4, 20 + armOffset, 3, 8);
    ctx.fillRect(21, 20 - armOffset, 3, 8);

    if (charId === 'knight') {
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(2, 16, 4, 12);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(1, 14, 6, 4);
    }

    if (charId === 'mage') {
      ctx.fillStyle = '#9932cc';
      ctx.fillRect(4, -4, 20, 8);
      ctx.fillRect(10, -8, 8, 4);
    }

    ctx.restore();
  }

  private drawAttackEffect(ctx: CanvasRenderingContext2D, player: Player, time: number): void {
    const x = player.facing === 'right'
      ? player.x + player.width
      : player.x - 30;
    const y = player.y + 4;

    ctx.fillStyle = '#ffff00';
    ctx.globalAlpha = 0.8;

    for (let i = 0; i < 3; i++) {
      const offset = i * 8;
      ctx.fillRect(x + (player.facing === 'right' ? offset : -offset), y + 4 + i * 4, 12, 4);
    }

    ctx.fillStyle = '#fff';
    ctx.fillRect(x + (player.facing === 'right' ? 4 : -16), y + 8, 16, 4);

    ctx.globalAlpha = 1;
  }

  private drawEnemies(ctx: CanvasRenderingContext2D, state: RenderState): void {
    for (const enemy of state.enemies) {
      if (!enemy.active) continue;
      this.drawPixelEnemy(ctx, enemy, state.gameTime);
    }
  }

  private drawPixelEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number): void {
    ctx.save();

    const facingRight = enemy.facing === 'right';
    if (!facingRight) {
      ctx.translate(enemy.x + enemy.width, enemy.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(enemy.x, enemy.y);
    }

    const w = enemy.width;
    const h = enemy.height;
    const bob = Math.sin(time * 0.005) * 2;

    switch (enemy.enemyType) {
      case 'wolf':
        this.drawWolf(ctx, w, h, bob);
        break;
      case 'bee':
        this.drawBee(ctx, w, h, time);
        break;
      case 'vine':
        this.drawVine(ctx, w, h, time);
        break;
      case 'slime':
        this.drawSlime(ctx, w, h, bob);
        break;
      case 'lavaworm':
        this.drawLavaWorm(ctx, w, h, time);
        break;
      case 'dragon':
        this.drawDragon(ctx, w, h, bob);
        break;
      case 'snowball':
        this.drawSnowball(ctx, w, h, time);
        break;
      case 'bat':
        this.drawBat(ctx, w, h, time);
        break;
      case 'giant':
        this.drawGiant(ctx, w, h, bob);
        break;
      case 'robot':
        this.drawRobot(ctx, w, h, time);
        break;
      case 'turret':
        this.drawTurret(ctx, w, h);
        break;
      case 'blackhole':
        this.drawBlackhole(ctx, w, h, time);
        break;
    }

    ctx.restore();

    if (enemy.health < enemy.maxHealth) {
      const barWidth = w;
      const barHeight = 4;
      const barX = enemy.x;
      const barY = enemy.y - 8;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(barX, barY, barWidth * (enemy.health / enemy.maxHealth), barHeight);
    }
  }

  private drawWolf(ctx: CanvasRenderingContext2D, w: number, h: number, bob: number): void {
    ctx.fillStyle = '#696969';
    ctx.fillRect(4, 8 + bob, w - 8, h - 16);
    ctx.fillRect(2, 4 + bob, 12, 10);

    ctx.fillStyle = '#a9a9a9';
    ctx.fillRect(4, 2 + bob, 4, 4);
    ctx.fillRect(10, 2 + bob, 4, 4);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(6, 8 + bob, 2, 2);

    ctx.fillStyle = '#fff';
    ctx.fillRect(8, 12 + bob, 2, 2);
    ctx.fillRect(11, 12 + bob, 2, 2);

    ctx.fillStyle = '#696969';
    ctx.fillRect(w - 8, 10 + bob, 6, 4);

    ctx.fillRect(6, h - 10, 4, 8);
    ctx.fillRect(w - 10, h - 10, 4, 8);
  }

  private drawBee(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const wingFlap = Math.sin(time * 0.03) * 4;

    ctx.fillStyle = '#ffff00';
    ctx.fillRect(4, 8, w - 8, h - 16);

    ctx.fillStyle = '#000';
    ctx.fillRect(8, 8, 4, h - 16);
    ctx.fillRect(16, 8, 4, h - 16);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(2, 4 - wingFlap, 8, 6);
    ctx.fillRect(w - 10, 4 + wingFlap, 8, 6);

    ctx.fillStyle = '#000';
    ctx.fillRect(6, 10, 2, 2);
    ctx.fillRect(18, 10, 2, 2);

    ctx.fillStyle = '#000';
    ctx.fillRect(w - 4, 12, 4, 2);
  }

  private drawVine(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const sway = Math.sin(time * 0.002) * 3;

    ctx.fillStyle = '#228b22';
    ctx.fillRect(w / 2 - 4 + sway, 0, 8, h);

    ctx.fillStyle = '#32cd32';
    for (let i = 0; i < 4; i++) {
      const y = i * 12;
      ctx.fillRect(w / 2 - 10 + sway, y, 6, 8);
      ctx.fillRect(w / 2 + 4 + sway, y + 6, 6, 8);
    }

    ctx.fillStyle = '#ff0000';
    for (let i = 0; i < 3; i++) {
      const y = 6 + i * 14;
      ctx.fillRect(w / 2 - 2 + sway, y, 4, 4);
    }
  }

  private drawSlime(ctx: CanvasRenderingContext2D, w: number, h: number, bob: number): void {
    const squash = 1 + Math.sin(bob * 0.1) * 0.1;

    ctx.fillStyle = '#32cd32';
    ctx.beginPath();
    ctx.ellipse(w / 2, h - h / 4, w / 2 - 2, h / 2 * squash, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7cfc00';
    ctx.beginPath();
    ctx.ellipse(w / 2 - 4, h - h / 3, w / 4, h / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.fillRect(w / 2 - 8, h / 2, 4, 4);
    ctx.fillRect(w / 2 + 4, h / 2, 4, 4);

    ctx.fillStyle = '#fff';
    ctx.fillRect(w / 2 - 6, h / 2 + 1, 2, 2);
    ctx.fillRect(w / 2 + 6, h / 2 + 1, 2, 2);
  }

  private drawLavaWorm(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    for (let i = 0; i < 4; i++) {
      const offset = Math.sin(time * 0.005 + i * 0.5) * 3;
      ctx.fillStyle = i % 2 === 0 ? '#ff4500' : '#ff6600';
      ctx.fillRect(4 + i * 6, 8 + offset, 8, h - 16);
    }

    ctx.fillStyle = '#cc0000';
    ctx.fillRect(2, 6, 12, h - 12);

    ctx.fillStyle = '#ffff00';
    ctx.fillRect(6, 10, 3, 3);
    ctx.fillRect(10, 10, 3, 3);

    ctx.fillStyle = '#fff';
    ctx.fillRect(8, 16, 2, 2);
    ctx.fillRect(11, 16, 2, 2);
  }

  private drawDragon(ctx: CanvasRenderingContext2D, w: number, h: number, bob: number): void {
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(8, 10 + bob, w - 16, h - 20);

    ctx.fillStyle = '#b22222';
    ctx.fillRect(2, 4 + bob, 16, 16);

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(4, 2 + bob, 4, 4);
    ctx.fillRect(12, 2 + bob, 4, 4);

    ctx.fillStyle = '#ffff00';
    ctx.fillRect(8, 10 + bob, 3, 3);
    ctx.fillRect(14, 10 + bob, 3, 3);

    ctx.fillStyle = '#8b0000';
    ctx.fillRect(w - 10, 12 + bob, 10, 8);

    ctx.fillStyle = '#ff4500';
    ctx.fillRect(w - 2, 14 + bob, 6, 4);

    ctx.fillStyle = '#8b0000';
    ctx.fillRect(10, h - 12, 6, 10);
    ctx.fillRect(w - 16, h - 12, 6, 10);

    ctx.fillStyle = '#228b22';
    ctx.fillRect(6, 20 + bob, w - 12, 4);
  }

  private drawSnowball(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const rotation = time * 0.003;

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0e0e0';
    for (let i = 0; i < 5; i++) {
      const angle = rotation + (i / 5) * Math.PI * 2;
      const x = w / 2 + Math.cos(angle) * (w / 3);
      const y = h / 2 + Math.sin(angle) * (h / 3);
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }

    ctx.fillStyle = '#4169e1';
    ctx.fillRect(w / 2 - 6, h / 2 - 4, 4, 4);
    ctx.fillRect(w / 2 + 2, h / 2 - 4, 4, 4);
  }

  private drawBat(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const wingFlap = Math.sin(time * 0.04) * 6;

    ctx.fillStyle = '#2c2c2c';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(0, h / 2 - wingFlap);
    ctx.lineTo(2, h / 2 + 4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w, h / 2 + wingFlap);
    ctx.lineTo(w - 2, h / 2 + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(w / 2 - 4, h / 2 - 2, 2, 2);
    ctx.fillRect(w / 2 + 2, h / 2 - 2, 2, 2);

    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(w / 2 - 5, 2, 3, 4);
    ctx.fillRect(w / 2 + 2, 2, 3, 4);
  }

  private drawGiant(ctx: CanvasRenderingContext2D, w: number, h: number, bob: number): void {
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(8, 12 + bob, w - 16, h - 24);

    ctx.fillStyle = '#deb887';
    ctx.fillRect(10, 2 + bob, w - 20, 14);

    ctx.fillStyle = '#4a3728';
    ctx.fillRect(8, 0 + bob, w - 16, 8);

    ctx.fillStyle = '#000';
    ctx.fillRect(14, 8 + bob, 4, 4);
    ctx.fillRect(w - 18, 8 + bob, 4, 4);

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(2, 14 + bob, 6, 16);
    ctx.fillRect(w - 8, 14 + bob, 6, 16);

    ctx.fillStyle = '#5c4033';
    ctx.fillRect(10, h - 16, 8, 14);
    ctx.fillRect(w - 18, h - 16, 8, 14);
  }

  private drawRobot(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const glow = 0.5 + Math.sin(time * 0.005) * 0.5;

    ctx.fillStyle = '#708090';
    ctx.fillRect(6, 10, w - 12, h - 20);

    ctx.fillStyle = '#a9a9a9';
    ctx.fillRect(8, 0, w - 16, 14);

    ctx.fillStyle = `rgba(255, 0, 0, ${glow})`;
    ctx.fillRect(12, 4, 6, 6);
    ctx.fillRect(w - 18, 4, 6, 6);

    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(w / 2 - 2, -4, 4, 6);
    ctx.fillStyle = `rgba(255, 0, 0, ${glow})`;
    ctx.fillRect(w / 2 - 1, -4, 2, 2);

    ctx.fillStyle = '#708090';
    ctx.fillRect(2, 12, 4, 18);
    ctx.fillRect(w - 6, 12, 4, 18);

    ctx.fillRect(10, h - 14, 8, 12);
    ctx.fillRect(w - 18, h - 14, 8, 12);

    ctx.fillStyle = `rgba(0, 255, 0, ${glow})`;
    ctx.fillRect(10, 18, w - 20, 4);
  }

  private drawTurret(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = '#696969';
    ctx.fillRect(4, h / 2, w - 8, h / 2);

    ctx.fillStyle = '#808080';
    ctx.fillRect(2, h / 2 - 2, w - 4, 6);

    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2f2f2f';
    ctx.fillRect(w / 2 - 3, h / 2 - 12, 6, 14);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(w / 2 - 2, h / 2 - 4, 4, 4);
  }

  private drawBlackhole(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    const cx = w / 2;
    const cy = h / 2;

    for (let i = 4; i >= 0; i--) {
      const hue = (time * 0.1 + i * 30) % 360;
      const radius = w / 2 - i * 4;
      ctx.fillStyle = `hsla(${hue}, 80%, ${30 + i * 10}%, ${0.8 - i * 0.15})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, cy, w / 4, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const angle = time * 0.005 + (i / 8) * Math.PI * 2;
      const dist = w / 3 + Math.sin(time * 0.003 + i) * 8;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      ctx.fillStyle = '#fff';
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
  }

  private drawBoss(ctx: CanvasRenderingContext2D, state: RenderState): void {
    const boss = state.boss;
    if (!boss) return;

    this.drawPixelBoss(ctx, boss, state.gameTime);
  }

  private drawPixelBoss(ctx: CanvasRenderingContext2D, boss: Boss, time: number): void {
    ctx.save();

    const facingRight = boss.facing === 'right';
    if (!facingRight) {
      ctx.translate(boss.x + boss.width, boss.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(boss.x, boss.y);
    }

    const w = boss.width;
    const h = boss.height;
    const bob = Math.sin(time * 0.003) * 3;
    const phase2 = boss.phase === 2;

    switch (boss.bossType) {
      case 'forest_king':
        this.drawForestKing(ctx, w, h, bob, phase2);
        break;
      case 'volcano_lord':
        this.drawVolcanoLord(ctx, w, h, bob, phase2, time);
        break;
      case 'ice_queen':
        this.drawIceQueen(ctx, w, h, bob, phase2, time);
        break;
      case 'space_emperor':
        this.drawSpaceEmperor(ctx, w, h, bob, phase2, time);
        break;
    }

    ctx.restore();
  }

  private drawForestKing(ctx: CanvasRenderingContext2D, w: number, h: number, bob: number, phase2: boolean): void {
    const bodyColor = phase2 ? '#228b22' : '#2e8b57';
    const accentColor = phase2 ? '#ff0000' : '#8b4513';

    ctx.fillStyle = bodyColor;
    ctx.fillRect(20, 30 + bob, w - 40, h - 50);

    ctx.fillRect(w / 2 - 25, 10 + bob, 50, 40);

    ctx.fillStyle = accentColor;
    ctx.fillRect(w / 2 - 30, 0 + bob, 10, 20);
    ctx.fillRect(w / 2 + 20, 0 + bob, 10, 20);
    ctx.fillRect(w / 2 - 5, 0 + bob, 10, 15);

    ctx.fillStyle = '#ffff00';
    ctx.fillRect(w / 2 - 15, 20 + bob, 8, 8);
    ctx.fillRect(w / 2 + 7, 20 + bob, 8, 8);

    ctx.fillStyle = '#000';
    ctx.fillRect(w / 2 - 13, 22 + bob, 4, 4);
    ctx.fillRect(w / 2 + 9, 22 + bob, 4, 4);

    ctx.fillStyle = bodyColor;
    ctx.fillRect(10, 40 + bob, 15, 40);
    ctx.fillRect(w - 25, 40 + bob, 15, 40);

    ctx.fillStyle = '#228b22';
    for (let i = 0; i < 5; i++) {
      const x = 25 + i * 18;
      ctx.fillRect(x, h - 20, 8, 20);
    }

    if (phase2) {
      ctx.fillStyle = '#ff4500';
      for (let i = 0; i < 6; i++) {
        const angle = (bob * 0.1 + i / 6) * Math.PI * 2;
        const x = w / 2 + Math.cos(angle) * (w / 2 + 10);
        const y = h / 2 + Math.sin(angle) * (h / 2 + 10);
        ctx.fillRect(x - 4, y - 4, 8, 8);
      }
    }
  }

  private drawVolcanoLord(ctx: CanvasRenderingContext2D, w: number, h: number, bob: number, phase2: boolean, time: number): void {
    const glowIntensity = 0.5 + Math.sin(time * 0.005) * 0.5;

    ctx.fillStyle = phase2 ? '#8b0000' : '#4a1c1c';
    ctx.fillRect(15, 25 + bob, w - 30, h - 45);

    ctx.fillStyle = '#2d0a0a';
    ctx.fillRect(w / 2 - 30, 5 + bob, 60, 45);

    ctx.fillStyle = `rgba(255, 69, 0, ${glowIntensity})`;
    ctx.fillRect(w / 2 - 25, 0 + bob, 50, 15);

    ctx.fillStyle = '#ffff00';
    for (let i = 0; i < 5; i++) {
      const x = w / 2 - 20 + i * 10;
      const y = 5 + bob + Math.sin(time * 0.01 + i) * 5;
      ctx.fillRect(x, y, 6, 8);
    }

    ctx.fillStyle = `rgba(255, 0, 0, ${glowIntensity})`;
    ctx.fillRect(w / 2 - 18, 18 + bob, 10, 10);
    ctx.fillRect(w / 2 + 8, 18 + bob, 10, 10);

    ctx.fillStyle = '#000';
    ctx.fillRect(w / 2 - 15, 20 + bob, 4, 4);
    ctx.fillRect(w / 2 + 11, 20 + bob, 4, 4);

    ctx.fillStyle = phase2 ? '#8b0000' : '#4a1c1c';
    ctx.fillRect(5, 35 + bob, 15, 50);
    ctx.fillRect(w - 20, 35 + bob, 15, 50);

    if (phase2) {
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(0, 30 + bob, 8, 8);
      ctx.fillRect(w - 8, 30 + bob, 8, 8);
      ctx.fillRect(w / 2 - 4, 50 + bob, 8, 8);
    }
  }

  private drawIceQueen(ctx: CanvasRenderingContext2D, w: number, h: number, bob: number, phase2: boolean, time: number): void {
    const dressColor = phase2 ? '#4169e1' : '#87ceeb';
    const accentColor = phase2 ? '#0000cd' : '#b0e0e6';

    ctx.fillStyle = dressColor;
    ctx.beginPath();
    ctx.moveTo(20, 40 + bob);
    ctx.lineTo(w - 20, 40 + bob);
    ctx.lineTo(w - 10, h);
    ctx.lineTo(10, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillRect(w / 2 - 20, 10 + bob, 40, 35);

    ctx.fillStyle = accentColor;
    ctx.fillRect(w / 2 - 25, 5 + bob, 50, 15);
    ctx.fillRect(w / 2 - 5, -5 + bob, 10, 15);

    ctx.fillStyle = '#4169e1';
    ctx.fillRect(w / 2 - 12, 22 + bob, 6, 6);
    ctx.fillRect(w / 2 + 6, 22 + bob, 6, 6);

    ctx.fillStyle = '#000';
    ctx.fillRect(w / 2 - 10, 24 + bob, 2, 2);
    ctx.fillRect(w / 2 + 8, 24 + bob, 2, 2);

    ctx.fillStyle = '#e0ffff';
    for (let i = 0; i < 8; i++) {
      const angle = time * 0.002 + (i / 8) * Math.PI * 2;
      const dist = 40 + Math.sin(time * 0.003 + i) * 10;
      const x = w / 2 + Math.cos(angle) * dist;
      const y = h / 2 + bob + Math.sin(angle) * dist * 0.5;
      this.drawPixelSnowflake(ctx, x - 4, y - 4, 8);
    }

    if (phase2) {
      ctx.fillStyle = '#00ffff';
      for (let i = 0; i < 6; i++) {
        const x = 15 + i * 15;
        ctx.fillRect(x, h - 30, 6, 25);
      }
    }
  }

  private drawSpaceEmperor(ctx: CanvasRenderingContext2D, w: number, h: number, bob: number, phase2: boolean, time: number): void {
    const armorColor = phase2 ? '#4b0082' : '#1a0a33';
    const glowColor = phase2 ? '#ff00ff' : '#8a2be2';
    const glowIntensity = 0.5 + Math.sin(time * 0.005) * 0.5;

    ctx.fillStyle = armorColor;
    ctx.fillRect(15, 30 + bob, w - 30, h - 50);

    ctx.fillStyle = '#0a001a';
    ctx.fillRect(w / 2 - 30, 5 + bob, 60, 40);

    ctx.fillStyle = `rgba(${glowColor === '#ff00ff' ? '255, 0, 255' : '138, 43, 226'}, ${glowIntensity})`;
    ctx.fillRect(w / 2 - 20, 15 + bob, 12, 12);
    ctx.fillRect(w / 2 + 8, 15 + bob, 12, 12);

    ctx.fillStyle = '#fff';
    ctx.fillRect(w / 2 - 16, 18 + bob, 4, 4);
    ctx.fillRect(w / 2 + 12, 18 + bob, 4, 4);

    ctx.fillStyle = armorColor;
    ctx.fillRect(5, 35 + bob, 12, 55);
    ctx.fillRect(w - 17, 35 + bob, 12, 55);

    ctx.fillStyle = `rgba(${glowColor === '#ff00ff' ? '255, 0, 255' : '138, 43, 226'}, ${glowIntensity * 0.5})`;
    ctx.fillRect(w / 2 - 8, 40 + bob, 16, 8);
    ctx.fillRect(w / 2 - 4, 50 + bob, 8, 20);

    if (phase2) {
      for (let i = 0; i < 8; i++) {
        const angle = time * 0.003 + (i / 8) * Math.PI * 2;
        const dist = w / 2 + 20;
        const x = w / 2 + Math.cos(angle) * dist;
        const y = h / 2 + bob + Math.sin(angle) * dist * 0.6;
        ctx.fillStyle = glowColor;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, state: RenderState): void {
    for (const proj of state.projectiles) {
      if (!proj.active) continue;

      let color = '#ffff00';
      let size = proj.width;

      if (proj.owner === 'player') {
        color = '#00ffff';
      } else if (proj.owner === 'enemy') {
        color = '#ff6600';
      } else if (proj.owner === 'boss') {
        color = '#ff00ff';
        size = proj.width;
      }

      ctx.fillStyle = color;
      ctx.fillRect(proj.x, proj.y, size, proj.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(proj.x + 2, proj.y + 2, size - 4, proj.height - 4);

      if (proj.owner === 'boss') {
        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(proj.x + size / 2, proj.y + proj.height / 2, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, state: RenderState): void {
    for (const particle of state.particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      if (particle.type === 'death' || particle.type === 'hit') {
        ctx.fillRect(
          Math.floor(particle.x - particle.size / 2),
          Math.floor(particle.y - particle.size / 2),
          particle.size,
          particle.size
        );
      } else {
        ctx.fillRect(
          Math.floor(particle.x),
          Math.floor(particle.y),
          particle.size,
          particle.size
        );
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawUI(ctx: CanvasRenderingContext2D, state: RenderState): void {
    const player = state.player;
    if (!player) return;

    this.drawHealthBar(ctx, player);
    this.drawCoins(ctx, player);
    this.drawScore(ctx, player);
    this.drawTimer(ctx, state.gameTime);
    this.drawBoostIndicators(ctx, player);
    this.drawBossHealthBar(ctx, state.boss);
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D, player: Player): void {
    const barX = 20;
    const barY = 20;
    const barWidth = 200;
    const barHeight = 24;

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = player.health / player.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight / 3);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.health)} / ${player.maxHealth}`, barX + barWidth / 2, barY + 17);

    ctx.fillStyle = '#ff4444';
    const heartSize = 16;
    ctx.fillRect(barX - heartSize - 8, barY + 4, heartSize, heartSize);
    ctx.fillStyle = '#ff8888';
    ctx.fillRect(barX - heartSize - 6, barY + 6, 4, 4);
  }

  private drawCoins(ctx: CanvasRenderingContext2D, player: Player): void {
    const x = CANVAS_WIDTH - 150;
    const y = 20;

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - 2, y - 2, 130, 32);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, 126, 28);

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 8, y + 6, 16, 16);
    ctx.fillStyle = '#ffed4a';
    ctx.fillRect(x + 10, y + 8, 12, 6);
    ctx.fillStyle = '#b8860b';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('$', x + 16, y + 18);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${player.coins}`, x + 32, y + 21);
  }

  private drawScore(ctx: CanvasRenderingContext2D, player: Player): void {
    const x = CANVAS_WIDTH - 150;
    const y = 60;

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - 2, y - 2, 130, 32);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, 126, 28);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', x + 8, y + 20);

    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${player.score}`, x + 118, y + 21);
  }

  private drawTimer(ctx: CanvasRenderingContext2D, gameTime: number): void {
    const x = CANVAS_WIDTH / 2;
    const y = 20;

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - 60, y - 2, 120, 32);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - 58, y, 116, 28);

    ctx.fillStyle = '#87ceeb';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formatTime(gameTime), x, y + 21);
  }

  private drawBoostIndicators(ctx: CanvasRenderingContext2D, player: Player): void {
    let x = 20;
    const y = 56;

    if (player.speedBoost) {
      ctx.fillStyle = '#00bfff';
      ctx.fillRect(x, y, 28, 28);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPD', x + 14, y + 18);
      x += 34;
    }

    if (player.powerBoost) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(x, y, 28, 28);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PWR', x + 14, y + 18);
      x += 34;
    }

    if (player.invincible) {
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(x, y, 28, 28);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', x + 14, y + 20);
      x += 34;
    }

    if (player.hasShield) {
      ctx.fillStyle = '#4169e1';
      ctx.fillRect(x, y, 28, 28);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🛡', x + 14, y + 20);
    }
  }

  private drawBossHealthBar(ctx: CanvasRenderingContext2D, boss: Boss | null): void {
    if (!boss) return;

    const barX = CANVAS_WIDTH / 2 - 200;
    const barY = CANVAS_HEIGHT - 60;
    const barWidth = 400;
    const barHeight = 32;

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = boss.health / boss.maxHealth;
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#ff4500');
    gradient.addColorStop(1, '#ff0000');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight / 3);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, CANVAS_WIDTH / 2, barY - 10);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${Math.ceil(boss.health)} / ${boss.maxHealth}`, CANVAS_WIDTH / 2, barY + 22);

    if (boss.phase === 2) {
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('⚡ ENRAGED ⚡', CANVAS_WIDTH / 2, barY + 42);
    }
  }

  private drawPixelTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
    const trunkW = w * 0.2;
    const trunkH = h * 0.4;
    const crownH = h * 0.6;

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + w / 2 - trunkW / 2, y + crownH, trunkW, trunkH);

    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      const layerW = w - i * (w / 6);
      const layerX = x + (w - layerW) / 2;
      const layerY = y + i * (crownH / 5);
      const layerH = crownH / 5 + 4;
      ctx.fillRect(layerX, layerY, layerW, layerH);
    }
  }

  private drawPixelBush(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillRect(x, y + h / 3, w, h * 0.6);
    ctx.fillRect(x + w * 0.1, y, w * 0.8, h * 0.5);
    ctx.fillRect(x + w * 0.2, y - h * 0.1, w * 0.6, h * 0.4);
  }

  private drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(x, y + h * 0.3, w, h * 0.5);
    ctx.fillRect(x + w * 0.1, y, w * 0.8, h * 0.6);
    ctx.fillRect(x + w * 0.2, y - h * 0.1, w * 0.6, h * 0.5);
  }

  private drawPixelMountain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
    ctx.fillStyle = color;
    for (let i = 0; i < h; i++) {
      const rowWidth = w * (1 - i / h);
      const rowX = x + (w - rowWidth) / 2;
      ctx.fillRect(rowX, y + i, rowWidth, 1);
    }

    ctx.fillStyle = '#fff';
    const snowH = h * 0.25;
    for (let i = 0; i < snowH; i++) {
      const rowWidth = w * (1 - i / h);
      const rowX = x + (w - rowWidth) / 2;
      ctx.fillRect(rowX, y + i, rowWidth, 1);
    }
  }

  private drawPixelVolcano(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bodyColor: string, lavaColor: string): void {
    ctx.fillStyle = bodyColor;
    for (let i = 0; i < h; i++) {
      const rowWidth = w * (0.4 + 0.6 * (i / h));
      const rowX = x + (w - rowWidth) / 2;
      ctx.fillRect(rowX, y + i, rowWidth, 1);
    }

    ctx.fillStyle = lavaColor;
    const craterW = w * 0.3;
    ctx.fillRect(x + w / 2 - craterW / 2, y, craterW, h * 0.15);
  }

  private drawPixelEmber(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
    const flicker = Math.sin(time * 0.02) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, ${100 + flicker * 100}, 0, ${0.5 + flicker * 0.5})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), 3, 3);
  }

  private drawPixelIceSpike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = '#87ceeb';
    for (let i = 0; i < h; i++) {
      const rowWidth = w * (1 - i / h);
      const rowX = x + (w - rowWidth) / 2;
      ctx.fillRect(rowX, y + i, rowWidth, 1);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < h * 0.7; i++) {
      const rowWidth = w * (1 - i / h) * 0.3;
      ctx.fillRect(x + w / 2 - rowWidth / 2, y + i, rowWidth, 1);
    }
  }

  private drawPixelSnowflake(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#fff';
    const s = Math.max(1, size);
    ctx.fillRect(Math.floor(x), Math.floor(y), s, s);

    if (size >= 3) {
      ctx.fillRect(Math.floor(x - s), Math.floor(y), s, s);
      ctx.fillRect(Math.floor(x + s), Math.floor(y), s, s);
      ctx.fillRect(Math.floor(x), Math.floor(y - s), s, s);
      ctx.fillRect(Math.floor(x), Math.floor(y + s), s, s);
    }
  }

  private drawPixelNebula(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + h * 0.4, w * 0.25, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawPixelPlanet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ringColor: string): void {
    ctx.fillStyle = '#cd853f';
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#deb887';
    ctx.beginPath();
    ctx.arc(x + r - r * 0.3, y + r - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(x + r, y + r, r * 1.5, r * 0.4, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }
}
