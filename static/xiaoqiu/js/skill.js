// skill.js - 技能系统模块

const SkillSystem = {
  slowFields: [],
  teleportEffect: null,
  shieldEffect: null,

  activate(player, enemies) {
    const char = CHARACTERS[player.charId];
    if (player.skillCooldown > 0) return false;
    if (player.frozen) return false;

    player.skillCooldown = char.skillCooldown;
    player.lastSkillTime = performance.now();

    switch (player.charId) {
      case 'balanced':
        this.activateSlow(player, enemies);
        break;
      case 'swift':
        this.activateTeleport(player, enemies);
        break;
      case 'guardian':
        this.activateShield(player);
        break;
    }
    return true;
  },

  activateSlow(player, enemies) {
    const field = {
      x: player.x,
      y: player.y,
      radius: 350,
      duration: 4000,
      startTime: performance.now(),
      slowFactor: 0.3,
    };
    this.slowFields.push(field);

    enemies.forEach(e => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < field.radius) {
        e.slowFactor = field.slowFactor;
        e.slowUntil = performance.now() + field.duration;
      }
    });
  },

  activateTeleport(player, enemies) {
    const canvas = Game.canvas;
    const padding = 80;
    let bestX = player.x;
    let bestY = player.y;
    let bestDist = 0;

    for (let attempt = 0; attempt < 20; attempt++) {
      const tx = padding + Math.random() * (canvas.width - padding * 2);
      const ty = padding + Math.random() * (canvas.height - padding * 2);

      let minDist = Infinity;
      enemies.forEach(e => {
        const dx = e.x - tx;
        const dy = e.y - ty;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) minDist = d;
      });

      if (minDist > bestDist) {
        bestDist = minDist;
        bestX = tx;
        bestY = ty;
      }
    }

    this.teleportEffect = {
      fromX: player.x,
      fromY: player.y,
      toX: bestX,
      toY: bestY,
      startTime: performance.now(),
      duration: 200,
    };

    player.x = bestX;
    player.y = bestY;
    player.invincible = true;
    player.invincibleUntil = performance.now() + 500;
  },

  activateShield(player) {
    player.shieldActive = true;
    player.shieldUntil = performance.now() + 3000;
  },

  update(player, enemies, now) {
    this.slowFields = this.slowFields.filter(f => {
      return now - f.startTime < f.duration;
    });

    if (this.teleportEffect && now - this.teleportEffect.startTime > this.teleportEffect.duration) {
      this.teleportEffect = null;
    }

    if (player.shieldActive && now > player.shieldUntil) {
      player.shieldActive = false;
    }

    enemies.forEach(e => {
      if (e.slowUntil && now > e.slowUntil) {
        e.slowFactor = 1;
        e.slowUntil = 0;
      }
    });
  },

  drawEffects(ctx, time) {
    this.slowFields.forEach(f => {
      Theme.drawSlowField(ctx, f, time);
    });

    if (this.teleportEffect) {
      const te = this.teleportEffect;
      const progress = (time - te.startTime) / te.duration;
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(te.fromX, te.fromY);
      ctx.lineTo(te.toX, te.toY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(te.toX, te.toY, 8 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  reset() {
    this.slowFields = [];
    this.teleportEffect = null;
    this.shieldEffect = null;
  },
};