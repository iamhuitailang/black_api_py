class CombatSystem {
  constructor() {
    this.killRewards = [];
    this.spawnQueue = [];
  }

  processTowers(towers, enemies, dt) {
    for (var i = 0; i < towers.length; i++) {
      towers[i].update(dt, enemies);
    }
  }

  applyAoeDamage(tower, primaryTarget, enemies, cfg) {
    var damage = tower.getDamage();

    if (tower.type === 'flame') {
      var coneAngle = (cfg.coneAngle || 45) * Math.PI / 180;
      var towerAngle = tower.angle;
      for (var i = 0; i < enemies.length; i++) {
        var e = enemies[i];
        if (e.isDead()) continue;
        var dx = e.x - tower.x;
        var dy = e.y - tower.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > tower.getRange()) continue;
        var angleToEnemy = Math.atan2(dy, dx);
        var angleDiff = Math.abs(this.normalizeAngle(angleToEnemy - towerAngle));
        if (angleDiff <= coneAngle / 2) {
          e.takeDamage(damage, cfg.armorPierce);
          if (cfg.burnDps && cfg.burnDuration) {
            e.applyBurn(cfg.burnDps * tower.level, cfg.burnDuration);
          }
        }
      }
    } else if (tower.type === 'freeze') {
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

  processEnemyDeaths(enemies, towers) {
    this.killRewards = [];
    this.spawnQueue = [];
    var toRemove = [];

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.isDead() && !e.processed) {
        e.processed = true;
        this.killRewards.push(e.reward);

        if (e.type === 'acid') {
          var acidCfg = ENEMY_TYPES.acid;
          for (var j = 0; j < towers.length; j++) {
            var t = towers[j];
            var dist = Math.sqrt((t.x - e.x) * (t.x - e.x) + (t.y - e.y) * (t.y - e.y));
            if (dist <= acidCfg.acidRadius) {
              t.applyAcid(acidCfg.acidFactor, acidCfg.acidDuration);
            }
          }
        }

        if (e.type === 'mother') {
          var motherCfg = ENEMY_TYPES.mother;
          for (var s = 0; s < motherCfg.deathSpawnCount; s++) {
            this.spawnQueue.push({
              type: 'normal',
              x: e.x,
              y: e.y,
              path: e.path,
              pathIndex: Math.max(0, e.pathIndex - 1)
            });
          }
        }

        toRemove.push(i);
      }

      while (e.spawnQueue.length > 0) {
        var spawnType = e.spawnQueue.shift();
        this.spawnQueue.push({
          type: spawnType,
          x: e.x,
          y: e.y,
          path: e.path,
          pathIndex: Math.max(0, e.pathIndex)
        });
      }
    }

    return toRemove;
  }

  getTotalKillRewards() {
    var total = 0;
    for (var i = 0; i < this.killRewards.length; i++) {
      total += this.killRewards[i];
    }
    return total;
  }

  getSpawnQueue() {
    return this.spawnQueue;
  }
}
