import { 
  GAME_WIDTH, GAME_HEIGHT, HITBOX_RADIUS, GRAZE_RADIUS, 
  BULLET_COLORS, CHARACTERS, BOSS 
} from './constants.js';
import { audioManager } from './audio.js';

export class Player {
  constructor(characterId, x, y) {
    const char = CHARACTERS[characterId];
    this.id = characterId;
    this.char = char;
    this.x = x;
    this.y = y;
    this.radius = HITBOX_RADIUS;
    this.grazeRadius = GRAZE_RADIUS;
    this.speed = char.speed;
    this.damage = char.damage;
    this.shotType = char.shotType;
    this.shotCount = char.shotCount;
    this.color = char.color;
    this.secondaryColor = char.secondaryColor;
    
    this.bombs = 3;
    this.maxBombs = 3;
    this.lives = 3;
    
    this.shootCooldown = 0;
    this.shootInterval = 80;
    
    this.invincible = false;
    this.invincibleTimer = 0;
    
    this.slowMode = false;
    this.grazedBullets = new Set();
  }

  update(keys, deltaTime, bullets, enemies) {
    let dx = 0, dy = 0;
    const currentSpeed = this.slowMode ? this.speed * 0.45 : this.speed;
    
    if (keys['ArrowUp'] || keys['KeyW']) dy -= currentSpeed;
    if (keys['ArrowDown'] || keys['KeyS']) dy += currentSpeed;
    if (keys['ArrowLeft'] || keys['KeyA']) dx -= currentSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) dx += currentSpeed;
    
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }
    
    this.x = Math.max(10, Math.min(GAME_WIDTH - 10, this.x + dx));
    this.y = Math.max(20, Math.min(GAME_HEIGHT - 20, this.y + dy));
    
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }
    
    if (this.invincible) {
      this.invincibleTimer -= deltaTime;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
    
    this.grazedBullets.clear();
  }

  shoot(playerBullets, target = null) {
    if (this.shootCooldown > 0) return [];
    this.shootCooldown = this.shootInterval;
    
    const newBullets = [];
    
    switch (this.shotType) {
      case 'line':
        newBullets.push(new PlayerBullet(this.x, this.y - 15, 0, -12, this.damage));
        break;
      
      case 'spread':
        for (let i = 0; i < this.shotCount; i++) {
          const angle = -Math.PI / 2 + (i - (this.shotCount - 1) / 2) * 0.25;
          const speed = 10;
          newBullets.push(new PlayerBullet(
            this.x, this.y - 15,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            this.damage
          ));
        }
        break;
      
      case 'homing':
        const homingBullet = new PlayerBullet(this.x, this.y - 15, 0, -8, this.damage);
        homingBullet.homing = true;
        homingBullet.homingStrength = 0.05;
        homingBullet.target = target;
        newBullets.push(homingBullet);
        break;
    }
    
    audioManager.playShoot();
    return newBullets;
  }

  useBomb() {
    if (this.bombs <= 0) return null;
    this.bombs--;
    audioManager.playBomb();
    return {
      type: this.char.bombType,
      duration: this.char.bombDuration,
      startTime: Date.now()
    };
  }

  addBomb() {
    if (this.bombs < this.maxBombs) {
      this.bombs++;
      audioManager.playPowerUp();
      return true;
    }
    return false;
  }

  hit() {
    if (this.invincible) return false;
    return true;
  }

  die() {
    this.lives--;
    if (this.bombs > 0) {
      this.bombs--;
      this.invincible = true;
      this.invincibleTimer = 3000;
      return 'revived';
    }
    return 'dead';
  }

  graze(bullet) {
    const dist = Math.hypot(this.x - bullet.x, this.y - bullet.y);
    if (dist < this.grazeRadius && dist >= this.radius) {
      if (!this.grazedBullets.has(bullet.id)) {
        this.grazedBullets.add(bullet.id);
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    
    if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 15);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.7, this.secondaryColor);
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.fillStyle = this.secondaryColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.char.emoji, this.x, this.y);
    
    if (this.slowMode) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff6b9d';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.grazeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
}

export class PlayerBullet {
  static nextId = 0;
  
  constructor(x, y, vx, vy, damage) {
    this.id = PlayerBullet.nextId++;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 4;
    this.active = true;
    this.homing = false;
    this.homingStrength = 0;
    this.target = null;
  }

