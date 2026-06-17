var ENEMY_TYPES = {
  normal: {
    name: '普通虫',
    hp: 70,
    speed: 55,
    armor: 0,
    reward: 12,
    glowColor: '#39ff14',
    bodyColor: '#1a3a0a'
  },
  acid: {
    name: '酸液虫',
    hp: 55,
    speed: 50,
    armor: 0,
    reward: 18,
    glowColor: '#a8ff00',
    bodyColor: '#2a3a0a',
    acidRadius: 70,
    acidFactor: 0.25,
    acidDuration: 4
  },
  shell: {
    name: '甲壳虫',
    hp: 50,
    speed: 35,
    armor: 30,
    reward: 22,
    glowColor: '#ff8c00',
    bodyColor: '#3a2a0a'
  },
  mother: {
    name: '母虫',
    hp: 150,
    speed: 30,
    armor: 5,
    reward: 45,
    glowColor: '#bf40ff',
    bodyColor: '#2a0a3a',
    spawnInterval: 6,
    spawnCount: 1,
    deathSpawnCount: 2
  }
};

class Enemy {
  constructor(type, path) {
    this.type = type;
    var cfg = ENEMY_TYPES[type];
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.baseSpeed = cfg.speed;
    this.armor = cfg.armor;
    this.reward = cfg.reward;
    this.glowColor = cfg.glowColor;
    this.bodyColor = cfg.bodyColor;
    this.path = path;
    this.pathIndex = 0;
    this.pathProgress = 0;
    var start = path[0];
    this.x = start.x * CELL_SIZE + CELL_SIZE / 2;
    this.y = start.y * CELL_SIZE + CELL_SIZE / 2;
    this.dead = false;
    this.reachedExit = false;
    this.slowFactor = 0;
    this.slowTimer = 0;
    this.burnDps = 0;
    this.burnTimer = 0;
    this.spawnTimer = 0;
    this.spawnQueue = [];
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.legPhase = Math.random() * Math.PI * 2;
  }

  getSpeed() {
    var speed = this.baseSpeed;
    if (this.slowFactor > 0 && this.slowTimer > 0) {
      speed *= (1 - this.slowFactor);
    }
    return speed;
  }

  update(dt) {
    if (this.dead) return;

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowFactor = 0;
      }
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.hp -= this.burnDps * dt;
      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
        return;
      }
    }

    if (this.type === 'mother') {
      this.spawnTimer += dt;
      if (this.spawnTimer >= ENEMY_TYPES.mother.spawnInterval) {
        this.spawnTimer = 0;
        for (var s = 0; s < ENEMY_TYPES.mother.spawnCount; s++) {
          this.spawnQueue.push('normal');
        }
      }
    }

    this.pulsePhase += dt * 3;
    this.legPhase += dt * 8;

    this.moveAlongPath(dt);
  }

  moveAlongPath(dt) {
    if (this.pathIndex >= this.path.length - 1) {
      this.reachedExit = true;
      return;
    }

    var speed = this.getSpeed();
    var moveAmount = speed * dt;

    while (moveAmount > 0 && this.pathIndex < this.path.length - 1) {
      var current = this.path[this.pathIndex];
      var next = this.path[this.pathIndex + 1];
      var cx = current.x * CELL_SIZE + CELL_SIZE / 2;
      var cy = current.y * CELL_SIZE + CELL_SIZE / 2;
      var nx = next.x * CELL_SIZE + CELL_SIZE / 2;
      var ny = next.y * CELL_SIZE + CELL_SIZE / 2;

      var dx = nx - this.x;
      var dy = ny - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        this.pathIndex++;
        this.pathProgress = this.pathIndex;
        if (this.pathIndex >= this.path.length - 1) {
          this.reachedExit = true;
          return;
        }
        continue;
      }

      if (moveAmount >= dist) {
        this.x = nx;
        this.y = ny;
        moveAmount -= dist;
        this.pathIndex++;
        this.pathProgress = this.pathIndex;
      } else {
        var ratio = moveAmount / dist;
        this.x += dx * ratio;
        this.y += dy * ratio;
        this.pathProgress = this.pathIndex + ratio;
        moveAmount = 0;
      }
    }
  }

  takeDamage(amount, armorPierce) {
    var damageReduction = 0;
    if (this.armor > 0) {
      damageReduction = this.armor / (this.armor + 100) * (1 - armorPierce);
    }
    var finalDamage = amount * (1 - damageReduction);
    this.hp -= finalDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return finalDamage;
  }

  applySlow(factor, duration) {
    if (factor > this.slowFactor) {
      this.slowFactor = factor;
    }
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  applyBurn(dps, duration) {
    this.burnDps = Math.max(this.burnDps, dps);
    this.burnTimer = Math.max(this.burnTimer, duration);
  }

  isDead() {
    return this.dead;
  }

  hasReachedExit() {
    return this.reachedExit;
  }

  distanceTo(otherX, otherY) {
    var dx = this.x - otherX;
    var dy = this.y - otherY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
