class DafeijiEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.hp = 20;
    this.maxHp = 20;
    this.speed = 2;
    this.score = 10;
    this.type = 'scout';
    this.alive = true;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.shootTimer = 0;
    this.shootInterval = 120;
    this.canShoot = false;
    this.dropRate = 0.15;
    this.phase = Math.random() * Math.PI * 2;
    this.hitFlashTimer = 0;
    this.moveTimer = 0;
    this.difficultyMultiplier = 1.0;
  }

  update(dt) {
    this.moveTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
  }

  move(dt) {}

  shoot(playerX, playerY) {
    if (!this.canShoot) return null;
    this.shootTimer++;
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      return this._createBullet(playerX, playerY);
    }
    return null;
  }

  _createBullet(playerX, playerY) {
    return {
      x: this.x + this.width / 2 - 3,
      y: this.y + this.height,
      width: 6,
      height: 6,
      speed: 4,
      damage: 10,
      type: 'standard',
      owner: 'enemy'
    };
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlashTimer = 4;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  isOffScreen() {
    return this.y > this.canvasHeight + 50 || this.x < -50 || this.x > this.canvasWidth + 50;
  }

  draw(ctx) {
    ctx.save();
    this._drawShape(ctx);
    if (this.hitFlashTimer > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  _drawShape(ctx) {}

  getHitBox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

class DafeijiScout extends DafeijiEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight);
    this.width = 28;
    this.height = 28;
    this.hp = 20;
    this.maxHp = 20;
    this.speed = 3;
    this.score = 10;
    this.type = 'scout';
    this.canShoot = false;
    this.dropRate = 0.1;
    this.zigzagAmplitude = 40;
    this.zigzagSpeed = 0.05;
    this.baseX = x;
  }

  move(dt) {
    this.y += this.speed * dt;
    this.x = this.baseX + Math.sin(this.moveTimer * this.zigzagSpeed + this.phase) * this.zigzagAmplitude;
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.canvasWidth) this.x = this.canvasWidth - this.width;
  }

  _drawShape(ctx) {
    let cx = this.x + this.width / 2;
    let cy = this.y + this.height / 2;

    ctx.beginPath();
    ctx.moveTo(cx, this.y);
    ctx.lineTo(this.x + this.width, cy + 4);
    ctx.lineTo(cx + 4, this.y + this.height);
    ctx.lineTo(cx - 4, this.y + this.height);
    ctx.lineTo(this.x, cy + 4);
    ctx.closePath();

    let grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, '#3a3a3a');
    grad.addColorStop(0.5, '#2a2a2a');
    grad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = '#FF1744';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(80,80,80,0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + 5);
    ctx.lineTo(cx + 3, cy + 5);
    ctx.stroke();
  }
}

class DafeijiFighter extends DafeijiEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight);
    this.width = 38;
    this.height = 40;
    this.hp = 50;
    this.maxHp = 50;
    this.speed = 2;
    this.score = 25;
    this.type = 'fighter';
    this.canShoot = true;
    this.shootInterval = 90;
    this.dropRate = 0.2;
    this.trackStrength = 0.3;
  }

  move(dt) {
    this.y += this.speed * dt;
    if (this._playerX !== undefined) {
      let dx = this._playerX - (this.x + this.width / 2);
      this.x += Math.sign(dx) * this.trackStrength * dt;
    }
  }

  setPlayerX(px) {
    this._playerX = px;
  }

  _createBullet(playerX, playerY) {
    return {
      x: this.x + this.width / 2 - 3,
      y: this.y + this.height,
      width: 6,
      height: 6,
      speed: 4,
      damage: 12,
      type: 'standard',
      owner: 'enemy'
    };
  }

  _drawShape(ctx) {
    let cx = this.x + this.width / 2;

    ctx.beginPath();
    ctx.moveTo(cx, this.y);
    ctx.lineTo(cx + 8, this.y + 12);
    ctx.lineTo(cx + this.width / 2, this.y + 20);
    ctx.lineTo(cx + 10, this.y + this.height - 6);
    ctx.lineTo(cx + 6, this.y + this.height);
    ctx.lineTo(cx - 6, this.y + this.height);
    ctx.lineTo(cx - 10, this.y + this.height - 6);
    ctx.lineTo(cx - this.width / 2, this.y + 20);
    ctx.lineTo(cx - 8, this.y + 12);
    ctx.closePath();

    let grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    grad.addColorStop(0, '#4a3a2a');
    grad.addColorStop(0.5, '#3a2a1a');
    grad.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = '#FF6B35';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath();
    ctx.moveTo(cx - 2, this.y + 14);
    ctx.lineTo(cx + 2, this.y + 14);
    ctx.lineTo(cx + 1, this.y + 20);
    ctx.lineTo(cx - 1, this.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(120,80,40,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, this.y + 6);
    ctx.lineTo(cx, this.y + this.height - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, this.y + 18);
    ctx.lineTo(cx + 8, this.y + 18);
    ctx.stroke();
  }
}