  update(enemies) {
    if (this.homing && enemies && enemies.length > 0) {
      if (!this.target || !this.target.active) {
        let minDist = Infinity;
        for (const enemy of enemies) {
          if (!enemy.active) continue;
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist < minDist) {
            minDist = dist;
            this.target = enemy;
          }
        }
      }
      
      if (this.target && this.target.active) {
        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        const currentAngle = Math.atan2(this.vy, this.vx);
        const speed = Math.hypot(this.vx, this.vy);
        let newAngle = currentAngle + Math.sign(angle - currentAngle) * this.homingStrength;
        
        if (Math.abs(angle - currentAngle) < this.homingStrength) {
          newAngle = angle;
        }
        
        this.vx = Math.cos(newAngle) * speed;
        this.vy = Math.sin(newAngle) * speed;
      }
    }
    
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.x < -20 || this.x > GAME_WIDTH + 20 || this.y < -20 || this.y > GAME_HEIGHT + 20) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = BULLET_COLORS.player;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export class EnemyBullet {
  static nextId = 0;
  static colors = Object.values(BULLET_COLORS.enemy);
  
  constructor(x, y, vx, vy, color = null, radius = 6) {
    this.id = EnemyBullet.nextId++;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color || EnemyBullet.colors[Math.floor(Math.random() * EnemyBullet.colors.length)];
    this.radius = radius;
    this.active = true;
    this.grazed = false;
    this.slowed = false;
  }

  update(slowActive = false) {
    const speedMult = slowActive ? 0.3 : 1;
    this.x += this.vx * speedMult;
    this.y += this.vy * speedMult;
    
    if (this.x < -20 || this.x > GAME_WIDTH + 20 || this.y < -20 || this.y > GAME_HEIGHT + 20) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export class Enemy {
  static nextId = 0;
  
  constructor(type, x, y) {
    this.id = Enemy.nextId++;
    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    this.shootCooldown = Math.random() * 2000;
    
    switch (type) {
      case 'small':
        this.hp = 30;
        this.maxHp = 30;
        this.radius = 12;
        this.speed = 1.5;
        this.color = '#ff6666';
        this.shootInterval = 2500;
        this.bulletSpeed = 3;
        this.score = 100;
        break;
      case 'medium':
        this.hp = 80;
        this.maxHp = 80;
        this.radius = 18;
        this.speed = 1;
        this.color = '#66ff66';
        this.shootInterval = 1800;
        this.bulletSpeed = 3.5;
        this.score = 250;
        break;
      case 'large':
        this.hp = 150;
        this.maxHp = 150;
        this.radius = 25;
        this.speed = 0.8;
        this.color = '#6666ff';
        this.shootInterval = 1200;
        this.bulletSpeed = 4;
        this.score = 500;
        break;
      case 'elite':
        this.hp = 300;
        this.maxHp = 300;
        this.radius = 30;
        this.speed = 0.6;
        this.color = '#ff66ff';
        this.shootInterval = 800;
        this.bulletSpeed = 4.5;
        this.score = 1000;
        break;
    }
    
    this.movePattern = Math.floor(Math.random() * 3);
    this.moveTimer = 0;
    this.baseX = x;
    this.dropPowerUp = Math.random() < 0.15;
  }

  update(deltaTime, playerX, playerY) {
    this.moveTimer += deltaTime;
    
    switch (this.movePattern) {
      case 0:
        this.y += this.speed;
        break;
      case 1:
        this.y += this.speed * 0.8;
        this.x = this.baseX + Math.sin(this.moveTimer / 500) * 50;
        break;
      case 2:
        this.y += this.speed * 0.6;
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        this.x += Math.cos(angle) * this.speed * 0.3;
        break;
    }
    
    this.x = Math.max(this.radius, Math.min(GAME_WIDTH - this.radius, this.x));
    
    if (this.y > GAME_HEIGHT + 50) {
      this.active = false;
    }
    
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }
  }

  shoot(playerX, playerY) {
    if (this.shootCooldown > 0) return [];
    this.shootCooldown = this.shootInterval;
    
    const bullets = [];
    const angle = Math.atan2(playerY - this.y, playerX - this.x);
    
    if (this.type === 'small') {
      bullets.push(new EnemyBullet(
        this.x, this.y + this.radius,
        Math.cos(angle) * this.bulletSpeed,
        Math.sin(angle) * this.bulletSpeed
      ));
    } else if (this.type === 'medium') {
      for (let i = -1; i <= 1; i++) {
        const a = angle + i * 0.3;
        bullets.push(new EnemyBullet(
          this.x, this.y + this.radius,
          Math.cos(a) * this.bulletSpeed,
          Math.sin(a) * this.bulletSpeed
        ));
      }
    } else if (this.type === 'large') {
      for (let i = 0; i < 5; i++) {
        const a = angle + (i - 2) * 0.25;
        bullets.push(new EnemyBullet(
          this.x, this.y + this.radius,
          Math.cos(a) * this.bulletSpeed,
          Math.sin(a) * this.bulletSpeed
        ));
      }
    } else if (this.type === 'elite') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + this.moveTimer / 1000;
        bullets.push(new EnemyBullet(
          this.x, this.y,
          Math.cos(a) * this.bulletSpeed * 0.8,
          Math.sin(a) * this.bulletSpeed * 0.8
        ));
      }
    }
    
    return bullets;
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const hpPercent = this.hp / this.maxHp;
    const barWidth = this.radius * 2;
    const barHeight = 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
    ctx.fillStyle = hpPercent > 0.5 ? '#44ff44' : hpPercent > 0.25 ? '#ffff44' : '#ff4444';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * hpPercent, barHeight);
  }
}

