class Player {
  constructor(characterType, x, y) {
    this.characterType = characterType;
    const cfg = GameConfig.CHARACTERS[characterType];
    this.cfg = cfg;

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 42;
    this.height = 72;
    this.crouchHeight = 44;

    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.facing = 1;
    this.onGround = false;
    this.isCrouching = false;
    this.isSprinting = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.hitFlash = 0;
    this.jumpHeld = false;
    this.jumpHoldTime = 0;

    this.activeEffects = { speed: 0, shield: 0, smoke: 0 };

    this.score = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.walkCycle = 0;
    this.legAngle = 0;
    this.armAngle = 0;
    this.bodyBob = 0;
    this.eyeBlink = 0;
    this.squash = 0;
    this.stretch = 0;
  }

  get currentHeight() {
    return this.isCrouching ? this.crouchHeight : this.height;
  }

  getHitbox() {
    const h = this.currentHeight;
    return {
      x: this.x - this.width / 2,
      y: this.y - h,
      width: this.width,
      height: h
    };
  }

  takeDamage(amount) {
    if (this.activeEffects.shield > 0 || this.invincible) return;
    const reduction = this.cfg.damageReduction;
    const actualDmg = Math.floor(amount * (1 - reduction));
    this.hp = Math.max(0, this.hp - actualDmg);
    this.invincible = true;
    this.invincibleTimer = 60;
    this.hitFlash = 15;
    this.squash = 0.3;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  applyEffect(effect, value, duration) {
    if (effect === 'heal') {
      this.heal(value);
    } else if (effect === 'speed') {
      this.activeEffects.speed = duration;
    } else if (effect === 'shield') {
      this.activeEffects.shield = duration;
    } else if (effect === 'smoke') {
      this.activeEffects.smoke = duration;
    }
  }

  update(dt) {
    let moveSpeed = this.cfg.speed;
    if (this.isSprinting) moveSpeed *= 1.4;
    if (this.activeEffects.speed > 0) moveSpeed *= 2;
    if (this.isCrouching) moveSpeed += this.cfg.crouchSpeedBonus;
    if (this.isCrouching && !this.onGround) moveSpeed *= 0.7;

    if (Input.left()) {
      this.vx = -moveSpeed;
      this.facing = -1;
    } else if (Input.right()) {
      this.vx = moveSpeed;
      this.facing = 1;
    } else {
      this.vx *= 0.75;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    if (Input.jump() && this.onGround) {
      this.vy = -this.cfg.jumpPower;
      this.onGround = false;
      this.jumpHeld = true;
      this.jumpHoldTime = 0;
      this.stretch = 0.4;
    }

    const isJumpHeld = Input.isDown(GameConfig.KEYS.JUMP);
    if (this.jumpHeld && isJumpHeld && this.vy < 0) {
      this.jumpHoldTime++;
      const maxHold = 10 + this.cfg.airTimeBonus * 15;
      if (this.jumpHoldTime < maxHold) {
        this.vy -= 0.3 + this.cfg.airTimeBonus * 0.4;
      }
    }
    if (!isJumpHeld) this.jumpHeld = false;

    this.vy += GameConfig.GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    const groundY = GameConfig.GROUND_Y;
    if (this.y >= groundY) {
      if (!this.onGround && this.vy > 4) this.squash = 0.25;
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
    }

    const ceilingY = 80;
    if (this.y < ceilingY) {
      this.y = ceilingY;
      if (this.vy < 0) this.vy = 0;
    }

    this.x = Math.max(30, Math.min(GameConfig.WORLD_WIDTH - 30, this.x));

    this.isCrouching = Input.crouch() && this.onGround;
    this.isSprinting = Input.sprint();

    for (const key in this.activeEffects) {
      if (this.activeEffects[key] > 0) {
        this.activeEffects[key] -= dt;
        if (this.activeEffects[key] <= 0) this.activeEffects[key] = 0;
      }
    }

    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.squash > 0) this.squash -= 0.06;
    if (this.squash < 0) this.squash = 0;
    if (this.stretch > 0) this.stretch -= 0.08;
    if (this.stretch < 0) this.stretch = 0;

    this.eyeBlink++;
    if (this.eyeBlink > 180) this.eyeBlink = 0;

    this.animTimer++;
    if (this.animTimer >= 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    const moveAmt = Math.abs(this.vx);
    if (moveAmt > 0.5 && this.onGround) {
      this.walkCycle = (this.walkCycle + moveAmt * 0.06) % (Math.PI * 2);
      this.bodyBob = Math.abs(Math.sin(this.walkCycle * 2)) * 2.5;
    } else {
      this.walkCycle *= 0.9;
      this.bodyBob *= 0.85;
    }

    this.legAngle = Math.sin(this.walkCycle) * 0.55;
    this.armAngle = Math.sin(this.walkCycle + Math.PI) * 0.45;
  }

  render(ctx, cameraX) {
    const drawX = this.x - cameraX;
    const drawY = this.y;
    const cfg = this.cfg;
    const f = this.facing;

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    if (this.invincible && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    if (this.activeEffects.shield > 0) {
      ctx.save();
      const shieldAlpha = 0.35 + Math.sin(Date.now() * 0.01) * 0.1;
      const cy = drawY - (this.currentHeight / 2);
      const shieldGrad = ctx.createRadialGradient(drawX, cy, 5, drawX, cy, 60);
      shieldGrad.addColorStop(0, `rgba(253, 203, 110, ${shieldAlpha + 0.35})`);
      shieldGrad.addColorStop(0.6, `rgba(253, 203, 110, ${shieldAlpha})`);
      shieldGrad.addColorStop(1, 'rgba(253, 203, 110, 0)');
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.ellipse(drawX, cy, 55, this.currentHeight * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.activeEffects.smoke > 0) {
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const px = drawX + Math.sin(Date.now() * 0.006 + i * 1.2) * 26;
        const py = drawY - this.currentHeight / 2 + Math.cos(Date.now() * 0.004 + i * 0.8) * 22;
        const r = 24 - i * 2.5;
        const smokeGrad = ctx.createRadialGradient(px, py, 0, px, py, r);
        smokeGrad.addColorStop(0, 'rgba(178, 190, 195, 0.7)');
        smokeGrad.addColorStop(1, 'rgba(178, 190, 195, 0)');
        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.hitFlash > 0) {
      ctx.filter = 'brightness(2.5) saturate(0.3)';
    }

    ctx.save();
    ctx.translate(drawX, drawY);
    const sx = 1 - this.squash * 0.4 + this.stretch * 0.15;
    const sy = 1 + this.squash * 0.4 - this.stretch * 0.2;
    ctx.scale(sx, sy);

    if (this.isCrouching) {
      this.renderCrouch(ctx, cfg, f);
    } else {
      this.renderStand(ctx, cfg, f);
    }

    ctx.restore();

    if (this.activeEffects.speed > 0) {
      ctx.save();
      ctx.strokeStyle = '#00D2D3';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.55 - i * 0.12;
        ctx.beginPath();
        const sx2 = drawX - f * (15 + i * 10);
        const sy2 = drawY - 25 - i * 14;
        ctx.moveTo(sx2, sy2);
        ctx.quadraticCurveTo(sx2 - f * 8, sy2 + 3, sx2 - f * 22, sy2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  renderStand(ctx, cfg, f) {
    const bob = this.bodyBob;
    const legA = this.legAngle;
    const armA = this.armAngle;

    ctx.save();
    ctx.translate(-8, -bob);
    ctx.rotate(legA * 0.35);
    this.drawLeg(ctx, cfg, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(8, -bob);
    ctx.rotate(-legA * 0.35);
    this.drawLeg(ctx, cfg, 1);
    ctx.restore();

    this.drawBody(ctx, cfg, f, bob);

    ctx.save();
    ctx.translate(-16, -52 - bob);
    ctx.rotate(-armA + (f < 0 ? 0.3 : -0.3));
    this.drawArm(ctx, cfg, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(16, -52 - bob);
    ctx.rotate(armA + (f < 0 ? -0.3 : 0.3));
    this.drawArm(ctx, cfg, 1);
    ctx.restore();

    this.drawHead(ctx, cfg, f, bob);
  }

  renderCrouch(ctx, cfg, f) {
    const bob = this.bodyBob * 0.5;

    ctx.fillStyle = '#2D3436';
    ctx.beginPath();
    ctx.ellipse(-10, -2 - bob, 9, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(10, -2 - bob, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const bodyGrad = ctx.createRadialGradient(0, -26 - bob, 3, 0, -26 - bob, 30);
    bodyGrad.addColorStop(0, this.lightenColor(cfg.color, 25));
    bodyGrad.addColorStop(0.6, cfg.color);
    bodyGrad.addColorStop(1, this.darkenColor(cfg.color, 12));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, -26 - bob, 27, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = cfg.accent;
    ctx.beginPath();
    ctx.ellipse(0, -24 - bob, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawHead(ctx, cfg, f, bob + 18, true);
  }

  drawLeg(ctx, cfg, side) {
    ctx.fillStyle = '#2D3436';
    ctx.beginPath();
    ctx.moveTo(-4.5, -2);
    ctx.lineTo(4.5, -2);
    ctx.quadraticCurveTo(6, 9, 0, 11);
    ctx.quadraticCurveTo(-6, 9, -4.5, -2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(0, 12, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cfg.accent;
    ctx.beginPath();
    ctx.ellipse(0, 12, 5.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBody(ctx, cfg, f, bob) {
    const topY = -68 - bob;
    const botY = -14 - bob;
    const bodyGrad = ctx.createLinearGradient(0, topY, 0, botY);
    bodyGrad.addColorStop(0, this.lightenColor(cfg.color, 25));
    bodyGrad.addColorStop(0.5, cfg.color);
    bodyGrad.addColorStop(1, this.darkenColor(cfg.color, 12));
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(-18, botY);
    ctx.quadraticCurveTo(-24, -42 - bob, -15, topY);
    ctx.quadraticCurveTo(0, topY - 5, 15, topY);
    ctx.quadraticCurveTo(24, -42 - bob, 18, botY);
    ctx.quadraticCurveTo(0, botY + 5, -18, botY);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = cfg.accent;
    ctx.beginPath();
    ctx.ellipse(0, -38 - bob, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.characterType === 'clown') {
      ctx.fillStyle = '#FFE66D';
      const by = -46 - bob;
      const by2 = -28 - bob;
      this.drawPomPom(ctx, -12, by, 3.5);
      this.drawPomPom(ctx, 12, by, 3.5);
      this.drawPomPom(ctx, -10, by2, 3.5);
      this.drawPomPom(ctx, 10, by2, 3.5);
    } else if (this.characterType === 'trainer') {
      ctx.fillStyle = '#FDCB6E';
      ctx.beginPath();
      ctx.arc(0, -40 - bob, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E17055';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (this.characterType === 'acrobat') {
      ctx.strokeStyle = '#FDCB6E';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-15, -50 - bob);
      ctx.lineTo(-15, -22 - bob);
      ctx.moveTo(15, -50 - bob);
      ctx.lineTo(15, -22 - bob);
      ctx.stroke();
    }
  }

  drawArm(ctx, cfg, side) {
    const armGrad = ctx.createLinearGradient(0, -3, 0, 24);
    armGrad.addColorStop(0, this.lightenColor(cfg.color, 18));
    armGrad.addColorStop(1, cfg.color);
    ctx.fillStyle = armGrad;

    ctx.beginPath();
    ctx.ellipse(0, 11, 5.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.arc(0, 27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawHead(ctx, cfg, f, bob, crouch) {
    const headR = crouch ? 14 : 17;
    const headY = -68 - bob;
    const hr = headR;

    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.arc(0, headY, hr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(200, 150, 100, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-7 + f * 2, headY + 4, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(7 + f * 2, headY + 4, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const blinking = this.eyeBlink > 174 && this.eyeBlink < 180;
    const eyeY = headY - 3;
    const eyeX = f * 2.5;

    if (blinking) {
      ctx.strokeStyle = '#2D3436';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6 + eyeX, eyeY);
      ctx.lineTo(-2 + eyeX, eyeY);
      ctx.moveTo(2 + eyeX, eyeY);
      ctx.lineTo(6 + eyeX, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#2D3436';
      ctx.beginPath();
      ctx.ellipse(-4 + eyeX, eyeY, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(6 + eyeX, eyeY, 2.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.ellipse(-3 + eyeX, eyeY - 1, 1, 1.2, 0, 0, Math.PI * 2);
      ctx.ellipse(7 + eyeX, eyeY - 1, 1, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#E17055';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(eyeX, headY + 6, 5, 0.15, Math.PI - 0.15);
    ctx.stroke();

    if (this.characterType === 'clown') {
      this.drawClownHat(ctx, headY, hr, cfg, f);
    } else if (this.characterType === 'trainer') {
      this.drawTrainerHat(ctx, headY, hr, cfg, f);
    } else if (this.characterType === 'acrobat') {
      this.drawAcrobatHat(ctx, headY, hr, cfg, f);
    }
  }

  drawClownHat(ctx, headY, hr, cfg, f) {
    ctx.fillStyle = '#FF6B6B';
    for (let i = -2; i <= 2; i++) {
      const angle = -Math.PI / 2 + (i / 2) * 0.55;
      const hx = Math.cos(angle) * (hr + 4);
      const hy = headY + Math.sin(angle) * (hr + 2);
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    ctx.fillStyle = cfg.hat;
    ctx.beginPath();
    ctx.moveTo(-hr - 3, headY - 5);
    ctx.quadraticCurveTo(0, headY - hr - 24, hr + 3, headY - 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(0, headY - hr - 24, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FF4757';
    ctx.beginPath();
    ctx.arc(f * 2, headY + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawTrainerHat(ctx, headY, hr, cfg, f) {
    ctx.fillStyle = '#3D2914';
    ctx.beginPath();
    ctx.ellipse(0, headY - hr + 2, hr + 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cfg.hat;
    ctx.beginPath();
    ctx.roundRect(-15, headY - hr - 22, 30, 20, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.fillRect(-17, headY - hr - 3, 34, 5);

    ctx.fillStyle = '#FDCB6E';
    ctx.fillRect(-15, headY - hr - 10, 30, 3);

    ctx.fillStyle = '#E17055';
    ctx.beginPath();
    ctx.ellipse(0, headY - hr - 13, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawAcrobatHat(ctx, headY, hr, cfg, f) {
    ctx.fillStyle = cfg.hat;
    ctx.beginPath();
    ctx.moveTo(-14, headY - 7);
    ctx.lineTo(14, headY - 7);
    ctx.lineTo(0, headY - hr - 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.arc(0, headY - hr - 30, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(253, 203, 110, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, headY - 12, hr + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(253, 203, 110, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, headY - 12, hr + 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawPomPom(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    this.beginPath();
    this.moveTo(x + r[0], y);
    this.lineTo(x + w - r[1], y);
    this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    this.lineTo(x + w, y + h - r[2]);
    this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    this.lineTo(x + r[3], y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    this.lineTo(x, y + r[0]);
    this.quadraticCurveTo(x, y, x + r[0], y);
    this.closePath();
    return this;
  };
}
