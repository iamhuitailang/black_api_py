function createCharacter(type, x, y, isPlayer) {
  const data = CONFIG.CHARACTERS[type];
  const char = {
    type: type,
    name: data.name,
    color: data.color,
    x: x,
    y: y,
    bodyWidth: 50,
    bodyHeight: 100,
    vx: 0,
    vy: 0,
    hp: data.HP,
    maxHp: data.HP,
    mp: 100,
    maxMp: 100,
    attack: data.ATTACK,
    defense: data.DEFENSE,
    moveSpeed: data.SPEED,
    jumpPower: 14,
    isGrounded: true,
    isCrouching: false,
    isAttacking: false,
    isBlocking: false,
    isHurt: false,
    isDead: false,
    facing: isPlayer ? 1 : -1,
    currentAttack: null,
    attackTimer: 0,
    attackCooldown: 0,
    hurtTimer: 0,
    hitFlash: 0,
    skills: data.SKILLS,
    skillName: data.SKILLS[0].name
  };

  char.update = function(dt, opponent) {
    if (this.isDead) return;

    this.vy += 0.6;
    this.y += this.vy;

    const groundY = CONFIG.CANVAS.GROUND_Y - this.bodyHeight;
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    if (!this.isAttacking && !this.isHurt) {
      this.x += this.vx * dt * 0.06;
      this.vx *= 0.85;

      if (this.x < 0) this.x = 0;
      if (this.x > CONFIG.CANVAS.WIDTH - this.bodyWidth) {
        this.x = CONFIG.CANVAS.WIDTH - this.bodyWidth;
      }
    }

    if (opponent) {
      this.facing = opponent.x > this.x ? 1 : -1;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.currentAttack = null;
      }
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
      }
    }

    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
    }

    if (this.isGrounded && !this.isAttacking && !this.isHurt) {
      this.mp = Math.min(this.maxMp, this.mp + dt * 0.008);
    }
  };

  char.moveLeft = function() {
    if (this.isAttacking || this.isHurt || this.isDead) return;
    this.vx = -this.moveSpeed;
    this.isCrouching = false;
  };

  char.moveRight = function() {
    if (this.isAttacking || this.isHurt || this.isDead) return;
    this.vx = this.moveSpeed;
    this.isCrouching = false;
  };

  char.jump = function() {
    if (!this.isGrounded || this.isAttacking || this.isHurt || this.isDead) return;
    this.vy = -this.jumpPower * 0.7;
    this.isGrounded = false;
    this.isCrouching = false;
  };

  char.crouch = function() {
    if (this.isAttacking || this.isHurt || this.isDead || !this.isGrounded) return;
    this.isCrouching = true;
    this.vx = 0;
  };

  char.standUp = function() {
    this.isCrouching = false;
  };

  char.block = function() {
    if (this.isAttacking || this.isHurt || this.isDead || !this.isGrounded) return;
    this.isBlocking = true;
    this.vx = 0;
  };

  char.stopBlock = function() {
    this.isBlocking = false;
  };

  char.attack = function(type) {
    if (this.isAttacking || this.isHurt || this.isDead || this.attackCooldown > 0) return;

    const atk = CONFIG.ATTACKS[type];
    if (!atk) return;

    this.isAttacking = true;
    this.currentAttack = type;
    this.attackTimer = atk.duration;
    this.attackCooldown = atk.cooldown;

    this.mp = Math.min(this.maxMp, this.mp + 8);
  };

  char.useSkill = function(index) {
    if (this.isAttacking || this.isHurt || this.isDead || this.attackCooldown > 0) return;

    const skill = this.skills[index];
    if (!skill) return;
    if (this.mp < skill.mpCost) return;

    this.mp -= skill.mpCost;
    this.isAttacking = true;
    this.currentAttack = 'skill';
    this.attackTimer = 700;
    this.attackCooldown = 1200;
  };

  char.getHitbox = function() {
    const hitboxes = {
      lightPunch: { x: 40, y: 25, w: 45, h: 35 },
      heavyPunch: { x: 35, y: 20, w: 70, h: 45 },
      lightKick: { x: 45, y: 55, w: 55, h: 35 },
      heavyKick: { x: 40, y: 50, w: 85, h: 45 },
      skill: { x: 20, y: 10, w: 130, h: 120 }
    };

    if (!this.currentAttack) return null;
    const hb = hitboxes[this.currentAttack];
    if (!hb) return null;

    return {
      x: this.facing === 1 ? this.x + this.bodyWidth / 2 + hb.x : this.x + this.bodyWidth / 2 - hb.x - hb.w,
      y: this.y + hb.y,
      w: hb.w,
      h: hb.h
    };
  };

  char.getBodyBox = function() {
    const h = this.isCrouching ? this.bodyHeight * 0.7 : this.bodyHeight;
    const yOffset = this.isCrouching ? this.bodyHeight * 0.3 : 0;
    return {
      x: this.x,
      y: this.y + yOffset,
      w: this.bodyWidth,
      h: h
    };
  };

  char.takeDamage = function(damage) {
    if (this.isDead) return 0;

    let actualDamage = damage;
    if (this.isBlocking) {
      actualDamage = Math.floor(damage * 0.3);
      this.mp = Math.min(this.maxMp, this.mp + 12);
    } else {
      actualDamage = Math.max(1, damage - this.defense);
    }

    this.hp -= actualDamage;
    this.isHurt = true;
    this.hurtTimer = 200;
    this.hitFlash = 250;

    if (!this.isBlocking) {
      this.vx = (this.facing === 1 ? -1 : 1) * 6;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }

    return actualDamage;
  };

  char.getAttackDamage = function() {
    if (!this.currentAttack) return 0;

    if (this.currentAttack === 'skill') {
      return this.skills[0].damage;
    }

    const atk = CONFIG.ATTACKS[this.currentAttack];
    if (!atk) return 0;

    return atk.damage + Math.floor(this.attack * 0.5);
  };

  char.reset = function() {
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = true;
    this.isCrouching = false;
    this.isAttacking = false;
    this.isBlocking = false;
    this.isHurt = false;
    this.isDead = false;
    this.currentAttack = null;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.hurtTimer = 0;
    this.hitFlash = 0;
  };

  return char;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createCharacter };
}