class DafeijiBomber extends DafeijiEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight);
    this.width = 50;
    this.height = 44;
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 1.5;
    this.score = 50;
    this.type = 'bomber';
    this.canShoot = true;
    this.shootInterval = 120;
    this.dropRate = 0.3;
  }

  move(dt) {
    this.y += this.speed * dt;
  }

  _createBullet(playerX, playerY) {
    return {
      x: this.x + this.width / 2 - 5,
      y: this.y + this.height,
      width: 10,
      height: 10,
      speed: 2.5,
      damage: 20,
      type: 'bomb',
      owner: 'enemy'
    };
  }

  _drawShape(ctx) {
    let cx = this.x + this.width / 2;

    ctx.beginPath();
    ctx.moveTo(cx - 4, this.y);
    ctx.lineTo(cx + 4, this.y);
    ctx.lineTo(cx + 10, this.y + 8);
    ctx.lineTo(cx + this.width / 2, this.y + 16);
    ctx.lineTo(cx + this.width / 2 - 2, this.y + this.height - 8);
    ctx.lineTo(cx + 8, this.y + this.height);
    ctx.lineTo(cx - 8, this.y + this.height);
    ctx.lineTo(cx - this.width / 2 + 2, this.y + this.height - 8);
    ctx.lineTo(cx - this.width / 2, this.y + 16);
    ctx.lineTo(cx - 10, this.y + 8);
    ctx.closePath();

    let grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, '#3a3a2a');
    grad.addColorStop(0.5, '#2a2a1a');
    grad.addColorStop(1, '#1a1a0a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#5a5a3a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = '#FFD600';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#FFD600';
    ctx.fillRect(cx - 8, this.y + 14, 16, 4);
    ctx.fillRect(cx - 12, this.y + 24, 24, 3);
    ctx.restore();

    ctx.strokeStyle = 'rgba(100,100,60,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(this.x + 8, this.y + 10);
    ctx.lineTo(this.x + 8, this.y + this.height - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.x + this.width - 8, this.y + 10);
    ctx.lineTo(this.x + this.width - 8, this.y + this.height - 6);
    ctx.stroke();
  }
}

