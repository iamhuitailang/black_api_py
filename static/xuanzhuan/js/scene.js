var Scene = (function () {

  var ctx = null;
  var canvas = null;
  var theme = null;
  var particles = [];
  var stars = [];
  var clouds = [];
  var flags = [];
  var cachedGradients = {};
  var animTime = 0;
  var dpr = 1;

  function init(canvasEl, themeCfg) {
    canvas = canvasEl;
    theme = themeCfg;

    if (!canvas._dprScaled) {
      dpr = window.devicePixelRatio || 1;
      if (dpr > 1) {
        canvas.style.width = CONFIG.GAME.canvasWidth + 'px';
        canvas.style.height = CONFIG.GAME.canvasHeight + 'px';
        canvas.width = CONFIG.GAME.canvasWidth * dpr;
        canvas.height = CONFIG.GAME.canvasHeight * dpr;
      }
      canvas._dprScaled = true;
    }

    ctx = canvas.getContext('2d');
    if (dpr > 1) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    rebuildGradients();
    initStars();
    initClouds();
    initFlags();
    particles = [];
    animTime = 0;
  }

  function rebuildGradients() {
    cachedGradients = {};
    var W = CONFIG.GAME.canvasWidth;
    var H = CONFIG.GAME.canvasHeight;

    cachedGradients.sky = ctx.createLinearGradient(0, 0, 0, H);
    cachedGradients.sky.addColorStop(0, theme.skyTop);
    cachedGradients.sky.addColorStop(0.3, lightenColor(theme.skyTop, 8));
    cachedGradients.sky.addColorStop(0.6, mixColor(theme.skyTop, theme.skyBottom, 0.5));
    cachedGradients.sky.addColorStop(1, theme.skyBottom);

    cachedGradients.ground = ctx.createLinearGradient(0, 435, 0, 465);
    cachedGradients.ground.addColorStop(0, theme.groundColor);
    cachedGradients.ground.addColorStop(0.5, lightenColor(theme.groundColor, -5));
    cachedGradients.ground.addColorStop(1, theme.groundDark);

    var plat = CONFIG.PLATFORM;
    cachedGradients.platform = ctx.createRadialGradient(0, -plat.radius * 0.3, plat.innerRadius * 0.3, 0, 0, plat.radius);
    cachedGradients.platform.addColorStop(0, lightenColor(theme.platformColor, 25));
    cachedGradients.platform.addColorStop(0.3, lightenColor(theme.platformColor, 10));
    cachedGradients.platform.addColorStop(0.6, theme.platformColor);
    cachedGradients.platform.addColorStop(0.85, lightenColor(theme.platformColor, -10));
    cachedGradients.platform.addColorStop(1, theme.platformEdge);

    cachedGradients.pole = ctx.createLinearGradient(-6, 0, 6, 0);
    cachedGradients.pole.addColorStop(0, lightenColor(theme.poleColor, 25));
    cachedGradients.pole.addColorStop(0.3, lightenColor(theme.poleColor, 10));
    cachedGradients.pole.addColorStop(0.6, theme.poleColor);
    cachedGradients.pole.addColorStop(1, lightenColor(theme.poleColor, -20));

    cachedGradients.sunOuter = ctx.createRadialGradient(700, 130, 0, 700, 130, 137);
    cachedGradients.sunOuter.addColorStop(0, 'rgba(255, 220, 140, 0.5)');
    cachedGradients.sunOuter.addColorStop(0.3, 'rgba(255, 180, 100, 0.35)');
    cachedGradients.sunOuter.addColorStop(0.6, 'rgba(255, 140, 70, 0.15)');
    cachedGradients.sunOuter.addColorStop(1, 'rgba(255, 100, 60, 0)');

    cachedGradients.horseBodies = [];
    for (var i = 0; i < theme.horseColors.length; i++) {
      var c = theme.horseColors[i];
      cachedGradients.horseBodies[i] = ctx.createRadialGradient(-4, -2, 2, 0, 2, 20);
      cachedGradients.horseBodies[i].addColorStop(0, lightenColor(c, 25));
      cachedGradients.horseBodies[i].addColorStop(0.3, lightenColor(c, 12));
      cachedGradients.horseBodies[i].addColorStop(0.6, c);
      cachedGradients.horseBodies[i].addColorStop(1, lightenColor(c, -20));
    }

    cachedGradients.horseHeads = [];
    for (var j = 0; j < theme.horseColors.length; j++) {
      var cc = theme.horseColors[j];
      cachedGradients.horseHeads[j] = ctx.createRadialGradient(-3, -22, 2, 0, -18, 14);
      cachedGradients.horseHeads[j].addColorStop(0, lightenColor(cc, 35));
      cachedGradients.horseHeads[j].addColorStop(0.3, lightenColor(cc, 18));
      cachedGradients.horseHeads[j].addColorStop(0.6, lightenColor(cc, 8));
      cachedGradients.horseHeads[j].addColorStop(1, lightenColor(cc, -10));
    }
  }

  function setTheme(themeCfg) {
    theme = themeCfg;
    rebuildGradients();
    initStars();
    initClouds();
    initFlags();
  }

  function initStars() {
    stars = [];
    if (theme.id !== 'night') return;
    for (var i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * CONFIG.GAME.canvasWidth,
        y: Math.random() * 380,
        r: Math.random() * 1.2 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 2 + 1
      });
    }
  }

  function initClouds() {
    clouds = [];
    for (var i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * CONFIG.GAME.canvasWidth,
        y: 30 + Math.random() * 140,
        w: 70 + Math.random() * 70,
        speed: 0.1 + Math.random() * 0.15
      });
    }
  }

  function initFlags() {
    flags = [];
    for (var i = 0; i < 8; i++) {
      flags.push({
        angle: (Math.PI * 2 / 8) * i,
        phase: Math.random() * Math.PI * 2,
        colorIdx: i % theme.flagColors.length
      });
    }
  }

  function render(platformAngle, characters, tilt, effects, dt) {
    if (!ctx) return;
    animTime += dt;

    var W = CONFIG.GAME.canvasWidth;
    var H = CONFIG.GAME.canvasHeight;

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = cachedGradients.sky;
    ctx.fillRect(0, 0, W, H);

    drawClouds(dt);

    if (theme.id === 'night') drawStars(dt);
    if (theme.id === 'sunset') drawSun();
    if (theme.id === 'kids') drawBackgroundHorses(platformAngle);

    drawGround();
    drawPlatform(platformAngle, tilt);
    drawHorses(platformAngle);
    drawCharacters(characters);
    drawEffectsOverlay(effects);
    drawParticles(dt);

    if (theme.id === 'night') drawFireflies();
  }

  function drawStars(dt) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.twinkle += dt * 0.003 * s.speed;
      var a = 0.4 + Math.sin(s.twinkle) * 0.45;
      ctx.fillStyle = a > 0.8
        ? 'rgba(255,255,255,0.95)'
        : a > 0.5
          ? 'rgba(255,255,255,0.7)'
          : a > 0.2
            ? 'rgba(255,255,255,0.4)'
            : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawClouds(dt) {
    ctx.fillStyle = theme.cloudColor;
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.speed;
      if (c.x > CONFIG.GAME.canvasWidth + c.w) c.x = -c.w;
      var h = c.w * 0.35;
      ctx.beginPath();
      ctx.arc(c.x, c.y, h * 0.5, 0, Math.PI * 2);
      ctx.arc(c.x + c.w * 0.22, c.y - h * 0.18, h * 0.5, 0, Math.PI * 2);
      ctx.arc(c.x + c.w * 0.48, c.y, h * 0.48, 0, Math.PI * 2);
      ctx.arc(c.x + c.w * 0.3, c.y + h * 0.08, h * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSun() {
    ctx.fillStyle = cachedGradients.sunOuter;
    ctx.beginPath();
    ctx.arc(700, 130, 137, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 235, 170, 0.85)';
    ctx.beginPath();
    ctx.arc(700, 130, 55, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackgroundHorses(angle) {
    var plat = CONFIG.PLATFORM;
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    for (var i = 0; i < 3; i++) {
      var a = angle + (Math.PI * 2 / 3) * i + Math.PI / 6;
      var r = plat.radius + 70;
      var x = plat.cx + Math.cos(a) * r;
      var y = plat.cy + Math.sin(a) * r;
      ctx.globalAlpha = 0.25;
      ctx.fillText('🎠', x, y);
    }
    ctx.globalAlpha = 1;
  }

  function drawGround() {
    var W = CONFIG.GAME.canvasWidth;
    var H = CONFIG.GAME.canvasHeight;
    var groundY = 445;

    ctx.fillStyle = theme.groundDark;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.fillStyle = cachedGradients.ground;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (var x = 0; x <= W; x += 25) {
      ctx.lineTo(x, groundY + Math.sin(x * 0.018) * 4);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawPlatform(angle, tilt) {
    var plat = CONFIG.PLATFORM;
    var rOuter = plat.radius;
    var rInner = plat.innerRadius;
    var tiltAngle = tilt ? tilt.angle : 0;
    var midR = (rOuter + rInner) / 2;

    ctx.save();
    ctx.translate(plat.cx, plat.cy);
    ctx.rotate(tiltAngle * 0.4);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(5, 16, rOuter + 10, (rOuter - rInner) / 2 + 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cachedGradients.platform;
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
    ctx.arc(0, 0, rInner, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = theme.platformEdge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = lightenColor(theme.platformEdge, -10);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, rInner, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (var i = 0; i < 16; i++) {
      var a = (Math.PI * 2 / 16) * i + angle * 0.5;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * midR, Math.sin(a) * midR, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    drawPole();
    drawFlags(angle);

    ctx.restore();
  }

  function drawPole() {
    ctx.fillStyle = cachedGradients.pole;
    ctx.fillRect(-5, -32, 10, 32);

    ctx.fillStyle = lightenColor(theme.poleColor, 30);
    ctx.beginPath();
    ctx.arc(0, -38, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.poleColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawFlags(angle) {
    for (var i = 0; i < flags.length; i++) {
      var f = flags[i];
      var a = f.angle + angle * 0.3;
      var r = CONFIG.PLATFORM.radius - 5;
      var fx = Math.cos(a) * r;
      var fy = Math.sin(a) * r;
      var wave = Math.sin(f.phase + angle * 2.5) * 3;

      ctx.strokeStyle = theme.poleColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy - 28);
      ctx.stroke();

      ctx.fillStyle = theme.flagColors[f.colorIdx];
      ctx.beginPath();
      ctx.moveTo(fx, fy - 28);
      ctx.lineTo(fx + 14 + wave, fy - 22);
      ctx.lineTo(fx, fy - 16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.moveTo(fx, fy - 22);
      ctx.lineTo(fx + 7, fy - 22);
      ctx.lineTo(fx, fy - 16);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawHorses(angle) {
    var plat = CONFIG.PLATFORM;
    var midR = (plat.radius + plat.innerRadius) / 2;

    for (var i = 0; i < 6; i++) {
      var baseAngle = (Math.PI * 2 / 6) * i + angle;
      var x = Math.cos(baseAngle) * midR;
      var y = Math.sin(baseAngle) * midR;
      var bob = Math.sin(angle * 3 + i * 1.1) * 5;
      var colorIdx = i % theme.horseColors.length;

      ctx.save();
      ctx.translate(x, y + bob);
      ctx.rotate(baseAngle + Math.PI / 2);

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cachedGradients.horseBodies[colorIdx];
      ctx.beginPath();
      ctx.ellipse(0, 2, 13, 17, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cachedGradients.horseHeads[colorIdx];
      ctx.beginPath();
      ctx.arc(0, -18, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-3, -22, 1.8, 0, Math.PI * 2);
      ctx.fill();

      var maneColor = lightenColor(theme.horseColors[colorIdx], 25);
      ctx.fillStyle = maneColor;
      ctx.beginPath();
      ctx.ellipse(-11, -24, 3.5, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(11, -24, 3.5, 7, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      var poleOffset = (i % 2 === 0) ? -2.5 : 2.5;
      ctx.fillRect(poleOffset - 0.8, -28, 1.6, 56);

      ctx.restore();
    }
  }

  function drawCharacters(characters) {
    for (var i = 0; i < characters.length; i++) {
      drawCharacter(characters[i]);
    }
  }

  function drawCharacter(ch) {
    if (!ch.alive && ch.fallTimer <= 0) return;

    ctx.save();

    var fallOffset = 0;
    var fallRotate = 0;
    if (!ch.alive) {
      fallOffset = (1 - ch.fallTimer) * 80;
      fallRotate = (1 - ch.fallTimer) * Math.PI * 0.6 * (ch.angularVel >= 0 ? 1 : -1);
    }

    var bob = ch.alive ? Math.sin(ch.bobPhase) * 1.5 : 0;
    var wobbleX = Math.sin(ch.wobble) * 3;
    var wobbleR = Math.sin(ch.wobble) * 0.12;
    var crouchY = ch.crouchAmount * 8;
    var scale = 1 - ch.crouchAmount * 0.15;

    ctx.translate(ch.x + wobbleX, ch.y - 20 + bob + crouchY + fallOffset);
    ctx.rotate(wobbleR + fallRotate);
    ctx.scale(scale, scale);

    if (ch.skillActive) {
      var pulse = 0.5 + Math.sin(animTime * 0.012) * 0.4;
      ctx.fillStyle = pulse > 0.7
        ? 'rgba(255,215,0,0.35)'
        : pulse > 0.5
          ? 'rgba(255,215,0,0.2)'
          : 'rgba(255,215,0,0.08)';
      ctx.beginPath();
      ctx.arc(0, -10, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = pulse > 0.6 ? 'rgba(255,215,0,0.9)' : 'rgba(255,215,0,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -10, 35, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lightenColor(ch.color, 18);
    ctx.beginPath();
    ctx.ellipse(0, 10, 12, 15 - ch.crouchAmount * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = lightenColor(ch.color, 30);
    ctx.beginPath();
    ctx.arc(0, -10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-4, -11, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -11, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -6, 3, 0.1, Math.PI - 0.1);
    ctx.stroke();

    if (ch.crouchAmount > 0.08) {
      ctx.font = 'bold 9px sans-serif';
      var crouchAlpha = ch.crouchAmount * 0.8;
      ctx.fillStyle = crouchAlpha > 0.5
        ? 'rgba(100,150,255,0.7)'
        : crouchAlpha > 0.3
          ? 'rgba(100,150,255,0.45)'
          : 'rgba(100,150,255,0.2)';
      ctx.textAlign = 'center';
      ctx.fillText('蹲', 0, 30);
    }

    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2.5;
    var label = ch.isPlayer ? '你' : ch.name;
    ctx.strokeText(label, 0, -28);
    ctx.fillStyle = ch.isPlayer ? '#fff' : 'rgba(255,255,255,0.85)';
    ctx.fillText(label, 0, -28);

    var stabPct = ch.stability / ch.maxStability;
    var barW = 36;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-barW / 2 - 1, -40, barW + 2, 6);
    ctx.fillStyle = stabPct > 0.5 ? '#4ade80' : stabPct > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(-barW / 2, -39, barW * stabPct, 4);

    ctx.restore();
  }

  function drawEffectsOverlay(effects) {
    if (!effects || !effects.length) return;

    for (var i = 0; i < effects.length; i++) {
      var eff = effects[i];
      var progress = 1 - (eff.elapsed / eff.duration);
      if (progress <= 0) continue;

      if (eff.type === 'bump') {
        var bumpA = progress * 0.22;
        ctx.fillStyle = bumpA > 0.15
          ? 'rgba(255,180,80,0.25)'
          : bumpA > 0.08
            ? 'rgba(255,180,80,0.15)'
            : 'rgba(255,180,80,0.06)';
        ctx.fillRect(0, 0, CONFIG.GAME.canvasWidth, CONFIG.GAME.canvasHeight);

        var shockR = (1 - progress) * 120;
        ctx.strokeStyle = progress > 0.5 ? 'rgba(255,180,80,0.8)' : 'rgba(255,180,80,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(CONFIG.PLATFORM.cx, CONFIG.PLATFORM.cy, shockR, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (eff.type === 'wind') {
        var dir = eff.direction;
        ctx.strokeStyle = progress > 0.5 ? 'rgba(150,200,255,0.6)' : 'rgba(150,200,255,0.3)';
        ctx.lineWidth = 2;
        for (var j = 0; j < 10; j++) {
          var y = 60 + j * 52;
          var offset = (eff.elapsed * 0.35 + j * 45) % 220;
          var sx = dir > 0 ? offset - 60 : CONFIG.GAME.canvasWidth - offset + 60;
          var ex = dir > 0 ? offset + 20 : CONFIG.GAME.canvasWidth - offset - 20;
          ctx.beginPath();
          ctx.moveTo(sx, y);
          ctx.lineTo(ex, y);
          ctx.stroke();
        }
      }

      if (eff.type === 'tilt') {
        var tp = 0;
        if (progress > 0.8) tp = (1 - progress) / 0.2;
        else if (progress < 0.2) tp = progress / 0.2;
        else tp = 1;
        var ta = tp * 0.12;
        ctx.fillStyle = eff.direction > 0
          ? (ta > 0.08 ? 'rgba(255,120,120,0.15)' : 'rgba(255,120,120,0.06)')
          : (ta > 0.08 ? 'rgba(120,120,255,0.15)' : 'rgba(120,120,255,0.06)');
        ctx.fillRect(
          eff.direction > 0 ? CONFIG.GAME.canvasWidth * 0.55 : 0,
          0,
          CONFIG.GAME.canvasWidth * 0.45,
          CONFIG.GAME.canvasHeight
        );
      }
    }
  }

  function drawParticles(dt) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vy += 60 * dt / 1000;

      var a = p.life / p.maxLife;
      ctx.fillStyle = a > 0.6
        ? 'rgba(255,200,100,0.9)'
        : a > 0.3
          ? 'rgba(255,200,100,0.6)'
          : 'rgba(255,200,100,0.25)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    if (particles.length > 32) {
      var write = 0;
      for (var k = 0; k < particles.length; k++) {
        if (particles[k].life > 0) {
          if (write !== k) particles[write] = particles[k];
          write++;
        }
      }
      particles.length = write;
    }
  }

  function drawFireflies() {
    for (var i = 0; i < 12; i++) {
      var t = animTime * 0.001;
      var x = (Math.sin(t * 0.4 + i * 2.3) * 0.5 + 0.5) * CONFIG.GAME.canvasWidth;
      var y = 280 + Math.sin(t * 0.8 + i * 1.9) * 160 + i * 12;
      var a = 0.3 + Math.sin(t * 4 + i * 2.7) * 0.25;

      ctx.fillStyle = a > 0.4 ? 'rgba(255,255,150,0.9)' : 'rgba(255,255,150,0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function spawnParticles(x, y, count, color) {
    var col = color || 'rgb(255,200,100)';
    for (var i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180 - 50,
        size: 2.5 + Math.random() * 3,
        color: col,
        life: 500 + Math.random() * 400,
        maxLife: 900
      });
    }
  }

  function lightenColor(hex, amount) {
    var num = parseInt(hex.replace('#', ''), 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + amount));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    var b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function mixColor(hex1, hex2, ratio) {
    var n1 = parseInt(hex1.replace('#', ''), 16);
    var n2 = parseInt(hex2.replace('#', ''), 16);
    var r = Math.round((n1 >> 16) * (1 - ratio) + (n2 >> 16) * ratio);
    var g = Math.round(((n1 >> 8) & 0xff) * (1 - ratio) + ((n2 >> 8) & 0xff) * ratio);
    var b = Math.round((n1 & 0xff) * (1 - ratio) + (n2 & 0xff) * ratio);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function getContext() {
    return ctx;
  }

  function getTheme() {
    return theme;
  }

  return {
    init: init,
    setTheme: setTheme,
    render: render,
    spawnParticles: spawnParticles,
    getContext: getContext,
    getTheme: getTheme
  };

})();
