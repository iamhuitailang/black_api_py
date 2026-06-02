class DafeijiPlayer {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.width = 48;
    this.height = 56;
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 5;
    this.attack = 10;
    this.defense = 2;
    this.lives = 3;
    this.weaponLevel = 1;
    this.bulletCount = 1;
    this.shootCooldown = 0;
    this.shootInterval = 8;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 90;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.shieldDuration = 300;
    this.speedBoostActive = false;
    this.speedBoostTimer = 0;
    this.speedBoostDuration = 300;
    this.baseSpeed = 5;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.hitFlashTimer = 0;
    this.engineFlicker = 0;
    this.aircraftData = null;
  }

  setAircraft(aircraftData) {
    this.aircraftData = aircraftData;
    if (aircraftData) {
      this.maxHp = aircraftData.hp || 100;
      this.hp = this.maxHp;
      this.speed = aircraftData.speed || 5;
      this.baseSpeed = this.speed;
      this.attack = aircraftData.attack || 10;
      this.defense = aircraftData.defense || 2;
      this.bulletCount = aircraftData.bullet_count || 1;
      this.lives = aircraftData.lives || 3;
      this.weaponLevel = aircraftData.weapon_level || 1;
      this.width = aircraftData.width || 48;
      this.height = aircraftData.height || 56;
    }
  }

  resetPosition() {
    this.x = this.canvasWidth / 2 - this.width / 2;
    this.y = this.canvasHeight - this.height - 40;
  }

  moveLeft(dt) {
    let spd = this.speedBoostActive ? this.baseSpeed * 1.5 : this.baseSpeed;
    this.x -= spd * dt;
    if (this.x < 0) this.x = 0;
  }

  moveRight(dt) {
    let spd = this.speedBoostActive ? this.baseSpeed * 1.5 : this.baseSpeed;
    this.x += spd * dt;
    if (this.x + this.width > this.canvasWidth) this.x = this.canvasWidth - this.width;
  }

  moveUp(dt) {
    let spd = this.speedBoostActive ? this.baseSpeed * 1.5 : this.baseSpeed;
    this.y -= spd * dt;
    if (this.y < 0) this.y = 0;
  }

  moveDown(dt) {
    let spd = this.speedBoostActive ? this.baseSpeed * 1.5 : this.baseSpeed;
    this.y += spd * dt;
    if (this.y + this.height > this.canvasHeight) this.y = this.canvasHeight - this.height;
  }

  shoot() {
    if (this.shootCooldown > 0) return [];
    this.shootCooldown = this.shootInterval;
    let bullets = [];
    let cx = this.x + this.width / 2;
    let top = this.y;
    let lvl = this.weaponLevel;

    if (lvl >= 1) {
      bullets.push({ x: cx - 2, y: top, width: 4, height: 14, speed: 8, damage: this.attack, type: 'normal', direction: -1, owner: 'player' });
    }
    if (lvl >= 2) {
      bullets.push({ x: cx - 14, y: top + 8, width: 4, height: 12, speed: 8, damage: this.attack * 0.8, type: 'normal', direction: -1, owner: 'player' });
      bullets.push({ x: cx + 10, y: top + 8, width: 4, height: 12, speed: 8, damage: this.attack * 0.8, type: 'normal', direction: -1, owner: 'player' });
    }
    if (lvl >= 3) {
      bullets.push({ x: cx - 22, y: top + 14, width: 4, height: 10, speed: 7.5, damage: this.attack * 0.6, type: 'normal', direction: -1, owner: 'player', angle: -0.15 });
      bullets.push({ x: cx + 18, y: top + 14, width: 4, height: 10, speed: 7.5, damage: this.attack * 0.6, type: 'normal', direction: -1, owner: 'player', angle: 0.15 });
    }
    if (lvl >= 4) {
      bullets.push({ x: cx - 30, y: top + 20, width: 4, height: 10, speed: 7, damage: this.attack * 0.5, type: 'normal', direction: -1, owner: 'player', angle: -0.3 });
      bullets.push({ x: cx + 26, y: top + 20, width: 4, height: 10, speed: 7, damage: this.attack * 0.5, type: 'normal', direction: -1, owner: 'player', angle: 0.3 });
    }
    if (lvl >= 5) {
      bullets.push({ x: cx - 2, y: top, width: 6, height: 20, speed: 9, damage: this.attack * 1.5, type: 'missile', direction: -1, owner: 'player' });
    }
    return bullets;
  }

  takeDamage(amount) {
    if (this.invincible || this.shieldActive) return 0;
    let actual = Math.max(1, amount - this.defense);
    this.hp -= actual;
    this.hitFlashTimer = 6;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
    return actual;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  die() {
    this.lives--;
    if (this.lives > 0) {
      this.hp = this.maxHp;
      this.invincible = true;
      this.invincibleTimer = this.invincibleDuration;
    }
  }

  isDead() {
    return this.lives <= 0 && this.hp <= 0;
  }

  update(dt) {
    if (this.shootCooldown > 0) this.shootCooldown--;
    this.engineFlicker = (this.engineFlicker + 0.15) % (Math.PI * 2);

    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    if (this.shieldActive) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
      }
    }

    if (this.speedBoostActive) {
      this.speedBoostTimer--;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostActive = false;
      }
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
  }

  activateShield(duration) {
    this.shieldActive = true;
    this.shieldTimer = duration || this.shieldDuration;
  }

  activateSpeedBoost(duration) {
    this.speedBoostActive = true;
    this.speedBoostTimer = duration || this.speedBoostDuration;
  }

  upgradeWeapon() {
    this.weaponLevel = Math.min(5, this.weaponLevel + 1);
  }

  getHitBox() {
    let pad = 6;
    return {
      x: this.x + pad,
      y: this.y + pad,
      width: this.width - pad * 2,
      height: this.height - pad * 2
    };
  }

  draw(ctx) {
    ctx.save();
    if (this.invincible && Math.floor(this.invincibleTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    let cx = this.x + this.width / 2;
    let cy = this.y + this.height / 2;

    if (this.hitFlashTimer > 0) {
      ctx.globalCompositeOperation = 'source-over';
    }

    this._drawBody(ctx, cx, cy);
    this._drawWings(ctx, cx, cy);
    this._drawEngineGlow(ctx, cx, cy);
    this._drawCockpit(ctx, cx, cy);
    this._drawWeaponMounts(ctx, cx, cy);
    this._drawDetails(ctx, cx, cy);

    if (this.hitFlashTimer > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (this.shieldActive) {
      this._drawShield(ctx, cx, cy);
    }

    ctx.restore();
  }

  _drawBody(ctx, cx, cy) {
    ctx.beginPath();
    ctx.moveTo(cx, this.y);
    ctx.lineTo(cx + 10, this.y + 16);
    ctx.lineTo(cx + 12, this.y + this.height - 12);
    ctx.lineTo(cx + 8, this.y + this.height);
    ctx.lineTo(cx - 8, this.y + this.height);
    ctx.lineTo(cx - 12, this.y + this.height - 12);
    ctx.lineTo(cx - 10, this.y + 16);
    ctx.closePath();

    let grad = ctx.createLinearGradient(cx - 12, this.y, cx + 12, this.y + this.height);
    grad.addColorStop(0, '#5a5a6a');
    grad.addColorStop(0.3, '#4a4a5a');
    grad.addColorStop(0.7, '#3a3a4a');
    grad.addColorStop(1, '#2a2a3a');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#6a6a7a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, this.y + 4);
    ctx.lineTo(cx + 6, this.y + 20);
    ctx.lineTo(cx + 4, this.y + this.height - 16);
    ctx.lineTo(cx, this.y + this.height - 10);
    ctx.closePath();
    let highlight = ctx.createLinearGradient(cx, this.y, cx + 6, this.y);
    highlight.addColorStop(0, 'rgba(140,140,160,0.4)');
    highlight.addColorStop(1, 'rgba(140,140,160,0)');
    ctx.fillStyle = highlight;
    ctx.fill();
  }

  _drawWings(ctx, cx, cy) {
    ctx.beginPath();
    ctx.moveTo(cx - 10, this.y + 18);
    ctx.lineTo(cx - this.width / 2, this.y + 30);
    ctx.lineTo(cx - this.width / 2 + 2, this.y + 38);
    ctx.lineTo(cx - 12, this.y + 36);
    ctx.closePath();

    let wingGrad = ctx.createLinearGradient(cx - this.width / 2, this.y + 18, cx, this.y + 38);
    wingGrad.addColorStop(0, '#2a2a3a');
    wingGrad.addColorStop(0.5, '#3a3a4a');
    wingGrad.addColorStop(1, '#4a4a5a');
    ctx.fillStyle = wingGrad;
    ctx.fill();
    ctx.strokeStyle = '#5a5a6a';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - this.width / 2 + 4, this.y + 24);
    ctx.lineTo(cx - 14, this.y + 28);
    ctx.strokeStyle = '#5a5a6a';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 10, this.y + 18);
    ctx.lineTo(cx + this.width / 2, this.y + 30);
    ctx.lineTo(cx + this.width / 2 - 2, this.y + 38);
    ctx.lineTo(cx + 12, this.y + 36);
    ctx.closePath();

    let wingGrad2 = ctx.createLinearGradient(cx, this.y + 18, cx + this.width / 2, this.y + 38);
    wingGrad2.addColorStop(0, '#4a4a5a');
    wingGrad2.addColorStop(0.5, '#3a3a4a');
    wingGrad2.addColorStop(1, '#2a2a3a');
    ctx.fillStyle = wingGrad2;
    ctx.fill();
    ctx.strokeStyle = '#5a5a6a';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + this.width / 2 - 4, this.y + 24);
    ctx.lineTo(cx + 14, this.y + 28);
    ctx.strokeStyle = '#5a5a6a';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  _drawEngineGlow(ctx, cx, cy) {
    let flicker = Math.sin(this.engineFlicker) * 3;

    ctx.save();
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 12 + flicker;

    let eGrad = ctx.createRadialGradient(cx - 5, this.y + this.height + 2, 0, cx - 5, this.y + this.height + 2, 8 + flicker);
    eGrad.addColorStop(0, 'rgba(0,229,255,0.9)');
    eGrad.addColorStop(0.5, 'rgba(0,229,255,0.4)');
    eGrad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = eGrad;
    ctx.beginPath();
    ctx.arc(cx - 5, this.y + this.height + 2, 8 + flicker, 0, Math.PI * 2);
    ctx.fill();

    let eGrad2 = ctx.createRadialGradient(cx + 5, this.y + this.height + 2, 0, cx + 5, this.y + this.height + 2, 8 + flicker);
    eGrad2.addColorStop(0, 'rgba(0,229,255,0.9)');
    eGrad2.addColorStop(0.5, 'rgba(0,229,255,0.4)');
    eGrad2.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = eGrad2;
    ctx.beginPath();
    ctx.arc(cx + 5, this.y + this.height + 2, 8 + flicker, 0, Math.PI * 2);
    ctx.fill();

    let trailLen = 14 + flicker * 2;
    let tGrad = ctx.createLinearGradient(cx - 5, this.y + this.height, cx - 5, this.y + this.height + trailLen);
    tGrad.addColorStop(0, 'rgba(0,229,255,0.6)');
    tGrad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 8, this.y + this.height);
    ctx.lineTo(cx - 2, this.y + this.height);
    ctx.lineTo(cx - 5, this.y + this.height + trailLen);
    ctx.closePath();
    ctx.fill();

    let tGrad2 = ctx.createLinearGradient(cx + 5, this.y + this.height, cx + 5, this.y + this.height + trailLen);
    tGrad2.addColorStop(0, 'rgba(0,229,255,0.6)');
    tGrad2.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = tGrad2;
    ctx.beginPath();
    ctx.moveTo(cx + 2, this.y + this.height);
    ctx.lineTo(cx + 8, this.y + this.height);
    ctx.lineTo(cx + 5, this.y + this.height + trailLen);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawCockpit(ctx, cx, cy) {
    ctx.beginPath();
    ctx.moveTo(cx, this.y + 6);
    ctx.lineTo(cx + 4, this.y + 14);
    ctx.lineTo(cx, this.y + 20);
    ctx.lineTo(cx - 4, this.y + 14);
    ctx.closePath();

    ctx.save();
    ctx.shadowColor = '#FF6B35';
    ctx.shadowBlur = 6;
    let cockpitGrad = ctx.createLinearGradient(cx - 4, this.y + 6, cx + 4, this.y + 20);
    cockpitGrad.addColorStop(0, '#FF6B35');
    cockpitGrad.addColorStop(1, '#CC4400');
    ctx.fillStyle = cockpitGrad;
    ctx.fill();
    ctx.restore();
  }

  _drawWeaponMounts(ctx, cx, cy) {
    let positions = [
      { x: cx - this.width / 2 + 3, y: this.y + 28 },
      { x: cx + this.width / 2 - 7, y: this.y + 28 }
    ];
    positions.forEach(function(pos) {
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(pos.x, pos.y, 4, 8);
      ctx.strokeStyle = '#5a5a6a';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(pos.x, pos.y, 4, 8);

      if (this.weaponLevel >= 3) {
        ctx.save();
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(pos.x + 1, pos.y - 2, 2, 2);
        ctx.restore();
      }
    }.bind(this));
  }

  _drawDetails(ctx, cx, cy) {
    ctx.strokeStyle = 'rgba(100,100,120,0.5)';
    ctx.lineWidth = 0.5;

    ctx.beginPath();
    ctx.moveTo(cx - 4, this.y + 22);
    ctx.lineTo(cx - 8, this.y + 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 4, this.y + 22);
    ctx.lineTo(cx + 8, this.y + 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 6, this.y + this.height - 18);
    ctx.lineTo(cx + 6, this.y + this.height - 18);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,229,255,0.3)';
    ctx.fillRect(cx - 2, this.y + 24, 4, 2);
  }

  _drawShield(ctx, cx, cy) {
    let shieldPulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.35;
    let radius = Math.max(1, this.width * 0.7);

    ctx.save();
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,229,255,' + shieldPulse + ')';
    ctx.lineWidth = 2;
    ctx.stroke();

    let sGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
    sGrad.addColorStop(0, 'rgba(0,229,255,0)');
    sGrad.addColorStop(1, 'rgba(0,229,255,' + (shieldPulse * 0.3) + ')');
    ctx.fillStyle = sGrad;
    ctx.fill();

    ctx.restore();
  }
}

window.DafeijiPlayer = DafeijiPlayer;