class DafeijiHeavy extends DafeijiEnemy {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, canvasWidth, canvasHeight);
    this.width = 60;
    this.height = 56;
    this.hp = 200;
    this.maxHp = 200;
    this.speed = 1;
    this.score = 80;
    this.type = 'heavy';
    this.canShoot = true;
    this.shootInterval = 60;
    this.dropRate = 0.35;
    this.spreadPattern = 0;
  }

  move(dt) {
    this.y += this.speed * dt;
    if (this.y > 80 && this.speed > 0.2) {
      this.speed = 0.2;
    }
  }

  _createBullet(playerX, playerY) {
    let bullets = [];
    let cx = this.x + this.width / 2;
    let cy = this.y + this.height;

    this.spreadPattern = (this.spreadPattern + 1) % 3;

    if (this.spreadPattern === 0) {
      let angles = [-0.3, -0.15, 0, 0.15, 0.3];
      angles.forEach(function(a) {
        bullets.push({
          x: cx - 3,
          y: cy,
          width: 6,
          height: 6,
          speed: 3.5,
          damage: 15,
          type: 'standard',
          owner: 'enemy',
          angle: a
        });
      });
    } else {
      let angle = Math.atan2(playerY - cy, playerX - cx);
      bullets.push({
        x: cx - 3,
        y: cy,
        width: 6,
        height: 6,
        speed: 4,
        damage: 18,
        type: 'standard',
        owner: 'enemy',
        angle: angle - Math.PI / 2
      });
    }
    return bullets;
  }

  _drawShape(ctx) {
    let cx = this.x + this.width / 2;
    let cy = this.y + this.height / 2;

    ctx.beginPath();
    ctx.moveTo(cx - 6, this.y);
    ctx.lineTo(cx + 6, this.y);
    ctx.lineTo(cx + 14, this.y + 10);
    ctx.lineTo(cx + this.width / 2, this.y + 18);
    ctx.lineTo(cx + this.width / 2, cy + 8);
    ctx.lineTo(cx + 12, this.y + this.height);
    ctx.lineTo(cx - 12, this.y + this.height);
    ctx.lineTo(cx - this.width / 2, cy + 8);
    ctx.lineTo(cx - this.width / 2, this.y + 18);
    ctx.lineTo(cx - 14, this.y + 10);
    ctx.closePath();

    let grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    grad.addColorStop(0, '#4a2a2a');
    grad.addColorStop(0.5, '#3a1a1a');
    grad.addColorStop(1, '#2a0a0a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#6a3a3a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = '#FF1744';
    ctx.shadowBlur = 6;
    let pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
    ctx.fillStyle = 'rgba(255,23,68,' + (0.5 + pulse * 0.5) + ')';
    ctx.beginPath();
    ctx.arc(cx - 16, this.y + 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 16, this.y + 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(120,60,60,0.4)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + 6, this.y + i * 14);
      ctx.lineTo(this.x + this.width - 6, this.y + i * 14);
      ctx.stroke();
    }

    ctx.fillStyle = '#3a1a1a';
    ctx.fillRect(cx - 10, this.y + 6, 20, 8);
    ctx.strokeStyle = '#6a3a3a';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(cx - 10, this.y + 6, 20, 8);
  }
}

class DafeijiBoss extends DafeijiEnemy {
  constructor(x, y, canvasWidth, canvasHeight, waveNumber) {
    super(x, y, canvasWidth, canvasHeight);
    this.width = 100;
    this.height = 80;
    this.hp = 500 + (waveNumber || 1) * 100;
    this.maxHp = this.hp;
    this.speed = 0.5;
    this.score = 200;
    this.type = 'boss';
    this.canShoot = true;
    this.shootInterval = 40;
    this.dropRate = 1.0;
    this.attackPattern = 0;
    this.patternTimer = 0;
    this.patternDuration = 180;
    this.moveDirection = 1;
    this.entered = false;
    this.targetY = 60;
    this.corePulse = 0;
  }

  move(dt) {
    if (!this.entered) {
      this.y += 1 * dt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.entered = true;
      }
      return;
    }