export class Boss {
  constructor() {
    this.x = GAME_WIDTH / 2;
    this.y = 120;
    this.radius = 40;
    this.hp = BOSS.maxHp;
    this.maxHp = BOSS.maxHp;
    this.active = true;
    this.phase = 0;
    this.shootTimer = 0;
    this.moveTimer = 0;
    this.color = '#aa44ff';
    this.targetX = GAME_WIDTH / 2;
    this.spiralAngle = 0;
  }

  get currentPhase() {
    return BOSS.phases[this.phase];
  }

  update(deltaTime, playerX) {
    this.moveTimer += deltaTime;
    this.shootTimer += deltaTime;
    
    if (this.y < 150) {
      this.y += 0.5;
    }
    
    if (Math.abs(this.x - this.targetX) > 2) {
      this.x += (this.targetX > this.x ? 1 : -1) * 1.5;
    } else {
      this.targetX = 80 + Math.random() * (GAME_WIDTH - 160);
    }
    
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent <= BOSS.phases[2].hpThreshold && this.phase < 2) {
      this.phase = 2;
      audioManager.playBossAlert();
    } else if (hpPercent <= BOSS.phases[1].hpThreshold && this.phase < 1) {
      this.phase = 1;
      audioManager.playBossAlert();
    }
    
    this.x = Math.max(this.radius, Math.min(GAME_WIDTH - this.radius, this.x));
  }

  shoot(playerX, playerY) {
    const phase = this.currentPhase;
    const interval = 1000 / phase.bulletsPerSecond;
    
    if (this.shootTimer < interval) return [];
    this.shootTimer = 0;
    
    const bullets = [];
    
    switch (phase.pattern) {
      case 'ring':
        const ringCount = 24;
        for (let i = 0; i < ringCount; i++) {
          const angle = (i / ringCount) * Math.PI * 2 + this.moveTimer / 500;
          bullets.push(new EnemyBullet(
            this.x, this.y + this.radius,
            Math.cos(angle) * 2.5,
            Math.sin(angle) * 2.5,
            BULLET_COLORS.enemy.pink,
            8
          ));
        }
        break;
      
      case 'fan':
        const fanCount = 11;
        const fanAngle = Math.atan2(playerY - this.y, playerX - this.x);
        const spread = 1.2;
        for (let i = 0; i < fanCount; i++) {
          const angle = fanAngle - spread / 2 + (i / (fanCount - 1)) * spread;
          bullets.push(new EnemyBullet(
            this.x, this.y + this.radius,
            Math.cos(angle) * 3.5,
            Math.sin(angle) * 3.5,
            BULLET_COLORS.enemy.cyan,
            7
          ));
        }
        break;
      
      case 'spiral':
        this.spiralAngle += 0.3;
        const spiralCount = 3;
        for (let i = 0; i < spiralCount; i++) {
          const angle = this.spiralAngle + (i / spiralCount) * Math.PI * 2;
          bullets.push(new EnemyBullet(
            this.x, this.y + this.radius,
            Math.cos(angle) * 3,
            Math.sin(angle) * 3,
            BULLET_COLORS.enemy.purple,
            6
          ));
        }
        if (Math.random() < 0.3) {
          const aimAngle = Math.atan2(playerY - this.y, playerX - this.x);
          bullets.push(new EnemyBullet(
            this.x, this.y + this.radius,
            Math.cos(aimAngle) * 5,
            Math.sin(aimAngle) * 5,
            BULLET_COLORS.enemy.red,
            10
          ));
        }
        break;
    }
    
    return bullets;
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.active = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    const phaseColors = ['#ff6699', '#66ffff', '#ff00ff'];
    const glowColor = phaseColors[this.phase];
    
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius + 20);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(0.5, 'rgba(170, 68, 255, 0.3)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 20, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('紫', this.x, this.y);
  }
}

export class PowerUp {
  static nextId = 0;
  
  constructor(x, y, type = 'P') {
    this.id = PowerUp.nextId++;
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 10;
    this.active = true;
    this.vy = 1.5;
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  update() {
    this.y += this.vy;
    this.bobTimer += 0.1;
    this.x += Math.sin(this.bobTimer) * 0.5;
    
    if (this.y > GAME_HEIGHT + 20) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.bobTimer * 0.5);
    
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type, 0, 0);
    
    ctx.restore();
  }
}
