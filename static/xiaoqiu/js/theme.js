// theme.js - 主题渲染模块

const Theme = {
  current: null,

  set(id) {
    this.current = THEMES[id] || THEMES.hell;
    GameState.data.lastTheme = this.current.id;
    GameState.save();
  },

  get() {
    return this.current;
  },

  drawBackground(ctx, w, h, time) {
    const t = this.current;

    ctx.fillStyle = t.bgColor;
    ctx.fillRect(0, 0, w, h);

    const grd = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) / 1.2);
    if (t.id === 'hell') {
      grd.addColorStop(0, '#4a0a0a');
      grd.addColorStop(0.4, '#2a0505');
      grd.addColorStop(1, '#0a0202');
    } else if (t.id === 'space') {
      grd.addColorStop(0, '#1a2a5a');
      grd.addColorStop(0.4, '#0a1530');
      grd.addColorStop(1, '#020510');
    } else {
      grd.addColorStop(0, '#f5f5f5');
      grd.addColorStop(0.5, '#e8e8e8');
      grd.addColorStop(1, '#d0d0d0');
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = t.gridColor;
    ctx.lineWidth = 1;
    const gs = 60;
    for (let x = 0; x < w; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (t.id === 'hell') {
      this.drawLavaCracks(ctx, w, h, time);
    } else if (t.id === 'space') {
      this.drawStars(ctx, w, h, time);
    } else {
      this.drawSoftGlow(ctx, w, h, time);
    }
  },

  drawLavaCracks(ctx, w, h, time) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 10;
    const t = time / 1000;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const baseY = (i * 133 + Math.sin(t + i) * 20) % h;
      ctx.moveTo(0, baseY);
      for (let x = 0; x < w; x += 40) {
        const y = baseY + Math.sin(x * 0.015 + t + i) * 18 + Math.sin(x * 0.04 + t * 2) * 8;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  },

  _starsCache: null,
  drawStars(ctx, w, h, time) {
    if (!this._starsCache || this._starsCache.w !== w || this._starsCache.h !== h) {
      const stars = [];
      for (let i = 0; i < 120; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.3,
          tw: Math.random() * Math.PI * 2,
          sp: Math.random() * 2 + 0.5,
        });
      }
      this._starsCache = { stars, w, h };
    }
    const t = time / 1000;
    ctx.save();
    this._starsCache.stars.forEach(s => {
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * s.sp + s.tw));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  },

  drawSoftGlow(ctx, w, h, time) {
    ctx.save();
    const t = time / 1000;
    for (let i = 0; i < 4; i++) {
      const cx = w / 2 + Math.cos(t * 0.3 + i * 1.5) * 200;
      const cy = h / 2 + Math.sin(t * 0.4 + i * 2) * 150;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
      grd.addColorStop(0, 'rgba(200, 200, 220, 0.15)');
      grd.addColorStop(1, 'rgba(200, 200, 220, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  },

  drawPlayer(ctx, p, time) {
    const t = this.current;
    const char = CHARACTERS[p.charId];

    if (p.shieldActive) {
      ctx.save();
      ctx.strokeStyle = char.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = char.color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time / 100);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (p.frozen) {
      ctx.save();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time / 800;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * (p.radius + 6), p.y + Math.sin(a) * (p.radius + 6), 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = char.glowColor;
    ctx.shadowBlur = 25;
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.3, char.color);
    grd.addColorStop(1, this.darkenColor(char.color, 0.4));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = t.textColor;
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(char.icon, p.x, p.y);
    ctx.restore();

    if (p.invincible && !p.shieldActive) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time / 50);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },

  drawEnemy(ctx, e, time) {
    const t = this.current;
    const type = ENEMY_TYPES[e.type];

    if (e.exploding) {
      const progress = (time - e.explodeStartTime) / type.fuseTime;
      const flash = Math.sin(progress * Math.PI * 8) * 0.5 + 0.5;
      ctx.save();
      ctx.globalAlpha = 0.6 + flash * 0.4;
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 20 + flash * 15;
      ctx.fillStyle = '#ff2222';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = type.glowColor;
    ctx.shadowBlur = 15;
    const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.4, type.color);
    grd.addColorStop(1, this.darkenColor(type.color, 0.4));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();

    if (e.type === 'tracker') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.type === 'freezer') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const a = (time / 400 + i * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(a) * e.radius, e.y + Math.sin(a) * e.radius);
        ctx.stroke();
      }
    }
    ctx.restore();
  },

  drawExplosion(ctx, ex, time) {
    const t = this.current;
    const progress = (time - ex.startTime) / ex.duration;
    if (progress >= 1) return;

    const radius = ex.radius * (0.3 + progress * 0.7);
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;

    const grd = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, radius);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.3, t.explosionColor);
    grd.addColorStop(0.7, this.darkenColor(t.explosionColor, 0.5));
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = t.explosionColor;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  drawParticle(ctx, p, time) {
    const life = (time - p.startTime) / p.duration;
    if (life >= 1) return;
    const alpha = 1 - life;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x + p.vx * life * p.duration / 16, p.y + p.vy * life * p.duration / 16, p.radius * (1 - life * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  drawSlowField(ctx, field, time) {
    const t = this.current;
    const progress = (time - field.startTime) / field.duration;
    if (progress >= 1) return;
    const alpha = (progress < 0.1 ? progress / 0.1 : progress > 0.9 ? (1 - progress) / 0.1 : 1) * 0.3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#9c27b0';
    ctx.beginPath();
    ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e91e63';
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * 2;
    ctx.beginPath();
    ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },

  darkenColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.floor(r * (1 - factor));
    const ng = Math.floor(g * (1 - factor));
    const nb = Math.floor(b * (1 - factor));
    return `rgb(${nr},${ng},${nb})`;
  },
};