    this.x += this.speed * this.moveDirection * dt;
    if (this.x <= 10) this.moveDirection = 1;
    if (this.x + this.width >= this.canvasWidth - 10) this.moveDirection = -1;
  }

  shoot(playerX, playerY) {
    if (!this.entered || !this.canShoot) return [];
    this.shootTimer++;
    this.patternTimer++;

    if (this.patternTimer >= this.patternDuration) {
      this.patternTimer = 0;
      this.attackPattern = (this.attackPattern + 1) % 3;
    }

    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      return this._createBullets(playerX, playerY);
    }
    return [];
  }

  _createBullets(playerX, playerY) {
    let bullets = [];
    let cx = this.x + this.width / 2;
    let cy = this.y + this.height;

    switch (this.attackPattern) {
      case 0:
        for (let i = -4; i <= 4; i++) {
          bullets.push({
            x: cx - 3,
            y: cy,
            width: 6,
            height: 6,
            speed: 3,
            damage: 12,
            type: 'standard',
            owner: 'enemy',
            angle: i * 0.12
          });
        }
        break;
      case 1:
        let angle = Math.atan2(playerY - cy, playerX - cx);
        for (let i = -2; i <= 2; i++) {
          bullets.push({
            x: cx - 3,
            y: cy,
            width: 6,
            height: 6,
            speed: 4.5,
            damage: 15,
            type: 'standard',
            owner: 'enemy',
            angle: angle - Math.PI / 2 + i * 0.08
          });
        }
        break;
      case 2:
        let baseAngle = (Date.now() * 0.002) % (Math.PI * 2);
        for (let i = 0; i < 8; i++) {
          bullets.push({
            x: cx - 3,
            y: cy,
            width: 6,
            height: 6,
            speed: 3,
            damage: 10,
            type: 'standard',
            owner: 'enemy',
            angle: baseAngle + i * (Math.PI / 4)
          });
        }
        break;
    }
    return bullets;
  }

  _drawShape(ctx) {
    let cx = this.x + this.width / 2;
    let cy = this.y + this.height / 2;
    this.corePulse = (this.corePulse + 0.05) % (Math.PI * 2);

    ctx.beginPath();
    ctx.moveTo(cx - 12, this.y);
    ctx.lineTo(cx + 12, this.y);
    ctx.lineTo(cx + 20, this.y + 10);
    ctx.lineTo(cx + this.width / 2, this.y + 22);
    ctx.lineTo(cx + this.width / 2 - 4, cy);
    ctx.lineTo(cx + this.width / 2, this.y + this.height - 14);
    ctx.lineTo(cx + 16, this.y + this.height - 6);
    ctx.lineTo(cx + 10, this.y + this.height);
    ctx.lineTo(cx - 10, this.y + this.height);
    ctx.lineTo(cx - 16, this.y + this.height - 6);
    ctx.lineTo(cx - this.width / 2, this.y + this.height - 14);
    ctx.lineTo(cx - this.width / 2 + 4, cy);
    ctx.lineTo(cx - this.width / 2, this.y + 22);
    ctx.lineTo(cx - 20, this.y + 10);
    ctx.closePath();

    let grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    grad.addColorStop(0, '#4a2a3a');
    grad.addColorStop(0.3, '#3a1a2a');
    grad.addColorStop(0.7, '#2a0a1a');
    grad.addColorStop(1, '#1a0a1a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#6a4a5a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100,60,80,0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + 8, this.y + i * 13);
      ctx.lineTo(this.x + this.width - 8, this.y + i * 13);
      ctx.stroke();
    }

    ctx.save();
    let glowIntensity = Math.sin(this.corePulse) * 0.3 + 0.7;
    ctx.shadowColor = '#FF1744';
    ctx.shadowBlur = 20 * glowIntensity;

    let coreGrad = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy - 4, 12);
    coreGrad.addColorStop(0, 'rgba(255,100,100,' + glowIntensity + ')');
    coreGrad.addColorStop(0.5, 'rgba(255,23,68,' + glowIntensity * 0.6 + ')');
    coreGrad.addColorStop(1, 'rgba(255,23,68,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,200,200,' + glowIntensity + ')';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#FF6B35';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(cx - 6, this.y + 16, 12, 6);
    ctx.fillRect(cx - 18, this.y + 26, 10, 4);
    ctx.fillRect(cx + 8, this.y + 26, 10, 4);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 3;
    ctx.fillStyle = 'rgba(0,229,255,0.6)';
    ctx.beginPath();
    ctx.arc(this.x + 18, this.y + 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + this.width - 18, this.y + 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    let hpRatio = this.hp / this.maxHp;
    let barWidth = this.width + 20;
    let barX = cx - barWidth / 2;
    let barY = this.y - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, 6);
    let hpColor = hpRatio > 0.5 ? '#00E676' : hpRatio > 0.25 ? '#FFD600' : '#FF1744';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, 6);
    ctx.strokeStyle = '#6a4a5a';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(barX, barY, barWidth, 6);
  }
}

