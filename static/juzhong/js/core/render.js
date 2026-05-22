var Render = (function() {
  var canvas = null;
  var ctx = null;
  var width = 0;
  var height = 0;
  var dpr = 1;

  var platform = {
    x: 0,
    y: 0,
    width: 360,
    height: 16
  };

  function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clear() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
  }

  function drawBackground() {
    if (!ctx) return;

    var gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#120810');
    gradient.addColorStop(0.3, '#1e0a18');
    gradient.addColorStop(0.55, '#140816');
    gradient.addColorStop(0.8, '#0a0a14');
    gradient.addColorStop(1, '#04040a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawSpotlights();
    drawArenaBackwall();
    drawAudienceSilhouette();
    drawTopBanner();
  }

  function drawSpotlights() {
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    var cx = width / 2;
    var spots = [
      { x: cx - width * 0.28, color: 'rgba(255,80,100,0.10)' },
      { x: cx, color: 'rgba(255,180,80,0.08)' },
      { x: cx + width * 0.28, color: 'rgba(100,160,255,0.08)' }
    ];

    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      var grad = ctx.createRadialGradient(s.x, 20, 0, s.x, height * 0.6, 320);
      grad.addColorStop(0, s.color);
      grad.addColorStop(0.5, 'rgba(0,0,0,0.02)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  function drawArenaBackwall() {
    if (!ctx) return;

    var wallTop = height * 0.08;
    var wallBottom = height * 0.52;

    var wallGrad = ctx.createLinearGradient(0, wallTop, 0, wallBottom);
    wallGrad.addColorStop(0, 'rgba(35,8,22,0.6)');
    wallGrad.addColorStop(0.5, 'rgba(22,6,15,0.8)');
    wallGrad.addColorStop(1, 'rgba(12,4,8,0.9)');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, wallTop, width, wallBottom - wallTop);

    ctx.strokeStyle = 'rgba(80,15,30,0.15)';
    ctx.lineWidth = 1;
    for (var y = Math.floor(wallTop); y < wallBottom; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(60,10,25,0.12)';
    for (var x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, wallTop);
      ctx.lineTo(x, wallBottom);
      ctx.stroke();
    }
  }

  function drawAudienceSilhouette() {
    if (!ctx) return;

    var baseY = height * 0.50;

    ctx.fillStyle = 'rgba(5,5,10,0.93)';
    ctx.beginPath();
    ctx.moveTo(0, baseY + 60);
    for (var x = 0; x <= width; x += 12) {
      var n = Math.sin(x * 0.04) * 16 + Math.sin(x * 0.09) * 8 + Math.sin(x * 0.18) * 4;
      ctx.lineTo(x, baseY + n);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(3,3,8,0.97)';
    ctx.beginPath();
    ctx.moveTo(0, baseY + 38);
    for (var x2 = 0; x2 <= width; x2 += 18) {
      var n2 = Math.sin(x2 * 0.03 + 1) * 22 + Math.sin(x2 * 0.065) * 8;
      ctx.lineTo(x2, baseY + 32 + n2);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var s = 0; s < 8; s++) {
      var lx = (s + 0.5) * (width / 8);
      var ly = baseY + 15 + Math.sin(s * 1.5) * 8;
      var spotGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 45);
      spotGrad.addColorStop(0, 'rgba(255,60,90,0.05)');
      spotGrad.addColorStop(1, 'rgba(255,60,90,0)');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(lx - 45, ly - 45, 90, 90);
    }
    ctx.restore();
  }

  function drawTopBanner() {
    if (!ctx) return;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.font = 'bold 11px "Hiragino Sans", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('第28回 オリンピック 重量挙げ', width / 2, 20);

    ctx.globalAlpha = 0.18;
    ctx.font = '9px sans-serif';
    ctx.fillStyle = 'rgba(233,69,96,0.5)';
    ctx.fillText('IWF CHAMPIONSHIP 2026', width / 2, 35);
    ctx.restore();
  }

  function drawPlatform() {
    if (!ctx) return;

    platform.width = Math.min(380, width * 0.4);
    platform.x = width / 2 - platform.width / 2;
    platform.y = height * 0.72;

    ctx.fillStyle = '#351a08';
    ctx.fillRect(platform.x - 10, platform.y + platform.height + 3, platform.width + 20, 8);

    ctx.fillStyle = '#6b3a14';
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    ctx.fillStyle = '#5a2f0e';
    var plankCount = 10;
    for (var i = 0; i < plankCount; i++) {
      var px = platform.x + i * (platform.width / plankCount);
      ctx.fillRect(px, platform.y, 1, platform.height);
    }

    ctx.fillStyle = '#8a5828';
    ctx.fillRect(platform.x, platform.y - 4, platform.width, 4);

    ctx.fillStyle = 'rgba(255,210,170,0.06)';
    ctx.fillRect(platform.x, platform.y - 4, platform.width, 2);

    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(platform.x - 2, platform.y - 6, platform.width + 4, platform.height + 8);

    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IWF', platform.x + 18, platform.y - 9);
    ctx.fillText('IWF', platform.x + platform.width - 18, platform.y - 9);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var matGrad = ctx.createRadialGradient(
      width / 2, platform.y + 6, 0,
      width / 2, platform.y + 6, platform.width * 0.65
    );
    matGrad.addColorStop(0, 'rgba(255,70,100,0.06)');
    matGrad.addColorStop(1, 'rgba(255,70,100,0)');
    ctx.fillStyle = matGrad;
    ctx.fillRect(0, platform.y - 18, width, platform.height + 36);
    ctx.restore();
  }

  function drawAthlete(liftState, isPlayer) {
    if (!ctx) return;

    var cx = width / 2;
    var groundY = platform.y;
    var barHeight = liftState.barHeight || 0;
    var phase = liftState.phase;

    var shake = (Math.random() - 0.5) * (liftState.shakeAmount || 0);

    var baseY = groundY - 8;
    var bodyH = 58;
    var armLen = 42;

    var armAng = 0;
    var legAng = 0;
    var torsoY = baseY - bodyH / 2;
    var squatOffset = 0;

    switch (phase) {
      case 'pull':
        armAng = -0.35 + Math.min(0.4, barHeight / 600);
        torsoY -= Math.min(barHeight * 0.12, 30);
        break;
      case 'squat':
      case 'dip':
        armAng = -1.0;
        legAng = 0.4;
        squatOffset = 22;
        torsoY += squatOffset;
        break;
      case 'stand':
      case 'jerk':
        armAng = -1.2;
        torsoY -= Math.min(barHeight * 0.08, 25);
        break;
      case 'lock':
        armAng = -1.45;
        legAng = -0.25;
        torsoY -= Math.min(barHeight * 0.15, 40);
        break;
      default:
        armAng = -0.25;
    }

    torsoY = Math.max(groundY - 140, Math.min(groundY - 45, torsoY));
    torsoY += shake;

    var singlet = isPlayer ? '#e94560' : '#4a90d9';
    var singletDark = isPlayer ? '#9a2038' : '#2d5a80';
    var singletLight = isPlayer ? '#ff5878' : '#60a8e0';
    var skin = isPlayer ? '#ffddaa' : '#c89868';
    var skinDark = isPlayer ? '#d4b080' : '#a07848';
    var hair = isPlayer ? '#1a1a2e' : '#2d2d2d';

    ctx.save();
    ctx.translate(cx, torsoY);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var glowR = 26 + (liftState.phasePower / 100) * 20;
    var glowGrad = ctx.createRadialGradient(0, 4, 0, 0, 4, glowR);
    glowGrad.addColorStop(0, 'rgba(255,180,140,0.22)');
    glowGrad.addColorStop(0.5, 'rgba(255,140,110,0.08)');
    glowGrad.addColorStop(1, 'rgba(255,100,100,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 4, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = singlet;
    ctx.strokeStyle = singletDark;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.quadraticCurveTo(-16, 12, -12, 28);
    ctx.quadraticCurveTo(0, 34, 12, 28);
    ctx.quadraticCurveTo(16, 12, 14, -20);
    ctx.quadraticCurveTo(0, -26, -14, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = singlet;
    ctx.strokeStyle = singletDark;
    ctx.beginPath();
    ctx.moveTo(-11, -22);
    ctx.quadraticCurveTo(-15, -32, -8, -35);
    ctx.lineTo(8, -35);
    ctx.quadraticCurveTo(15, -32, 11, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = singletDark;
    ctx.beginPath();
    ctx.moveTo(-8, -18);
    ctx.lineTo(-10, 8);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = singletLight;
    ctx.beginPath();
    ctx.ellipse(4, 4, 2.5, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    var legLen = 26;
    var legSpread = 13;

    ctx.strokeStyle = skin;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    var hipY = 26;
    var kneeYl = hipY + legLen * Math.cos(legAng);
    var kneeXl = -legSpread - 4 * Math.sin(legAng);
    var footYl = kneeYl + legLen;
    var footXl = kneeXl - 3 * Math.sin(legAng * 0.5);

    var kneeYr = hipY + legLen * Math.cos(legAng);
    var kneeXr = legSpread + 4 * Math.sin(legAng);
    var footYr = kneeYr + legLen;
    var footXr = kneeXr + 3 * Math.sin(legAng * 0.5);

    ctx.beginPath();
    ctx.moveTo(-6, hipY);
    ctx.quadraticCurveTo(kneeXl, hipY + legLen * 0.6, footXl, footYl);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(6, hipY);
    ctx.quadraticCurveTo(kneeXr, hipY + legLen * 0.6, footXr, footYr);
    ctx.stroke();

    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(footXl, footYl);
    ctx.lineTo(footXl - 3, footYl + 9);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(footXr, footYr);
    ctx.lineTo(footXr + 3, footYr + 9);
    ctx.stroke();

    ctx.lineWidth = 7;
    var shoulderY = -32;
    var barOffY = barHeight * 0.28 - 38;

    var elbowXl = -armLen * 0.5 * Math.cos(armAng);
    var elbowYl = shoulderY - armLen * 0.5 * Math.sin(armAng);
    var handXl = -armLen * Math.cos(armAng);
    var handYl = shoulderY - armLen * Math.sin(armAng) + barOffY;

    var elbowXr = armLen * 0.5 * Math.cos(armAng);
    var elbowYr = shoulderY - armLen * 0.5 * Math.sin(armAng);
    var handXr = armLen * Math.cos(armAng);
    var handYr = shoulderY - armLen * Math.sin(armAng) + barOffY;

    ctx.beginPath();
    ctx.moveTo(-4, shoulderY);
    ctx.quadraticCurveTo(elbowXl, shoulderY + armLen * 0.3, handXl, handYl);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, shoulderY);
    ctx.quadraticCurveTo(elbowXr, shoulderY + armLen * 0.3, handXr, handYr);
    ctx.stroke();

    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.arc(handXl, handYl, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(handXr, handYr, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(0, -44, 12, 13, 0, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -42, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.ellipse(-5, -38, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isPlayer) {
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(-3.5, -43, 1.6, 0, Math.PI * 2);
      ctx.arc(3.5, -43, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c04050';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (phase === 'pull' || phase === 'jerk') {
        ctx.arc(0, -38, 3.5, 0.15, Math.PI - 0.15);
      } else if (phase === 'lock') {
        ctx.arc(0, -37, 3.5, 0, Math.PI);
      } else {
        ctx.moveTo(-2.5, -38);
        ctx.lineTo(2.5, -38);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBarbell(liftState, isPlayer) {
    if (!ctx) return;

    var cx = width / 2;
    var groundY = platform.y;
    var barHeight = liftState.barHeight || 0;
    var weight = liftState.weight || 0;
    var sag = liftState.barSag || 0;
    var sagEffect = Effects.getSagEffect();
    if (sagEffect) {
      sag += Math.sin(liftState.elapsed * sagEffect.frequency) * sagEffect.amplitude * sagEffect.life;
    }

    var barY = groundY - 60 - barHeight;
    barY = Math.max(40, Math.min(groundY - 60, barY));

    var barW = 190;
    var barT = 2.5;

    var plateCount = Math.min(5, Math.max(1, Math.ceil(weight / 40)));
    var plateColors = ['#e94560', '#1a1a2e', '#f9ca24', '#4ecdc4', '#f0f0f0'];

    ctx.save();

    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = barT;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx - barW / 2, barY);
    for (var bx = -barW / 2; bx <= barW / 2; bx += 2) {
      var sagAmt = -sag * (1 - Math.pow(bx / (barW / 2), 2));
      ctx.lineTo(cx + bx, barY + sagAmt);
    }
    ctx.stroke();

    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - barW / 2 - 1, barY);
    ctx.lineTo(cx - barW / 2 + 6, barY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + barW / 2 - 6, barY);
    ctx.lineTo(cx + barW / 2 + 1, barY);
    ctx.stroke();

    ctx.strokeStyle = '#b0b0b0';
    ctx.lineWidth = 0.8;
    for (var kx = -barW / 2 + 8; kx < barW / 2 - 8; kx += 7) {
      ctx.beginPath();
      ctx.moveTo(cx + kx, barY - 0.8);
      ctx.lineTo(cx + kx, barY + 0.8);
      ctx.stroke();
    }

    for (var side = -1; side <= 1; side += 2) {
      var pX = cx + side * (barW / 2 + 4);
      var pW = 11;

      for (var p = 0; p < plateCount; p++) {
        var pCol = plateColors[p % plateColors.length];
        var pH = 68 - p * 9;
        var px = side === -1 ? pX - pW * (p + 1) : pX + pW * p;

        ctx.fillStyle = pCol;
        ctx.fillRect(px, barY - pH / 2, pW, pH);

        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px, barY - pH / 2, 2, pH);

        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px + pW - 2, barY - pH / 2, 2, pH);

        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(px, barY - pH / 2, pW, pH);
      }

      ctx.fillStyle = '#1a1a1a';
      var endW = 3;
      var ex = side === -1 ? pX - pW * plateCount - endW : pX + pW * plateCount;
      ctx.fillRect(ex, barY - 24, endW, 48);
    }

    if (weight > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 4;
      ctx.fillText(weight + 'kg', cx, barY - 14);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  function drawOpponentAthlete(liftState) {
    if (!ctx) return;

    var cx = width * 0.18;
    var groundY = platform.y;
    var barHeight = liftState ? liftState.barHeight || 0 : 0;

    var baseY = groundY - 6;
    var headR = 9;
    var bodyH = 40;
    var armLen = 28;
    var legLen = 20;

    var singlet = '#4a90d9';
    var singletDark = '#2d5a80';
    var skin = '#c89868';
    var hair = '#2d2d2d';

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(cx, baseY - bodyH / 2);

    ctx.fillStyle = singlet;
    ctx.strokeStyle = singletDark;
    ctx.lineWidth = 1.3;

    ctx.beginPath();
    ctx.ellipse(0, 6, 10, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = skin;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-5, 20);
    ctx.lineTo(-9, 20 + legLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, 20);
    ctx.lineTo(9, 20 + legLen);
    ctx.stroke();

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-3, -7);
    ctx.lineTo(-armLen * 0.65, -7 - armLen * 0.45);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(3, -7);
    ctx.lineTo(armLen * 0.65, -7 - armLen * 0.45);
    ctx.stroke();

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -18, headR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -16, headR - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawScoreBoard(tournament) {
    if (!ctx || !tournament) return;

    var boardW = 185;
    var boardH = 250;
    var boardX = width - boardW - 10;
    var boardY = 45;

    ctx.save();

    ctx.fillStyle = 'rgba(5,5,12,0.93)';
    roundRect(ctx, boardX, boardY, boardW, boardH, 7);
    ctx.fill();

    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    roundRect(ctx, boardX, boardY, boardW, boardH, 7);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(233,69,96,0.25)';
    ctx.lineWidth = 0.8;
    roundRect(ctx, boardX + 2.5, boardY + 2.5, boardW - 5, boardH - 5, 5);
    ctx.stroke();

    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 13px "Hiragino Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', boardX + boardW / 2, boardY + 22);

    var liftName = tournament.currentLiftType === 'snatch' ? '\u30b9\u30ca\u30c3\u30c1' : '\u30af\u30ea\u30fc\u30f3';
    ctx.fillStyle = '#777';
    ctx.font = '10px sans-serif';
    ctx.fillText(liftName + '  ' + tournament.currentAttempt + '/3', boardX + boardW / 2, boardY + 40);

    var pBest = tournament.playerBest[tournament.currentLiftType] || 0;
    var oBest = tournament.opponentBest[tournament.currentLiftType] || 0;

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#e94560';
    ctx.textAlign = 'left';
    ctx.fillText('YOU', boardX + 20, boardY + 64);
    ctx.fillStyle = '#4a90d9';
    ctx.fillText('OPP', boardX + 108, boardY + 64);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(pBest + 'kg', boardX + 20, boardY + 90);
    ctx.fillText(oBest + 'kg', boardX + 108, boardY + 90);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(boardX + 11, boardY + 104);
    ctx.lineTo(boardX + boardW - 11, boardY + 104);
    ctx.stroke();

    var pTotal = (tournament.playerBest.snatch || 0) + (tournament.playerBest.cleanjerk || 0);
    var oTotal = (tournament.opponentBest.snatch || 0) + (tournament.opponentBest.cleanjerk || 0);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('TOTAL', boardX + boardW / 2, boardY + 122);

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#e94560';
    ctx.textAlign = 'left';
    ctx.fillText(pTotal + 'kg', boardX + 20, boardY + 146);
    ctx.fillStyle = '#4a90d9';
    ctx.fillText(oTotal + 'kg', boardX + 108, boardY + 146);

    var attempts = tournament.playerResults[tournament.currentLiftType] || [];
    ctx.font = '10px sans-serif';
    for (var i = 0; i < 3; i++) {
      var a = attempts[i];
      var txt = a ? (a.success ? '\u2713' + a.weight : '\u2717' + a.weight) : '-';
      ctx.fillStyle = a ? (a.success ? '#4ecdc4' : '#e94560') : '#333';
      ctx.fillText(txt, boardX + 26 + i * 50, boardY + 174);
    }

    ctx.fillStyle = '#444';
    ctx.textAlign = 'center';
    ctx.fillText('ATTEMPTS', boardX + boardW / 2, boardY + 192);

    ctx.fillStyle = 'rgba(233,69,96,0.4)';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IWF OFFICIAL', boardX + boardW / 2, boardY + boardH - 8);

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
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

  function getWidth() { return width; }
  function getHeight() { return height; }
  function getPlatform() { return platform; }

  return {
    init: init,
    resize: resize,
    clear: clear,
    drawBackground: drawBackground,
    drawPlatform: drawPlatform,
    drawAthlete: drawAthlete,
    drawBarbell: drawBarbell,
    drawOpponentAthlete: drawOpponentAthlete,
    drawScoreBoard: drawScoreBoard,
    getWidth: getWidth,
    getHeight: getHeight,
    getPlatform: getPlatform
  };
})();