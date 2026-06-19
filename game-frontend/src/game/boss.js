import { Soldier } from './enemies.js';
import { rectOverlap } from './collision.js';

const BossPhase = {
  SERPENT: 1,
  WYRM: 2,
  DRAGON: 3,
};

const BossAction = {
  IDLE: 'IDLE',
  MOVE: 'MOVE',
  TAIL_WHIP: 'TAIL_WHIP',
  INK_SPIT: 'INK_SPIT',
  DASH_WINDUP: 'DASH_WINDUP',
  DASH_ATTACK: 'DASH_ATTACK',
  DASH_RECOVER: 'DASH_RECOVER',
  INK_RAIN: 'INK_RAIN',
  TAIL_SWEEP: 'TAIL_SWEEP',
  BREATH: 'BREATH',
  SHOCKWAVE: 'SHOCKWAVE',
  SUMMON: 'SUMMON',
  DIVE: 'DIVE',
  PHASE_TRANSITION: 'PHASE_TRANSITION',
  DEAD: 'DEAD',
};

const PHASE_SIZES = {
  [BossPhase.SERPENT]: { width: 80, height: 90 },
  [BossPhase.WYRM]: { width: 100, height: 110 },
  [BossPhase.DRAGON]: { width: 120, height: 130 },
};

class InkProjectile {
  constructor(x, y, vx, vy, type, damage) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 12;
    this.height = 12;
    this.type = type;
    this.damage = damage;
    this.active = true;
    this.life = 300;
  }

  update(platforms, canvasWidth, canvasHeight) {
    if (!this.active) return;
    this.x += this.vx;
    this.y += this.vy;

    if (this.type === 'rain') {
      this.vy += 0.15;
    }

    this.life--;
    if (this.life <= 0 || this.x < -60 || this.x > canvasWidth + 60 || this.y > canvasHeight + 60) {
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

  render(ctx, cameraOffset) {
    if (!this.active) return;
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const sx = this.x - ox;
    const sy = this.y - oy;

    ctx.fillStyle = '#1a1210';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(sx + 6, sy + 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(sx + 6, sy + 6, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}

class ShockwaveRing {
  constructor(x, y, damage) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.maxRadius = 200;
    this.expandSpeed = 4;
    this.damage = damage;
    this.active = true;
    this.hit = false;
  }

  update() {
    if (!this.active) return;
    this.radius += this.expandSpeed;
    if (this.radius >= this.maxRadius) {
      this.active = false;
    }
  }

  hitsPlayer(player) {
    if (this.hit || !this.active) return false;
    const pc = player.getCenter ? player.getCenter() : { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 };
    const dx = pc.x - this.x;
    const dy = pc.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const innerR = this.radius - 16;
    const outerR = this.radius + 16;
    if (dist >= innerR && dist <= outerR) {
      this.hit = true;
      return true;
    }
    return false;
  }

  render(ctx, cameraOffset) {
    if (!this.active) return;
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const sx = this.x - ox;
    const sy = this.y - oy;
    const lifeRatio = 1 - this.radius / this.maxRadius;

    ctx.strokeStyle = '#1a1210';
    ctx.lineWidth = 6 * lifeRatio;
    ctx.globalAlpha = 0.7 * lifeRatio;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.15 * lifeRatio;
    ctx.fillStyle = '#1a1210';
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}

export class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.phase = BossPhase.SERPENT;
    this.phaseHp = 10;
    this.phaseMaxHp = 10;
    this.totalMaxHp = 30;
    this.facing = -1;
    this.action = BossAction.IDLE;
    this.invincible = false;
    this.invTimer = 0;
    this.active = true;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.gravity = 0.55;
    this.onEmitParticles = null;
    this.projectiles = [];
    this.shockwaves = [];
    this.attackHitboxes = [];

    const size = PHASE_SIZES[BossPhase.SERPENT];
    this.width = size.width;
    this.height = size.height;

    this.actionTimer = 0;
    this.attackFrame = 0;
    this.cooldownTimer = 0;
    this.moveDir = 1;
    this.moveTimer = 0;

    this.tailWhipRange = 40;
    this.tailWhipDamage = 2;
    this.tailWhipDuration = 15;

    this.inkSpitCooldown = 0;
    this.inkSpitCooldownMax = 90;
    this.inkSpitRange = 300;
    this.inkSpitSpeed = 4;

    this.dashWindup = 45;
    this.dashDuration = 15;
    this.dashSpeed = 5;
    this.dashDamage = 3;
    this.dashRecover = 20;
    this.dashPostInvFrames = 10;

    this.inkRainCooldown = 0;
    this.inkRainCooldownMax = 120;

    this.tailSweepDuration = 20;
    this.tailSweepDamage = 2;

    this.breathCooldown = 0;
    this.breathCooldownMax = 150;
    this.breathDuration = 60;
    this.breathDamage = 2;
    this.breathSweepSpeed = 0.02;
    this.breathAngle = 0;

    this.shockwaveCooldown = 0;
    this.shockwaveCooldownMax = 90;
    this.shockwaveDamage = 3;

    this.summonCooldown = 0;
    this.summonCooldownMax = 180;
    this.maxSoldiers = 4;

    this.diveSpeed = 10;
    this.diveDamage = 3;
    this.diveTargetX = 0;
    this.diveTargetY = 0;
    this.airY = 0;
    this.flightY = 0;
    this.flightPhase = 0;

    this.transitionTimer = 0;
    this.transitionDuration = 20;
    this.flashFrame = 0;

    this.arenaLeft = x - 250;
    this.arenaRight = x + 250;
    this.groundY = y;

    this.bodySegments = this._initSegments();
  }

  _initSegments() {
    const count = this.phase === BossPhase.SERPENT ? 5 : this.phase === BossPhase.WYRM ? 7 : 9;
    const segs = [];
    for (let i = 0; i < count; i++) {
      segs.push({ offsetX: i * 12, offsetY: Math.sin(i * 0.8) * 6 });
    }
    return segs;
  }

  _updateSize() {
    const size = PHASE_SIZES[this.phase];
    this.width = size.width;
    this.height = size.height;
  }

  update(player, platforms, soldiers_array) {
    if (this.action === BossAction.DEAD) return;

    this.attackHitboxes = [];

    if (this.invTimer > 0) {
      this.invTimer--;
      if (this.invTimer <= 0) this.invincible = false;
    }

    if (this.action === BossAction.PHASE_TRANSITION) {
      this.transitionTimer--;
      this.flashFrame++;
      this.vx = 0;
      if (this.transitionTimer <= 0) {
        this.invincible = false;
        this.action = BossAction.IDLE;
        this.actionTimer = 0;
        this.cooldownTimer = 30;
      }
      return;
    }

    this._updateProjectiles(platforms);
    this._updateShockwaves(player);

    if (this.inkSpitCooldown > 0) this.inkSpitCooldown--;
    if (this.inkRainCooldown > 0) this.inkRainCooldown--;
    if (this.breathCooldown > 0) this.breathCooldown--;
    if (this.shockwaveCooldown > 0) this.shockwaveCooldown--;
    if (this.summonCooldown > 0) this.summonCooldown--;
    if (this.cooldownTimer > 0) this.cooldownTimer--;

    this._facePlayer(player);

    switch (this.phase) {
      case BossPhase.SERPENT:
        this._updatePhase1(player);
        break;
      case BossPhase.WYRM:
        this._updatePhase2(player);
        break;
      case BossPhase.DRAGON:
        this._updatePhase3(player, soldiers_array);
        break;
    }

    this._emitTrailParticles();
  }

  _facePlayer(player) {
    const pc = player.getCenter ? player.getCenter() : { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 };
    const bc = this._getCenter();
    this.facing = pc.x < bc.x ? -1 : 1;
  }

  _distToPlayer(player) {
    const bc = this._getCenter();
    const pc = player.getCenter ? player.getCenter() : { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 };
    const dx = pc.x - bc.x;
    const dy = pc.y - bc.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _getCenter() {
    return { x: this.x + this.width * 0.5, y: this.y + this.height * 0.5 };
  }

  _updateProjectiles(platforms) {
    const cw = (this.arenaRight + 200);
    const ch = this.groundY + 200;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.projectiles[i].update(platforms, cw, ch);
      if (!this.projectiles[i].active) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  _updateShockwaves(player) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].update();
      if (this.shockwaves[i].hitsPlayer(player) && !player.invincible) {
        player.takeDamage(this.shockwaves[i].damage, this.x + this.width * 0.5);
      }
      if (!this.shockwaves[i].active) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  _updatePhase1(player) {
    switch (this.action) {
      case BossAction.TAIL_WHIP:
        this.attackFrame--;
        this.vx = 0;
        if (this.attackFrame > this.tailWhipDuration * 0.5) {
          const tailX = this.facing === -1 ? this.x + this.width - 10 : this.x - 20;
          const tailY = this.y + this.height * 0.4;
          this.attackHitboxes.push({ x: tailX, y: tailY, width: 30, height: 30, damage: this.tailWhipDamage });
        }
        if (this.attackFrame <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 20;
        }
        break;

      case BossAction.INK_SPIT:
        this.attackFrame--;
        this.vx = 0;
        if (this.attackFrame <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 30;
        }
        break;

      case BossAction.MOVE:
        this.moveTimer--;
        this.vx = this.moveDir * 2;
        const cx = this.x + this.width * 0.5;
        if (cx <= this.arenaLeft) { this.moveDir = 1; }
        if (cx >= this.arenaRight) { this.moveDir = -1; }
        this.x += this.vx;
        if (this.moveTimer <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 10;
        }
        break;

      default:
        this.vx = 0;
        const dist = this._distToPlayer(player);

        if (dist < this.tailWhipRange && this.cooldownTimer <= 0) {
          this.action = BossAction.TAIL_WHIP;
          this.attackFrame = this.tailWhipDuration;
        } else if (dist < this.inkSpitRange && this.inkSpitCooldown <= 0 && this.cooldownTimer <= 0) {
          this._fireInkSpit(player);
          this.inkSpitCooldown = this.inkSpitCooldownMax;
          this.action = BossAction.INK_SPIT;
          this.attackFrame = 10;
        } else if (this.cooldownTimer <= 0) {
          this.action = BossAction.MOVE;
          this.moveDir = this.facing;
          this.moveTimer = 40 + Math.floor(Math.random() * 40);
        }
        break;
    }
  }

  _fireInkSpit(player) {
    const bc = this._getCenter();
    const pc = player.getCenter ? player.getCenter() : { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 };
    const baseAngle = Math.atan2(pc.y - bc.y, pc.x - bc.x);
    const spread = 0.2;
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * spread;
      const vx = Math.cos(angle) * this.inkSpitSpeed;
      const vy = Math.sin(angle) * this.inkSpitSpeed;
      this.projectiles.push(new InkProjectile(bc.x, bc.y, vx, vy, 'blob', 1));
    }
  }

  _updatePhase2(player) {
    switch (this.action) {
      case BossAction.DASH_WINDUP:
        this.attackFrame--;
        this.vx = 0;
        if (this.attackFrame <= 0) {
          this.action = BossAction.DASH_ATTACK;
          this.attackFrame = this.dashDuration;
        }
        break;

      case BossAction.DASH_ATTACK:
        this.attackFrame--;
        this.vx = this.dashSpeed * this.facing;
        this.x += this.vx;
        this.attackHitboxes.push({
          x: this.x, y: this.y, width: this.width, height: this.height, damage: this.dashDamage,
        });
        if (this.attackFrame <= 0) {
          this.vx = 0;
          this.invincible = true;
          this.invTimer = this.dashPostInvFrames;
          this.action = BossAction.DASH_RECOVER;
          this.attackFrame = this.dashRecover;
        }
        break;

      case BossAction.DASH_RECOVER:
        this.attackFrame--;
        this.vx = 0;
        if (this.attackFrame <= 0) {
          this.invincible = false;
          this.action = BossAction.IDLE;
          this.cooldownTimer = 25;
        }
        break;

      case BossAction.INK_RAIN:
        this.attackFrame--;
        this.vx = 0;
        if (this.attackFrame <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 20;
        }
        break;

      case BossAction.TAIL_SWEEP:
        this.attackFrame--;
        this.vx = 0;
        if (this.attackFrame > this.tailSweepDuration * 0.4) {
          const tailX = this.facing === -1 ? this.x + this.width - 5 : this.x - 30;
          const tailY = this.y + this.height * 0.3;
          this.attackHitboxes.push({ x: tailX, y: tailY, width: 40, height: 35, damage: this.tailSweepDamage });
        }
        if (this.attackFrame <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 15;
        }
        break;

      case BossAction.MOVE:
        this.moveTimer--;
        this.vx = this.moveDir * 2.5;
        const cx = this.x + this.width * 0.5;
        if (cx <= this.arenaLeft) { this.moveDir = 1; }
        if (cx >= this.arenaRight) { this.moveDir = -1; }
        this.x += this.vx;
        if (this.moveTimer <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 10;
        }
        break;

      default:
        this.vx = 0;
        const dist = this._distToPlayer(player);
        const pick = Math.random();

        if (dist < 70 && this.cooldownTimer <= 0 && pick < 0.3) {
          this.action = BossAction.TAIL_SWEEP;
          this.attackFrame = this.tailSweepDuration;
        } else if (dist < 250 && this.inkRainCooldown <= 0 && this.cooldownTimer <= 0 && pick < 0.5) {
          this._fireInkRain();
          this.inkRainCooldown = this.inkRainCooldownMax;
          this.action = BossAction.INK_RAIN;
          this.attackFrame = 15;
        } else if (dist < 350 && this.cooldownTimer <= 0 && pick < 0.75) {
          this.action = BossAction.DASH_WINDUP;
          this.attackFrame = this.dashWindup;
        } else if (this.cooldownTimer <= 0) {
          this.action = BossAction.MOVE;
          this.moveDir = this.facing;
          this.moveTimer = 25 + Math.floor(Math.random() * 30);
        }
        break;
    }
  }

  _fireInkRain() {
    const bc = this._getCenter();
    for (let i = 0; i < 8; i++) {
      const rx = this.arenaLeft + Math.random() * (this.arenaRight - this.arenaLeft);
      const vy = -(3 + Math.random() * 3);
      const vx = (Math.random() - 0.5) * 1.5;
      this.projectiles.push(new InkProjectile(rx, bc.y - 40, vx, vy, 'rain', 1));
    }
  }

  _updatePhase3(player, soldiers_array) {
    this.flightPhase += 0.03;

    switch (this.action) {
      case BossAction.BREATH:
        this.attackFrame--;
        this.breathAngle += this.breathSweepSpeed * this.facing;
        const bc = this._getCenter();
        const breathLen = 220;
        const breathWidth = 30;
        const tipX = bc.x + Math.cos(this.breathAngle) * breathLen;
        const tipY = bc.y + Math.sin(this.breathAngle) * breathLen;
        this.attackHitboxes.push({
          x: Math.min(bc.x, tipX),
          y: Math.min(bc.y, tipY) - breathWidth * 0.5,
          width: Math.abs(tipX - bc.x),
          height: breathWidth,
          damage: this.breathDamage,
          type: 'breath',
        });
        if (this.attackFrame <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 30;
        }
        break;

      case BossAction.SHOCKWAVE:
        this.attackFrame--;
        this.vx = 0;
        if (this.attackFrame === 10) {
          const sc = this._getCenter();
          this.shockwaves.push(new ShockwaveRing(sc.x, this.y + this.height, this.shockwaveDamage));
          if (this.onEmitParticles) {
            this.onEmitParticles('BOSS_AOE', sc.x, this.y + this.height, { expandRate: 100 });
          }
        }
        if (this.attackFrame <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 20;
        }
        break;

      case BossAction.SUMMON:
        this.attackFrame--;
        this.vx = 0;
        if (this.attackFrame <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 30;
        }
        break;

      case BossAction.DIVE:
        this.attackFrame--;
        const dx = this.diveTargetX - (this.x + this.width * 0.5);
        const dy = this.diveTargetY - this.y;
        const diveDist = Math.sqrt(dx * dx + dy * dy);
        if (diveDist > 8) {
          this.vx = (dx / diveDist) * this.diveSpeed;
          this.vy = (dy / diveDist) * this.diveSpeed;
          this.x += this.vx;
          this.y += this.vy;
        } else {
          this.y = this.groundY - this.height;
          this.vy = 0;
          this.vx = 0;
          this.onGround = true;
          this.attackHitboxes.push({
            x: this.x - 20, y: this.y + this.height - 10, width: this.width + 40, height: 20, damage: this.diveDamage,
          });
          if (this.onEmitParticles) {
            this.onEmitParticles('INK_SPLASH', this.x + this.width * 0.5, this.y + this.height, { count: 16 });
          }
          this.action = BossAction.IDLE;
          this.cooldownTimer = 25;
        }
        break;

      case BossAction.MOVE:
        this.moveTimer--;
        this.vx = this.moveDir * 1.5;
        this.x += this.vx;
        const targetY = this.groundY - this.height - Math.sin(this.flightPhase) * 60;
        this.y += (targetY - this.y) * 0.05;
        const cx = this.x + this.width * 0.5;
        if (cx <= this.arenaLeft) { this.moveDir = 1; }
        if (cx >= this.arenaRight) { this.moveDir = -1; }
        if (this.moveTimer <= 0) {
          this.action = BossAction.IDLE;
          this.cooldownTimer = 8;
        }
        break;

      default:
        this.vx = 0;
        const pick = Math.random();
        if (this.breathCooldown <= 0 && this.cooldownTimer <= 0 && pick < 0.25) {
          this.action = BossAction.BREATH;
          this.attackFrame = this.breathDuration;
          this.breathAngle = this.facing === 1 ? -0.3 : Math.PI - 0.3 + 0.6;
          this.breathCooldown = this.breathCooldownMax;
        } else if (this.shockwaveCooldown <= 0 && this.cooldownTimer <= 0 && pick < 0.45) {
          this.action = BossAction.SHOCKWAVE;
          this.attackFrame = 15;
          this.shockwaveCooldown = this.shockwaveCooldownMax;
        } else if (this.summonCooldown <= 0 && soldiers_array && soldiers_array.length < this.maxSoldiers && this.cooldownTimer <= 0 && pick < 0.6) {
          this._summonSoldiers(soldiers_array);
          this.summonCooldown = this.summonCooldownMax;
          this.action = BossAction.SUMMON;
          this.attackFrame = 12;
        } else if (this.cooldownTimer <= 0 && pick < 0.8 && !this.onGround) {
          const pc = player.getCenter ? player.getCenter() : { x: player.x + player.width * 0.5, y: player.y + player.height * 0.5 };
          this.diveTargetX = pc.x;
          this.diveTargetY = this.groundY - this.height;
          this.action = BossAction.DIVE;
          this.attackFrame = 60;
        } else if (this.cooldownTimer <= 0) {
          this.action = BossAction.MOVE;
          this.moveDir = this.facing;
          this.moveTimer = 30 + Math.floor(Math.random() * 30);
        }
        break;
    }
  }

  _summonSoldiers(soldiers_array) {
    for (let i = 0; i < 2; i++) {
      const sx = this.x + (Math.random() - 0.5) * 80;
      const sy = this.y;
      const patrolLeft = Math.max(this.arenaLeft, sx - 80);
      const patrolRight = Math.min(this.arenaRight, sx + 80);
      soldiers_array.push(new Soldier(sx, sy, patrolLeft, patrolRight));
    }
  }

  _emitTrailParticles() {
    if (!this.onEmitParticles) return;
    if (this.action === BossAction.PHASE_TRANSITION) return;
    const bc = this._getCenter();
    if (Math.random() < 0.3) {
      this.onEmitParticles('INK_SPLASH', bc.x + (Math.random() - 0.5) * this.width * 0.5, bc.y + (Math.random() - 0.5) * this.height * 0.5, {
        count: 1,
      });
    }
  }

  takeDamage(amount) {
    if (this.invincible || this.action === BossAction.DEAD) return;
    this.phaseHp -= amount;
    if (this.phaseHp <= 0) {
      this.phaseHp = 0;
      if (this.phase >= BossPhase.DRAGON) {
        this.action = BossAction.DEAD;
        this.active = false;
        if (this.onEmitParticles) {
          const bc = this._getCenter();
          this.onEmitParticles('BOSS_AOE', bc.x, bc.y, { expandRate: 200, splatCount: 20 });
        }
      } else {
        this.phaseTransition();
      }
    }
  }

  phaseTransition() {
    this.phase++;
    this.phaseHp = this.phaseMaxHp;
    this.invincible = true;
    this.invTimer = this.transitionDuration;
    this.transitionTimer = this.transitionDuration;
    this.flashFrame = 0;
    this.action = BossAction.PHASE_TRANSITION;
    this.vx = 0;
    this.vy = 0;
    this._updateSize();
    this.bodySegments = this._initSegments();
    this.projectiles.length = 0;
    this.shockwaves.length = 0;

    if (this.phase === BossPhase.DRAGON) {
      this.airY = this.groundY - this.height - 80;
      this.y = this.airY;
      this.onGround = false;
    }

    if (this.onEmitParticles) {
      const bc = this._getCenter();
      this.onEmitParticles('BOSS_AOE', bc.x, bc.y, { expandRate: 150, splatCount: 14 });
    }
  }

  isDead() {
    return this.action === BossAction.DEAD;
  }

  getCurrentPhase() {
    return this.phase;
  }

  getPhaseHp() {
    return this.phaseHp;
  }

  getPhaseMaxHp() {
    return this.phaseMaxHp;
  }

  getAttackHitboxes() {
    return this.attackHitboxes;
  }

  render(ctx, cameraOffset) {
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;

    for (const p of this.projectiles) {
      p.render(ctx, cameraOffset);
    }

    for (const sw of this.shockwaves) {
      sw.render(ctx, cameraOffset);
    }

    if (this.action === BossAction.DEAD) return;

    const sx = this.x - ox;
    const sy = this.y - oy;

    if (this.action === BossAction.PHASE_TRANSITION && Math.floor(this.flashFrame / 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.save();
    ctx.translate(sx + this.width * 0.5, sy + this.height);
    ctx.scale(this.facing, 1);

    switch (this.phase) {
      case BossPhase.SERPENT:
        this._renderSerpent(ctx);
        break;
      case BossPhase.WYRM:
        this._renderWyrm(ctx);
        break;
      case BossPhase.DRAGON:
        this._renderDragon(ctx);
        break;
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    if (this.action === BossAction.BREATH) {
      this._renderBreath(ctx, cameraOffset);
    }
  }

  _renderSerpent(ctx) {
    const c1 = '#1a1210';
    const c2 = '#2a2018';
    const c3 = '#3a3028';

    const t = Date.now() * 0.003;
    for (let i = this.bodySegments.length - 1; i >= 0; i--) {
      const seg = this.bodySegments[i];
      const wave = Math.sin(t + i * 0.8) * 4;
      const sx = -this.width * 0.3 + seg.offsetX * 0.6;
      const sy = -this.height + seg.offsetY + wave;
      const segW = 16 - i * 1.5;
      const segH = 14 - i;
      ctx.fillStyle = i % 2 === 0 ? c1 : c2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, Math.max(2, segW), Math.max(2, segH), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(0, -this.height + 10, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c3;
    ctx.beginPath();
    ctx.ellipse(-4, -this.height + 6, 8, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c83030';
    ctx.beginPath();
    ctx.arc(-6, -this.height + 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -this.height + 6, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8d8c0';
    ctx.beginPath();
    ctx.arc(-6, -this.height + 5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -this.height + 5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = c1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -this.height + 14);
    ctx.quadraticCurveTo(-22, -this.height + 8, -18, -this.height - 4);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -this.height + 14);
    ctx.quadraticCurveTo(16, -this.height + 8, 14, -this.height - 2);
    ctx.stroke();

    if (this.action === BossAction.TAIL_WHIP && this.attackFrame > this.tailWhipDuration * 0.5) {
      const swing = (1 - this.attackFrame / this.tailWhipDuration) * 1.2;
      ctx.strokeStyle = 'rgba(26,18,16,0.5)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -this.height * 0.5, this.width * 0.4, -Math.PI * 0.3 + swing, Math.PI * 0.3 + swing);
      ctx.stroke();
    }
  }

  _renderWyrm(ctx) {
    const c1 = '#1a1210';
    const c2 = '#2a2018';
    const c3 = '#3a3028';

    const t = Date.now() * 0.004;
    for (let i = this.bodySegments.length - 1; i >= 0; i--) {
      const seg = this.bodySegments[i];
      const wave = Math.sin(t + i * 0.7) * 5;
      const sx = -this.width * 0.35 + seg.offsetX * 0.7;
      const sy = -this.height + seg.offsetY * 1.2 + wave;
      const segW = 20 - i * 1.8;
      const segH = 16 - i * 1.2;
      ctx.fillStyle = i % 2 === 0 ? c1 : c2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, Math.max(3, segW), Math.max(3, segH), 0, 0, Math.PI * 2);
      ctx.fill();

      if (i % 3 === 0) {
        ctx.fillStyle = c3;
        ctx.beginPath();
        ctx.ellipse(sx + 3, sy - 2, 4, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(0, -this.height + 14, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.ellipse(-6, -this.height + 10, 14, 16, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c83030';
    ctx.beginPath();
    ctx.arc(-8, -this.height + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -this.height + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8d8c0';
    ctx.beginPath();
    ctx.arc(-8, -this.height + 7, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -this.height + 7, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = c1;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, -this.height + 18);
    ctx.quadraticCurveTo(-28, -this.height + 10, -24, -this.height - 6);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-24, -this.height - 6);
    ctx.lineTo(-30, -this.height - 10);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, -this.height + 18);
    ctx.quadraticCurveTo(22, -this.height + 10, 20, -this.height - 4);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(20, -this.height - 4);
    ctx.lineTo(26, -this.height - 8);
    ctx.stroke();

    ctx.strokeStyle = c3;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const wy = -this.height + 24 + i * 14;
      ctx.beginPath();
      ctx.moveTo(-10, wy);
      ctx.lineTo(-18, wy - 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, wy);
      ctx.lineTo(16, wy - 6);
      ctx.stroke();
    }

    if (this.action === BossAction.DASH_WINDUP) {
      ctx.strokeStyle = 'rgba(200,48,48,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, -this.height * 0.5);
      ctx.lineTo(40, -this.height * 0.5);
      ctx.stroke();
    }

    if (this.action === BossAction.TAIL_SWEEP && this.attackFrame > this.tailSweepDuration * 0.4) {
      const swing = (1 - this.attackFrame / this.tailSweepDuration) * 1.5;
      ctx.strokeStyle = 'rgba(26,18,16,0.5)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, -this.height * 0.45, this.width * 0.45, -Math.PI * 0.35 + swing, Math.PI * 0.35 + swing);
      ctx.stroke();
    }
  }

  _renderDragon(ctx) {
    const c1 = '#1a1210';
    const c2 = '#2a2018';
    const c3 = '#3a3028';

    const t = Date.now() * 0.004;
    for (let i = this.bodySegments.length - 1; i >= 0; i--) {
      const seg = this.bodySegments[i];
      const wave = Math.sin(t + i * 0.6) * 8;
      const sx = -this.width * 0.4 + seg.offsetX * 0.8;
      const sy = -this.height + seg.offsetY * 1.4 + wave;
      const segW = 24 - i * 1.6;
      const segH = 18 - i * 1.2;
      ctx.fillStyle = i % 2 === 0 ? c1 : c2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, Math.max(4, segW), Math.max(4, segH), 0, 0, Math.PI * 2);
      ctx.fill();

      if (i % 2 === 0) {
        ctx.fillStyle = c3;
        ctx.beginPath();
        ctx.ellipse(sx + 4, sy - 3, 5, 7, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(0, -this.height + 18, 34, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.ellipse(-8, -this.height + 12, 18, 20, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c83030';
    ctx.beginPath();
    ctx.arc(-10, -this.height + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -this.height + 10, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8d8c0';
    ctx.beginPath();
    ctx.arc(-10, -this.height + 9, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -this.height + 9, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(200,48,48,0.3)';
    ctx.beginPath();
    ctx.arc(-10, -this.height + 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -this.height + 10, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = c1;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-20, -this.height + 22);
    ctx.quadraticCurveTo(-36, -this.height + 14, -32, -this.height - 8);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-32, -this.height - 8);
    ctx.lineTo(-40, -this.height - 14);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-36, -this.height - 4);
    ctx.lineTo(-44, -this.height);
    ctx.stroke();

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(14, -this.height + 22);
    ctx.quadraticCurveTo(30, -this.height + 14, 28, -this.height - 6);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, -this.height - 6);
    ctx.lineTo(36, -this.height - 12);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(32, -this.height - 2);
    ctx.lineTo(40, -this.height + 2);
    ctx.stroke();

    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(-20, -this.height + 2);
    ctx.lineTo(-48, -this.height - 18);
    ctx.lineTo(-36, -this.height + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c3;
    ctx.beginPath();
    ctx.moveTo(-44, -this.height - 16);
    ctx.lineTo(-52, -this.height - 26);
    ctx.lineTo(-38, -this.height - 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(14, -this.height + 2);
    ctx.lineTo(42, -this.height - 16);
    ctx.lineTo(30, -this.height + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c3;
    ctx.beginPath();
    ctx.moveTo(38, -this.height - 14);
    ctx.lineTo(46, -this.height - 24);
    ctx.lineTo(32, -this.height - 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = c3;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 5; i++) {
      const wy = -this.height + 30 + i * 12;
      ctx.beginPath();
      ctx.moveTo(-12, wy);
      ctx.lineTo(-22, wy - 8);
      ctx.lineTo(-26, wy - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, wy);
      ctx.lineTo(20, wy - 8);
      ctx.lineTo(24, wy - 4);
      ctx.stroke();
    }

    ctx.strokeStyle = c1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, -this.height + 26);
    ctx.quadraticCurveTo(0, -this.height + 32, -2, -this.height + 38);
    ctx.stroke();
  }

  _renderBreath(ctx, cameraOffset) {
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;
    const bc = this._getCenter();
    const sx = bc.x - ox;
    const sy = bc.y - oy;
    const breathLen = 220;

    ctx.save();
    ctx.translate(sx, sy);

    const progress = 1 - this.attackFrame / this.breathDuration;
    const alpha = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;

    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = '#1a1210';

    const segments = 8;
    const segLen = breathLen / segments;
    for (let i = 0; i < segments; i++) {
      const angle = this.breathAngle;
      const dist = (i + 1) * segLen;
      const spread = 8 + i * 4;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;

      ctx.beginPath();
      ctx.ellipse(px, py, spread, spread * 0.6, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = alpha * 0.2;
    ctx.fillStyle = '#2a2018';
    for (let i = 0; i < 6; i++) {
      const angle = this.breathAngle + (Math.random() - 0.5) * 0.4;
      const dist = 30 + Math.random() * breathLen * 0.8;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(px, py, 3 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export { BossPhase, BossAction };
