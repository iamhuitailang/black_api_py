class DafeijiRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.explosions = [];
    this.scorePopups = [];
    this.waveAnnouncement = null;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.collectionFlashes = [];
    this.engineTrailParticles = [];
    this.nebulae = [];
    this._initNebulae();
  }

  _initNebulae() {
    for (let i = 0; i < 3; i++) {
      this.nebulae.push({
        x: Math.random() * (this.canvas.width || 400),
        y: Math.random() * (this.canvas.height || 700),
        radius: 60 + Math.random() * 80,
        color: ['rgba(40,0,60,0.08)', 'rgba(0,20,60,0.06)', 'rgba(60,0,20,0.07)'][i],
        speed: 0.1 + Math.random() * 0.15
      });
    }
  }

  createExplosion(x, y, size, count) {
    let particles = [];
    let numParticles = count || (10 + size * 2);
    let colors = ['#FF6B35', '#FF1744', '#FFD600', '#ffffff', '#FF9100'];
    for (let i = 0; i < numParticles; i++) {
      let angle = (Math.PI * 2 / numParticles) * i + (Math.random() - 0.5) * 0.5;
      let speed = (1 + Math.random() * 3) * (size / 20);
      let particleSize = 1 + Math.random() * (size / 8);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: particleSize,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.01 + Math.random() * 0.03,
        deceleration: 0.96 + Math.random() * 0.03
      });
    }
    this.explosions.push({ particles: particles });
    if (size > 30) {
      this.triggerShake(Math.min(size / 10, 8), 10);
    }
  }

  addScorePopup(x, y, score) {
    this.scorePopups.push({
      x: x,
      y: y,
      score: score,
      life: 1.0,
      decay: 0.025
    });
  }

  addCollectionFlash(x, y, color) {
    this.collectionFlashes.push({
      x: x,
      y: y,
      color: color,
      radius: 5,
      maxRadius: 30,
      life: 1.0,
      decay: 0.06
    });
  }

  showWaveAnnouncement(waveNumber, waveName) {
    this.waveAnnouncement = {
      text: 'WAVE ' + waveNumber,
      subText: waveName || '',
      life: 1.0,
      phase: 0
    };
  }

  triggerShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  addEngineTrailParticle(x, y) {
    if (this.engineTrailParticles.length > 50) return;
    this.engineTrailParticles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 1 + Math.random() * 1.5,
      size: 1 + Math.random() * 2,
      life: 1.0,
      decay: 0.04 + Math.random() * 0.03
    });
  }

  update(dt) {
    this.explosions.forEach(function(exp) {
      exp.particles.forEach(function(p) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= p.deceleration;
        p.vy *= p.deceleration;
        p.life -= p.decay * dt;
      });
      exp.particles = exp.particles.filter(function(p) { return p.life > 0; });
    });
    this.explosions = this.explosions.filter(function(exp) { return exp.particles.length > 0; });

    this.scorePopups.forEach(function(popup) {
      popup.y -= 1 * dt;
      popup.life -= popup.decay * dt;
    });
    this.scorePopups = this.scorePopups.filter(function(p) { return p.life > 0; });

    if (this.waveAnnouncement) {
      this.waveAnnouncement.phase += 0.02 * dt;
      if (this.waveAnnouncement.phase < 0.2) {
        this.waveAnnouncement.life = this.waveAnnouncement.phase / 0.2;
      } else if (this.waveAnnouncement.phase > 0.8) {
        this.waveAnnouncement.life = (1 - this.waveAnnouncement.phase) / 0.2;
      } else {
        this.waveAnnouncement.life = 1.0;
      }
      if (this.waveAnnouncement.phase >= 1.0) {
        this.waveAnnouncement = null;
      }
    }

    if (this.shakeDuration > 0) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeDuration -= dt;
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    this.collectionFlashes.forEach(function(flash) {
      flash.radius += (flash.maxRadius - flash.radius) * 0.2;
      flash.life -= flash.decay * dt;
    });
    this.collectionFlashes = this.collectionFlashes.filter(function(f) { return f.life > 0; });

    this.engineTrailParticles.forEach(function(p) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      p.size *= 0.98;
    });
    this.engineTrailParticles = this.engineTrailParticles.filter(function(p) { return p.life > 0; });

    this.nebulae.forEach(function(n) {
      n.y += n.speed * dt;
      if (n.y - n.radius > (this.canvas.height || 700)) {
        n.y = -n.radius;
        n.x = Math.random() * (this.canvas.width || 400);
      }
    }.bind(this));
  }

  drawBackground(starLayers) {
    let ctx = this.ctx;
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.nebulae.forEach(function(n) {
      let grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
    });

    if (starLayers) {
      starLayers.forEach(function(layer) {
        layer.stars.forEach(function(star) {
          ctx.fillStyle = 'rgba(255,255,255,' + star.brightness + ')';
          ctx.fillRect(star.x, star.y, star.size, star.size);
        });
      });

      starLayers.forEach(function(layer) {
        if (layer.debris) {
          layer.debris.forEach(function(d) {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rotation);
            ctx.fillStyle = 'rgba(80,80,100,' + (d.opacity || 0.3) + ')';
            ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size * 0.4);
            ctx.restore();
          });
        }
      });
    }
  }

  drawExplosions() {
    let ctx = this.ctx;
    this.explosions.forEach(function(exp) {
      exp.particles.forEach(function(p) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });
  }

  drawScorePopups() {
    let ctx = this.ctx;
    this.scorePopups.forEach(function(popup) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, popup.life);
      ctx.fillStyle = '#FFD600';
      ctx.shadowColor = '#FFD600';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+' + popup.score, popup.x, popup.y);
      ctx.restore();
    });
  }

  drawWaveAnnouncement() {
    if (!this.waveAnnouncement) return;
    let ctx = this.ctx;
    let wa = this.waveAnnouncement;
    ctx.save();
    ctx.globalAlpha = Math.max(0, wa.life);

    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(wa.text, this.canvas.width / 2, this.canvas.height / 2 - 20);

    if (wa.subText) {
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FF6B35';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(wa.subText, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    ctx.restore();
  }

  drawCollectionFlashes() {
    let ctx = this.ctx;
    this.collectionFlashes.forEach(function(flash) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, flash.life * 0.5);
      let grad = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.radius);
      grad.addColorStop(0, flash.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawEngineTrail() {
    let ctx = this.ctx;
    this.engineTrailParticles.forEach(function(p) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life * 0.6);
      let grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(0.5, p.size));
      grad.addColorStop(0, 'rgba(0,229,255,0.8)');
      grad.addColorStop(0.5, 'rgba(0,229,255,0.3)');
      grad.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawHUD(player, score, wave, itemsCollected) {
    let ctx = this.ctx;
    ctx.save();

    this._drawHpBar(ctx, player);
    this._drawLives(ctx, player);
    this._drawScore(ctx, score);
    this._drawWave(ctx, wave);
    this._drawWeaponLevel(ctx, player);
    this._drawActivePowerups(ctx, player);

    ctx.restore();
  }

  _drawHpBar(ctx, player) {
    let barX = 15;
    let barY = 15;
    let barWidth = 120;
    let barHeight = 10;
    let hpRatio = player.hp / player.maxHp;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    let hpGrad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    if (hpRatio > 0.5) {
      hpGrad.addColorStop(0, '#00E676');
      hpGrad.addColorStop(1, '#76FF03');
    } else if (hpRatio > 0.25) {
      hpGrad.addColorStop(0, '#FFD600');
      hpGrad.addColorStop(1, '#FF9100');
    } else {
      hpGrad.addColorStop(0, '#FF1744');
      hpGrad.addColorStop(1, '#FF6B35');
    }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP ' + player.hp + '/' + player.maxHp, barX, barY + barHeight + 12);
  }

  _drawLives(ctx, player) {
    let startX = 15;
    let y = 42;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LIVES', startX, y);
    for (let i = 0; i < player.lives; i++) {
      let hx = startX + 40 + i * 16;
      ctx.save();
      ctx.fillStyle = '#FF1744';
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(hx, y - 3);
      ctx.bezierCurveTo(hx - 4, y - 7, hx - 8, y - 3, hx, y + 3);
      ctx.bezierCurveTo(hx + 8, y - 3, hx + 4, y - 7, hx, y - 3);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawScore(ctx, score) {
    ctx.save();
    ctx.fillStyle = '#FFD600';
    ctx.shadowColor = '#FFD600';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(score.toString().padStart(8, '0'), this.canvas.width - 15, 28);
    ctx.restore();

    ctx.fillStyle = '#888888';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SCORE', this.canvas.width - 15, 40);
  }

  _drawWave(ctx, wave) {
    ctx.save();
    ctx.fillStyle = '#00E5FF';
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 3;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WAVE ' + wave, this.canvas.width / 2, 25);
    ctx.restore();
  }

  _drawWeaponLevel(ctx, player) {
    let x = 15;
    let y = this.canvas.height - 25;
    ctx.fillStyle = '#FF6B35';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WPN LV.' + player.weaponLevel, x, y);

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < player.weaponLevel ? '#FF6B35' : 'rgba(255,107,53,0.2)';
      ctx.fillRect(x + 75 + i * 10, y - 8, 7, 7);
    }
  }

  _drawActivePowerups(ctx, player) {
    let x = this.canvas.width - 15;
    let y = this.canvas.height - 25;
    ctx.textAlign = 'right';
    ctx.font = '9px monospace';

    if (player.shieldActive) {
      let ratio = player.shieldTimer / player.shieldDuration;
      ctx.fillStyle = '#00E5FF';
      ctx.fillText('SHIELD', x, y);
      ctx.fillStyle = 'rgba(0,229,255,0.3)';
      ctx.fillRect(x - 50, y + 3, 50, 3);
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(x - 50, y + 3, 50 * ratio, 3);
      y -= 16;
    }

    if (player.speedBoostActive) {
      let ratio = player.speedBoostTimer / player.speedBoostDuration;
      ctx.fillStyle = '#FFD600';
      ctx.fillText('SPEED', x, y);
      ctx.fillStyle = 'rgba(255,214,0,0.3)';
      ctx.fillRect(x - 50, y + 3, 50, 3);
      ctx.fillStyle = '#FFD600';
      ctx.fillRect(x - 50, y + 3, 50 * ratio, 3);
      y -= 16;
    }
  }

  drawAll(player, score, wave, itemsCollected, bulletManager, enemyManager, itemManager, starLayers) {
    let ctx = this.ctx;
    ctx.save();

    if (this.shakeDuration > 0) {
      ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    }

    this.drawBackground(starLayers);
    this.drawEngineTrail();
    itemManager.draw(ctx);
    enemyManager.draw(ctx);
    player.draw(ctx);
    bulletManager.drawPlayerBullets(ctx);
    bulletManager.drawEnemyBullets(ctx);
    this.drawExplosions();
    this.drawCollectionFlashes();
    this.drawScorePopups();
    this.drawWaveAnnouncement();

    ctx.restore();

    this.drawHUD(player, score, wave, itemsCollected);
  }
}

window.DafeijiRenderer = DafeijiRenderer;
