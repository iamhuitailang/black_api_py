var TOWER_TYPES = {
  electromagnetic: {
    name: '电磁塔',
    cost: 80,
    damage: 25,
    range: 120,
    attackSpeed: 1.0,
    color: '#9c27b0',
    slowFactor: 0.5,
    slowDuration: 2,
    armorPierce: 0,
    aoe: false
  },
  laser: {
    name: '激光塔',
    cost: 120,
    damage: 45,
    range: 150,
    attackSpeed: 0.7,
    color: '#ff1744',
    slowFactor: 0,
    slowDuration: 0,
    armorPierce: 0.2,
    aoe: false
  },
  flame: {
    name: '喷火塔',
    cost: 100,
    damage: 15,
    range: 100,
    attackSpeed: 0.8,
    color: '#ff6d00',
    slowFactor: 0,
    slowDuration: 0,
    armorPierce: 0,
    aoe: true,
    burnDps: 8,
    burnDuration: 3,
    coneAngle: 45
  },
  freeze: {
    name: '冷冻塔',
    cost: 150,
    damage: 10,
    range: 110,
    attackSpeed: 0.6,
    color: '#00b0ff',
    slowFactor: 0.7,
    slowDuration: 3,
    armorPierce: 0,
    aoe: true,
    aoeRadius: 60
  }
};

var TOWER_LEVEL_MULT = [
  { damage: 1.0, range: 1.0, attackSpeed: 1.0 },
  { damage: 1.4, range: 1.1, attackSpeed: 1.15 },
  { damage: 1.9, range: 1.2, attackSpeed: 1.3 }
];

class Tower {
  constructor(type, gx, gy) {
    this.type = type;
    this.gx = gx;
    this.gy = gy;
    var cfg = TOWER_TYPES[type];
    var pos = { x: gx * CELL_SIZE + CELL_SIZE / 2, y: gy * CELL_SIZE + CELL_SIZE / 2 };
    this.x = pos.x;
    this.y = pos.y;
    this.level = 1;
    this.baseDamage = cfg.damage;
    this.baseRange = cfg.range;
    this.baseAttackSpeed = cfg.attackSpeed;
    this.color = cfg.color;
    this.cooldown = 0;
    this.target = null;
    this.attackEffect = null;
    this.attackEffectTimer = 0;
    this.acidCorrosion = 0;
    this.acidTimer = 0;
    this.totalInvested = cfg.cost;
    this.angle = 0;
  }

  getDamage() {
    return this.baseDamage * TOWER_LEVEL_MULT[this.level - 1].damage;
  }

  getRange() {
    return this.baseRange * TOWER_LEVEL_MULT[this.level - 1].range;
  }

  getAttackSpeed() {
    return this.baseAttackSpeed * TOWER_LEVEL_MULT[this.level - 1].attackSpeed;
  }

  getConfig() {
    return TOWER_TYPES[this.type];
  }

  update(dt, enemies) {
    if (this.acidTimer > 0) {
      this.acidTimer -= dt;
      if (this.acidTimer <= 0) {
        this.acidCorrosion = 0;
      }
    }

    this.cooldown -= dt;
    if (this.attackEffectTimer > 0) {
      this.attackEffectTimer -= dt;
      if (this.attackEffectTimer <= 0) {
        this.attackEffect = null;
      }
    }

    if (this.cooldown <= 0) {
      this.target = this.selectTarget(enemies);
      if (this.target) {
        this.attack(this.target, enemies);
        var speed = this.getAttackSpeed();
        if (this.acidCorrosion > 0) {
          speed *= (1 - this.acidCorrosion);
        }
        this.cooldown = 1.0 / speed;
      }
    }

    if (this.target && this.target.isDead()) {
      this.target = null;
    }

    if (this.target) {
      var dx = this.target.x - this.x;
      var dy = this.target.y - this.y;
      this.angle = Math.atan2(dy, dx);
    }
  }

  selectTarget(enemies) {
    var range = this.getRange();
    var best = null;
    var bestProgress = -1;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.isDead()) continue;
      var dx = e.x - this.x;
      var dy = e.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= range) {
        var progress = e.pathProgress || e.pathIndex;
        if (progress > bestProgress) {
          bestProgress = progress;
          best = e;
        }
      }
    }
    return best;
  }

  attack(target, enemies) {
    var cfg = this.getConfig();
    var damage = this.getDamage();

    if (cfg.aoe) {
      this.applyAoeAttack(target, enemies, cfg, damage);
    } else {
      target.takeDamage(damage, cfg.armorPierce);
      if (cfg.slowFactor > 0 && cfg.slowDuration > 0) {
        target.applySlow(cfg.slowFactor, cfg.slowDuration);
      }
    }

    this.attackEffect = {
      type: this.type,
      targetX: target.x,
      targetY: target.y,
      target: target
    };
    this.attackEffectTimer = 0.2;
  }

  applyAoeAttack(primaryTarget, enemies, cfg, damage) {
    if (this.type === 'flame') {
      var coneAngle = (cfg.coneAngle || 45) * Math.PI / 180;
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (e.isDead()) continue;
        var dx = e.x - this.x;
        var dy = e.y - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.getRange()) continue;
        var angleToEnemy = Math.atan2(dy, dx);
        var angleDiff = Math.abs(this.normalizeAngle(angleToEnemy - this.angle));
        if (angleDiff <= coneAngle / 2) {
          e.takeDamage(damage, cfg.armorPierce);
          if (cfg.burnDps && cfg.burnDuration) {
            e.applyBurn(cfg.burnDps * this.level, cfg.burnDuration);
          }
        }
      }
    } else if (this.type === 'freeze') {
      var aoeRadius = cfg.aoeRadius || 60;
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (e.isDead()) continue;
        var dist = e.distanceTo(primaryTarget.x, primaryTarget.y);
        if (dist <= aoeRadius) {
          e.takeDamage(damage, cfg.armorPierce);
          if (cfg.slowFactor > 0 && cfg.slowDuration > 0) {
            e.applySlow(cfg.slowFactor, cfg.slowDuration);
          }
        }
      }
    }
  }

  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  applyAcid(factor, duration) {
    this.acidCorrosion = Math.max(this.acidCorrosion, factor);
    this.acidTimer = Math.max(this.acidTimer, duration);
  }
}
