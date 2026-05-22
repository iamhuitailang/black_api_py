var Effects = (function() {
  var clouds = [];
  var sparkles = [];
  var particles = [];
  var fogAlpha = 0;
  var fogTargetAlpha = 0;
  var fogActive = false;
  var lastCloudTime = 0;

  function init(canvasW, canvasH) {
    clouds = [];
    sparkles = [];
    particles = [];
    fogAlpha = 0;
    fogTargetAlpha = 0;
    fogActive = false;
    lastCloudTime = 0;

    for (var i = 0; i < 4; i++) {
      spawnCloud(canvasW, canvasH, true);
    }
    for (var j = 0; j < 12; j++) {
      spawnSparkle(canvasW, canvasH);
    }
  }

  function spawnCloud(canvasW, canvasH, randomY) {
    clouds.push({
      x: Math.random() * canvasW,
      y: randomY ? Math.random() * canvasH * 0.4 + 40 : -60,
      size: 40 + Math.random() * 50,
      speed: 0.2 + Math.random() * 0.4,
      alpha: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2
    });
  }

  function spawnSparkle(canvasW, canvasH) {
    sparkles.push({
      x: Math.random() * canvasW,
      y: Math.random() * canvasH,
      size: 2 + Math.random() * 4,
      alpha: 0.3 + Math.random() * 0.5,
      speed: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? '#fff' : '#f8bbd0'
    });
  }

  function spawnParticles(x, y, color, count) {
    count = count || 10;
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      var speed = 2 + Math.random() * 4;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 5,
        alpha: 1,
        color: color,
        life: 1,
        gravity: 0.15
      });
    }
  }

  function update(dt, now, canvasW, canvasH) {
    for (var i = clouds.length - 1; i >= 0; i--) {
      var c = clouds[i];
      c.x += c.speed * dt * 0.06;
      c.phase += 0.002 * dt;
      c.y += Math.sin(c.phase) * 0.3;
      if (c.x - c.size > canvasW) {
        c.x = -c.size;
      }
    }

    if (now - lastCloudTime > GameConfig.ANIM.cloudSpawnInterval) {
      lastCloudTime = now;
      if (clouds.length < 8) {
        spawnCloud(canvasW, canvasH, false);
      }
    }

    for (var j = sparkles.length - 1; j >= 0; j--) {
      var s = sparkles[j];
      s.phase += GameConfig.ANIM.sparkleSpeed * dt * 0.06;
      s.alpha = 0.2 + Math.abs(Math.sin(s.phase)) * 0.5;
    }

    for (var k = particles.length - 1; k >= 0; k--) {
      var p = particles[k];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= 0.02;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0 || p.y > canvasH + 50) {
        particles.splice(k, 1);
      }
    }

    if (fogAlpha !== fogTargetAlpha) {
      if (fogAlpha < fogTargetAlpha) {
        fogAlpha = Math.min(fogTargetAlpha, fogAlpha + 0.008 * dt);
      } else {
        fogAlpha = Math.max(fogTargetAlpha, fogAlpha - 0.008 * dt);
      }
    }
  }

  function drawClouds(ctx) {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = GameConfig.COLORS.cloudColor;

      var s = c.size;
      ctx.beginPath();
      ctx.arc(c.x - s * 0.3, c.y, s * 0.35, 0, Math.PI * 2);
      ctx.arc(c.x, c.y - s * 0.15, s * 0.4, 0, Math.PI * 2);
      ctx.arc(c.x + s * 0.3, c.y, s * 0.35, 0, Math.PI * 2);
      ctx.arc(c.x + s * 0.15, c.y + s * 0.2, s * 0.3, 0, Math.PI * 2);
      ctx.arc(c.x - s * 0.15, c.y + s * 0.15, s * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = c.alpha * 0.5;
      ctx.fillStyle = GameConfig.COLORS.cloudHighlight;
      ctx.beginPath();
      ctx.arc(c.x - s * 0.2, c.y - s * 0.1, s * 0.15, 0, Math.PI * 2);
      ctx.arc(c.x + s * 0.1, c.y - s * 0.2, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  function drawSparkles(ctx) {
    for (var i = 0; i < sparkles.length; i++) {
      var s = sparkles[i];
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      drawStar(ctx, s.x, s.y, s.size, s.size * 0.4, 4);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawStar(ctx, cx, cy, outerR, innerR, points) {
    var step = Math.PI / points;
    ctx.beginPath();
    for (var i = 0; i < points * 2; i++) {
      var r = i % 2 === 0 ? outerR : innerR;
      var angle = i * step - Math.PI / 2;
      if (i === 0) {
        ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      } else {
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      }
    }
    ctx.closePath();
  }

  function drawParticles(ctx) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFog(ctx, canvasW, canvasH) {
    if (fogAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = fogAlpha;

    var gradient = ctx.createRadialGradient(
      canvasW / 2, canvasH / 2, canvasW * 0.15,
      canvasW / 2, canvasH / 2, canvasW * 0.7
    );
    gradient.addColorStop(0, 'rgba(244, 143, 177, 0)');
    gradient.addColorStop(0.5, 'rgba(244, 143, 177, 0.4)');
    gradient.addColorStop(1, 'rgba(206, 147, 216, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  function triggerFog(duration) {
    fogActive = true;
    fogTargetAlpha = 1;
    setTimeout(function() {
      fogTargetAlpha = 0;
      setTimeout(function() {
        fogActive = false;
      }, GameConfig.ANIM.fogFadeOut);
    }, duration || GameConfig.ANIM.fogHold);
  }

  function isFogActive() {
    return fogActive || fogAlpha > 0.05;
  }

  function addSparkleAt(x, y) {
    for (var i = 0; i < 3; i++) {
      sparkles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        size: 2 + Math.random() * 3,
        alpha: 1,
        speed: 1 + Math.random(),
        phase: Math.random() * Math.PI * 2,
        color: '#fff'
      });
    }
    if (sparkles.length > 25) {
      sparkles.splice(0, sparkles.length - 25);
    }
  }

  return {
    init: init,
    update: update,
    drawClouds: drawClouds,
    drawSparkles: drawSparkles,
    drawParticles: drawParticles,
    drawFog: drawFog,
    triggerFog: triggerFog,
    isFogActive: isFogActive,
    spawnParticles: spawnParticles,
    addSparkleAt: addSparkleAt
  };
})();
