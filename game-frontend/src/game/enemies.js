import { rectOverlap, resolveCollision, stompCheck } from './collision.js';

const EnemyState = {
  PATROL: 'PATROL',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  STUNNED: 'STUNNED',
  DEAD: 'DEAD',
  IDLE: 'IDLE',
  AIM: 'AIM',
  SHOOT: 'SHOOT',
  INACTIVE: 'INACTIVE',
  ACTIVE: 'ACTIVE',
  RESETTING: 'RESETTING',
  LUNGE: 'LUNGE',
  BLOCK: 'BLOCK',
};

class Enemy {
  constructor(x, y, width, height, hp, speed, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.facing = -1;
    this.state = EnemyState.IDLE;
    this.stunTimer = 0;
    this.invincible = false;
    this.invTimer = 0;
    this.type = type;
    this.active = true;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.gravity = 0.55;
    this.onEmitParticles = null;
  }

  update(player, platforms) {}

  takeDamage(amount) {
    if (this.invincible || this.state === EnemyState.DEAD) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = EnemyState.DEAD;
      this.active = false;
      if (this.onEmitParticles) {
        this.onEmitParticles('ENEMY_DEATH', this.x + this.width * 0.5, this.y + this.height * 0.5, {
          type: this.type,
        });
      }
    }
  }

  stun(duration) {
    if (this.state === EnemyState.DEAD) return;
    this.state = EnemyState.STUNNED;
    this.stunTimer = duration;
  }

  render(ctx, cameraOffset) {}

  isDead() {
    return this.hp <= 0;
  }

  getCenter() {
    return { x: this.x + this.width * 0.5, y: this.y + this.height * 0.5 };
  }

  _applyGravityAndCollide(platforms) {
    if (!this.onGround) {
      this.vy += this.gravity;
    }
    this.x += this.vx;
    this.y += this.vy;
    resolveCollision(this, platforms);
  }

  _facePlayer(player) {
    const pc = player.x + player.width * 0.5;
    const ec = this.x + this.width * 0.5;
    this.facing = pc < ec ? -1 : 1;
  }

  _distToPlayer(player) {
    const ec = this.getCenter();
    const pc = player.getCenter ? player.getCenter() : { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 };
    const dx = pc.x - ec.x;
    const dy = pc.y - ec.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _checkStomp(player) {
    if (stompCheck(player, this)) {
      this.stun(this.stunDuration || 90);
      player.stompBounce();
      return true;
    }
    return false;
  }
}

export class Soldier extends Enemy {
  constructor(x, y, patrolLeft, patrolRight) {
    super(x, y, 32, 48, 2, 1.5, 'soldier');
    this.patrolLeft = patrolLeft;
    this.patrolRight = patrolRight;
    this.state = EnemyState.PATROL;
    this.stunDuration = 90;
    this.attackFrame = 0;
    this.attackDuration = 10;
    this.chaseRange = 200;
    this.attackRange = 50;
    this.damage = 1;
  }

  update(player, platforms) {
    if (this.state === EnemyState.DEAD) return;
    if (this.invTimer > 0) {
      this.invTimer--;
      if (this.invTimer <= 0) this.invincible = false;
    }

    if (this.state === EnemyState.STUNNED) {
      this.stunTimer--;
      this.vx = 0;
      this._applyGravityAndCollide(platforms);
      if (this.stunTimer <= 0) {
        this.state = EnemyState.PATROL;
      }
      return;
    }

    if (this.state === EnemyState.ATTACK) {
      this.attackFrame--;
      this.vx = 0;
      this._applyGravityAndCollide(platforms);
      if (this.attackFrame <= 0) {
        this.state = EnemyState.CHASE;
      }
      return;
    }

    this._facePlayer(player);
    const dist = this._distToPlayer(player);

    if (dist < this.attackRange) {
      this.state = EnemyState.ATTACK;
      this.attackFrame = this.attackDuration;
      this.vx = 0;
    } else if (dist < this.chaseRange) {
      this.state = EnemyState.CHASE;
      this.vx = this.speed * this.facing;
    } else {
      this.state = EnemyState.PATROL;
      this.vx = this.speed * this.facing * 0.5;
      const cx = this.x + this.width * 0.5;
      if (cx <= this.patrolLeft) {
        this.facing = 1;
        this.vx = Math.abs(this.vx);
      } else if (cx >= this.patrolRight) {
        this.facing = -1;
        this.vx = -Math.abs(this.vx);
      }
    }

    this._applyGravityAndCollide(platforms);
    this._checkStomp(player);
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    if (!this.isDead()) {
      this.invincible = true;
      this.invTimer = 15;
    }
  }

