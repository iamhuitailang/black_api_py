var Effects = (function() {
  var effectsList = [];
  var particles = [];
  var whiteLights = [];
  var fireworks = [];
  var screenShake = 0;
  var screenFlash = 0;
  var flashColor = '#fff';

  function addEffect(type, x, y, options) {
    var effect = {
      type: type,
      x: x,
      y: y,
      startTime: Date.now(),
      duration: options.duration || 500,
      data: options.data || {}
    };
    effectsList.push(effect);

    if (type === 'whiteLights') {
      createWhiteLights(x, y, options);
    } else if (type === 'fireworks') {
      createFireworks(x, y, options);
    } else if (type === 'barBend') {
      createBarBendEffect(x, y, options);
    } else if (type === 'shake') {
      screenShake = options.amount || 10;
    } else if (type === 'flash') {
      screenFlash = 1.0;
      flashColor = options.color || '#fff';
    } else if (type === 'particles') {
      createParticles(x, y, options);
    }
  }

  function createWhiteLights(x, y, options) {
    whiteLights = [];
    var count = options.count || 3;
    for (var i = 0; i < count; i++) {
      whiteLights.push({
        x: x + (i - (count - 1) / 2) * 40,
        y: y - 60,
        radius: 0,
        maxRadius: 15,
        alpha: 0,
        phase: 'growing',
        delay: i * 150
      });
    }
  }

  function createFireworks(x, y, options) {
    var count = options.count || 50;
    var colors = ['#ff4757', '#ffa502', '#ffdd59', '#7bed9f', '#70a1ff', '#ff6b81'];
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      var speed = 2 + Math.random() * 4;
      fireworks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.01,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function createBarBendEffect(x, y, options) {
    particles.push({
      x: x,
      y: y,
      type: 'sag',
      amplitude: options.amplitude || 5,
      frequency: options.frequency || 10,
      life: 1.0,
      decay: 0.02
    });
  }

  function createParticles(x, y, options) {
    var count = options.count || 20;
    var color = options.color || '#f5a623';
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 3;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 2,
        color: color,
        gravity: 0.1
      });
    }
  }

  function update(dt) {
    var now = Date.now();

    effectsList = effectsList.filter(function(e) {
      return now - e.startTime < e.duration;
    });

    whiteLights = whiteLights.filter(function(light) {
      if (now - light.delay < 0) return true;

      if (light.phase === 'growing') {
        light.radius += dt * 60;
        light.alpha = Math.min(1, light.radius / light.maxRadius);
        if (light.radius >= light.maxRadius) {
          light.phase = 'fading';
        }
      } else if (light.phase === 'fading') {
        light.alpha -= dt * 1.5;
        if (light.alpha <= 0) return false;
      }
      return true;
    });

    fireworks = fireworks.filter(function(f) {
      f.x += f.vx;
      f.y += f.vy;
      f.vy += 0.05;
      f.life -= f.decay;
      return f.life > 0;
    });

    particles = particles.filter(function(p) {
      if (p.type === 'sag') {
        p.life -= p.decay;
        return p.life > 0;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.life -= p.decay;
      return p.life > 0;
    });

    if (screenShake > 0) {
      screenShake = Math.max(0, screenShake - dt * 30);
    }
    if (screenFlash > 0) {
      screenFlash -= dt * 2;
      if (screenFlash < 0) screenFlash = 0;
    }
  }

  function render(ctx, offsetX, offsetY) {
    for (var i = 0; i < whiteLights.length; i++) {
      var light = whiteLights[i];
      if (light.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = light.alpha;
        ctx.beginPath();
        ctx.arc(light.x + offsetX, light.y + offsetY, light.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.restore();
      }
    }

    for (var j = 0; j < fireworks.length; j++) {
      var f = fireworks[j];
      ctx.save();
      ctx.globalAlpha = f.life;
      ctx.beginPath();
      ctx.arc(f.x + offsetX, f.y + offsetY, f.size * f.life, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    for (var k = 0; k < particles.length; k++) {
      var p = particles[k];
      if (p.type !== 'sag') {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x + offsetX, p.y + offsetY, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function triggerSuccess(x, y) {
    addEffect('whiteLights', x, y, { count: 3, duration: 1500 });
    addEffect('flash', x, y, { color: 'rgba(255,255,255,0.3)', duration: 300 });
  }

  function triggerRecord(x, y) {
    addEffect('fireworks', x, y - 100, { count: 80, duration: 3000 });
    addEffect('fireworks', x - 100, y - 80, { count: 60, duration: 3000 });
    addEffect('fireworks', x + 100, y - 80, { count: 60, duration: 3000 });
  }

  function triggerFail(x, y) {
    addEffect('shake', x, y, { amount: 15, duration: 500 });
    addEffect('flash', x, y, { color: 'rgba(255,0,0,0.3)', duration: 300 });
    addEffect('particles', x, y, { count: 15, color: '#e94560', duration: 800 });
  }

  function triggerBarBend(x, y, amplitude) {
    addEffect('barBend', x, y, { amplitude: amplitude, duration: 500 });
  }

  function getScreenShake() {
    return screenShake;
  }

  function getScreenFlash() {
    return { alpha: screenFlash, color: flashColor };
  }

  function getSagEffect() {
    for (var i = 0; i < particles.length; i++) {
      if (particles[i].type === 'sag') {
        return particles[i];
      }
    }
    return null;
  }

  function clear() {
    effectsList = [];
    particles = [];
    whiteLights = [];
    fireworks = [];
    screenShake = 0;
    screenFlash = 0;
  }

  return {
    addEffect: addEffect,
    update: update,
    render: render,
    triggerSuccess: triggerSuccess,
    triggerRecord: triggerRecord,
    triggerFail: triggerFail,
    triggerBarBend: triggerBarBend,
    getScreenShake: getScreenShake,
    getScreenFlash: getScreenFlash,
    getSagEffect: getSagEffect,
    clear: clear
  };
})();
