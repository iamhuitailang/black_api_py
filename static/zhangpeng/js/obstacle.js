class Obstacle {
  constructor(type, x, y, difficulty = 1) {
    const cfg = GameConfig.OBSTACLE_TYPES[type];
    this.type = type;
    this.cfg = cfg;
    this.x = x;
    this.y = y;
    this.width = cfg.width;
    this.height = cfg.height;
    this.difficulty = difficulty;
    this.vx = 0;
    this.vy = 0;
    this.isAnimal = cfg.isAnimal || false;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.15;
    this.active = true;
    this.falling = cfg.y !== 'ground';
    this.animFrame = 0;
    this.animTimer = 0;
    this.id = Math.random().toString(36).substr(2, 9);

    const speedMult = [1, 1.8, 3.0][difficulty - 1] || 1;
    const fallMult = [1, 1.5, 2.5][difficulty - 1] || 1;

    if (this.isAnimal) {
      this.vx = (Math.random() > 0.5 ? 1 : -1) * cfg.speedX * speedMult;
    } else if (this.falling) {
      this.vy = (2 + Math.random() * 2) * fallMult;
    }
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  update(dt, player) {
    if (this.isAnimal) {
      this.x += this.vx;
      if (this.type === 'monkey') {
        this.animTimer++;
        if (this.animTimer > 40) {
          this.animTimer = 0;
          this.vx = (Math.random() > 0.5 ? 1 : -1) * Math.abs(this.vx);
        }
      }
      this.y = GameConfig.GROUND_Y;
    } else if (this.falling) {
      this.vy += 0.3;
      this.y += this.vy;
      this.x += this.vx;
      this.rotation += this.rotationSpeed;
      if (this.y >= GameConfig.GROUND_Y) {
        this.y = GameConfig.GROUND_Y;
        this.vy = 0;
        this.falling = false;
        if (this.type === 'crate') {
          this.vx = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
        } else {
          this.vx *= 0.5;
        }
      }
    } else {
      this.x += this.vx;
      this.vx *= 0.98;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    if (this.x < -100 || this.x > GameConfig.WORLD_WIDTH + 100) {
      this.active = false;
    }
  }

  render(ctx, cameraX) {
    const drawX = this.x - cameraX;
    const drawY = this.y;

    if (drawX < -100 || drawX > GameConfig.CANVAS_WIDTH + 100) return;

    ctx.save();

    if (this.rotation !== 0) {
      ctx.translate(drawX, drawY - this.height / 2);
      ctx.rotate(this.rotation);
      ctx.translate(-drawX, -(drawY - this.height / 2));
    }

    switch (this.type) {
      case 'cloth':
        this.renderCloth(ctx, drawX, drawY);
        break;
      case 'beam':
        this.renderBeam(ctx, drawX, drawY);
        break;
      case 'crate':
        this.renderCrate(ctx, drawX, drawY);
        break;
      case 'stone':
        this.renderStone(ctx, drawX, drawY);
        break;
      case 'monkey':
        this.renderMonkey(ctx, drawX, drawY);
        break;
      case 'horse':
        this.renderHorse(ctx, drawX, drawY);
        break;
      case 'bear':
        this.renderBear(ctx, drawX, drawY);
        break;
    }

    ctx.restore();
  }

  renderCloth(ctx, x, y) {
    ctx.fillStyle = '#E17055';
    ctx.beginPath();
    ctx.moveTo(x - 25, y - 5);
    ctx.quadraticCurveTo(x, y - 25, x + 25, y - 5);
    ctx.quadraticCurveTo(x + 20, y, x, y - 3);
    ctx.quadraticCurveTo(x - 20, y, x - 25, y - 5);
    ctx.fill();
    ctx.strokeStyle = '#D63031';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  renderBeam(ctx, x, y) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 60, y - 20, 120, 20);
    ctx.strokeStyle = '#5D3317';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 60, y - 20, 120, 20);
    ctx.beginPath();
    ctx.moveTo(x - 30, y - 20);
    ctx.lineTo(x - 25, y);
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x + 5, y);
    ctx.moveTo(x + 30, y - 20);
    ctx.lineTo(x + 35, y);
    ctx.stroke();
  }

  renderCrate(ctx, x, y) {
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(x - 22, y - 45, 44, 45);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 22, y - 45, 44, 45);
    ctx.beginPath();
    ctx.moveTo(x - 22, y - 45);
    ctx.lineTo(x + 22, y);
    ctx.moveTo(x + 22, y - 45);
    ctx.lineTo(x - 22, y);
    ctx.stroke();
  }

  renderStone(ctx, x, y) {
    ctx.fillStyle = '#636E72';
    ctx.beginPath();
    ctx.moveTo(x - 17, y - 20);
    ctx.lineTo(x - 10, y - 35);
    ctx.lineTo(x + 8, y - 33);
    ctx.lineTo(x + 17, y - 18);
    ctx.lineTo(x + 12, y - 3);
    ctx.lineTo(x - 8, y - 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2D3436';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#747D80';
    ctx.beginPath();
    ctx.arc(x - 5, y - 22, 4, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 15, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderMonkey(ctx, x, y) {
    const bounce = Math.sin(this.animTimer * 0.3) * 3;
    const dir = this.vx >= 0 ? 1 : -1;

    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.ellipse(x, y - 25 + bounce, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.ellipse(x, y - 20 + bounce, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.arc(x, y - 42 + bounce, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.arc(x, y - 40 + bounce, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x - 3 + dir, y - 42 + bounce, 2, 0, Math.PI * 2);
    ctx.arc(x + 3 + dir, y - 42 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 15 * dir, y - 30 + bounce);
    ctx.quadraticCurveTo(x - 30 * dir, y - 25, x - 25 * dir, y - 15);
    ctx.stroke();

    ctx.fillStyle = '#A0522D';
    const armSwing = Math.sin(this.animTimer * 0.5) * 8;
    ctx.beginPath();
    ctx.arc(x + 15 * dir, y - 28 + bounce + armSwing, 6, 0, Math.PI * 2);
    ctx.arc(x - 15 * dir, y - 28 + bounce - armSwing, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  renderHorse(ctx, x, y) {
    const dir = this.vx >= 0 ? 1 : -1;
    const stride = Math.sin(this.animTimer * 0.4) * 6;

    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(x, y - 30, 30, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.moveTo(x + 20 * dir, y - 42);
    ctx.lineTo(x + 35 * dir, y - 50);
    ctx.lineTo(x + 35 * dir, y - 35);
    ctx.lineTo(x + 22 * dir, y - 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(x + 30 * dir, y - 52);
    ctx.lineTo(x + 40 * dir, y - 48);
    ctx.lineTo(x + 35 * dir, y - 45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 32 * dir, y - 46, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6B3410';
    for (let i = 0; i < 4; i++) {
      const lx = x + (i - 1.5) * 12;
      const legOffset = Math.sin(this.animTimer * 0.4 + i * 1.5) * 8;
      ctx.fillRect(lx - 3, y - 15, 6, 15 + legOffset * 0.3);
    }

    ctx.strokeStyle = '#2F1810';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 25 * dir, y - 40);
    ctx.lineTo(x - 10 * dir, y - 55);
    ctx.stroke();
  }

  renderBear(ctx, x, y) {
    const dir = this.vx >= 0 ? 1 : -1;
    const sway = Math.sin(this.animTimer * 0.1) * 2;

    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.ellipse(x, y - 35, 25, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6B6B6B';
    ctx.beginPath();
    ctx.ellipse(x + 3 * dir, y - 30, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.arc(x, y - 58 + sway, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x - 10, y - 68 + sway, 6, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 68 + sway, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3A3A3A';
    ctx.beginPath();
    ctx.arc(x - 10, y - 68 + sway, 3, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 68 + sway, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.arc(x + 3 * dir, y - 56 + sway, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF4757';
    ctx.beginPath();
    ctx.arc(x - 4, y - 60 + sway, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 60 + sway, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.ellipse(x - 20 * dir, y - 35 + sway, 8, 15, 0.3 * dir, 0, Math.PI * 2);
    ctx.ellipse(x + 20 * dir, y - 35 - sway, 8, 15, -0.3 * dir, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.ellipse(x - 10, y - 10, 8, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 10, y - 10, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
