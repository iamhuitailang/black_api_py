var Render = (function() {
  var canvas, ctx;
  var bgOffset = 0;
  var LOGIC_W = 800;
  var LOGIC_H = 600;

  function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
  }

  function clear() {
    ctx.clearRect(0, 0, LOGIC_W, LOGIC_H);
  }

  function drawBackground(gameSpeed, deltaTime) {
    var w = LOGIC_W;
    var h = LOGIC_H;

    var gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, CONFIG.COLORS.SKY_TOP);
    gradient.addColorStop(0.4, CONFIG.COLORS.SKY_BOTTOM);
    gradient.addColorStop(1, '#e8a060');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    var sunX = w * 0.78;
    var sunY = 120;
    var sunRadius = 55;

    var glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3);
    glowGradient.addColorStop(0, 'rgba(255, 220, 100, 0.4)');
    glowGradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.2)');
    glowGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = CONFIG.COLORS.SUN;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    bgOffset = (bgOffset + gameSpeed * 0.3) % 400;

    ctx.fillStyle = CONFIG.COLORS.SAND_DUNE;
    for (var i = -1; i < 4; i++) {
      var duneX = i * 400 - bgOffset * 0.3;
      drawDune(duneX, 280, 250, 80, CONFIG.COLORS.SAND_DUNE);
    }

    ctx.fillStyle = '#a0724a';
    for (var j = -1; j < 4; j++) {
      var duneX2 = j * 350 - bgOffset * 0.5 + 100;
      drawDune(duneX2, 340, 200, 60, '#a0724a');
    }

    ctx.fillStyle = '#8b6b3a';
    for (var k = -1; k < 5; k++) {
      var duneX3 = k * 300 - bgOffset * 0.7 + 50;
      drawDune(duneX3, 400, 180, 50, '#8b6b3a');
    }

    var groundY = CONFIG.GROUND.Y;
    var groundGradient = ctx.createLinearGradient(0, groundY, 0, h);
    groundGradient.addColorStop(0, CONFIG.COLORS.GROUND_TOP);
    groundGradient.addColorStop(0.5, CONFIG.COLORS.GROUND_MIDDLE);
    groundGradient.addColorStop(1, CONFIG.COLORS.GROUND_BOTTOM);
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, w, h - groundY);

    ctx.fillStyle = CONFIG.COLORS.ROAD;
    ctx.fillRect(0, groundY - 20, w, 30);

    var roadOffset = bgOffset % 80;
    ctx.strokeStyle = CONFIG.COLORS.ROAD_LINE;
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 30]);
    ctx.lineDashOffset = -roadOffset;
    ctx.beginPath();
    ctx.moveTo(0, groundY - 5);
    ctx.lineTo(w, groundY - 5);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (var m = 0; m < 20; m++) {
      var rockX = ((m * 73 - bgOffset * 0.8) % (w + 100)) - 50;
      var rockY = groundY + 20 + (m % 3) * 25;
      ctx.beginPath();
      ctx.ellipse(rockX, rockY, 3 + (m % 3), 2 + (m % 2), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDune(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.quadraticCurveTo(x + width * 0.3, y - height * 0.3, x + width * 0.5, y);
    ctx.quadraticCurveTo(x + width * 0.7, y + height * 0.2, x + width, y + height);
    ctx.closePath();
    ctx.fill();
  }

  function drawCarriage(carriage) {
    var x = carriage.x;
    var y = carriage.y;
    var type = carriage.type;

    if (carriage.invincible && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (carriage.shielded) {
      ctx.strokeStyle = 'rgba(65, 105, 225, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y + carriage.height / 2, carriage.width * 0.7, carriage.height * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(135, 206, 235, 0.3)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(x, y + carriage.height / 2, carriage.width * 0.75, carriage.height * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(x, y);

    var bodyW = 70;
    var bodyH = 40;
    var bodyX = -bodyW / 2;
    var bodyY = 15;

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.moveTo(bodyX, bodyY + bodyH);
    ctx.lineTo(bodyX, bodyY + 10);
    ctx.lineTo(bodyX + 10, bodyY);
    ctx.lineTo(bodyX + bodyW - 10, bodyY);
    ctx.lineTo(bodyX + bodyW, bodyY + 10);
    ctx.lineTo(bodyX + bodyW, bodyY + bodyH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = type.accentColor;
    ctx.fillRect(bodyX + 5, bodyY + 5, bodyW - 10, 8);

    ctx.fillStyle = '#1a0f0a';
    var windowW = 15;
    var windowH = 18;
    var windowY = bodyY + 18;
    for (var wi = 0; wi < 3; wi++) {
      var wx = bodyX + 8 + wi * (windowW + 5);
      ctx.fillRect(wx, windowY, windowW, windowH);
    }

    ctx.fillStyle = type.accentColor;
    ctx.fillRect(bodyX - 5, bodyY + bodyH - 5, bodyW + 10, 8);

    var wheelY = bodyY + bodyH + 5;
    var wheelRadius = 12;
    var wheelOffset = Math.sin(carriage.animFrame * Math.PI / 2) * 3;

    drawWheel(bodyX + 12, wheelY + wheelOffset, wheelRadius, type.wheelColor, carriage.animFrame);
    drawWheel(bodyX + bodyW - 12, wheelY + wheelOffset, wheelRadius, type.wheelColor, carriage.animFrame);

    var horseX = bodyX + bodyW + 15;
    var horseY = bodyY + 15;
    drawHorse(horseX, horseY, carriage.animFrame);

    ctx.restore();

    if (carriage.boosted) {
      for (var p = 0; p < 5; p++) {
        var px = x - 30 - p * 10 - Math.random() * 5;
        var py = y + 30 + Math.random() * 20;
        ctx.fillStyle = 'rgba(255, ' + Math.floor(100 + Math.random() * 100) + ', 0, ' + (0.6 - p * 0.1) + ')';
        ctx.beginPath();
        ctx.arc(px, py, 4 - p * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }

  function drawWheel(x, y, radius, color, animFrame) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8b6b3a';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (var i = 0; i < 4; i++) {
      var angle = (i * Math.PI / 2) + (animFrame * Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * radius * 0.55, y + Math.sin(angle) * radius * 0.55);
      ctx.stroke();
    }
  }

  function drawHorse(x, y, animFrame) {
    var bounce = Math.sin(animFrame * Math.PI / 2) * 2;

    ctx.fillStyle = '#5c3d1a';
    ctx.beginPath();
    ctx.ellipse(x, y + bounce, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x + 8, y - 12 + bounce, 7, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 16 + bounce);
    ctx.lineTo(x + 8, y - 22 + bounce);
    ctx.lineTo(x + 4, y - 16 + bounce);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - 2, y - 16 + bounce);
    ctx.lineTo(x + 2, y - 22 + bounce);
    ctx.lineTo(x, y - 16 + bounce);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4a2f15';
    var legOffset = Math.sin(animFrame * Math.PI / 2) * 5;
    ctx.fillRect(x - 8, y + 10, 4, 15 + legOffset);
    ctx.fillRect(x + 4, y + 10, 4, 15 - legOffset);

    ctx.strokeStyle = '#3d2510';
    ctx.lineWidth = 1;
    for (var mi = 0; mi < 5; mi++) {
      ctx.beginPath();
      ctx.moveTo(x - 3 - mi, y - 18 + bounce);
      ctx.lineTo(x - 5 - mi, y - 25 + bounce - mi);
      ctx.stroke();
    }
  }

  function drawObstacle(obstacle) {
    var type = obstacle.type;

    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    switch (obstacle.typeId) {
      case 'rock':
        drawRock(obstacle, type);
        break;
      case 'pit':
        drawPit(obstacle, type);
        break;
      case 'post':
        drawPost(obstacle, type);
        break;
      case 'beast':
        drawBeast(obstacle, type);
        break;
    }

    ctx.restore();
  }

  function drawRock(obstacle, type) {
    var w = obstacle.width;
    var h = obstacle.height;

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.moveTo(-w / 2, h);
    ctx.lineTo(-w / 2 + 8, h * 0.3);
    ctx.lineTo(-w / 4, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(w / 4, 5);
    ctx.lineTo(w / 2 - 5, h * 0.4);
    ctx.lineTo(w / 2, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = type.accentColor;
    ctx.beginPath();
    ctx.moveTo(-w / 4, 5);
    ctx.lineTo(-w / 6, h * 0.15);
    ctx.lineTo(0, 10);
    ctx.lineTo(w / 6, h * 0.2);
    ctx.lineTo(w / 5, 15);
    ctx.closePath();
    ctx.fill();
  }

  function drawPit(obstacle, type) {
    var w = obstacle.width;
    var h = 40;
    var y = CONFIG.GROUND.Y - obstacle.y;

    ctx.fillStyle = '#0a0500';
    ctx.fillRect(-w / 2, 0, w, h + 30);

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2 + 10, h + 30);
    ctx.lineTo(w / 2 - 10, h + 30);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3d2510';
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 5, -5);
    ctx.lineTo(-w / 2, 10);
    ctx.lineTo(-w / 2 + 5, -3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w / 2 + 5, -5);
    ctx.lineTo(w / 2, 10);
    ctx.lineTo(w / 2 - 5, -3);
    ctx.closePath();
    ctx.fill();
  }

  function drawPost(obstacle, type) {
    var w = obstacle.width;
    var h = obstacle.height;

    ctx.fillStyle = type.color;
    ctx.fillRect(-w / 2, 0, w, h);

    ctx.fillStyle = type.accentColor;
    ctx.fillRect(-w / 2, 0, w / 4, h);

    ctx.strokeStyle = '#5c3d1a';
    ctx.lineWidth = 2;
    for (var i = 0; i < 4; i++) {
      var ry = 15 + i * 20;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 3, ry);
      ctx.lineTo(w / 2 - 3, ry);
      ctx.stroke();
    }

    ctx.fillStyle = '#a0522d';
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBeast(obstacle, type) {
    var w = obstacle.width;
    var h = obstacle.height;
    var bounce = Math.sin(obstacle.animFrame * Math.PI / 2) * 3;

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.5 + bounce, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = type.accentColor;
    ctx.beginPath();
    ctx.ellipse(w * 0.3, h * 0.3 + bounce, w * 0.2, h * 0.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.25 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(w * 0.37, h * 0.25 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5c0000';
    var legOffset = Math.sin(obstacle.animFrame * Math.PI / 2) * 6;
    ctx.fillRect(-w * 0.2, h * 0.6, 6, 18 + legOffset);
    ctx.fillRect(w * 0.1, h * 0.6, 6, 18 - legOffset);
  }

  function drawItem(item) {
    var type = item.type;
    var y = item.getBobY();

    ctx.save();
    ctx.translate(item.x, y);

    switch (item.typeId) {
      case 'coin':
        drawCoin(item, type);
        break;
      case 'shield':
        drawShield(item, type);
        break;
      case 'boost':
        drawBoost(item, type);
        break;
      case 'heart':
        drawHeart(item, type);
        break;
    }

    ctx.restore();
  }

  function drawCoin(item, type) {
    var r = 12;
    var spin = Math.abs(Math.sin(Date.now() * 0.005));
    var scaleX = 0.3 + spin * 0.7;

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * scaleX, r, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = type.accentColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * scaleX * 0.7, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (scaleX > 0.5) {
      ctx.fillStyle = type.color;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
    }
  }

  function drawShield(item, type) {
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(12, -8);
    ctx.lineTo(10, 12);
    ctx.lineTo(0, 16);
    ctx.lineTo(-10, 12);
    ctx.lineTo(-12, -8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = type.accentColor;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, -5);
    ctx.lineTo(6, 8);
    ctx.lineTo(0, 11);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-8, -5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 8);
    ctx.moveTo(-5, 1);
    ctx.lineTo(5, 1);
    ctx.stroke();
  }

  function drawBoost(item, type) {
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.moveTo(-5, -14);
    ctx.lineTo(8, -2);
    ctx.lineTo(2, -2);
    ctx.lineTo(6, 14);
    ctx.lineTo(-8, 2);
    ctx.lineTo(-2, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = type.accentColor;
    ctx.beginPath();
    ctx.moveTo(-3, -10);
    ctx.lineTo(5, -2);
    ctx.lineTo(1, -2);
    ctx.lineTo(3, 10);
    ctx.lineTo(-5, 2);
    ctx.lineTo(-1, 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawHeart(item, type) {
    ctx.fillStyle = type.color;
    ctx.beginPath();
    var s = 12;
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(0, -s * 0.3, -s, -s * 0.3, -s, 0);
    ctx.bezierCurveTo(-s, s * 0.4, 0, s * 0.7, 0, s);
    ctx.bezierCurveTo(0, s * 0.7, s, s * 0.4, s, 0);
    ctx.bezierCurveTo(s, -s * 0.3, 0, -s * 0.3, 0, s * 0.3);
    ctx.fill();

    ctx.fillStyle = type.accentColor;
    ctx.beginPath();
    var s2 = 7;
    ctx.moveTo(0, s2 * 0.3);
    ctx.bezierCurveTo(0, -s2 * 0.3, -s2, -s2 * 0.3, -s2, 0);
    ctx.bezierCurveTo(-s2, s2 * 0.4, 0, s2 * 0.6, 0, s2 * 0.8);
    ctx.bezierCurveTo(0, s2 * 0.6, s2, s2 * 0.4, s2, 0);
    ctx.bezierCurveTo(s2, -s2 * 0.3, 0, -s2 * 0.3, 0, s2 * 0.3);
    ctx.fill();
  }

  function drawParticles(particles) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.getAlpha();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD(game) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    roundRect(ctx, 10, 10, 260, 100, 10);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    roundRect(ctx, 10, 10, 260, 100, 10);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 26px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('分数: ' + game.score, 25, 18);

    ctx.fillStyle = '#fff5e1';
    ctx.font = 'bold 20px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.fillText('距离: ' + Math.floor(game.distance) + ' 米', 25, 52);

    ctx.fillStyle = '#c4965a';
    ctx.font = '16px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.fillText('最高: ' + game.highScore + ' / ' + game.highDistance + 'm', 25, 82);

    var panelX = CONFIG.CANVAS.WIDTH - 270;
    var panelY = 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    roundRect(ctx, panelX, panelY, 260, 100, 10);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    roundRect(ctx, panelX, panelY, 260, 100, 10);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.fillText('生命值', panelX + 20, panelY + 18);

    for (var i = 0; i < game.carriage.maxHp; i++) {
      var hx = panelX + 20 + i * 40;
      var hy = panelY + 50;
      if (i < game.carriage.hp) {
        drawBigHeart(hx, hy, '#ff1493', '#ff69b4');
      } else {
        drawBigHeart(hx, hy, '#333', '#555');
      }
    }

    var speedKmh = Math.floor(game.gameSpeed * 15);
    ctx.fillStyle = '#87CEEB';
    ctx.font = 'bold 18px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.fillText('速度: ' + speedKmh + ' km/h', panelX + 20, panelY + 78);

    if (game.carriage.boosted) {
      ctx.fillStyle = '#ff4500';
      ctx.font = 'bold 14px "Microsoft YaHei", "SimHei", sans-serif';
      ctx.fillText('加速中!', panelX + 160, panelY + 78);
    }

    if (game.carriage.shielded) {
      ctx.fillStyle = '#4169E1';
      ctx.font = 'bold 16px "Microsoft YaHei", "SimHei", sans-serif';
      ctx.fillText('护盾', panelX + 160, panelY + 18);
    }

    ctx.restore();
  }

  function drawSmallHeart(x, y, color) {
    ctx.fillStyle = color;
    var s = 8;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y - s * 0.3, x - s, y - s * 0.3, x - s, y);
    ctx.bezierCurveTo(x - s, y + s * 0.4, x, y + s * 0.7, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.7, x + s, y + s * 0.4, x + s, y);
    ctx.bezierCurveTo(x + s, y - s * 0.3, x, y - s * 0.3, x, y + s * 0.3);
    ctx.fill();
  }

  function drawBigHeart(x, y, color, accentColor) {
    var s = 16;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y - s * 0.3, x - s, y - s * 0.3, x - s, y);
    ctx.bezierCurveTo(x - s, y + s * 0.4, x, y + s * 0.7, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.7, x + s, y + s * 0.4, x + s, y);
    ctx.bezierCurveTo(x + s, y - s * 0.3, x, y - s * 0.3, x, y + s * 0.3);
    ctx.fill();

    ctx.fillStyle = accentColor;
    var s2 = 8;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 2 + s2 * 0.3);
    ctx.bezierCurveTo(x - 4, y - 2 - s2 * 0.3, x - 4 - s2, y - 2 - s2 * 0.3, x - 4 - s2, y - 2);
    ctx.bezierCurveTo(x - 4 - s2, y - 2 + s2 * 0.4, x - 4, y - 2 + s2 * 0.6, x - 4, y - 2 + s2 * 0.8);
    ctx.bezierCurveTo(x - 4, y - 2 + s2 * 0.6, x - 4 + s2, y - 2 + s2 * 0.4, x - 4 + s2, y - 2);
    ctx.bezierCurveTo(x - 4 + s2, y - 2 - s2 * 0.3, x - 4, y - 2 - s2 * 0.3, x - 4, y - 2 + s2 * 0.3);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x - 4, y + 2, 3, 5, -0.5, 0, Math.PI * 2);
    ctx.fill();
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

  function drawJumpIndicator(carriage) {
    if (!Input.isJumpHeld() || !carriage.isOnGround) return;

    var holdTime = Input.getJumpCharge();
    if (holdTime < 100) return;

    var maxHold = 500;
    var progress = Math.min(holdTime / maxHold, 1);

    var barX = carriage.x - 35;
    var barY = carriage.y - 20;
    var barW = 70;
    var barH = 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    var gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(0.5, '#FFC107');
    gradient.addColorStop(1, '#F44336');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barW * progress, barH);
  }

  return {
    init: init,
    clear: clear,
    drawBackground: drawBackground,
    drawCarriage: drawCarriage,
    drawObstacle: drawObstacle,
    drawItem: drawItem,
    drawParticles: drawParticles,
    drawHUD: drawHUD,
    drawJumpIndicator: drawJumpIndicator,
    roundRect: roundRect
  };
})();
