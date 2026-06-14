const Effects = {
  particles: [],
  gridRipples: [],

  addParticle(x, y, color, type = 'spark') {
    for (let i = 0; i < (type === 'explosion' ? 12 : 5); i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (type === 'explosion' ? 6 : 3),
        vy: (Math.random() - 0.5) * (type === 'explosion' ? 6 : 3),
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        color,
        size: type === 'explosion' ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
        type
      });
    }
  },

  addIceParticle(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.3 + Math.random() * 0.5,
      life: 1,
      decay: 0.015,
      color: '#93c5fd',
      size: 2 + Math.random() * 2,
      type: 'ice',
      rotation: Math.random() * Math.PI * 2
    });
  },

  addSpeedTrail(x, y, direction) {
    this.particles.push({
      x: x - direction.x * 8,
      y: y - direction.y * 8,
      vx: -direction.x * 0.5,
      vy: -direction.y * 0.5,
      life: 0.8,
      decay: 0.08,
      color: '#fbbf24',
      size: 3,
      type: 'trail'
    });
  },

  addGridRipple(x, y) {
    this.gridRipples.push({
      x,
      y,
      radius: 5,
      maxRadius: 60,
      life: 1,
      decay: 0.025
    });
  },

  update() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.type === 'ice') {
        p.rotation += 0.05;
      }
      return p.life > 0;
    });

    this.gridRipples = this.gridRipples.filter(r => {
      r.radius += 1.5;
      r.life -= r.decay;
      return r.life > 0 && r.radius < r.maxRadius;
    });
  },

  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;

      if (p.type === 'ice') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, p.size * 2);
        }
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.type === 'trail') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  },

  drawGridRipples(ctx) {
    this.gridRipples.forEach(r => {
      ctx.save();
      ctx.strokeStyle = `rgba(100, 150, 200, ${r.life * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  },

  drawGrid(ctx, time) {
    ctx.strokeStyle = 'rgba(50, 70, 100, 0.3)';
    ctx.lineWidth = 1;

    const gridSize = GameConfig.GRID_SIZE;
    const offset = (time * 0.01) % gridSize;

    for (let x = -offset; x <= GameConfig.CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GameConfig.CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = -offset; y <= GameConfig.CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GameConfig.CANVAS_WIDTH, y);
      ctx.stroke();
    }

    this.drawGridRipples(ctx);
  },

  clear() {
    this.particles = [];
    this.gridRipples = [];
  }
};
