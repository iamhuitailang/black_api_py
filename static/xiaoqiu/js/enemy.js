// enemy.js - 敌人球体 AI 与生成逻辑

const EnemyManager = {
  enemies: [],
  explosions: [],
  particles: [],
  spawnTimer: 0,
  largeSpawnTimer: 0,

  reset() {
    this.enemies = [];
    this.explosions = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.largeSpawnTimer = 0;
  },

  spawnEnemy(game) {
    const type = this.pickWeightedType(game.stage);
    const canvas = Game.canvas;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const margin = 40;

    switch (side) {
      case 0: x = Math.random() * canvas.width; y = -margin; break;
      case 1: x = canvas.width + margin; y = Math.random() * canvas.height; break;
      case 2: x = Math.random() * canvas.width; y = canvas.height + margin; break;
      case 3: x = -margin; y = Math.random() * canvas.height; break;
    }

    const typeData = ENEMY_TYPES[type];
    const angle = Math.random() * Math.PI * 2;
    const speedMul = game.stage.speedMul;

    const enemy = {
      type,
      x,
      y,
      vx: Math.cos(angle) * typeData.speed * speedMul,
      vy: Math.sin(angle) * typeData.speed * speedMul,
      radius: typeData.radius,
      damage: typeData.damage,
      slowFactor: 1,
      slowUntil: 0,
      exploding: false,
      explodeStartTime: 0,
    };

    this.enemies.push(enemy);
  },

  spawnLarge(game) {
    const canvas = Game.canvas;
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const margin = 60;
    switch (side) {
      case 0: x = Math.random() * canvas.width; y = -margin; break;
      case 1: x = canvas.width + margin; y = Math.random() * canvas.height; break;
      case 2: x = Math.random() * canvas.width; y = canvas.height + margin; break;
      case 3: x = -margin; y = Math.random() * canvas.height; break;
    }

    const typeData = ENEMY_TYPES.large;
    const angle = Math.random() * Math.PI * 2;
    const speedMul = game.stage.speedMul;

    this.enemies.push({
      type: 'large',
      x,
      y,
      vx: Math.cos(angle) * typeData.speed * speedMul,
      vy: Math.sin(angle) * typeData.speed * speedMul,
      radius: typeData.radius,
      damage: typeData.damage,
      slowFactor: 1,
      slowUntil: 0,
    });
  },

  pickWeightedType(stage) {
    const types = ['small', 'medium', 'tracker', 'explosive', 'freezer'];
    const weights = types.map(t => ENEMY_TYPES[t].weight);
    if (stage && stage.speedMul > 1.2) {
      weights[2] *= 1.5;
      weights[3] *= 1.5;
      weights[4] *= 1.3;
    }
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < types.length; i++) {
      r -= weights[i];
      if (r <= 0) return types[i];
    }
    return 'small';
  },

  update(game, player, now) {
    const dt = game.dt;
    const canvas = Game.canvas;
    const stage = game.stage;

    this.spawnTimer += dt;
    if (this.spawnTimer >= stage.spawnRate) {
      this.spawnTimer = 0;
      const count = stage.speedMul > 1.4 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        this.spawnEnemy(game);
      }
    }

    this.largeSpawnTimer += dt;
    if (this.largeSpawnTimer >= 5000) {
      this.largeSpawnTimer = 0;
      if (game.elapsedTime > 15000) {
        this.spawnLarge(game);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const typeData = ENEMY_TYPES[e.type];

      const speedMul = e.slowFactor * stage.speedMul;
      if (e.type === 'tracker') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const sp = typeData.speed * speedMul;
        e.vx = (dx / dist) * sp;
        e.vy = (dy / dist) * sp;
      } else if (e.type === 'explosive') {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < typeData.explosionRadius * 0.6 && !e.exploding) {
          e.exploding = true;
          e.explodeStartTime = now;
        }
        if (e.exploding) {
          e.vx *= 0.95;
          e.vy *= 0.95;
          if (now - e.explodeStartTime >= typeData.fuseTime) {
            this.createExplosion(e.x, e.y, typeData.explosionRadius, typeData.explosionDamage);
            this.enemies.splice(i, 1);
            this.spawnHitParticles(e.x, e.y, '#ff4444', 20);
            continue;
          }
        }
      }

      e.x += e.vx * (dt / 16.67);
      e.y += e.vy * (dt / 16.67);

      const margin = 100;
      if (e.x < -margin || e.x > canvas.width + margin ||
          e.y < -margin || e.y > canvas.height + margin) {
        this.enemies.splice(i, 1);
        continue;
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      if (now - ex.startTime >= ex.duration) {
        this.explosions.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (now - p.startTime >= p.duration) {
        this.particles.splice(i, 1);
      }
    }
  },

  createExplosion(x, y, radius, damage) {
    this.explosions.push({
      x, y,
      radius,
      damage,
      startTime: performance.now(),
      duration: 400,
    });
    this.spawnHitParticles(x, y, '#ff6600', 30);
  },

  spawnHitParticles(x, y, color, count) {
    const theme = Theme.get();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color,
        startTime: performance.now(),
        duration: 500 + Math.random() * 400,
      });
    }
  },

  draw(ctx, time) {
    this.enemies.forEach(e => Theme.drawEnemy(ctx, e, time));
    this.explosions.forEach(ex => Theme.drawExplosion(ctx, ex, time));
    this.particles.forEach(p => Theme.drawParticle(ctx, p, time));
  },

  checkPlayerCollision(player, now) {
    if (player.invincible && now < player.invincibleUntil) return false;
    if (player.shieldActive) return false;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = e.radius + player.radius;

      if (dist < minDist) {
        const typeData = ENEMY_TYPES[e.type];
        let damage = typeData.damage;

        if (e.type === 'freezer') {
          player.frozen = true;
          player.frozenUntil = now + CONFIG.FREEZE_DURATION;
        }

        if (e.type === 'explosive' && !e.exploding) {
          e.exploding = true;
          e.explodeStartTime = now;
        }

        this.enemies.splice(i, 1);
        this.spawnHitParticles(e.x, e.y, typeData.color, 12);
        return { damaged: true, damage, type: e.type };
      }
    }
    return false;
  },

  checkExplosionDamage(player, now) {
    if (player.invincible && now < player.invincibleUntil) return null;
    if (player.shieldActive) return null;

    for (const ex of this.explosions) {
      const dx = ex.x - player.x;
      const dy = ex.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ex.radius * 0.8) {
        return ex.damage;
      }
    }
    return null;
  },
};