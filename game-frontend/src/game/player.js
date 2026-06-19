import { resolveCollision } from './collision.js';

const State = {
  IDLE: 'IDLE',
  RUN: 'RUN',
  JUMP: 'JUMP',
  FALL: 'FALL',
  ATTACK: 'ATTACK',
  DASH: 'DASH',
  HURT: 'HURT',
  DEAD: 'DEAD',
};

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 36;
    this.height = 56;
    this.vx = 0;
    this.vy = 0;
    this.hp = 5;
    this.maxHp = 5;
    this.speed = 4.5;
    this.jumpForce = -11;
    this.gravity = 0.55;
    this.facing = 1;
    this.onGround = false;
    this.state = State.IDLE;
    this.worldMinX = 0;
    this.worldMaxX = Infinity;

    this.attackFrame = 0;
    this.attackDuration = 18;
    this.attackCooldown = 0;
    this.attackCooldownMax = 8;
    this.canSlashProjectiles = false;

    this.dashFrame = 0;
    this.dashDuration = 12;
    this.dashCooldown = 0;
    this.dashCooldownMax = 40;
    this.dashSpeed = 14;

    this.invincible = 0;
    this.hurtStun = 0;
    this.hurtStunMax = 15;
    this.invincibleAfterDamage = 45;

    this.jumpReleased = true;
    this.jumpLockFrames = 0;
    this.prevX = x;
    this.prevY = y;

    this.onEmitParticles = null;
  }

  update(input, platforms) {
    if (!this.isAlive()) {
      this.state = State.DEAD;
      this.vx = 0;
      this.vy += this.gravity;
      this.y += this.vy;
      this._clampToWorldBounds();
      return;
    }

    if (this.invincible > 0) this.invincible--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.hurtStun > 0) this.hurtStun--;
    if (this.jumpLockFrames > 0) this.jumpLockFrames--;

    this._sanitizeState();

    if (this.dashFrame > 0) {
      this.dashFrame--;
      this.vx = this.dashSpeed * this.facing;
      this.vy = 0;
      this.state = State.DASH;
      this.invincible = Math.max(this.invincible, 1);
      if (this.onEmitParticles) {
        this.onEmitParticles('DASH_AFTERIMAGE', this.x + this.width * 0.5, this.y + this.height * 0.5, {
          size: this.height * 0.4,
          width: this.width * 0.4,
        });
      }
      this.prevX = this.x;
      this.prevY = this.y;
      this.x += this.vx;
      this.y += this.vy;
      resolveCollision(this, platforms);
      this._clampToWorldBounds();
      this._sanitizeState();
      if (this.dashFrame <= 0) {
        this.dashCooldown = this.dashCooldownMax;
        this.vx = 0;
      }
      return;
    }

    if (this.attackFrame > 0) {
      this.attackFrame--;
      this.canSlashProjectiles = true;
      this.state = State.ATTACK;
      if (this.onGround) {
        this.vx *= 0.7;
      }
      this.prevX = this.x;
      this.prevY = this.y;
      this.x += this.vx;
      if (!this.onGround) {
        this.vy += this.gravity;
      }
      this.y += this.vy;
      resolveCollision(this, platforms);
      this._clampToWorldBounds();
      this._sanitizeState();
      if (this.attackFrame <= 0) {
        this.attackCooldown = this.attackCooldownMax;
        this.canSlashProjectiles = false;
      }
      return;
    } else {
      this.canSlashProjectiles = false;
    }

    if (this.hurtStun > 0) {
      this.state = State.HURT;
      this.vx *= 0.82;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      this.prevX = this.x;
      this.prevY = this.y;
      this.x += this.vx;
      this.vy += this.gravity;
      this.y += this.vy;
      resolveCollision(this, platforms);
      this._clampToWorldBounds();
      this._sanitizeState();
      return;
    }

    let moving = false;
    if (input.isDown('ArrowLeft') || input.isDown('a') || input.isDown('A')) {
      this.vx = -this.speed;
      this.facing = -1;
      moving = true;
    } else if (input.isDown('ArrowRight') || input.isDown('d') || input.isDown('D')) {
      this.vx = this.speed;
      this.facing = 1;
      moving = true;
    } else {
      this.vx *= 0.85;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    if (input.isPressed('j') || input.isPressed('J')) {
      this.startAttack();
    } else if ((input.isPressed('k') || input.isPressed('K')) && this.onGround && this.jumpReleased) {
      this.vy = this.jumpForce;
      this.onGround = false;
      this.jumpReleased = false;
      this.jumpLockFrames = 4;
    } else if (input.isPressed('l') || input.isPressed('L')) {
      this.startDash();
    }

    if (!input.isDown('k') && !input.isDown('K')) {
      if (!this.onGround && this.vy < this.jumpForce * 0.4) {
        this.vy *= 0.5;
      }
      this.jumpReleased = true;
    }

    if (!this.onGround) {
      this.vy += this.gravity;
    }

    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx;
    this.y += this.vy;
    resolveCollision(this, platforms);
    this._clampToWorldBounds();
    this._sanitizeState();

    if (this.attackFrame > 0) {
      this.state = State.ATTACK;
    } else if (this.onGround) {
      if (moving) {
        this.state = State.RUN;
      } else {
        this.state = State.IDLE;
      }
    } else {
      if (this.vy < 0) {
        this.state = State.JUMP;
      } else {
        this.state = State.FALL;
      }
    }
  }

  takeDamage(amount, fromX) {
    if (this.invincible > 0 || !this.isAlive()) return;
    this.hp -= amount;
    if (fromX < this.x + this.width * 0.5) {
      this.vx = 3.5;
    } else {
      this.vx = -3.5;
    }
    this.vy = -3.5;
    this.hurtStun = this.hurtStunMax;
    this.invincible = this.invincibleAfterDamage;
    this.state = State.HURT;
    this.attackFrame = 0;
    this.dashFrame = 0;
    this.canSlashProjectiles = false;
    if (!this.isAlive()) {
      this.state = State.DEAD;
    }
  }

  stompBounce() {
    this.vy = this.jumpForce * 0.6;
    this.onGround = false;
  }

  startAttack() {
    if (this.attackFrame > 0 || this.attackCooldown > 0) return;
    this.attackFrame = this.attackDuration;
    this.canSlashProjectiles = true;
    this.state = State.ATTACK;
  }

  startDash() {
    if (this.dashFrame > 0 || this.dashCooldown > 0) return;
    this.dashFrame = this.dashDuration;
    this.invincible = this.dashDuration;
    this.state = State.DASH;
  }

  getHitbox() {
    if (this.attackFrame <= 0) return null;
    const range = 55;
    const hbX = this.facing === 1 ? this.x + this.width : this.x - range;
    const hbY = this.y + 4;
    const hbW = range;
    const hbH = this.height - 8;
    return { x: hbX, y: hbY, width: hbW, height: hbH };
  }

  render(ctx, cameraOffset) {
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const sx = this.x - ox;
    const sy = this.y - oy;

    if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0 && this.state !== State.DASH) {
      return;
    }

    ctx.save();
    ctx.translate(sx + this.width * 0.5, sy + this.height);
    ctx.scale(this.facing, 1);

    const color = '#e8e0d0';
    const shadowColor = 'rgba(232,224,208,0.15)';

    switch (this.state) {
      case State.IDLE:
        this._drawIdle(ctx, color, shadowColor);
        break;
      case State.RUN:
        this._drawRun(ctx, color, shadowColor);
        break;
      case State.JUMP:
        this._drawJump(ctx, color, shadowColor);
        break;
      case State.FALL:
        this._drawFall(ctx, color, shadowColor);
        break;
      case State.ATTACK:
        this._drawAttack(ctx, color, shadowColor);
        break;
      case State.DASH:
        this._drawDash(ctx, color, shadowColor);
        break;
      case State.HURT:
        this._drawHurt(ctx, color, shadowColor);
        break;
      case State.DEAD:
        this._drawDead(ctx, color);
        break;
    }

    ctx.restore();
  }

  _drawIdle(ctx, color, shadowColor) {
    ctx.fillStyle = color;
    ctx.fillRect(-4, -56, 8, 28);
    ctx.fillRect(-7, -28, 14, 28);
    ctx.fillStyle = shadowColor;
    ctx.fillRect(-7, -28, 14, 28);
    ctx.fillStyle = color;
    ctx.fillRect(-7, -28, 5, 28);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-1, -46);
    ctx.lineTo(2, -46);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1, -46);
    ctx.lineTo(6, -42);
    ctx.lineTo(6, -36);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(6, -36);
    ctx.lineTo(4, -32);
    ctx.stroke();

    this._drawSwordIdle(ctx, color);
  }

  _drawSwordIdle(ctx, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, -40);
    ctx.lineTo(10, -52);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(5, -41);
    ctx.lineTo(7, -39);
    ctx.stroke();
  }

  _drawRun(ctx, color, shadowColor) {
    const t = Date.now() * 0.012;
    const bob = Math.sin(t * 2) * 2;

    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(2, bob);
    ctx.fillRect(-4, -56, 8, 28);
    ctx.restore();

    ctx.fillStyle = shadowColor;
    ctx.fillRect(-5, -28 + bob, 12, 28);
    ctx.fillStyle = color;
    ctx.fillRect(-5, -28 + bob, 4, 28);

    const legPhase = Math.sin(t * 3);
    ctx.fillStyle = color;
    ctx.fillRect(-4 + legPhase * 4, -2, 3, 6);
    ctx.fillRect(1 - legPhase * 4, -2, 3, 6);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3, -44 + bob);
    ctx.lineTo(8, -38 + bob);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -42 + bob);
    ctx.lineTo(12, -54 + bob);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(7, -43 + bob);
    ctx.lineTo(9, -41 + bob);
    ctx.stroke();
  }

  _drawJump(ctx, color, shadowColor) {
    ctx.fillStyle = color;
    ctx.fillRect(-4, -56, 8, 26);

    ctx.fillRect(-6, -30, 12, 22);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -46);
    ctx.lineTo(-6, -54);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, -46);
    ctx.lineTo(6, -54);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1, -44);
    ctx.lineTo(8, -50);
    ctx.lineTo(8, -58);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(-5, -8, 4, 8);
    ctx.fillRect(2, -8, 4, 8);
  }

  _drawFall(ctx, color, shadowColor) {
    ctx.fillStyle = color;
    ctx.fillRect(-4, -56, 8, 26);
    ctx.fillRect(-6, -30, 12, 22);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-1, -46);
    ctx.lineTo(-5, -50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -46);
    ctx.lineTo(7, -50);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1, -44);
    ctx.lineTo(8, -40);
    ctx.lineTo(8, -34);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(-6, -8, 5, 8);
    ctx.fillRect(2, -8, 5, 8);
  }

  _drawAttack(ctx, color, shadowColor) {
    const progress = 1 - this.attackFrame / this.attackDuration;

    ctx.fillStyle = color;
    ctx.fillRect(-4, -56, 8, 28);
    ctx.fillRect(-6, -28, 12, 24);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3, -46);
    ctx.lineTo(8, -48);
    ctx.stroke();

    const swordAngle = -Math.PI * 0.3 + progress * Math.PI * 0.8;
    const shoulderX = 6;
    const shoulderY = -44;
    const swordLen = 30;

    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(swordAngle);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(swordLen, 0);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(2, 0);
    ctx.stroke();

    ctx.restore();

    if (progress > 0.1 && progress < 0.8) {
      this._drawSwordArc(ctx, shoulderX, shoulderY, swordLen, progress, color);
    }

    if (progress < 0.5) {
      ctx.fillStyle = color;
      ctx.fillRect(-5, -4, 4, 6);
      ctx.fillRect(2, -4, 4, 6);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(-3, -4, 4, 6);
      ctx.fillRect(4, -4, 4, 6);
    }
  }

  _drawSwordArc(ctx, cx, cy, len, progress, color) {
    const startAngle = -Math.PI * 0.3;
    const endAngle = startAngle + progress * Math.PI * 0.8;
    ctx.strokeStyle = 'rgba(232,224,208,0.4)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, len * 0.8, startAngle, endAngle);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232,224,208,0.15)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, len * 0.8, startAngle, endAngle);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  _drawDash(ctx, color, shadowColor) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;

    ctx.fillRect(-6, -56, 20, 14);

    ctx.fillRect(0, -42, 16, 22);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(12, -42);
    ctx.lineTo(22, -48);
    ctx.lineTo(28, -44);
    ctx.stroke();

    ctx.fillRect(2, -20, 6, 20);
    ctx.fillRect(10, -20, 6, 20);

    ctx.globalAlpha = 1;
  }

  _drawHurt(ctx, color, shadowColor) {
    ctx.fillStyle = '#c0a090';
    ctx.fillRect(-4, -56, 8, 28);
    ctx.fillRect(-6, -28, 12, 24);

    ctx.strokeStyle = '#c0a090';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -48);
    ctx.lineTo(1, -46);
    ctx.lineTo(-3, -44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -48);
    ctx.lineTo(7, -46);
    ctx.lineTo(3, -44);
    ctx.stroke();

    ctx.strokeStyle = '#c0a090';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -42);
    ctx.lineTo(-4, -38);
    ctx.stroke();

    ctx.fillRect(-4, -4, 3, 6);
    ctx.fillRect(1, -4, 3, 6);
  }

  _drawDead(ctx, color) {
    ctx.fillStyle = 'rgba(232,224,208,0.4)';
    ctx.fillRect(-8, -8, 16, 8);

    ctx.strokeStyle = 'rgba(232,224,208,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(10, -6);
    ctx.stroke();
  }

  getState() {
    return this.state;
  }

  isAlive() {
    return this.hp > 0;
  }

  setWorldBounds(minX, maxX) {
    this.worldMinX = minX;
    this.worldMaxX = maxX;
  }

  _clampToWorldBounds() {
    if (this.x < this.worldMinX) {
      this.x = this.worldMinX;
      this.vx = 0;
    }
    const maxX = this.worldMaxX - this.width;
    if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }
  }

  _sanitizeState() {
    if (isNaN(this.x) || !isFinite(this.x)) this.x = this.prevX || 100;
    if (isNaN(this.y) || !isFinite(this.y)) this.y = this.prevY || 400;
    if (isNaN(this.vx) || !isFinite(this.vx)) this.vx = 0;
    if (isNaN(this.vy) || !isFinite(this.vy)) this.vy = 0;
    if (this.vx > 20) this.vx = 20;
    if (this.vx < -20) this.vx = -20;
    if (this.vy > 25) this.vy = 25;
    if (this.vy < -25) this.vy = -25;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    if (this.hp < 0) this.hp = 0;
  }
}
