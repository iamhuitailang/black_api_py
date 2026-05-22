var Renderer = (function () {
  var canvas, ctx;
  var W, H;
  var groundY;
  var currentTheme;
  var bgOffset = 0;
  var particles = [];
  var stars = [];
  var exhaustParticles = [];

  function init(canvasEl, theme) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    currentTheme = theme;
    resize();
    window.addEventListener('resize', resize);
    generateStars();
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    groundY = H * CONFIG.GROUND_Y_RATIO;
  }

  function setTheme(theme) {
    currentTheme = theme;
    generateStars();
  }

  function getGroundY() {
    return groundY;
  }

  function generateStars() {
    stars = [];
    for (var i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * groundY * 0.6,
        r: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.2
      });
    }
  }

  function spawnParticles(x, y, color, count, opts) {
    opts = opts || {};
    for (var i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * (opts.speed || 8),
        vy: (Math.random() - 0.5) * (opts.speed || 8) - 2,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        color: color,
        size: Math.random() * (opts.size || 4) + 2,
        gravity: opts.gravity !== false
      });
    }
  }

  function spawnExhaust(x, y, color) {
    for (var i = 0; i < 3; i++) {
      exhaustParticles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: -1 - Math.random() * 2,
        vy: -0.5 + Math.random(),
        life: 1,
        decay: 0.03 + Math.random() * 0.02,
        color: color,
        size: 4 + Math.random() * 3
      });
    }
  }

  function updateParticles(dt) {
    var dtFactor = dt / 16.67;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dtFactor;
      p.y += p.vy * dtFactor;
      if (p.gravity) p.vy += 0.3 * dtFactor;
      p.life -= p.decay * dtFactor;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (var j = exhaustParticles.length - 1; j >= 0; j--) {
      var ep = exhaustParticles[j];
      ep.x += ep.vx * dtFactor;
      ep.y += ep.vy * dtFactor;
      ep.life -= ep.decay * dtFactor;
      if (ep.life <= 0) exhaustParticles.splice(j, 1);
    }
  }

  function clear() {
    ctx.clearRect(0, 0, W, H);
  }

  function drawSky(cameraX) {
    var sky = currentTheme.sky;
    var grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(0.5, sky[1]);
    grad.addColorStop(1, sky[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, groundY);

    if (currentTheme.bgElements === 'cyber' || currentTheme.bgElements === 'city') {
      var time = Date.now() * 0.002;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var sx = (s.x - cameraX * 0.1) % 2000;
        if (sx < 0) sx += 2000;
        if (sx > W + 10) continue;
        var twinkle = 0.5 + Math.sin(time + s.twinkle) * 0.5;
        ctx.globalAlpha = twinkle * 0.8;
        ctx.fillStyle = currentTheme.neonColors[i % currentTheme.neonColors.length];
        ctx.beginPath();
        ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (currentTheme.bgElements === 'wild') {
      drawClouds(cameraX);
    }
  }

  function drawClouds(cameraX) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (var i = 0; i < 6; i++) {
      var cx = ((i * 350 - cameraX * 0.15) % (W + 400)) - 200;
      var cy = 60 + Math.sin(i * 1.5) * 40;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy - 5, 25, 0, Math.PI * 2);
      ctx.arc(cx + 50, cy, 28, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy + 10, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBackground(cameraX) {
    if (currentTheme.bgElements === 'city') {
      drawCityBackground(cameraX);
    } else if (currentTheme.bgElements === 'wild') {
      drawWildBackground(cameraX);
    } else if (currentTheme.bgElements === 'cyber') {
      drawCyberBackground(cameraX);
    }
  }

  function drawCityBackground(cameraX) {
    var bldgCount = 15;
    for (var i = 0; i < bldgCount; i++) {
      var bx = ((i * 160 - cameraX * 0.3) % (W + 320)) - 160;
      var bh = 80 + Math.sin(i * 2.7) * 100 + (i % 3) * 40;
      var bw = 60 + (i % 4) * 20;
      var by = groundY - bh;

      ctx.fillStyle = currentTheme.buildingColor;
      ctx.fillRect(bx, by, bw, bh);

      ctx.fillStyle = currentTheme.buildingWindow;
      var wSize = 4;
      var gap = 8;
      for (var wy = by + 10; wy < groundY - 20; wy += gap) {
        for (var wx = bx + 8; wx < bx + bw - 8; wx += gap) {
          if (Math.sin(wx * wy * 0.1) > 0.2) {
            ctx.globalAlpha = 0.3 + Math.sin(wx + wy + Date.now() * 0.001) * 0.3;
            ctx.fillRect(wx, wy, wSize, wSize);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    var neonOffset = cameraX * 0.5;
    for (var n = 0; n < 8; n++) {
      var nx = ((n * 280 - neonOffset) % (W + 560)) - 280;
      var ny = groundY - 120 - (n % 3) * 60;
      var colors = currentTheme.neonColors;
      ctx.strokeStyle = colors[n % colors.length];
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors[n % colors.length];
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + 50, ny);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawWildBackground(cameraX) {
    ctx.fillStyle = '#3a7d44';
    for (var i = 0; i < 10; i++) {
      var mx = ((i * 250 - cameraX * 0.2) % (W + 500)) - 250;
      var mh = 120 + Math.sin(i * 1.3) * 60;
      ctx.beginPath();
      ctx.moveTo(mx, groundY);
      ctx.lineTo(mx + 100, groundY - mh);
      ctx.lineTo(mx + 200, groundY);
      ctx.fill();
    }

    for (var t = 0; t < 20; t++) {
      var tx = ((t * 140 - cameraX * 0.4) % (W + 280)) - 140;
      var th = 50 + (t % 3) * 25;
      ctx.fillStyle = '#2d5a27';
      ctx.beginPath();
      ctx.moveTo(tx, groundY);
      ctx.lineTo(tx + 15, groundY - th * 0.3);
      ctx.lineTo(tx + 30, groundY);
      ctx.fill();
      ctx.fillStyle = '#1a4d1a';
      ctx.beginPath();
      ctx.moveTo(tx + 7, groundY - th * 0.2);
      ctx.lineTo(tx + 15, groundY - th);
      ctx.lineTo(tx + 23, groundY - th * 0.2);
      ctx.fill();
    }
  }

  function drawCyberBackground(cameraX) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    var gridSize = 60;
    var gridOffset = cameraX * 0.3 % gridSize;
    for (var gx = -gridOffset; gx < W; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, groundY);
      ctx.stroke();
    }
    for (var gy = 0; gy < groundY; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    for (var i = 0; i < 12; i++) {
      var bx = ((i * 180 - cameraX * 0.3) % (W + 360)) - 180;
      var bh = 100 + Math.sin(i * 3.1) * 120 + (i % 4) * 50;
      var bw = 50 + (i % 3) * 30;
      var by = groundY - bh;

      ctx.fillStyle = currentTheme.buildingColor;
      ctx.fillRect(bx, by, bw, bh);

      var neonColors = currentTheme.neonColors;
      ctx.strokeStyle = neonColors[i % neonColors.length];
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = neonColors[i % neonColors.length];
      ctx.strokeRect(bx, by, bw, bh);
      ctx.shadowBlur = 0;
    }
  }

  function drawGround(cameraX) {
    ctx.fillStyle = currentTheme.ground;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.strokeStyle = currentTheme.groundLine;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = currentTheme.groundLine;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    var stripeWidth = 40;
    var stripeGap = 30;
    var stripeOffset = cameraX % (stripeWidth + stripeGap);
    ctx.fillStyle = currentTheme.groundLine;
    ctx.globalAlpha = 0.4;
    for (var sx = -stripeOffset; sx < W; sx += stripeWidth + stripeGap) {
      ctx.fillRect(sx, groundY + 20, stripeWidth, 4);
    }
    ctx.globalAlpha = 1;
  }

  function drawRamps(ramps, cameraX) {
    if (!ramps) return;
    for (var i = 0; i < ramps.length; i++) {
      var ramp = ramps[i];
      var rx = ramp.x + cameraX;

      if (rx + ramp.width < -100 || rx > W + 100) continue;

      ctx.beginPath();
      ctx.moveTo(rx, groundY);
      ctx.lineTo(rx + ramp.width, groundY - ramp.height);
      ctx.lineTo(rx + ramp.width, groundY);
      ctx.closePath();

      var grad = ctx.createLinearGradient(rx, groundY - ramp.height, rx + ramp.width, groundY);
      grad.addColorStop(0, currentTheme.rampColor);
      grad.addColorStop(1, currentTheme.rampDark);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = currentTheme.rampColor;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = currentTheme.rampColor;
      ctx.beginPath();
      ctx.moveTo(rx, groundY);
      ctx.lineTo(rx + ramp.width, groundY - ramp.height);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = currentTheme.rampDark;
      ctx.fillRect(rx - 10, groundY - 5, ramp.width + 20, 8);
    }
  }

  function drawObstacles(obstacles, cameraX) {
    if (!obstacles) return;
    for (var i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i];
      var ox = ob.x + cameraX;

      if (ox + ob.width < -50 || ox > W + 50) continue;

      switch (ob.type) {
        case 'cone':
          drawCone(ox, ob);
          break;
        case 'barrier':
          drawBarrier(ox, ob);
          break;
        case 'oil':
          drawOil(ox, ob);
          break;
        case 'rock':
          drawRock(ox, ob);
          break;
        case 'log':
          drawLog(ox, ob);
          break;
        case 'mud':
          drawMud(ox, ob);
          break;
        case 'laser':
          drawLaser(ox, ob);
          break;
        case 'glitch':
          drawGlitch(ox, ob);
          break;
        default:
          drawCone(ox, ob);
      }
    }
  }

  function drawCone(x, ob) {
    var cx = x + ob.width / 2;
    var cy = groundY;
    ctx.fillStyle = ob.color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ob.height);
    ctx.lineTo(cx - ob.width / 2, cy);
    ctx.lineTo(cx + ob.width / 2, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - ob.width / 3, cy - ob.height * 0.5, ob.width * 0.66, 4);
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - ob.width / 2 - 3, cy - 2, ob.width + 6, 4);
  }

  function drawBarrier(x, ob) {
    var y = groundY - ob.height;
    ctx.fillStyle = ob.color;
    ctx.fillRect(x, y, ob.width, ob.height);
    ctx.fillStyle = '#000';
    var stripeW = ob.width / 4;
    for (var i = 0; i < 4; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(x + i * stripeW, y, stripeW, ob.height);
      }
    }
    ctx.fillStyle = ob.color;
    ctx.fillRect(x - 3, y - 3, ob.width + 6, 5);
    ctx.fillRect(x - 3, groundY - 2, ob.width + 6, 4);
  }

  function drawOil(x, ob) {
    var cx = x + ob.width / 2;
    var cy = groundY;
    ctx.fillStyle = ob.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, ob.width / 2, ob.height, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(60, 60, 60, 0.6)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, ob.width / 2 - 5, ob.height - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    var colors = ['#ff6b6b', '#4ecdc4', '#ffd700'];
    for (var i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(cx + (i - 1.5) * 10, cy - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawRock(x, ob) {
    var cx = x + ob.width / 2;
    var cy = groundY;
    ctx.fillStyle = ob.color;
    ctx.beginPath();
    ctx.moveTo(cx - ob.width / 2, cy);
    ctx.lineTo(cx - ob.width / 3, cy - ob.height * 0.7);
    ctx.lineTo(cx, cy - ob.height);
    ctx.lineTo(cx + ob.width / 3, cy - ob.height * 0.8);
    ctx.lineTo(cx + ob.width / 2, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(cx - ob.width / 3, cy - ob.height * 0.7);
    ctx.lineTo(cx, cy - ob.height);
    ctx.lineTo(cx + ob.width / 6, cy - ob.height * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  function drawLog(x, ob) {
    var y = groundY - ob.height * 0.6;
    ctx.fillStyle = ob.color;
    ctx.beginPath();
    ctx.ellipse(x + ob.width / 2, y, ob.width / 2, ob.height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.ellipse(x + ob.width / 2, y, ob.width / 2 - 4, ob.height * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(x + 4, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + ob.width - 4, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMud(x, ob) {
    var cx = x + ob.width / 2;
    var cy = groundY;
    ctx.fillStyle = ob.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, ob.width / 2, ob.height, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d2817';
    for (var i = 0; i < 5; i++) {
      var px = cx + (Math.random() - 0.5) * ob.width * 0.8;
      var py = cy - 2 - Math.random() * ob.height * 0.6;
      ctx.beginPath();
      ctx.arc(px, py, 3 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawLaser(x, ob) {
    var cx = x + ob.width / 2;
    var time = Date.now() * 0.01;
    ctx.strokeStyle = ob.color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = ob.color;
    ctx.globalAlpha = 0.5 + Math.sin(time) * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, groundY - ob.height - 5);
    ctx.lineTo(cx, groundY);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = ob.color;
    ctx.fillRect(cx - 3, groundY - 5, 6, 5);
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - ob.width / 2, groundY - 2, ob.width, 4);
  }

  function drawGlitch(x, ob) {
    var cx = x + ob.width / 2;
    var cy = groundY - ob.height / 2;
    var time = Date.now() * 0.02;
    ctx.save();
    ctx.translate(cx, cy);
    var glitch1 = Math.sin(time) * 5;
    var glitch2 = Math.cos(time * 1.3) * 5;
    ctx.fillStyle = ob.color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-ob.width / 2 + glitch1, -ob.height / 2, ob.width, ob.height);
    ctx.fillStyle = '#ff00ff';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-ob.width / 2 + glitch2, -ob.height / 2 + 2, ob.width, ob.height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ob.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-ob.width / 2, -ob.height / 2, ob.width, ob.height);
    ctx.restore();
  }

  function drawBike(physState, bike, cameraX) {
    var x = physState.x - cameraX;
    var y = physState.y;
    var angle = physState.angle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    var style = bike.style;
    var wheelR = style.wheelSize;
    var bodyLen = style.bodyLen;
    var bodyH = style.bodyH;

    if (style.hasExhaust && physState.vx > 3 && physState.onGround) {
      spawnExhaust(-bodyLen * 0.45, -bodyH * 0.5, bike.colorDark);
    }

    drawExhaustParticles();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-bodyLen * 0.35, 0, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bodyLen * 0.35, 0, wheelR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(-bodyLen * 0.35, 0);
    ctx.rotate(physState.wheelSpin);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    for (var s = 0; s < 6; s++) {
      var sa = s * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sa) * wheelR * 0.8, Math.sin(sa) * wheelR * 0.8);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(bodyLen * 0.35, 0);
    ctx.rotate(physState.wheelSpin);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    for (var s2 = 0; s2 < 6; s2++) {
      var sa2 = s2 * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sa2) * wheelR * 0.8, Math.sin(sa2) * wheelR * 0.8);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(-bodyLen * 0.35, 0, wheelR + 3, 0, Math.PI * 2);
    ctx.arc(bodyLen * 0.35, 0, wheelR + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-bodyLen * 0.35, 0, wheelR, 0, Math.PI * 2);
    ctx.arc(bodyLen * 0.35, 0, wheelR, 0, Math.PI * 2);
    ctx.fill();

    drawBikeBody(bike, style, bodyLen, bodyH);

    drawRider(bike, style, bodyLen, bodyH, angle, physState);

    ctx.restore();

    if (physState.onRamp && physState.currentRamp) {
      var ramp = physState.currentRamp;
      var rx = ramp.x + cameraX;
      ctx.strokeStyle = currentTheme.rampColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(rx, groundY);
      ctx.lineTo(rx + ramp.width, groundY - ramp.height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }

  function drawBikeBody(bike, style, bodyLen, bodyH) {
    if (style.bodyType === 'scooter') {
      drawScooterBody(bike, bodyLen, bodyH, style);
    } else if (style.bodyType === 'sport') {
      drawSportBody(bike, bodyLen, bodyH, style);
    } else {
      drawDirtBody(bike, bodyLen, bodyH, style);
    }
  }

  function drawScooterBody(bike, bodyLen, bodyH, style) {
    ctx.fillStyle = bike.colorDark;
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.45, -5);
    ctx.lineTo(-bodyLen * 0.45, -bodyH - style.seatH);
    ctx.lineTo(bodyLen * 0.1, -bodyH - style.seatH);
    ctx.lineTo(bodyLen * 0.4, -bodyH);
    ctx.lineTo(bodyLen * 0.45, -5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bike.color;
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.35, -bodyH - style.seatH);
    ctx.lineTo(-bodyLen * 0.3, -bodyH - style.seatH - 5);
    ctx.lineTo(bodyLen * 0.05, -bodyH - style.seatH - 5);
    ctx.lineTo(bodyLen * 0.3, -bodyH - style.seatH);
    ctx.closePath();
    ctx.fill();

    if (style.hasBasket) {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-bodyLen * 0.5, -bodyH - style.seatH - 15, 20, 12);
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 1;
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-bodyLen * 0.5 + 5 + i * 5, -bodyH - style.seatH - 15);
        ctx.lineTo(-bodyLen * 0.5 + 5 + i * 5, -bodyH - style.seatH - 3);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#fff';
    ctx.fillRect(bodyLen * 0.15, -bodyH - style.seatH - 8, 12, 6);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(bodyLen * 0.17, -bodyH - style.seatH - 6, 8, 3);

    ctx.fillStyle = bike.colorDark;
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.45, -5);
    ctx.lineTo(-bodyLen * 0.55, -bodyH - style.seatH - 20);
    ctx.lineTo(-bodyLen * 0.5, -bodyH - style.seatH - 20);
    ctx.lineTo(-bodyLen * 0.42, -5);
    ctx.closePath();
    ctx.fill();
  }

  function drawSportBody(bike, bodyLen, bodyH, style) {
    ctx.fillStyle = bike.colorDark;
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.5, -5);
    ctx.lineTo(-bodyLen * 0.3, -bodyH - 3);
    ctx.lineTo(bodyLen * 0.3, -bodyH - 3);
    ctx.lineTo(bodyLen * 0.5, -5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bike.color;
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.3, -bodyH - 3);
    ctx.lineTo(-bodyLen * 0.15, -bodyH - 10);
    ctx.lineTo(bodyLen * 0.1, -bodyH - 10);
    ctx.lineTo(bodyLen * 0.3, -bodyH - 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillRect(-bodyLen * 0.12, -bodyH - style.seatH - 2, bodyLen * 0.25, 4);

    ctx.fillStyle = '#88ccff';
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.05, -bodyH - 12);
    ctx.lineTo(0, -bodyH - 20);
    ctx.lineTo(bodyLen * 0.15, -bodyH - 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(0, -bodyH - 18);
    ctx.lineTo(bodyLen * 0.08, -bodyH - 14);
    ctx.lineTo(bodyLen * 0.02, -bodyH - 13);
    ctx.closePath();
    ctx.fill();

    if (style.hasExhaust) {
      ctx.fillStyle = '#555';
      ctx.fillRect(-bodyLen * 0.55, -bodyH * 0.3, 12, 6);
      ctx.fillStyle = '#333';
      ctx.fillRect(-bodyLen * 0.6, -bodyH * 0.35, 8, 8);
    }

    ctx.fillStyle = bike.color;
    ctx.beginPath();
    ctx.moveTo(bodyLen * 0.35, -bodyH - 3);
    ctx.lineTo(bodyLen * 0.48, -bodyH - 15);
    ctx.lineTo(bodyLen * 0.5, -bodyH - 3);
    ctx.closePath();
    ctx.fill();
  }

  function drawDirtBody(bike, bodyLen, bodyH, style) {
    ctx.fillStyle = bike.colorDark;
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.45, -5);
    ctx.lineTo(-bodyLen * 0.35, -bodyH - style.seatH);
    ctx.lineTo(bodyLen * 0.35, -bodyH - style.seatH);
    ctx.lineTo(bodyLen * 0.45, -5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bike.color;
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.3, -bodyH - style.seatH);
    ctx.lineTo(-bodyLen * 0.25, -bodyH - style.seatH - 4);
    ctx.lineTo(bodyLen * 0.25, -bodyH - style.seatH - 4);
    ctx.lineTo(bodyLen * 0.3, -bodyH - style.seatH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(-bodyLen * 0.35, 0, style.wheelSize + 2, style.wheelSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bodyLen * 0.35, 0, style.wheelSize + 2, style.wheelSize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bike.colorDark;
    ctx.beginPath();
    ctx.moveTo(bodyLen * 0.2, -bodyH - style.seatH);
    ctx.lineTo(bodyLen * 0.45, -bodyH - style.seatH - 15);
    ctx.lineTo(bodyLen * 0.5, -bodyH - style.seatH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-bodyLen * 0.12, -bodyH - style.seatH - 5, bodyLen * 0.22, 3);

    if (style.hasExhaust) {
      ctx.fillStyle = '#444';
      ctx.fillRect(-bodyLen * 0.5, -bodyH * 0.3, 14, 5);
    }
  }

  function drawExhaustParticles() {
    for (var i = 0; i < exhaustParticles.length; i++) {
      var p = exhaustParticles[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawRider(bike, style, bodyLen, bodyH, angle, physState) {
    var riderX = -2;
    var riderY = -bodyH - style.seatH - 8;

    if (style.riderStyle === 'casual') {
      drawCasualRider(bike, riderX, riderY, physState);
    } else if (style.riderStyle === 'racer') {
      drawRacerRider(bike, riderX, riderY, physState);
    } else {
      drawOffroadRider(bike, riderX, riderY, physState);
    }
  }

  function drawCasualRider(bike, riderX, riderY, physState) {
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(riderX, riderY - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(riderX, riderY - 15, 9, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = bike.color;
    ctx.fillRect(riderX - 6, riderY - 3, 12, 12);

    var armAngle = Math.sin(Date.now() * 0.01) * 0.1;
    if (!physState.onGround) armAngle = 0.3;
    ctx.strokeStyle = '#ffcc99';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(riderX - 4, riderY);
    ctx.lineTo(riderX - 14, riderY + 8 + armAngle * 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(riderX + 4, riderY);
    ctx.lineTo(riderX + 14, riderY + 8 - armAngle * 5);
    ctx.stroke();

    var legSpread = !physState.onGround ? Math.sin(Date.now() * 0.015) * 0.3 : 0;
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(riderX - 3, riderY + 9);
    ctx.lineTo(riderX - 8 + legSpread * 3, riderY + 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(riderX + 3, riderY + 9);
    ctx.lineTo(riderX + 8 - legSpread * 3, riderY + 20);
    ctx.stroke();
  }

  function drawRacerRider(bike, riderX, riderY, physState) {
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(riderX, riderY - 12, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bike.color;
    ctx.beginPath();
    ctx.arc(riderX, riderY - 13, 9, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillRect(riderX + 1, riderY - 15, 7, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(riderX + 2, riderY - 15, 3, 2);

    ctx.fillStyle = bike.colorDark;
    ctx.beginPath();
    ctx.moveTo(riderX - 7, riderY - 5);
    ctx.lineTo(riderX - 9, riderY + 12);
    ctx.lineTo(riderX + 9, riderY + 12);
    ctx.lineTo(riderX + 7, riderY - 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bike.color;
    ctx.fillRect(riderX - 5, riderY - 4, 10, 8);

    var forwardLean = physState.vx > 5 ? -0.3 : 0;
    if (!physState.onGround) forwardLean = -0.5;
    ctx.strokeStyle = '#ffcc99';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(riderX - 3, riderY + 1);
    ctx.lineTo(riderX - 12 + forwardLean * 10, riderY + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(riderX + 3, riderY + 1);
    ctx.lineTo(riderX + 12 + forwardLean * 10, riderY + 6);
    ctx.stroke();

    ctx.strokeStyle = bike.colorDark;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(riderX - 2, riderY + 11);
    ctx.lineTo(riderX - 5, riderY + 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(riderX + 2, riderY + 11);
    ctx.lineTo(riderX + 5, riderY + 22);
    ctx.stroke();

    ctx.fillStyle = bike.color;
    ctx.fillRect(riderX - 3, riderY + 5, 6, 8);
  }

  function drawOffroadRider(bike, riderX, riderY, physState) {
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(riderX, riderY - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(riderX, riderY - 14, 10, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillRect(riderX - 5, riderY - 11, 10, 5);
    ctx.fillStyle = bike.color;
    ctx.fillRect(riderX - 3, riderY - 9, 6, 3);

    ctx.fillStyle = '#654321';
    ctx.fillRect(riderX - 7, riderY - 3, 14, 14);

    var armAngle = 0.2;
    if (!physState.onGround) armAngle = 0.4;
    ctx.strokeStyle = '#ffcc99';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(riderX - 4, riderY);
    ctx.lineTo(riderX - 16, riderY + 5 + armAngle * 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(riderX + 4, riderY);
    ctx.lineTo(riderX + 16, riderY + 5 - armAngle * 8);
    ctx.stroke();

    var legSpread = !physState.onGround ? 0.4 : 0.1;
    ctx.strokeStyle = '#4a3728';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(riderX - 3, riderY + 11);
    ctx.lineTo(riderX - 10 + legSpread * 5, riderY + 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(riderX + 3, riderY + 11);
    ctx.lineTo(riderX + 10 - legSpread * 5, riderY + 22);
    ctx.stroke();
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSpeedLines(speed, cameraX) {
    if (speed < 2) return;
    var intensity = Math.min(speed / 10, 1);
    ctx.strokeStyle = currentTheme.neonColors[0];
    ctx.lineWidth = 2;
    ctx.globalAlpha = intensity * 0.4;
    for (var i = 0; i < 8; i++) {
      var lx = Math.random() * W;
      var ly = Math.random() * groundY;
      var len = 20 + Math.random() * 40 * intensity;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - len, ly);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawFinishLine(cameraX, levelLength) {
    var fx = levelLength - cameraX;
    if (fx > W + 50 || fx < -50) return;

    var checkerSize = 20;
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 2; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#fff' : '#000';
        ctx.fillRect(fx + col * checkerSize, groundY - 80 + row * checkerSize, checkerSize, checkerSize);
      }
    }

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', fx + checkerSize, groundY - 90);
    ctx.textAlign = 'left';
  }

  function render(cameraX, physState, bike, ramps, obstacles, speed, levelLength, dt) {
    clear();
    drawSky(cameraX);
    drawBackground(cameraX);
    drawGround(cameraX);
    drawObstacles(obstacles, cameraX);
    drawRamps(ramps, cameraX);
    drawFinishLine(cameraX, levelLength);
    drawSpeedLines(speed, cameraX);
    updateParticles(dt);
    drawBike(physState, bike, cameraX);
    drawParticles();
  }

  return {
    init: init,
    resize: resize,
    setTheme: setTheme,
    getGroundY: getGroundY,
    render: render,
    spawnParticles: spawnParticles,
    clear: clear
  };
})();
