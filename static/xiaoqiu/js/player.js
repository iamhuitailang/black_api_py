// player.js - 玩家球体控制与属性

class Player {
  constructor(charId) {
    this.charId = charId;
    this.reset();
  }

  reset() {
    const char = CHARACTERS[this.charId];
    this.x = CONFIG.CANVAS.WIDTH / 2;
    this.y = CONFIG.CANVAS.HEIGHT / 2;
    this.radius = CONFIG.PLAYER_RADIUS;
    this.hp = char.maxHp;
    this.maxHp = char.maxHp;
    this.baseSpeed = char.speed;
    this.speed = char.speed;
    this.damagePerHit = char.damagePerHit;

    this.vx = 0;
    this.vy = 0;

    this.invincible = false;
    this.invincibleUntil = 0;
    this.shieldActive = false;
    this.shieldUntil = 0;

    this.skillCooldown = 0;
    this.lastSkillTime = 0;

    this.dashing = false;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.lastDashTime = 0;

    this.frozen = false;
    this.frozenUntil = 0;

    this.hpRegenTimer = 0;

    this.trail = [];
  }

  takeDamage(amount, now) {
    if (this.shieldActive) return 0;
    if (this.invincible && now < this.invincibleUntil) return 0;

    this.hp -= amount;
    this.invincible = true;
    this.invincibleUntil = now + CONFIG.INVINCIBLE_ON_HIT;

    if (this.hp <= 0) {
      this.hp = 0;
    }
    return amount;
  }

  update(input, game, now) {
    const char = CHARACTERS[this.charId];

    if (this.frozen && now > this.frozenUntil) {
      this.frozen = false;
    }

    if (this.dashing && now - this.dashTime > CONFIG.DASH_DURATION) {
      this.dashing = false;
      this.speed = this.baseSpeed;
    }

    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - game.dt);
    }

    if (this.skillCooldown > 0) {
      this.skillCooldown = Math.max(0, this.skillCooldown - game.dt);
    }

    this.hpRegenTimer += game.dt;
    if (this.hpRegenTimer >= CONFIG.HP_REGEN_INTERVAL && this.hp < this.maxHp && !this.frozen) {
      this.hpRegenTimer = 0;
      this.hp = Math.min(this.maxHp, this.hp + CONFIG.HP_REGEN_AMOUNT);
    }

    let moveX = 0;
    let moveY = 0;

    if (!this.frozen) {
      if (input.up) moveY -= 1;
      if (input.down) moveY += 1;
      if (input.left) moveX -= 1;
      if (input.right) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;
      }
    }

    const currentSpeed = this.dashing ? CONFIG.DASH_SPEED : this.baseSpeed;
    this.vx = moveX * currentSpeed;
    this.vy = moveY * currentSpeed;

    this.x += this.vx * (game.dt / 16.67);
    this.y += this.vy * (game.dt / 16.67);

    const margin = this.radius + 5;
    this.x = Math.max(margin, Math.min(Game.canvas.width - margin, this.x));
    this.y = Math.max(margin, Math.min(Game.canvas.height - margin, this.y));

    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.pop();
  }

  tryDash(now) {
    if (this.dashing) return false;
    if (this.dashCooldown > 0) return false;
    if (this.frozen) return false;

    this.dashing = true;
    this.dashTime = now;
    this.dashCooldown = CONFIG.DASH_COOLDOWN;
    this.lastDashTime = now;
    this.speed = CONFIG.DASH_SPEED;

    for (let i = 0; i < 8; i++) {
      EnemyManager.spawnHitParticles(this.x, this.y, CHARACTERS[this.charId].color, 3);
    }
    return true;
  }

  trySkill(enemies, now) {
    return SkillSystem.activate(this, enemies);
  }

  draw(ctx, time) {
    const theme = Theme.get();
    const char = CHARACTERS[this.charId];

    if (this.trail.length > 1) {
      ctx.save();
      for (let i = 1; i < this.trail.length; i++) {
        const t = this.trail[i];
        const alpha = (1 - i / this.trail.length) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = char.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.radius * (1 - i / this.trail.length * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    Theme.drawPlayer(ctx, this, time);
  }
}