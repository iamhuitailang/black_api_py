var Renderer = (function() {
  var ctx;
  var canvas;
  var dpr;
  var displayW = 0;
  var displayH = 0;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    displayW = canvas.clientWidth;
    displayH = canvas.clientHeight;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getWidth() { return displayW; }
  function getHeight() { return displayH; }

  function clear() {
    ctx.clearRect(0, 0, displayW, displayH);
  }

  function drawBackground() {
    var gradient = ctx.createLinearGradient(0, 0, 0, displayH);
    gradient.addColorStop(0, GameConfig.COLORS.bgTop);
    gradient.addColorStop(0.5, GameConfig.COLORS.bgMid);
    gradient.addColorStop(1, GameConfig.COLORS.bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, displayW, displayH);

    var sparkleCount = 30;
    for (var i = 0; i < sparkleCount; i++) {
      var seed = i * 137.5;
      var sx = ((seed * 13.37) % displayW + displayW) % displayW;
      var sy = ((seed * 7.91) % displayH + displayH) % displayH;
      var ss = 1 + (i % 3);
      ctx.save();
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, ss, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawStage() {
    var floorY = displayH * 0.75;
    var floorGradient = ctx.createLinearGradient(0, floorY, 0, displayH);
    floorGradient.addColorStop(0, GameConfig.COLORS.stageFloorLight);
    floorGradient.addColorStop(1, GameConfig.COLORS.stageFloor);
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, floorY, displayW, displayH - floorY);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (var i = 0; i < 8; i++) {
      var lx = (displayW / 8) * i + displayW / 16;
      ctx.beginPath();
      ctx.moveTo(lx, floorY);
      ctx.lineTo(lx - 20, displayH);
      ctx.lineTo(lx + 20, displayH);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(displayW, floorY);
    ctx.stroke();
  }

  function drawHat(h, time) {
    var bounce = Math.sin(time * 0.002 + h.bouncePhase) * 2;
    var shakeX = 0;
    var shakeY = bounce;

    if (h.animating) {
      shakeX = Math.sin(time * 0.03 + h.shakePhase) * 2;
    }

    var cx = h.x + shakeX;
    var cy = h.y + shakeY - h.liftOffset;
    var s = h.size;
    var flipScale = Math.cos(h.flipProgress * Math.PI * 0.5);

    ctx.save();
    ctx.translate(cx, cy);

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.25, s * 0.45, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.scale(1, flipScale);

    var hatGradient = ctx.createLinearGradient(-s * 0.4, -s * 0.3, s * 0.4, s * 0.1);
    hatGradient.addColorStop(0, GameConfig.COLORS.hatBodyLight);
    hatGradient.addColorStop(0.5, GameConfig.COLORS.hatBody);
    hatGradient.addColorStop(1, '#4a148c');

    ctx.fillStyle = hatGradient;
    ctx.beginPath();
    ctx.moveTo(-s * 0.38, -s * 0.3);
    ctx.lineTo(s * 0.38, -s * 0.3);
    ctx.lineTo(s * 0.32, s * 0.05);
    ctx.lineTo(-s * 0.32, s * 0.05);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = hatGradient;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.48, s * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = GameConfig.COLORS.hatBand;
    ctx.fillRect(-s * 0.34, -s * 0.12, s * 0.68, s * 0.08);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(s * 0.2, -s * 0.08, s * 0.06, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, -s * 0.2, s * 0.12, s * 0.04, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (flipScale < 0.3) {
      drawHatInside(h, time);
    }

    ctx.restore();
  }

  function drawHatInside(h, time) {
    var s = h.size;
    ctx.fillStyle = GameConfig.COLORS.hatInside;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.32, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    if (h.opened && h.type === GameConfig.HAT_TYPES.RABBIT) {
      drawRabbit(0, s * 0.02, s * 0.3, time, false, h.found);
    } else if (h.opened && h.type === GameConfig.HAT_TYPES.FAKE) {
      drawRabbit(0, s * 0.02, s * 0.28, time, true, false);
    }

    if (h.state === GameConfig.HAT_STATES.OPENING && h.flipProgress > 0.3) {
      var glowAlpha = (h.flipProgress - 0.3) / 0.7;
      ctx.save();
      ctx.globalAlpha = glowAlpha * 0.5;
      var glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.5);
      if (h.type === GameConfig.HAT_TYPES.RABBIT) {
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else if (h.type === GameConfig.HAT_TYPES.FAKE) {
        glowGradient.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
        glowGradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
      }
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawRabbit(x, y, size, time, isFake, found) {
    var bounce = Math.sin(time * 0.005) * 3;
    var bob = found ? Math.sin(time * 0.004) * 8 : bounce;

    ctx.save();
    ctx.translate(x, y + bob);

    var bodyColor = isFake ? GameConfig.COLORS.fakeBody : GameConfig.COLORS.rabbitBody;
    var innerColor = isFake ? GameConfig.COLORS.fakeInner : GameConfig.COLORS.rabbitInner;
    var cheekColor = isFake ? GameConfig.COLORS.fakeCheek : GameConfig.COLORS.rabbitCheek;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.1, size * 0.45, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.15, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(-size * 0.2, -size * 0.2, size * 0.12, size * 0.3, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.2, -size * 0.2, size * 0.12, size * 0.3, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cheekColor;
    ctx.beginPath();
    ctx.ellipse(-size * 0.2, -size * 0.15, size * 0.06, size * 0.18, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.2, -size * 0.15, size * 0.06, size * 0.18, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -size * 0.25, size * 0.28, 0, Math.PI * 2);
    ctx.fill();

    if (!isFake) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-size * 0.1, -size * 0.28, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.1, -size * 0.28, size * 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-size * 0.1, -size * 0.28, size * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.1, -size * 0.28, size * 0.04, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-size * 0.08, -size * 0.3, size * 0.015, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.12, -size * 0.3, size * 0.015, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff69b4';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.2);
      ctx.lineTo(-size * 0.04, -size * 0.16);
      ctx.lineTo(size * 0.04, -size * 0.16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = cheekColor;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(-size * 0.18, -size * 0.15, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.18, -size * 0.15, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(-size * 0.1, -size * 0.28, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.1, -size * 0.28, size * 0.06, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#888';
      ctx.lineWidth = Math.max(1, size * 0.02);
      ctx.beginPath();
      ctx.moveTo(-size * 0.14, -size * 0.36);
      ctx.lineTo(-size * 0.06, -size * 0.34);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * 0.14, -size * 0.36);
      ctx.lineTo(size * 0.06, -size * 0.34);
      ctx.stroke();

      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.18, size * 0.04, size * 0.025, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#777';
      ctx.lineWidth = Math.max(1, size * 0.015);
      ctx.beginPath();
      ctx.arc(0, -size * 0.12, size * 0.06, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.fillStyle = '#aaa';
      ctx.font = Math.floor(size * 0.25) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('X', 0, -size * 0.05);
    }

    ctx.restore();
  }

  function drawHUD(level, score, hp, maxHp, timeLeft, totalTime, rabbitsFound, totalRabbits) {
    var hudH = 70;
    ctx.fillStyle = GameConfig.COLORS.hudBg;
    roundRect(ctx, 10, 10, displayW - 20, hudH, 15);
    ctx.fill();

    ctx.strokeStyle = GameConfig.COLORS.hudBorder;
    ctx.lineWidth = 2;
    roundRect(ctx, 10, 10, displayW - 20, hudH, 15);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillText('第', 25, 32);
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(level + '', 50, 32);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('层', 50 + (level > 9 ? 30 : 20), 32);

    var diffLabel = GameConfig.getDifficultyLabel(level);
    ctx.fillStyle = '#ff80ab';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('[' + diffLabel + ']', 25, 58);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('得分', displayW * 0.32, 25);
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(score + '', displayW * 0.32, 50);

    var timeRatio = timeLeft / totalTime;
    var timeColor;
    if (timeRatio > 0.5) timeColor = GameConfig.COLORS.timerNormal;
    else if (timeRatio > 0.2) timeColor = GameConfig.COLORS.timerWarning;
    else timeColor = GameConfig.COLORS.timerDanger;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('时间', displayW * 0.52, 25);
    ctx.fillStyle = timeColor;
    ctx.font = 'bold 24px sans-serif';
    var mins = Math.floor(timeLeft / 60);
    var secs = Math.floor(timeLeft % 60);
    ctx.fillText(mins + ':' + (secs < 10 ? '0' : '') + secs, displayW * 0.52, 52);

    var barW = 80;
    var barH = 8;
    var barX = displayW * 0.52 - barW / 2;
    var barY = 62;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();
    ctx.fillStyle = timeColor;
    roundRect(ctx, barX, barY, barW * Math.max(0, timeRatio), barH, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('生命', displayW * 0.72, 25);
    for (var i = 0; i < maxHp; i++) {
      var hx = displayW * 0.72 - (maxHp * 14) + i * 28;
      var hy = 50;
      drawHeart(ctx, hx, hy, 10, i < hp ? GameConfig.COLORS.hpFull : GameConfig.COLORS.hpEmpty);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('兔子', displayW * 0.9, 25);
    ctx.fillStyle = '#f8bbd0';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(rabbitsFound + '/' + totalRabbits, displayW * 0.9, 52);
  }

  function drawHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    var s = size;
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.3);
    ctx.bezierCurveTo(x - s, y + s * 0.7, x, y + s, x, y + s * 1.1);
    ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.7, x + s, y + s * 0.3);
    ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3);
    ctx.fill();
    ctx.restore();
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

  function drawCountdown(num) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, displayW, displayH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#c2185b';
    ctx.shadowBlur = 30;
    ctx.fillText(num, displayW / 2, displayH / 2);
    ctx.restore();
  }

  function drawLevelIntro(level) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, displayW, displayH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ff80ab';
    ctx.fillText('第 ' + level + ' 层', displayW / 2, displayH / 2 - 30);

    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#fff';
    var diff = GameConfig.getDifficultyLabel(level);
    ctx.fillText('难度：' + diff, displayW / 2, displayH / 2 + 20);
    ctx.restore();
  }

  return {
    init: init,
    resize: resize,
    getWidth: getWidth,
    getHeight: getHeight,
    clear: clear,
    drawBackground: drawBackground,
    drawStage: drawStage,
    drawHat: drawHat,
    drawRabbit: drawRabbit,
    drawHUD: drawHUD,
    drawCountdown: drawCountdown,
    drawLevelIntro: drawLevelIntro
  };
})();
