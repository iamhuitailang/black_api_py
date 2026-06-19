export const ParticleType = {
  INK_SPLASH: 'INK_SPLASH',
  SWORD_TRAIL: 'SWORD_TRAIL',
  DASH_AFTERIMAGE: 'DASH_AFTERIMAGE',
  STUN_STARS: 'STUN_STARS',
  COLLECT_GLOW: 'COLLECT_GLOW',
  BOSS_AOE: 'BOSS_AOE',
  ENEMY_DEATH: 'ENEMY_DEATH',
  ROCK_IMPACT: 'ROCK_IMPACT',
  ELITE_BLOCK: 'ELITE_BLOCK',
};

const INK_COLORS = ['#1a1a1a', '#2a2018', '#1c1810', '#302820'];

class Particle {
  constructor(type, x, y, config = {}) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = config.vx ?? 0;
    this.vy = config.vy ?? 0;
    this.life = config.life ?? 1;
    this.maxLife = this.life;
    this.size = config.size ?? 4;
    this.alpha = config.alpha ?? 1;
    this.color = config.color ?? '#1a1a1a';
    this.rotation = config.rotation ?? 0;
    this.rotationSpeed = config.rotationSpeed ?? 0;
    this.gravity = config.gravity ?? 0;
    this.friction = config.friction ?? 1;
    this.width = config.width ?? this.size;
    this.trail = config.trail ?? [];
  }
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(type, x, y, config = {}) {
    const emitters = {
      [ParticleType.INK_SPLASH]: () => this._emitInkSplash(x, y, config),
      [ParticleType.SWORD_TRAIL]: () => this._emitSwordTrail(x, y, config),
      [ParticleType.DASH_AFTERIMAGE]: () => this._emitDashAfterimage(x, y, config),
      [ParticleType.STUN_STARS]: () => this._emitStunStars(x, y, config),
      [ParticleType.COLLECT_GLOW]: () => this._emitCollectGlow(x, y, config),
      [ParticleType.BOSS_AOE]: () => this._emitBossAoe(x, y, config),
      [ParticleType.ENEMY_DEATH]: () => this._emitInkSplash(x, y, { ...config, count: (config.count || 12) + 8 }),
      [ParticleType.ROCK_IMPACT]: () => this._emitInkSplash(x, y, { ...config, count: (config.count || 10) + 6 }),
      [ParticleType.ELITE_BLOCK]: () => this._emitInkSplash(x, y, { ...config, count: 6, size: 3 }),
    };

    const emitter = emitters[type];
    if (emitter) emitter();
  }

  _emitInkSplash(x, y, config) {
    const count = config.count ?? 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(1, 5);
      this.particles.push(new Particle(ParticleType.INK_SPLASH, x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randRange(0.3, 0.8),
        size: randRange(2, 6),
        alpha: randRange(0.6, 1),
        color: randPick(INK_COLORS),
        gravity: 0.15,
        friction: 0.96,
      }));
    }
  }

  _emitSwordTrail(x, y, config) {
    const count = config.count ?? 3;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(ParticleType.SWORD_TRAIL, x + randRange(-3, 3), y + randRange(-3, 3), {
        vx: randRange(-0.5, 0.5),
        vy: randRange(-0.5, 0.5),
        life: randRange(0.15, 0.35),
        size: randRange(3, 8),
        alpha: 0.8,
        color: randPick(INK_COLORS),
        width: config.width ?? randRange(4, 10),
        trail: [{ x, y }],
      }));
    }
  }

  _emitDashAfterimage(x, y, config) {
    this.particles.push(new Particle(ParticleType.DASH_AFTERIMAGE, x, y, {
      life: randRange(0.3, 0.5),
      size: config.size ?? 32,
      alpha: 0.6,
      color: '#ffffff',
      width: config.width ?? 24,
    }));
  }

  _emitStunStars(x, y, config) {
    const starCount = config.count ?? 4;
    for (let i = 0; i < starCount; i++) {
      const angle = (Math.PI * 2 / starCount) * i;
      this.particles.push(new Particle(ParticleType.STUN_STARS, x, y, {
        life: randRange(1, 2),
        size: randRange(4, 6),
        alpha: 1,
        color: '#f0e060',
        rotation: angle,
        rotationSpeed: 3,
        orbitRadius: config.orbitRadius ?? 14,
        orbitCenterX: x,
        orbitCenterY: y,
      }));
    }
  }

  _emitCollectGlow(x, y, config) {
    this.particles.push(new Particle(ParticleType.COLLECT_GLOW, x, y, {
      life: randRange(0.5, 0.8),
      size: 4,
      alpha: 0.9,
      color: '#c8a848',
      expandRate: config.expandRate ?? 40,
    }));
  }

  _emitBossAoe(x, y, config) {
    this.particles.push(new Particle(ParticleType.BOSS_AOE, x, y, {
      life: randRange(0.6, 1.0),
      size: 10,
      alpha: 0.8,
      color: '#1a1a1a',
      expandRate: config.expandRate ?? 120,
    }));
    const splatCount = config.splatCount ?? 8;
    for (let i = 0; i < splatCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(2, 6);
      this.particles.push(new Particle(ParticleType.INK_SPLASH, x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randRange(0.4, 0.8),
        size: randRange(3, 7),
        alpha: randRange(0.5, 0.9),
        color: randPick(INK_COLORS),
        gravity: 0.1,
        friction: 0.95,
      }));
    }
  }

  update(dt) {
    const step = dt ?? (1 / 60);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= step;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      const lifeRatio = p.life / p.maxLife;

      if (p.type === ParticleType.SWORD_TRAIL) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 8) p.trail.shift();
      }

      if (p.type === ParticleType.STUN_STARS) {
        p.rotation += p.rotationSpeed * step;
        p.x = p.orbitCenterX + Math.cos(p.rotation) * p.orbitRadius;
        p.y = p.orbitCenterY + Math.sin(p.rotation) * p.orbitRadius;
      } else {
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
      }

      p.alpha = lifeRatio;

      if (p.type === ParticleType.COLLECT_GLOW || p.type === ParticleType.BOSS_AOE) {
        p.size += p.expandRate * step;
      }
    }
  }

  render(ctx, cameraOffset) {
    const ox = cameraOffset?.x ?? 0;
    const oy = cameraOffset?.y ?? 0;

    for (const p of this.particles) {
      const sx = p.x - ox;
      const sy = p.y - oy;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      switch (p.type) {
        case ParticleType.INK_SPLASH:
          this._renderInkSplash(ctx, sx, sy, p);
          break;
        case ParticleType.SWORD_TRAIL:
          this._renderSwordTrail(ctx, sx, sy, p);
          break;
        case ParticleType.DASH_AFTERIMAGE:
          this._renderDashAfterimage(ctx, sx, sy, p);
          break;
        case ParticleType.STUN_STARS:
          this._renderStunStars(ctx, sx, sy, p);
          break;
        case ParticleType.COLLECT_GLOW:
          this._renderCollectGlow(ctx, sx, sy, p);
          break;
        case ParticleType.BOSS_AOE:
          this._renderBossAoe(ctx, sx, sy, p);
          break;
      }

      ctx.restore();
    }
  }

  _renderInkSplash(ctx, sx, sy, p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0, p.alpha * 0.3);
    ctx.beginPath();
    ctx.arc(sx, sy, p.size * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  _renderSwordTrail(ctx, sx, sy, p) {
    if (p.trail.length < 2) return;
    const lifeRatio = p.life / p.maxLife;
    ctx.strokeStyle = p.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < p.trail.length; i++) {
      const segRatio = i / p.trail.length;
      ctx.lineWidth = p.width * lifeRatio * segRatio;
      ctx.globalAlpha = Math.max(0, p.alpha * segRatio);
      ctx.beginPath();
      ctx.moveTo(p.trail[i - 1].x - (p.trail[0].x - sx), p.trail[i - 1].y - (p.trail[0].y - sy));
      ctx.lineTo(p.trail[i].x - (p.trail[0].x - sx), p.trail[i].y - (p.trail[0].y - sy));
      ctx.stroke();
    }
  }

  _renderDashAfterimage(ctx, sx, sy, p) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.alpha * 0.4);
    ctx.beginPath();
    ctx.ellipse(sx, sy, p.size * 0.5, p.width * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _renderStunStars(ctx, sx, sy, p) {
    ctx.fillStyle = p.color;
    ctx.translate(sx, sy);
    ctx.rotate(p.rotation);
    this._drawStar(ctx, 0, 0, 5, p.size, p.size * 0.5);
    ctx.fill();
  }

  _renderCollectGlow(ctx, sx, sy, p) {
    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size);
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, 'rgba(200,168,72,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  _renderBossAoe(ctx, sx, sy, p) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 4 * (p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = Math.max(0, p.alpha * 0.15);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(rot) * r;
      const y = cy + Math.sin(rot) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      rot += step;
    }
    ctx.closePath();
  }

  clear() {
    this.particles.length = 0;
  }
}
