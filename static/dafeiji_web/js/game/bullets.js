class DafeijiBulletManager {
  constructor() {
    this.playerBullets = [];
    this.enemyBullets = [];
  }

  addPlayerBullet(bullet) {
    this.playerBullets.push(bullet);
  }

  addPlayerBullets(bullets) {
    bullets.forEach(function(b) {
      this.playerBullets.push(b);
    }.bind(this));
  }

  addEnemyBullet(bullet) {
    this.enemyBullets.push(bullet);
  }

  update(dt) {
    this.playerBullets = this.playerBullets.filter(function(b) {
      if (b.angle) {
        b.x += Math.sin(b.angle) * b.speed * dt;
      }
      b.y += b.direction * b.speed * dt;
      return b.y > -20 && b.y < window.innerHeight + 20 && b.x > -20 && b.x < window.innerWidth + 20;
    });

    this.enemyBullets = this.enemyBullets.filter(function(b) {
      if (b.angle) {
        b.x += Math.sin(b.angle) * b.speed * dt;
      }
      if (b.vx !== undefined) {
        b.x += b.vx * dt;
      }
      if (b.vy !== undefined) {
        b.y += b.vy * dt;
      } else {
        b.y += b.speed * dt;
      }
      return b.y > -20 && b.y < window.innerHeight + 20 && b.x > -20 && b.x < window.innerWidth + 20;
    });
  }

  drawPlayerBullets(ctx) {
    this.playerBullets.forEach(function(b) {
      ctx.save();
      switch (b.type) {
        case 'normal':
          this._drawNormalBullet(ctx, b);
          break;
        case 'missile':
          this._drawMissileBullet(ctx, b);
          break;
        case 'laser':
          this._drawLaserBullet(ctx, b);
          break;
        case 'cannon':
          this._drawCannonBullet(ctx, b);
          break;
        default:
          this._drawNormalBullet(ctx, b);
      }
      ctx.restore();
    }.bind(this));
  }

  drawEnemyBullets(ctx) {
    this.enemyBullets.forEach(function(b) {
      ctx.save();
      switch (b.type) {
        case 'standard':
          this._drawStandardEnemyBullet(ctx, b);
          break;
        case 'bomb':
          this._drawBombEnemyBullet(ctx, b);
          break;
        default:
          this._drawStandardEnemyBullet(ctx, b);
      }
      ctx.restore();
    }.bind(this));
  }

  _drawNormalBullet(ctx, b) {
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 8;

    let grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
    grad.addColorStop(0, '#00E5FF');
    grad.addColorStop(1, 'rgba(0,229,255,0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(b.x, b.y, b.width, b.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x + 0.5, b.y, b.width - 1, 3);

    let trailGrad = ctx.createLinearGradient(b.x, b.y + b.height, b.x, b.y + b.height + 10);
    trailGrad.addColorStop(0, 'rgba(0,229,255,0.5)');
    trailGrad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = trailGrad;
    ctx.fillRect(b.x, b.y + b.height, b.width, 10);
  }

  _drawMissileBullet(ctx, b) {
    ctx.shadowColor = '#FF6B35';
    ctx.shadowBlur = 10;

    let cx = b.x + b.width / 2;
    ctx.beginPath();
    ctx.moveTo(cx, b.y);
    ctx.lineTo(b.x + b.width, b.y + b.height * 0.7);
    ctx.lineTo(cx, b.y + b.height);
    ctx.lineTo(b.x, b.y + b.height * 0.7);
    ctx.closePath();

    let grad = ctx.createLinearGradient(b.x, b.y, b.x + b.width, b.y + b.height);
    grad.addColorStop(0, '#FF6B35');
    grad.addColorStop(1, '#CC4400');
    ctx.fillStyle = grad;
    ctx.fill();

    let fireGrad = ctx.createRadialGradient(cx, b.y + b.height + 4, 0, cx, b.y + b.height + 4, 6);
    fireGrad.addColorStop(0, 'rgba(255,200,50,0.9)');
    fireGrad.addColorStop(0.5, 'rgba(255,107,53,0.5)');
    fireGrad.addColorStop(1, 'rgba(255,107,53,0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(cx, b.y + b.height + 4, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawLaserBullet(ctx, b) {
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(b.x + b.width / 2, b.y);
    ctx.lineTo(b.x + b.width / 2, b.y + b.height);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(b.x + b.width / 2, b.y);
    ctx.lineTo(b.x + b.width / 2, b.y + b.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();

    let bloomGrad = ctx.createLinearGradient(b.x - 4, b.y, b.x + b.width + 4, b.y);
    bloomGrad.addColorStop(0, 'rgba(0,229,255,0)');
    bloomGrad.addColorStop(0.5, 'rgba(0,229,255,0.3)');
    bloomGrad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(b.x - 4, b.y, b.width + 8, b.height);
  }

  _drawCannonBullet(ctx, b) {
    let cx = b.x + b.width / 2;
    let cy = b.y + b.height / 2;
    let r = Math.max(1, b.width / 2);

    ctx.shadowColor = '#FF1744';
    ctx.shadowBlur = 14;

    let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#FF1744');
    grad.addColorStop(1, 'rgba(255,23,68,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,23,68,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _drawStandardEnemyBullet(ctx, b) {
    let cx = b.x + (b.width || 6) / 2;
    let cy = b.y + (b.height || 6) / 2;
    let r = Math.max(1, (b.width || 6) / 2);

    ctx.shadowColor = '#FF1744';
    ctx.shadowBlur = 6;

    let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#FF6666');
    grad.addColorStop(0.6, '#FF1744');
    grad.addColorStop(1, 'rgba(255,23,68,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawBombEnemyBullet(ctx, b) {
    let cx = b.x + b.width / 2;
    let cy = b.y + b.height / 2;
    let r = Math.max(1, b.width / 2);

    ctx.shadowColor = '#880000';
    ctx.shadowBlur = 10;

    let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#FF4444');
    grad.addColorStop(0.4, '#CC0000');
    grad.addColorStop(1, 'rgba(100,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  checkPlayerBulletHits(enemies) {
    let hits = [];
    this.playerBullets = this.playerBullets.filter(function(bullet) {
      let hit = false;
      for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];
        if (this._rectsOverlap(bullet, e)) {
          hits.push({ bullet: bullet, enemy: e });
          hit = true;
          break;
        }
      }
      return !hit;
    }.bind(this));
    return hits;
  }

  checkEnemyBulletHits(player) {
    let hits = [];
    let pBox = player.getHitBox();
    this.enemyBullets = this.enemyBullets.filter(function(bullet) {
      if (this._rectsOverlap(bullet, pBox)) {
        hits.push(bullet);
        return false;
      }
      return true;
    }.bind(this));
    return hits;
  }

  _rectsOverlap(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  clear() {
    this.playerBullets = [];
    this.enemyBullets = [];
  }
}

window.DafeijiBulletManager = DafeijiBulletManager;
