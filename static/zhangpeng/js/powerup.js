class Powerup {
  constructor(type, x, y) {
    const cfg = GameConfig.POWERUP_TYPES[type];
    this.type = type;
    this.cfg = cfg;
    this.x = x;
    this.y = y;
    this.width = cfg.width;
    this.height = cfg.height;
    this.collected = false;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.animTimer = 0;
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  update(dt) {
    this.animTimer += dt;
  }

  render(ctx, cameraX) {
    if (this.collected) return;
    const drawX = this.x - cameraX;
    const bob = Math.sin(this.animTimer * 0.005 + this.bobOffset) * 5;
    const drawY = this.y - this.height / 2 + bob;

    if (drawX < -50 || drawX > GameConfig.CANVAS_WIDTH + 50) return;

    ctx.save();

    ctx.shadowColor = this.cfg.color;
    ctx.shadowBlur = 15;

    ctx.fillStyle = this.cfg.color;

    switch (this.type) {
      case 'heart':
        this.renderHeart(ctx, drawX, drawY);
        break;
      case 'speed':
        this.renderSpeed(ctx, drawX, drawY);
        break;
      case 'shield':
        this.renderShield(ctx, drawX, drawY);
        break;
      case 'smoke':
        this.renderSmoke(ctx, drawX, drawY);
        break;
    }

    ctx.restore();
  }

  renderHeart(ctx, x, y) {
    ctx.fillStyle = '#FF4757';
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.bezierCurveTo(x, y, x - 15, y - 5, x - 15, y - 10);
    ctx.bezierCurveTo(x - 15, y - 18, x - 5, y - 18, x, y - 10);
    ctx.bezierCurveTo(x + 5, y - 18, x + 15, y - 18, x + 15, y - 10);
    ctx.bezierCurveTo(x + 15, y - 5, x, y, x, y + 5);
    ctx.fill();
    ctx.fillStyle = '#FF6B81';
    ctx.beginPath();
    ctx.ellipse(x - 4, y - 12, 4, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  renderSpeed(ctx, x, y) {
    ctx.fillStyle = '#00D2D3';
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 12);
    ctx.lineTo(x + 8, y - 12);
    ctx.lineTo(x + 2, y - 2);
    ctx.lineTo(x + 12, y - 2);
    ctx.lineTo(x - 5, y + 12);
    ctx.lineTo(x - 1, y + 2);
    ctx.lineTo(x - 12, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#81ECEC';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 8);
    ctx.lineTo(x + 4, y - 8);
    ctx.lineTo(x + 1, y - 3);
    ctx.lineTo(x - 3, y - 3);
    ctx.closePath();
    ctx.fill();
  }

  renderShield(ctx, x, y) {
    ctx.fillStyle = '#FDCB6E';
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 12, y - 8);
    ctx.lineTo(x + 10, y + 5);
    ctx.lineTo(x, y + 14);
    ctx.lineTo(x - 10, y + 5);
    ctx.lineTo(x - 12, y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 6, y - 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 4, y + 4);
    ctx.lineTo(x - 6, y - 4);
    ctx.closePath();
    ctx.fill();
  }

  renderSmoke(ctx, x, y) {
    ctx.fillStyle = '#B2BEC3';
    ctx.beginPath();
    ctx.arc(x - 8, y + 2, 8, 0, Math.PI * 2);
    ctx.arc(x, y - 4, 10, 0, Math.PI * 2);
    ctx.arc(x + 8, y + 2, 8, 0, Math.PI * 2);
    ctx.arc(x - 4, y + 6, 7, 0, Math.PI * 2);
    ctx.arc(x + 4, y + 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#DFE6E9';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 4, 0, Math.PI * 2);
    ctx.arc(x + 3, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
