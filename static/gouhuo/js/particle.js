var ParticleSystem = (function () {
  var particles = [];
  var sparks = [];
  var stars = [];

  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function initStars(width, height) {
    stars = [];
    var count = Math.floor((width * height) / 8000);
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.6,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }

  function createFlameParticle(x, y, color, intensity) {
    intensity = intensity || 1;
    var speed = (1.5 + Math.random() * 2) * intensity;
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y,
      vx: (Math.random() - 0.5) * 1.5 * intensity,
      vy: -speed,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.4,
      size: (4 + Math.random() * 6) * intensity,
      color: color,
      type: 'flame'
    });
  }

  function createFlameParticleSeeded(x, y, color, intensity, seed) {
    intensity = intensity || 1;
    var r1 = seededRandom(seed);
    var r2 = seededRandom(seed + 1);
    var r3 = seededRandom(seed + 2);
    var r4 = seededRandom(seed + 3);
    var r5 = seededRandom(seed + 4);

    var speed = (1.5 + r1 * 2) * intensity;
    particles.push({
      x: x + (r2 - 0.5) * 20,
      y: y,
      vx: (r3 - 0.5) * 1.5 * intensity,
      vy: -speed,
      life: 1,
      maxLife: 0.8 + r4 * 0.4,
      size: (4 + r5 * 6) * intensity,
      color: color,
      type: 'flame'
    });
  }

  function createEmberParticle(x, y, color) {
    sparks.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 3,
      life: 1,
      maxLife: 1 + Math.random() * 1.5,
      size: 2 + Math.random() * 2,
      color: color,
      type: 'ember'
    });
  }

  function createEmberParticleSeeded(x, y, color, seed) {
    var r1 = seededRandom(seed);
    var r2 = seededRandom(seed + 1);
    var r3 = seededRandom(seed + 2);
    var r4 = seededRandom(seed + 3);

    sparks.push({
      x: x,
      y: y,
      vx: (r1 - 0.5) * 2,
      vy: -2 - r2 * 3,
      life: 1,
      maxLife: 1 + r3 * 1.5,
      size: 2 + r4 * 2,
      color: color,
      type: 'ember'
    });
  }

  function createSmokeParticle(x, y) {
    particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 0.5,
      life: 1,
      maxLife: 2 + Math.random() * 1,
      size: 15 + Math.random() * 20,
      color: 'rgba(80, 80, 80, 0.3)',
      type: 'smoke'
    });
  }

  function createSmokeParticleSeeded(x, y, seed) {
    var r1 = seededRandom(seed);
    var r2 = seededRandom(seed + 1);
    var r3 = seededRandom(seed + 2);
    var r4 = seededRandom(seed + 3);

    particles.push({
      x: x + (r1 - 0.5) * 30,
      y: y,
      vx: (r2 - 0.5) * 0.5,
      vy: -0.5 - r3 * 0.5,
      life: 1,
      maxLife: 2 + r4 * 1,
      size: 15 + seededRandom(seed + 4) * 20,
      color: 'rgba(80, 80, 80, 0.3)',
      type: 'smoke'
    });
  }

  function createCelebrationParticles(x, y) {
    for (var i = 0; i < 30; i++) {
      var angle = (Math.PI * 2 / 30) * i;
      var speed = 3 + Math.random() * 2;
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1.5,
        size: 3 + Math.random() * 3,
        color: ['#FFD700', '#FFA500', '#FF6B6B', '#87CEEB'][Math.floor(Math.random() * 4)],
        type: 'celebration'
      });
    }
  }

  function update(dt) {
    var i;

    for (i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life -= dt / p.maxLife;
      if (p.type === 'smoke') {
        p.size += 0.5;
      }
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    for (i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.05;
      s.life -= dt / s.maxLife;
      if (s.life <= 0) {
        sparks.splice(i, 1);
      }
    }
  }

  function drawStars(ctx, time) {
    for (var i = 0; i < stars.length; i++) {
      var star = stars[i];
      var brightness = 0.3 + Math.sin(time * star.twinkleSpeed + i) * 0.3 + star.brightness * 0.4;
      ctx.fillStyle = 'rgba(255, 255, 255, ' + brightness + ')';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles(ctx) {
    var i, p;

    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      if (p.type === 'flame') {
        ctx.globalAlpha = p.life * 0.8;
        var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, 'rgba(255, 140, 50, 0.6)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.globalAlpha = p.life * 0.15;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = p.life * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function getCount() {
    return particles.length + sparks.length;
  }

  function clear() {
    particles = [];
    sparks = [];
  }

  return {
    initStars: initStars,
    createFlameParticle: createFlameParticle,
    createFlameParticleSeeded: createFlameParticleSeeded,
    createEmberParticle: createEmberParticle,
    createEmberParticleSeeded: createEmberParticleSeeded,
    createSmokeParticle: createSmokeParticle,
    createSmokeParticleSeeded: createSmokeParticleSeeded,
    createCelebrationParticles: createCelebrationParticles,
    update: update,
    drawStars: drawStars,
    drawParticles: drawParticles,
    getCount: getCount,
    clear: clear
  };
})();