class DafeijiEnemyManager {
  constructor(canvasWidth, canvasHeight) {
    this.enemies = [];
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  spawnEnemy(type, x, y, difficultyMultiplier) {
    let enemy;
    let dm = difficultyMultiplier || 1.0;
    switch (type) {
      case 'scout':
        enemy = new DafeijiScout(x, y, this.canvasWidth, this.canvasHeight);
        break;
      case 'fighter':
        enemy = new DafeijiFighter(x, y, this.canvasWidth, this.canvasHeight);
        break;
      case 'bomber':
        enemy = new DafeijiBomber(x, y, this.canvasWidth, this.canvasHeight);
        break;
      case 'heavy':
        enemy = new DafeijiHeavy(x, y, this.canvasWidth, this.canvasHeight);
        break;
      case 'boss':
        enemy = new DafeijiBoss(x, y, this.canvasWidth, this.canvasHeight, dm);
        break;
      default:
        enemy = new DafeijiScout(x, y, this.canvasWidth, this.canvasHeight);
    }
    enemy.hp = Math.ceil(enemy.hp * dm);
    enemy.maxHp = enemy.hp;
    enemy.difficultyMultiplier = dm;
    return enemy;
  }

  spawnWave(waveConfig) {
    if (!waveConfig || !waveConfig.enemies) return;
    let self = this;
    waveConfig.enemies.forEach(function(e) {
      let enemy = self.spawnEnemy(e.type, e.x, e.y, waveConfig.difficulty);
      self.enemies.push(enemy);
    });
  }

  update(dt, playerX, playerY, bulletManager) {
    let newBullets = [];
    this.enemies.forEach(function(e) {
      e.update(dt);
      e.move(dt);

      if (e.type === 'fighter') {
        e.setPlayerX(playerX);
      }

      let bullets = e.shoot(playerX, playerY);
      if (bullets) {
        if (Array.isArray(bullets)) {
          newBullets = newBullets.concat(bullets);
        } else {
          newBullets.push(bullets);
        }
      }
    });

    newBullets.forEach(function(b) {
      bulletManager.addEnemyBullet(b);
    });

    this.enemies = this.enemies.filter(function(e) {
      return e.alive && !e.isOffScreen();
    });
  }

  checkPlayerCollision(player) {
    let pBox = player.getHitBox();
    let hitEnemies = [];
    this.enemies.forEach(function(e) {
      let eBox = e.getHitBox();
      if (pBox.x < eBox.x + eBox.width &&
          pBox.x + pBox.width > eBox.x &&
          pBox.y < eBox.y + eBox.height &&
          pBox.y + pBox.height > eBox.y) {
        hitEnemies.push(e);
      }
    });
    return hitEnemies;
  }

  draw(ctx) {
    this.enemies.forEach(function(e) {
      e.draw(ctx);
    });
  }

  getAliveCount() {
    return this.enemies.length;
  }

  clear() {
    this.enemies = [];
  }
}

window.DafeijiEnemy = DafeijiEnemy;
window.DafeijiScout = DafeijiScout;
window.DafeijiFighter = DafeijiFighter;
window.DafeijiBomber = DafeijiBomber;
window.DafeijiHeavy = DafeijiHeavy;
window.DafeijiBoss = DafeijiBoss;
window.DafeijiEnemyManager = DafeijiEnemyManager;