  render(ctx, cameraOffset) {
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const sx = this.x - ox;
    const sy = this.y - oy;

    if (this.state === EnemyState.DEAD) {
      ctx.fillStyle = 'rgba(26,18,16,0.25)';
      ctx.fillRect(sx + 4, sy + this.height - 6, this.width - 8, 6);
      return;
    }

    if (this.state === EnemyState.STUNNED && Math.floor(this.stunTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.save();
    ctx.translate(sx + this.width * 0.5, sy + this.height);
    ctx.scale(this.facing, 1);

    const c1 = '#1a1210';
    const c2 = '#2a2018';

    ctx.fillStyle = c1;
    ctx.fillRect(-6, -46, 12, 24);

    ctx.fillStyle = c2;
    ctx.fillRect(-8, -22, 16, 22);

    ctx.fillStyle = c1;
    ctx.fillRect(-8, -22, 5, 22);

    ctx.fillStyle = c1;
    ctx.fillRect(-6, -2, 4, 4);
    ctx.fillRect(2, -2, 4, 4);

    ctx.strokeStyle = c1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -36);
    ctx.lineTo(10, -42);
    ctx.stroke();

    ctx.strokeStyle = c2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -42);
    ctx.lineTo(14, -38);
    ctx.stroke();

    if (this.state === EnemyState.ATTACK && this.attackFrame > 5) {
      ctx.strokeStyle = c1;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(8, -36);
      ctx.lineTo(22, -32);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export class Archer extends Enemy {
  constructor(x, y) {
    super(x, y, 30, 46, 1, 0.8, 'archer');
    this.state = EnemyState.IDLE;
    this.stunDuration = 90;
    this.shootCooldown = 0;
    this.shootCooldownMax = 60;
    this.aimRange = 350;
    this.arrows = [];
    this.damage = 1;
  }

  update(player, platforms) {
    if (this.state === EnemyState.DEAD) return;
    if (this.invTimer > 0) {
      this.invTimer--;
      if (this.invTimer <= 0) this.invincible = false;
    }

    if (this.shootCooldown > 0) this.shootCooldown--;

    if (this.state === EnemyState.STUNNED) {
      this.stunTimer--;
      this.vx = 0;
      this._applyGravityAndCollide(platforms);
      if (this.stunTimer <= 0) {
        this.state = EnemyState.IDLE;
      }
      return;
    }

    if (this.state === EnemyState.SHOOT) {
      this.vx = 0;
      this._applyGravityAndCollide(platforms);
      this.state = EnemyState.IDLE;
      return;
    }

    if (this.state === EnemyState.AIM) {
      this._facePlayer(player);
      this.vx = 0;
      this._applyGravityAndCollide(platforms);
      this.shootCooldown = this.shootCooldownMax;
      const ec = this.getCenter();
      const pc = player.getCenter ? player.getCenter() : { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 };
      const dx = pc.x - ec.x;
      const dy = pc.y - ec.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vx = (dx / dist) * 5;
      const vy = (dy / dist) * 5;
      this.arrows.push(new Projectile(ec.x, ec.y, vx, vy, true));
      this.state = EnemyState.SHOOT;
      return;
    }

    const dist = this._distToPlayer(player);
    if (dist < this.aimRange && this.shootCooldown <= 0) {
      this.state = EnemyState.AIM;
    } else {
      this.state = EnemyState.IDLE;
    }

    this._facePlayer(player);
    this.vx = 0;
    this._applyGravityAndCollide(platforms);
    this._checkStomp(player);
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    if (!this.isDead()) {
      this.invincible = true;
      this.invTimer = 15;
    }
  }

  render(ctx, cameraOffset) {
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const sx = this.x - ox;
    const sy = this.y - oy;

    if (this.state === EnemyState.DEAD) {
      ctx.fillStyle = 'rgba(26,18,16,0.25)';
      ctx.fillRect(sx + 4, sy + this.height - 6, this.width - 8, 6);
      return;
    }

    if (this.state === EnemyState.STUNNED && Math.floor(this.stunTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.save();
    ctx.translate(sx + this.width * 0.5, sy + this.height);
    ctx.scale(this.facing, 1);

    const c1 = '#1a1210';
    const c2 = '#2a2018';

    ctx.fillStyle = c1;
    ctx.fillRect(-5, -44, 10, 22);

    ctx.fillStyle = c2;
    ctx.fillRect(-7, -22, 14, 22);

    ctx.fillStyle = c1;
    ctx.fillRect(-7, -22, 4, 22);

    ctx.fillRect(-5, -2, 3, 4);
    ctx.fillRect(2, -2, 3, 4);

    ctx.strokeStyle = c2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -34);
    ctx.lineTo(-8, -38);
    ctx.stroke();

    ctx.strokeStyle = c1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -34);
    ctx.lineTo(10, -38);
    ctx.stroke();

    ctx.strokeStyle = c2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, -42);
    ctx.quadraticCurveTo(10, -36, 8, -30);
    ctx.stroke();

    ctx.strokeStyle = c1;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, -42);
    ctx.lineTo(16, -40);
    ctx.stroke();

    if (this.state === EnemyState.AIM) {
      ctx.strokeStyle = 'rgba(26,18,16,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8, -38);
      ctx.lineTo(20, -38);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export class Trap extends Enemy {
  constructor(x, y, trapType) {
    const infiniteHp = 99999;
    if (trapType === 'SPIKE') {
      super(x, y, 40, 20, infiniteHp, 0, 'trap_spike');
    } else {
      super(x, y, 30, 30, infiniteHp, 0, 'trap_rock');
    }
    this.trapType = trapType;
    this.state = EnemyState.INACTIVE;
    this.stunDuration = 0;
    this.invincible = true;
    this.damage = 1;

    if (trapType === 'SPIKE') {
      this.hiddenDuration = 60;
      this.activeDuration = 45;
      this.cycleTimer = 0;
    } else {
      this.fallTriggerRange = 100;
      this.fallSpeed = 6;
      this.resetDuration = 120;
      this.resetTimer = 0;
      this.initialY = y;
      this.falling = false;
    }
  }

  update(player, platforms) {
    if (this.trapType === 'SPIKE') {
      this._updateSpike(player);
    } else {
      this._updateRock(player, platforms);
    }
  }

  _updateSpike(player) {
    this.cycleTimer++;
    if (this.state === EnemyState.INACTIVE) {
      if (this.cycleTimer >= this.hiddenDuration) {
        this.state = EnemyState.ACTIVE;
        this.cycleTimer = 0;
      }
    } else if (this.state === EnemyState.ACTIVE) {
      if (this.cycleTimer >= this.activeDuration) {
        this.state = EnemyState.INACTIVE;
        this.cycleTimer = 0;
      }
      if (rectOverlap(this, player) && !player.invincible) {
        player.takeDamage(this.damage, this.x + this.width * 0.5);
      }
    }
  }

  _updateRock(player, platforms) {
    if (this.state === EnemyState.INACTIVE) {
      this.y = this.initialY;
      this.falling = false;
      const pc = player.getCenter ? player.getCenter() : { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 };
      const dx = Math.abs(pc.x - (this.x + this.width * 0.5));
      if (dx < this.fallTriggerRange && pc.y > this.y) {
        this.state = EnemyState.ACTIVE;
        this.falling = true;
      }
    } else if (this.state === EnemyState.ACTIVE) {
      this.y += this.fallSpeed;
      if (rectOverlap(this, player) && !player.invincible) {
        player.takeDamage(this.damage, this.x + this.width * 0.5);
      }
      if (platforms) {
        for (const p of platforms) {
          if (rectOverlap(this, p)) {
            this.state = EnemyState.RESETTING;
            this.resetTimer = 0;
            this.falling = false;
            if (this.onEmitParticles) {
              this.onEmitParticles('ROCK_IMPACT', this.x + this.width * 0.5, this.y + this.height, {});
            }
            break;
          }
        }
      }
    } else if (this.state === EnemyState.RESETTING) {
      this.resetTimer++;
      if (this.resetTimer >= this.resetDuration) {
        this.state = EnemyState.INACTIVE;
        this.y = this.initialY;
      }
    }
  }

  takeDamage() {}

  stun() {}

  render(ctx, cameraOffset) {
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const sx = this.x - ox;
    const sy = this.y - oy;

    if (this.trapType === 'SPIKE') {
      this._renderSpike(ctx, sx, sy);
    } else {
      this._renderRock(ctx, sx, sy);
    }
  }

  _renderSpike(ctx, sx, sy) {
    if (this.state === EnemyState.INACTIVE) {
      ctx.fillStyle = 'rgba(26,18,16,0.15)';
      ctx.fillRect(sx + 2, sy + this.height - 4, this.width - 4, 4);
      return;
    }

    const c1 = '#1a1210';
    const c2 = '#2a2018';
    const spikeCount = 5;
    const spikeWidth = (this.width - 4) / spikeCount;

    ctx.fillStyle = c1;
    for (let i = 0; i < spikeCount; i++) {
      const bx = sx + 2 + i * spikeWidth;
      ctx.beginPath();
      ctx.moveTo(bx, sy + this.height);
      ctx.lineTo(bx + spikeWidth * 0.5, sy + 2);
      ctx.lineTo(bx + spikeWidth, sy + this.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = c2;
    ctx.fillRect(sx, sy + this.height - 3, this.width, 3);
  }

  _renderRock(ctx, sx, sy) {
    if (this.state === EnemyState.RESETTING) {
      ctx.globalAlpha = 0.3;
    }

    const c1 = '#1a1210';
    const c2 = '#3a3028';

    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy + this.height);
    ctx.lineTo(sx, sy + this.height * 0.4);
    ctx.lineTo(sx + this.width * 0.3, sy + 2);
    ctx.lineTo(sx + this.width * 0.7, sy);
    ctx.lineTo(sx + this.width, sy + this.height * 0.3);
    ctx.lineTo(sx + this.width - 1, sy + this.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(sx + this.width * 0.3, sy + 2);
    ctx.lineTo(sx + this.width * 0.5, sy + this.height * 0.5);
    ctx.lineTo(sx + this.width, sy + this.height * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}

export class Elite extends Enemy {
  constructor(x, y) {
    super(x, y, 38, 54, 6, 2.5, 'elite');
    this.state = EnemyState.IDLE;
    this.stunDuration = 60;
    this.attackRange = 60;
    this.lungeRange = 180;
    this.attackFrame = 0;
    this.attackDuration = 14;
    this.lungeFrame = 0;
    this.lungeDuration = 18;
    this.lungeSpeed = 8;
    this.blockChance = 0.3;
    this.blockFrame = 0;
    this.blockDuration = 8;
    this.damage = 2;
    this.chaseRange = 300;
  }

  update(player, platforms) {
    if (this.state === EnemyState.DEAD) return;
    if (this.invTimer > 0) {
      this.invTimer--;
      if (this.invTimer <= 0) this.invincible = false;
    }

    if (this.state === EnemyState.STUNNED) {
      this.stunTimer--;
      this.vx = 0;
      this._applyGravityAndCollide(platforms);
      if (this.stunTimer <= 0) {
        this.state = EnemyState.CHASE;
      }
      return;
    }

    if (this.state === EnemyState.BLOCK) {
      this.blockFrame--;
      this.vx = 0;
      this._applyGravityAndCollide(platforms);
      if (this.blockFrame <= 0) {
        this.invincible = false;
        this.state = EnemyState.ATTACK;
        this.attackFrame = this.attackDuration;
      }
      return;
    }

    if (this.state === EnemyState.ATTACK) {
      this.attackFrame--;
      this.vx = 0;
      this._applyGravityAndCollide(platforms);
      if (this.attackFrame <= 0) {
        this.state = EnemyState.CHASE;
      }
      return;
    }

    if (this.state === EnemyState.LUNGE) {
      this.lungeFrame--;
      this.vx = this.lungeSpeed * this.facing;
      this._applyGravityAndCollide(platforms);
      const dist = this._distToPlayer(player);
      if (dist < this.attackRange) {
        this.state = EnemyState.ATTACK;
        this.attackFrame = this.attackDuration;
        this.vx = 0;
      }
      if (this.lungeFrame <= 0) {
        this.state = EnemyState.CHASE;
      }
      this._checkStomp(player);
      return;
    }

    this._facePlayer(player);
    const dist = this._distToPlayer(player);

    if (dist < this.attackRange) {
      const facingPlayer = (player.x + player.width * 0.5 < this.x + this.width * 0.5 && this.facing === -1) ||
                           (player.x + player.width * 0.5 > this.x + this.width * 0.5 && this.facing === 1);
      if (facingPlayer && player.attackFrame > 0 && Math.random() < this.blockChance) {
        this.state = EnemyState.BLOCK;
        this.blockFrame = this.blockDuration;
        this.invincible = true;
        this.vx = 0;
        if (this.onEmitParticles) {
          this.onEmitParticles('ELITE_BLOCK', this.x + this.width * 0.5, this.y + this.height * 0.4, {});
        }
      } else {
        this.state = EnemyState.ATTACK;
        this.attackFrame = this.attackDuration;
        this.vx = 0;
      }
    } else if (dist < this.lungeRange) {
      this.state = EnemyState.LUNGE;
      this.lungeFrame = this.lungeDuration;
    } else if (dist < this.chaseRange) {
      this.state = EnemyState.CHASE;
      this.vx = this.speed * this.facing;
    } else {
      this.state = EnemyState.IDLE;
      this.vx = 0;
    }

    this._applyGravityAndCollide(platforms);
    this._checkStomp(player);
  }

  takeDamage(amount) {
    if (this.state === EnemyState.BLOCK) return;
    super.takeDamage(amount);
    if (!this.isDead()) {
      this.invincible = true;
      this.invTimer = 12;
    }
  }

  render(ctx, cameraOffset) {
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const sx = this.x - ox;
    const sy = this.y - oy;

    if (this.state === EnemyState.DEAD) {
      ctx.fillStyle = 'rgba(26,18,16,0.25)';
      ctx.fillRect(sx + 4, sy + this.height - 8, this.width - 8, 8);
      return;
    }

    if (this.state === EnemyState.STUNNED && Math.floor(this.stunTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.save();
    ctx.translate(sx + this.width * 0.5, sy + this.height);
    ctx.scale(this.facing, 1);

    const c1 = '#1a1210';
    const c2 = '#2a2018';
    const c3 = '#3a3028';

    ctx.fillStyle = c2;
    ctx.fillRect(-7, -50, 14, 6);

    ctx.fillStyle = c3;
    ctx.fillRect(-5, -44, 10, 4);

    ctx.fillStyle = c1;
    ctx.fillRect(-6, -40, 12, 20);

    ctx.fillStyle = c2;
    ctx.fillRect(-10, -20, 20, 20);

    ctx.fillStyle = c1;
    ctx.fillRect(-10, -20, 6, 20);

    ctx.fillStyle = c3;
    ctx.fillRect(-10, -18, 3, 8);

    ctx.fillRect(7, -18, 3, 8);

    ctx.fillStyle = c1;
    ctx.fillRect(-8, -2, 5, 5);
    ctx.fillRect(3, -2, 5, 5);

    ctx.strokeStyle = c1;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(5, -34);
    ctx.lineTo(14, -40);
    ctx.stroke();

    ctx.strokeStyle = c2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, -40);
    ctx.lineTo(20, -36);
    ctx.stroke();

    if (this.state === EnemyState.ATTACK && this.attackFrame > 7) {
      ctx.strokeStyle = c1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -30);
      ctx.lineTo(28, -26);
      ctx.stroke();
    }

    if (this.state === EnemyState.LUNGE) {
      ctx.strokeStyle = c1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -30);
      ctx.lineTo(16, -34);
      ctx.lineTo(24, -30);
      ctx.stroke();
    }

    if (this.state === EnemyState.BLOCK) {
      ctx.strokeStyle = 'rgba(58,48,40,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -28, 16, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(58,48,40,0.4)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -28, 16, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export class Projectile {
  constructor(x, y, vx, vy, canBeSlashed = true) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 16;
    this.height = 4;
    this.canBeSlashed = canBeSlashed;
    this.active = true;
    this.damage = 1;
  }

  update(platforms, canvasWidth, canvasHeight) {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -50 || this.x > canvasWidth + 50 || this.y < -50 || this.y > canvasHeight + 50) {
      this.active = false;
      return;
    }

    if (platforms) {
      for (const p of platforms) {
        if (rectOverlap(this, p)) {
          this.active = false;
          return;
        }
      }
    }
  }

  slash() {
    if (this.canBeSlashed) {
      this.active = false;
    }
  }

  render(ctx, cameraOffset) {
    if (!this.active) return;
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const sx = this.x - ox;
    const sy = this.y - oy;

    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(sx + this.width * 0.5, sy + this.height * 0.5);
    ctx.rotate(angle);

    ctx.strokeStyle = '#1a1210';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();

    ctx.fillStyle = '#2a2018';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(4, -2);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export { EnemyState };
