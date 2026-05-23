var CanvasRenderer = (function () {
  var canvas, ctx;
  var width, height;
  var firePitX, firePitY;
  var woodPositions = [];
  var selectedWoodId = null;
  var onWoodClick = null;
  var animationId = null;
  var lastTime = 0;
  var time = 0;
  var flameOffset = 0;
  var currentWoods = [];
  var ANIMATION_KEY = 'gouhuo_animation_state';
  var lastSaveTime = 0;
  var stonesCache = [];
  var isInitialized = false;
  var particleSeed = 0;

  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function init(callback) {
    canvas = document.getElementById('campfire-canvas');
    ctx = canvas.getContext('2d');
    onWoodClick = callback;
    restoreAnimationState();
    generateStones();
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', handleClick);
    ParticleSystem.initStars(width, height);
    isInitialized = true;
    preGenerateParticles();
    startLoop();
  }

  function preGenerateParticles() {
    var hasBurning = currentWoods.some(function (w) { return w.status === Wood.STATUS.BURNING; });
    if (!hasBurning) return;

    var particleCount = Math.floor(flameOffset * 3) % 30;
    for (var i = 0; i < particleCount; i++) {
      var seed = flameOffset + i * 100;
      var rand1 = seededRandom(seed);
      var rand2 = seededRandom(seed + 1);
      var rand3 = seededRandom(seed + 2);

      var px = firePitX + (rand1 - 0.5) * 40;
      var py = firePitY - 30 - rand2 * 40;

      if (rand3 < 0.5) {
        ParticleSystem.createFlameParticleSeeded(px, py, '#FF8C32', 0.8, seed);
      } else if (rand3 < 0.8) {
        ParticleSystem.createEmberParticleSeeded(px, py, '#FFA500', seed + 10);
      } else {
        ParticleSystem.createSmokeParticleSeeded(px, py, seed + 20);
      }
    }
  }

  function generateStones() {
    stonesCache = [];
    for (var i = 0; i < 20; i++) {
      stonesCache.push({
        offsetX: Math.sin(i * 2.5) * 30,
        offsetY: Math.cos(i * 1.8) * 20,
        sizeX: 20 + (i * 7 % 15),
        sizeY: 8 + (i * 11 % 5)
      });
    }
  }

  function restoreAnimationState() {
    try {
      var saved = localStorage.getItem(ANIMATION_KEY);
      if (saved) {
        var state = JSON.parse(saved);
        if (typeof state.flameOffset === 'number') {
          flameOffset = state.flameOffset;
        }
        if (typeof state.time === 'number') {
          time = state.time;
        }
        if (typeof state.particleSeed === 'number') {
          particleSeed = state.particleSeed;
        }
      }
    } catch (e) {
      console.warn('Restore animation state error:', e);
    }
  }

  function saveAnimationState() {
    try {
      localStorage.setItem(ANIMATION_KEY, JSON.stringify({
        flameOffset: flameOffset,
        time: time,
        particleSeed: particleSeed
      }));
    } catch (e) {
      console.warn('Save animation state error:', e);
    }
  }

  function forceSaveAnimationState() {
    saveAnimationState();
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    firePitX = width / 2;
    firePitY = height * 0.72;
    ParticleSystem.initStars(width, height);
    layoutWoods();
  }

  function layoutWoods() {
    woodPositions = [];
    var count = currentWoods.length;
    if (count === 0) return;

    var baseRadius = Math.min(width, height) * 0.28;
    var startAngle = Math.PI * 0.15;
    var endAngle = Math.PI * 0.85;

    for (var i = 0; i < count; i++) {
      var t = count === 1 ? 0.5 : i / (count - 1);
      var angle = startAngle + t * (endAngle - startAngle);
      var x = firePitX + Math.cos(angle) * baseRadius;
      var y = firePitY + Math.sin(angle) * baseRadius * 0.3;
      woodPositions.push({ x: x, y: y, angle: angle });
    }
  }

  function updateWoods(woods) {
    currentWoods = woods;
    layoutWoods();
  }

  function handleClick(e) {
    if (!onWoodClick) return;
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    for (var i = 0; i < currentWoods.length; i++) {
      var wood = currentWoods[i];
      var pos = woodPositions[i];
      if (!pos) continue;

      var dx = x - pos.x;
      var dy = y - pos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 50) {
        onWoodClick(wood, pos);
        return;
      }
    }
  }

  function startLoop() {
    function loop(timestamp) {
      var dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      if (lastTime === 0) dt = 0;
      lastTime = timestamp;
      time += dt;
      flameOffset += dt * 3;
      particleSeed += dt;

      ParticleSystem.update(dt);
      draw();

      animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawNightSky();
    ParticleSystem.drawStars(ctx, time);
    drawGround();
    drawFirePit();
    drawWoods();
    drawFire();
    ParticleSystem.drawParticles(ctx);

    var now = Date.now();
    if (now - lastSaveTime > 2000) {
      saveAnimationState();
      lastSaveTime = now;
    }
  }

  function drawNightSky() {
    var gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a20');
    gradient.addColorStop(0.3, '#101030');
    gradient.addColorStop(0.6, '#1a1535');
    gradient.addColorStop(1, '#252040');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawGround() {
    var gradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    gradient.addColorStop(0, '#1a1510');
    gradient.addColorStop(0.3, '#151210');
    gradient.addColorStop(1, '#0d0a08');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);

    ctx.fillStyle = '#2a2015';
    for (var i = 0; i < stonesCache.length; i++) {
      var stone = stonesCache[i];
      var x = (i / stonesCache.length) * width + stone.offsetX;
      var y = height * 0.75 + stone.offsetY;
      ctx.beginPath();
      ctx.ellipse(x, y, stone.sizeX, stone.sizeY, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFirePit() {
    var stoneCount = 12;
    var pitRadius = 80;

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(firePitX, firePitY + 20, pitRadius + 20, pitRadius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    for (var i = 0; i < stoneCount; i++) {
      var angle = (i / stoneCount) * Math.PI * 2;
      var sx = firePitX + Math.cos(angle) * pitRadius;
      var sy = firePitY + 15 + Math.sin(angle) * pitRadius * 0.35;
      var stoneSize = 15 + Math.sin(i * 2.3) * 5;

      var gradient = ctx.createRadialGradient(sx - 3, sy - 3, 0, sx, sy, stoneSize);
      gradient.addColorStop(0, '#6a6a6a');
      gradient.addColorStop(0.5, '#4a4a4a');
      gradient.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(sx, sy, stoneSize, stoneSize * 0.7, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(firePitX, firePitY + 18, pitRadius - 15, (pitRadius - 15) * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWoods() {
    for (var i = 0; i < currentWoods.length; i++) {
      var wood = currentWoods[i];
      var pos = woodPositions[i];
      if (!pos) continue;

      wood.position = { x: pos.x, y: pos.y };

      if (wood.status === Wood.STATUS.BURNING) {
        drawBurningWood(wood, pos, i);
      } else if (wood.status === Wood.STATUS.COMPLETED) {
        drawCompletedWood(wood, pos, i);
      } else {
        drawPendingWood(wood, pos);
      }
    }
  }

  function drawPendingWood(wood, pos) {
    var config = Wood.getTypeConfig(wood.woodType);
    var woodWidth = 70;
    var woodHeight = 18;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.angle - Math.PI / 2);

    var gradient = ctx.createLinearGradient(0, -woodHeight / 2, 0, woodHeight / 2);
    gradient.addColorStop(0, config.baseColor);
    gradient.addColorStop(0.5, shadeColor(config.baseColor, -20));
    gradient.addColorStop(1, shadeColor(config.baseColor, -40));
    ctx.fillStyle = gradient;
    roundRect(ctx, -woodWidth / 2, -woodHeight / 2, woodWidth, woodHeight, 4);
    ctx.fill();

    ctx.strokeStyle = shadeColor(config.baseColor, -50);
    ctx.lineWidth = 1;
    for (var i = 0; i < 5; i++) {
      var lineX = -woodWidth / 2 + 10 + i * 12;
      ctx.beginPath();
      ctx.moveTo(lineX, -woodHeight / 2 + 3);
      ctx.lineTo(lineX + 5, woodHeight / 2 - 3);
      ctx.stroke();
    }

    ctx.fillStyle = shadeColor(config.baseColor, -30);
    ctx.beginPath();
    ctx.ellipse(woodWidth / 2, 0, 5, woodHeight / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(wood.task, pos.x, pos.y - 25);

    ctx.fillStyle = 'rgba(255, 180, 100, 0.7)';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('点击点燃', pos.x, pos.y + 35);
  }

  function drawBurningWood(wood, pos, woodIndex) {
    var config = Wood.getTypeConfig(wood.woodType);
    var progress = Wood.getBurnProgress(wood);
    var woodWidth = 70;
    var woodHeight = 18;
    var burnedWidth = woodWidth * progress;
    var flameIntensity = 1 - progress * 0.5;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.angle - Math.PI / 2);

    var gradient = ctx.createLinearGradient(0, -woodHeight / 2, 0, woodHeight / 2);
    gradient.addColorStop(0, config.baseColor);
    gradient.addColorStop(0.5, shadeColor(config.baseColor, -20));
    gradient.addColorStop(1, shadeColor(config.baseColor, -40));
    ctx.fillStyle = gradient;
    roundRect(ctx, -woodWidth / 2 + burnedWidth, -woodHeight / 2, woodWidth - burnedWidth, woodHeight, 4);
    ctx.fill();

    if (burnedWidth > 0) {
      var burnGradient = ctx.createLinearGradient(0, -woodHeight / 2, 0, woodHeight / 2);
      burnGradient.addColorStop(0, config.ashColor);
      burnGradient.addColorStop(0.3, config.emberColor);
      burnGradient.addColorStop(0.5, config.burnColor);
      burnGradient.addColorStop(0.7, config.emberColor);
      burnGradient.addColorStop(1, config.ashColor);
      ctx.fillStyle = burnGradient;
      roundRect(ctx, -woodWidth / 2, -woodHeight / 2, burnedWidth, woodHeight, 4);
      ctx.fill();

      ctx.fillStyle = shadeColor(config.emberColor, 20);
      for (var i = 0; i < 3; i++) {
        var emberX = -woodWidth / 2 + 5 + i * (burnedWidth / 3);
        var emberSize = 2 + seededRandom(flameOffset * 100 + i + woodIndex * 50) * 2;
        ctx.beginPath();
        ctx.arc(emberX, 0, emberSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = shadeColor(config.baseColor, -50);
    ctx.lineWidth = 1;
    for (var j = 0; j < 5; j++) {
      var lineX = -woodWidth / 2 + 10 + j * 12;
      if (lineX > -woodWidth / 2 + burnedWidth) {
        ctx.beginPath();
        ctx.moveTo(lineX, -woodHeight / 2 + 3);
        ctx.lineTo(lineX + 5, woodHeight / 2 - 3);
        ctx.stroke();
      }
    }

    ctx.restore();

    var seed1 = flameOffset * 50 + woodIndex * 100;
    var seed2 = flameOffset * 30 + woodIndex * 80;
    var seed3 = flameOffset * 20 + woodIndex * 60;

    if (seededRandom(seed1) < 0.3 * flameIntensity) {
      ParticleSystem.createFlameParticleSeeded(pos.x, pos.y - 10, config.flameColor, flameIntensity, seed1);
    }
    if (seededRandom(seed2) < 0.15) {
      ParticleSystem.createEmberParticleSeeded(pos.x, pos.y - 15, config.particleColor, seed2);
    }
    if (seededRandom(seed3) < 0.05) {
      ParticleSystem.createSmokeParticleSeeded(pos.x, pos.y - 15, seed3);
    }

    drawWoodGlow(pos.x, pos.y, config.flameColor, flameIntensity);

    ctx.fillStyle = '#fff';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(wood.task, pos.x, pos.y - 35);

    ctx.fillStyle = config.flameColor;
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillText(Wood.formatTime(Wood.getRemainingTime(wood)), pos.x, pos.y - 22);

    if (wood.boostCount > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText('👏 x' + wood.boostCount, pos.x, pos.y + 35);
    }
  }

  function drawCompletedWood(wood, pos, woodIndex) {
    var config = Wood.getTypeConfig(wood.woodType);
    var woodWidth = 70;
    var woodHeight = 18;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.angle - Math.PI / 2);

    ctx.fillStyle = config.ashColor;
    roundRect(ctx, -woodWidth / 2, -woodHeight / 2, woodWidth, woodHeight, 4);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    for (var i = 0; i < 4; i++) {
      var ashX = -woodWidth / 2 + 15 + i * 15;
      var ashY = (seededRandom(i + woodIndex * 10) - 0.5) * 6;
      var ashSize = 3 + seededRandom(i * 2 + woodIndex * 10) * 3;
      ctx.beginPath();
      ctx.arc(ashX, ashY, ashSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(wood.task + ' ✓', pos.x, pos.y - 25);
  }

  function drawWoodGlow(x, y, color, intensity) {
    var glowSize = 40 * intensity;
    var gradient = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, glowSize);
    gradient.addColorStop(0, color + '60');
    gradient.addColorStop(0.5, color + '20');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y - 10, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFire() {
    var hasBurning = currentWoods.some(function (w) { return w.status === Wood.STATUS.BURNING; });
    var baseIntensity = hasBurning ? 0.6 : 0.3;

    var flameHeight = 60 + Math.sin(flameOffset) * 10 + Math.sin(flameOffset * 2) * 5;
    var flameWidth = 40 + Math.sin(flameOffset * 1.5) * 8;

    var gradient = ctx.createRadialGradient(firePitX, firePitY - flameHeight / 2, 0, firePitX, firePitY - flameHeight / 2, flameHeight);
    gradient.addColorStop(0, 'rgba(255, 200, 100, ' + (baseIntensity * 0.8) + ')');
    gradient.addColorStop(0.3, 'rgba(255, 140, 50, ' + (baseIntensity * 0.6) + ')');
    gradient.addColorStop(0.6, 'rgba(255, 80, 20, ' + (baseIntensity * 0.3) + ')');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(firePitX, firePitY - flameHeight / 2, flameWidth, flameHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hasBurning) {
      for (var i = 0; i < 3; i++) {
        var flickerX = Math.sin(flameOffset * 2 + i) * 10;
        var flickerH = flameHeight * (0.6 + seededRandom(flameOffset * 10 + i * 5) * 0.4);
        var flickerW = flameWidth * (0.4 + seededRandom(flameOffset * 8 + i * 3) * 0.3);

        var innerGradient = ctx.createRadialGradient(
          firePitX + flickerX, firePitY - flickerH / 2, 0,
          firePitX + flickerX, firePitY - flickerH / 2, flickerH
        );
        innerGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        innerGradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.7)');
        innerGradient.addColorStop(0.5, 'rgba(255, 140, 50, 0.4)');
        innerGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.ellipse(firePitX + flickerX, firePitY - flickerH / 2, flickerW, flickerH, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    var emberSeed = flameOffset * 5;
    if (seededRandom(emberSeed) < baseIntensity * 0.5) {
      var emberX = firePitX + (seededRandom(emberSeed + 1) - 0.5) * 30;
      var emberY = firePitY - 20;
      ParticleSystem.createEmberParticleSeeded(emberX, emberY, '#FFA500', emberSeed);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function shadeColor(color, percent) {
    var num = parseInt(color.replace('#', ''), 16);
    var amt = Math.round(2.55 * percent);
    var R = (num >> 16) + amt;
    var G = (num >> 8 & 0x00FF) + amt;
    var B = (num & 0x0000FF) + amt;
    R = Math.max(Math.min(255, R), 0);
    G = Math.max(Math.min(255, G), 0);
    B = Math.max(Math.min(255, B), 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  function celebrateAt(x, y) {
    ParticleSystem.createCelebrationParticles(x, y);
  }

  function destroy() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener('resize', resize);
  }

  return {
    init: init,
    updateWoods: updateWoods,
    celebrateAt: celebrateAt,
    forceSaveAnimationState: forceSaveAnimationState,
    destroy: destroy
  };
})();