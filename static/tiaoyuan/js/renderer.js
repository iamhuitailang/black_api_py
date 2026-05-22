var TiaoyuanRenderer = {
  ctx: null,
  canvas: null,
  dpr: 1,
  logicalW: 960,
  logicalH: 540,
  cameraX: 0,
  sandParticles: [],
  flagWave: 0,
  _cloudOffset: 0,
  _shakeTime: 0,
  _shakeIntensity: 0,

  init: function(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.logicalW = TiaoyuanConfig.CANVAS.logicalWidth;
    this.logicalH = TiaoyuanConfig.CANVAS.logicalHeight;
    this.cameraX = 0;
  },

  clear: function() {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.logicalW, this.logicalH);
  },

  applyCamera: function() {
    var ctx = this.ctx;
    var shakeX = 0, shakeY = 0;
    if (this._shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * this._shakeIntensity;
      shakeY = (Math.random() - 0.5) * this._shakeIntensity;
      this._shakeTime--;
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, -this.cameraX * this.dpr + shakeX, shakeY);
  },

  updateCamera: function(player) {
    var W = TiaoyuanConfig.WORLD;
    var C = TiaoyuanConfig.CAMERA;
    var targetX = 0;

    if (player.state === 'running' || player.state === 'atBoard' || player.state === 'charging') {
      targetX = Math.max(0, player.x - 300);
    } else if (player.state === 'jumping') {
      targetX = Math.max(0, player.x - 380);
    } else if (player.state === 'landed') {
      targetX = Math.max(0, player.x - 420);
    }

    targetX = Math.max(C.minX, Math.min(C.maxX, targetX));
    this.cameraX += (targetX - this.cameraX) * C.lerp;
    if (this.cameraX < 0) this.cameraX = 0;
  },

  shake: function(intensity, duration) {
    this._shakeIntensity = intensity || 8;
    this._shakeTime = duration || 12;
  },

  render: function(player, gameState, showMarker, markerDistance, markerFoul) {
    this.updateCamera(player);
    this.clear();
    this.applyCamera();

    this.drawSky();
    this.drawStadiumBackground();
    this.drawTrack();
    this.drawTakeoffBoard();
    this.drawSandpit();

    if (showMarker && markerDistance > 0) {
      this.drawDistanceMarker(markerDistance, markerFoul);
    }
    if (markerFoul) {
      this.drawFoulFlag();
    }

    this.drawSandParticles();
    this.drawAthlete(player);

    this.drawHUDCanvas(player, gameState);
  },

  drawSky: function() {
    var ctx = this.ctx;
    var W = TiaoyuanConfig.WORLD;
    var weather = TiaoyuanWeather.get();
    var cw = this.logicalW;
    var ch = this.logicalH;

    var skyGrad = ctx.createLinearGradient(0, 0, 0, W.groundY);
    if (weather.id === 'sunny') {
      skyGrad.addColorStop(0, '#0a1628');
      skyGrad.addColorStop(0.2, '#1e3a5f');
      skyGrad.addColorStop(0.5, '#2d5a87');
      skyGrad.addColorStop(0.8, '#5a9ac8');
      skyGrad.addColorStop(1, '#a0d4f0');
    } else if (weather.id === 'wind') {
      skyGrad.addColorStop(0, '#0d2018');
      skyGrad.addColorStop(0.3, '#1a4a3a');
      skyGrad.addColorStop(0.6, '#3a7a6a');
      skyGrad.addColorStop(1, '#8ac4b0');
    } else if (weather.id === 'headwind') {
      skyGrad.addColorStop(0, '#1a1020');
      skyGrad.addColorStop(0.3, '#3a2a3a');
      skyGrad.addColorStop(0.6, '#5a4a5a');
      skyGrad.addColorStop(1, '#8a7a8a');
    } else if (weather.id === 'rain') {
      skyGrad.addColorStop(0, '#1a1a25');
      skyGrad.addColorStop(0.4, '#2a2a3a');
      skyGrad.addColorStop(0.7, '#3a4a5a');
      skyGrad.addColorStop(1, '#5a6a7a');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(this.cameraX, 0, cw, W.groundY);

    if (weather.id === 'sunny') {
      var sunX = this.cameraX + cw * 0.75;
      var sunY = 70;
      var sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
      sunGrad.addColorStop(0, 'rgba(255,240,180,0.8)');
      sunGrad.addColorStop(0.3, 'rgba(255,200,100,0.4)');
      sunGrad.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFE8A0';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    this._cloudOffset += 0.3;
    var cloudBase = this.cameraX * 0.3;
    for (var i = 0; i < 7; i++) {
      var cx = (i * 240 + cloudBase + this._cloudOffset) % (cw + 300) + this.cameraX - 100;
      var cy = 40 + (i % 3) * 40;
      var cloudAlpha = weather.id === 'rain' ? 0.35 : (weather.id === 'headwind' ? 0.4 : 0.6);
      this._drawCloud(ctx, cx, cy, 0.6 + (i % 3) * 0.3, cloudAlpha);
    }

    if (weather.id === 'wind' || weather.id === 'headwind') {
      var windColor = weather.id === 'wind' ? 'rgba(144,238,144,0.5)' : 'rgba(255,180,180,0.45)';
      ctx.strokeStyle = windColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      var dir = weather.id === 'wind' ? 1 : -1;
      for (var w = 0; w < 15; w++) {
        var wy = 30 + w * 28 + (Date.now() * 0.12 * dir) % 28;
        var wx = this.cameraX + (w * 75 + Date.now() * 0.25 * dir) % (cw + 120);
        var wlen = 35 + (w % 3) * 15;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + wlen * dir, wy);
        ctx.stroke();
      }
    }

    if (weather.id === 'rain') {
      ctx.strokeStyle = 'rgba(160,190,220,0.55)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (var r = 0; r < 100; r++) {
        var rx = this.cameraX + (r * 35 + Date.now() * 0.5) % cw;
        var ry = ((r * 57 + Date.now() * 1.1) % W.groundY);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + 14);
        ctx.stroke();
      }
    }
  },

  _drawCloud: function(ctx, x, y, scale, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(200,200,220,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(x, y, 16 * scale, 0, Math.PI * 2);
    ctx.arc(x + 20 * scale, y - 5, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 42 * scale, y, 16 * scale, 0, Math.PI * 2);
    ctx.arc(x + 20 * scale, y + 7, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  drawStadiumBackground: function() {
    var ctx = this.ctx;
    var W = TiaoyuanConfig.WORLD;
    var cw = this.logicalW;
    var camX = this.cameraX;

    var standGrad = ctx.createLinearGradient(0, W.groundY - 160, 0, W.groundY - 80);
    standGrad.addColorStop(0, '#1a2530');
    standGrad.addColorStop(1, '#2a3a4a');
    ctx.fillStyle = standGrad;

    for (var x = 0; x < W.worldEndX + 300; x += 12) {
      var h = 55 + Math.sin(x * 0.035) * 18;
      ctx.fillRect(x - camX * 0.5 % 12, W.groundY - 80 - h, 10, h);
    }

    var standGrad2 = ctx.createLinearGradient(0, W.groundY - 140, 0, W.groundY - 80);
    standGrad2.addColorStop(0, '#253545');
    standGrad2.addColorStop(1, '#3a4a5a');
    ctx.fillStyle = standGrad2;

    for (var x2 = 0; x2 < W.worldEndX + 300; x2 += 14) {
      var h2 = 40 + Math.sin((x2 + 50) * 0.04) * 15;
      ctx.fillRect(x2 - camX * 0.65 % 14, W.groundY - 80 - h2, 11, h2);
    }

    var crowdOffset = camX * 0.7;
    var crowdColors = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#FDD835', '#00ACC1', '#D81B60', '#FF5722', '#00BCD4', '#5C6BC0', '#EF5350'];
    var t = Date.now() * 0.003;

    for (var cx = 0; cx < W.worldEndX + 300; cx += 4) {
      var drawX = cx - crowdOffset % 4;
      var sway = Math.sin(cx * 0.09 + t) * 1.8;
      var ci = Math.floor((cx + t * 10) / 4) % crowdColors.length;

      ctx.fillStyle = crowdColors[ci];
      ctx.fillRect(drawX, W.groundY - 86 + sway, 2.5, 11);

      ctx.fillStyle = '#FFDAB9';
      ctx.fillRect(drawX + 0.3, W.groundY - 94 + sway, 1.8, 5);
    }

    ctx.fillStyle = 'rgba(255,200,100,0.08)';
    ctx.fillRect(camX, W.groundY - 100, cw, 20);

    ctx.fillStyle = '#1a2530';
    ctx.fillRect(camX, W.groundY - 8, cw, 8);
  },

  drawTrack: function() {
    var ctx = this.ctx;
    var W = TiaoyuanConfig.WORLD;

    var trackGrad = ctx.createLinearGradient(0, W.groundY, 0, W.groundY + 120);
    trackGrad.addColorStop(0, '#D4204A');
    trackGrad.addColorStop(0.3, '#C41E3A');
    trackGrad.addColorStop(0.7, '#B01830');
    trackGrad.addColorStop(1, '#9A1020');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(W.trackStartX, W.groundY, W.trackEndX, 120);

    var edgeGrad = ctx.createLinearGradient(0, W.groundY, 0, W.groundY + 15);
    edgeGrad.addColorStop(0, 'rgba(255,80,80,0.5)');
    edgeGrad.addColorStop(1, 'rgba(180,20,40,0)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(W.trackStartX, W.groundY, W.trackEndX, 15);

    ctx.fillStyle = 'rgba(100,10,20,0.3)';
    for (var gx = W.trackStartX; gx < W.trackEndX; gx += 8) {
      ctx.fillRect(gx, W.groundY + 50, 3, 60);
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([30, 18]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W.trackStartX, W.groundY + 12);
    ctx.lineTo(W.trackEndX, W.groundY + 12);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.2;
    for (var i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(W.trackStartX, W.groundY + 12 + i * 28);
      ctx.lineTo(W.trackEndX, W.groundY + 12 + i * 28);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (var m = 0; m <= 8; m += 1) {
      var mx = W.trackStartX + m * W.scale;
      if (mx < W.boardX - 5) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(mx, W.groundY - 5, 2.5, 8);
        if (m % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fillText(m + 'm', mx, W.groundY - 9);
        }
      }
    }
  },

  drawTakeoffBoard: function() {
    var ctx = this.ctx;
    var W = TiaoyuanConfig.WORLD;

    var boardGrad = ctx.createLinearGradient(0, W.groundY, 0, W.groundY + 120);
    boardGrad.addColorStop(0, '#FFF5DC');
    boardGrad.addColorStop(0.5, '#F5E6C8');
    boardGrad.addColorStop(1, '#E8D4A8');
    ctx.fillStyle = boardGrad;
    ctx.fillRect(W.boardX, W.groundY, W.boardWidth, 120);

    ctx.fillStyle = 'rgba(139,115,85,0.25)';
    for (var bx = 0; bx < W.boardWidth; bx += 4) {
      ctx.fillRect(W.boardX + bx, W.groundY + 10, 1, 100);
    }

    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(W.boardX, W.groundY, W.boardWidth, 120);

    ctx.strokeStyle = '#E53935';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W.boardX, W.groundY - 2);
    ctx.lineTo(W.boardX, W.groundY + 122);
    ctx.stroke();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(W.boardX + W.boardWidth, W.groundY - 2);
    ctx.lineTo(W.boardX + W.boardWidth, W.groundY + 122);
    ctx.stroke();

    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 10px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('起跳', W.boardX + W.boardWidth / 2, W.groundY + 55);
    ctx.fillText('板', W.boardX + W.boardWidth / 2, W.groundY + 68);
  },

  drawSandpit: function() {
    var ctx = this.ctx;
    var W = TiaoyuanConfig.WORLD;
    var weather = TiaoyuanWeather.get();

    var sandW = W.sandpitEndX - W.sandpitX;
    var sandGrad = ctx.createLinearGradient(0, W.groundY, 0, W.groundY + 120);
    if (weather.id === 'rain') {
      sandGrad.addColorStop(0, '#B89060');
      sandGrad.addColorStop(0.5, '#A67C52');
      sandGrad.addColorStop(1, '#8B6914');
    } else {
      sandGrad.addColorStop(0, '#FFF0D0');
      sandGrad.addColorStop(0.3, '#F5E6C8');
      sandGrad.addColorStop(0.7, '#E8D4A8');
      sandGrad.addColorStop(1, '#D4BC8C');
    }
    ctx.fillStyle = sandGrad;
    ctx.fillRect(W.sandpitX, W.groundY, sandW, 120);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(W.sandpitX, W.groundY, sandW, 25);

    ctx.fillStyle = 'rgba(139,115,85,0.3)';
    for (var i = 0; i < 80; i++) {
      var sx = W.sandpitX + (i * 23) % sandW;
      var sy = W.groundY + 8 + (i * 13) % 105;
      var ss = 1 + (i % 3);
      ctx.fillRect(sx, sy, ss, ss);
    }

    ctx.fillStyle = 'rgba(200,170,120,0.35)';
    for (var j = 0; j < 30; j++) {
      var cx = W.sandpitX + 30 + (j * 47) % (sandW - 60);
      var cy = W.groundY + 40 + (j * 17) % 70;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 3 + (j % 4), 2 + (j % 3), (j % 5) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.strokeRect(W.sandpitX, W.groundY, sandW, 120);

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(W.sandpitX + 5, W.groundY + 5, sandW - 10, 110);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    for (var m = 0; m <= 8; m++) {
      var mx = W.sandpitX + m * W.scale;
      if (mx < W.sandpitEndX - 20) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(mx, W.groundY - 7, 2.5, 9);
        ctx.fillStyle = '#fff';
        ctx.fillText(m + 'm', mx, W.groundY - 10);
      }
    }
  },

  drawDistanceMarker: function(distance, isFoul) {
    var ctx = this.ctx;
    var W = TiaoyuanConfig.WORLD;

    var markerX = W.sandpitX + distance * W.scale;
    if (markerX > W.sandpitEndX - 10) markerX = W.sandpitEndX - 10;

    ctx.save();
    var markerColor = isFoul ? '#FF3333' : '#FFD700';
    var markerGlow = isFoul ? 'rgba(255,51,51,0.4)' : 'rgba(255,215,0,0.4)';

    ctx.shadowColor = markerGlow;
    ctx.shadowBlur = 12;

    ctx.strokeStyle = markerColor;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 5]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(markerX, W.groundY - 35);
    ctx.lineTo(markerX, W.groundY + 118);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.shadowBlur = 0;

    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.moveTo(markerX, W.groundY - 35);
    ctx.lineTo(markerX - 10, W.groundY - 55);
    ctx.lineTo(markerX + 10, W.groundY - 55);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isFoul ? '#CC0000' : '#DAA520';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 15px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(distance.toFixed(2) + 'm', markerX, W.groundY - 38);
    ctx.restore();
  },

  drawFoulFlag: function() {
    var ctx = this.ctx;
    var W = TiaoyuanConfig.WORLD;

    var flagX = W.boardX + W.boardWidth / 2;

    ctx.fillStyle = '#5D4037';
    ctx.fillRect(flagX - 1.5, W.groundY - 75, 3, 75);

    this.flagWave += 0.12;
    var wave = Math.sin(this.flagWave) * 5;

    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    ctx.moveTo(flagX + 2, W.groundY - 73);
    ctx.quadraticCurveTo(flagX + 28 + wave, W.groundY - 58, flagX + 2, W.groundY - 42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(flagX + 12, W.groundY - 57, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF1744';
    ctx.beginPath();
    ctx.arc(flagX + 12, W.groundY - 57, 2, 0, Math.PI * 2);
    ctx.fill();
  },

  drawAthlete: function(player) {
    var ctx = this.ctx;

    ctx.save();
    ctx.translate(player.x, player.y);

    var runCycle = 0;
    if (player.state === 'running') {
      runCycle = (Date.now() * 0.018 * (0.5 + player.getSpeedRatio() * 0.7)) % (Math.PI * 2);
    } else if (player.state === 'jumping') {
      runCycle = Math.PI * 0.3;
    }

    var legSwing = Math.sin(runCycle) * 20;
    var legSwing2 = Math.sin(runCycle + Math.PI) * 20;
    var armSwing = Math.sin(runCycle + Math.PI) * 18;
    var armSwing2 = Math.sin(runCycle) * 18;
    var shoulderSwing = Math.sin(runCycle) * 4;

    var bodyTilt = 0;
    if (player.state === 'running') bodyTilt = -0.1 - player.getSpeedRatio() * 0.12;
    if (player.state === 'jumping') bodyTilt = -0.18;

    ctx.save();
    ctx.rotate(bodyTilt);

    if (player.state === 'running' && player.getSpeedRatio() > 0.4) {
      ctx.save();
      ctx.globalAlpha = 0.12 + player.getSpeedRatio() * 0.15;
      ctx.fillStyle = '#FF6B35';
      ctx.beginPath();
      ctx.ellipse(-3, -35, 18, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    var kneeL = { x: legSwing * 0.4, y: -5 };
    var ankleL = { x: legSwing, y: 14 };
    var kneeR = { x: legSwing2 * 0.4, y: -5 };
    var ankleR = { x: legSwing2, y: 14 };

    ctx.strokeStyle = '#E8552A';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-5, -30);
    ctx.lineTo(kneeL.x - 3, kneeL.y);
    ctx.lineTo(ankleL.x - 3, ankleL.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, -30);
    ctx.lineTo(kneeR.x + 3, kneeR.y);
    ctx.lineTo(ankleR.x + 3, ankleR.y);
    ctx.stroke();

    ctx.strokeStyle = '#1a3a5a';
    ctx.lineWidth = 10;

    ctx.beginPath();
    ctx.moveTo(-5, -30);
    ctx.lineTo(kneeL.x - 3, kneeL.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, -30);
    ctx.lineTo(kneeR.x + 3, kneeR.y);
    ctx.stroke();

    ctx.fillStyle = '#1a3a5a';
    ctx.beginPath();
    ctx.ellipse(-5, -28, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, -28, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(ankleL.x - 3, ankleL.y + 2, 6, 4, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ankleR.x + 3, ankleR.y + 2, 6, 4, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F5F5F5';
    ctx.beginPath();
    ctx.ellipse(ankleL.x - 5, ankleL.y + 1, 2, 1.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ankleR.x + 1, ankleR.y + 1, 2, 1.5, -0.1, 0, Math.PI * 2);
    ctx.fill();

    var armShoulderL = { x: -10 + shoulderSwing, y: -50 };
    var armShoulderR = { x: 10 - shoulderSwing, y: -50 };
    var elbowL = { x: armShoulderL.x + armSwing * 0.3, y: -38 };
    var wristL = { x: armShoulderL.x + armSwing * 0.5, y: -25 };
    var elbowR = { x: armShoulderR.x + armSwing2 * 0.3, y: -38 };
    var wristR = { x: armShoulderR.x + armSwing2 * 0.5, y: -25 };

    if (player.state === 'jumping') {
      if (player.pose === 2) {
        elbowL = { x: -18, y: -52 };
        wristL = { x: -28, y: -48 };
        elbowR = { x: 18, y: -38 };
        wristR = { x: 26, y: -28 };
      } else if (player.pose === 3) {
        elbowL = { x: -10, y: -60 };
        wristL = { x: -14, y: -68 };
        elbowR = { x: 10, y: -60 };
        wristR = { x: 14, y: -68 };
      } else {
        elbowL = { x: -5, y: -45 };
        wristL = { x: armSwing * 0.4, y: -32 };
        elbowR = { x: 5, y: -45 };
        wristR = { x: armSwing2 * 0.4, y: -32 };
      }
    }

    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(armShoulderL.x, armShoulderL.y);
    ctx.quadraticCurveTo(elbowL.x, elbowL.y, wristL.x, wristL.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(armShoulderR.x, armShoulderR.y);
    ctx.quadraticCurveTo(elbowR.x, elbowR.y, wristR.x, wristR.y);
    ctx.stroke();

    ctx.fillStyle = '#E8C4A0';
    ctx.beginPath();
    ctx.arc(wristL.x, wristL.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wristR.x, wristR.y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    var bodyGrad = ctx.createLinearGradient(-16, -75, 16, -20);
    bodyGrad.addColorStop(0, '#FF9445');
    bodyGrad.addColorStop(0.25, '#FF7A35');
    bodyGrad.addColorStop(0.5, '#FF6B35');
    bodyGrad.addColorStop(0.75, '#E8552A');
    bodyGrad.addColorStop(1, '#CC4420');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#993318';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-13, -55);
    ctx.quadraticCurveTo(-15, -35, -12, -22);
    ctx.lineTo(12, -22);
    ctx.quadraticCurveTo(15, -35, 13, -55);
    ctx.quadraticCurveTo(8, -62, 0, -62);
    ctx.quadraticCurveTo(-8, -62, -13, -55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-12, -45);
    ctx.lineTo(12, -45);
    ctx.lineTo(10, -42);
    ctx.lineTo(-10, -42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a3a5a';
    ctx.font = 'bold 9px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1', 0, -40);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-5, -48, 3, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();

    var shortGrad = ctx.createLinearGradient(0, -32, 0, -18);
    shortGrad.addColorStop(0, '#1a3a5a');
    shortGrad.addColorStop(0.5, '#0d2240');
    shortGrad.addColorStop(1, '#081828');
    ctx.fillStyle = shortGrad;
    ctx.strokeStyle = '#060f18';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(-11, -30);
    ctx.quadraticCurveTo(-14, -18, -10, -15);
    ctx.lineTo(10, -15);
    ctx.quadraticCurveTo(14, -18, 11, -30);
    ctx.quadraticCurveTo(6, -34, 0, -34);
    ctx.quadraticCurveTo(-6, -34, -11, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (var si = 0; si < 3; si++) {
      var stripeY = -26 + si * 5;
      ctx.beginPath();
      ctx.moveTo(-10, stripeY);
      ctx.lineTo(10, stripeY);
      ctx.stroke();
    }

    var skinGrad = ctx.createRadialGradient(-3, -78, 3, 0, -74, 14);
    skinGrad.addColorStop(0, '#FADBC0');
    skinGrad.addColorStop(0.4, '#F0D0A8');
    skinGrad.addColorStop(0.7, '#E8C4A0');
    skinGrad.addColorStop(1, '#C9A87C');
    ctx.fillStyle = skinGrad;
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.ellipse(0, -76, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3a2515';
    ctx.beginPath();
    ctx.ellipse(0, -86, 11, 8, 0, Math.PI * 1.15, Math.PI * 1.85);
    ctx.fill();

    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.arc(0, -90, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a0a00';
    ctx.beginPath();
    ctx.arc(0, -92, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (var hi = -2; hi <= 2; hi++) {
      ctx.beginPath();
      ctx.moveTo(hi * 3, -92);
      ctx.lineTo(hi * 3, -95 - Math.abs(hi) * 0.5);
      ctx.stroke();
    }

    if (player.state === 'jumping' || player.state === 'charging') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-4, -76, 3.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4, -76, 3.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(-4, -76, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -76, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-3.2, -77, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4.8, -77, 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5a3a20';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-7, -82);
      ctx.quadraticCurveTo(-4, -84, -1, -82);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1, -82);
      ctx.quadraticCurveTo(4, -84, 7, -82);
      ctx.stroke();

      ctx.strokeStyle = '#8B5A3C';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -68, 3.5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(-4, -76, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -76, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#A07050';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, -68, 2.5, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }

    ctx.fillStyle = '#D4A87C';
    ctx.beginPath();
    ctx.ellipse(0, -70, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (player.state === 'charging') {
      var chargeRatio = player.getChargeRatio();
      ctx.save();
      for (var layer = 0; layer < 3; layer++) {
        var glowR = 20 + layer * 12 + chargeRatio * 30;
        var alpha = 0.4 - layer * 0.12;
        var hue = 35 + Math.floor(chargeRatio * 35);
        ctx.strokeStyle = 'hsla(' + hue + ', 100%, 55%, ' + alpha + ')';
        ctx.lineWidth = 4 - layer;
        ctx.beginPath();
        ctx.arc(0, -42, glowR, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (chargeRatio > 0.6) {
        var sparkCount = Math.floor(chargeRatio * 15);
        for (var sp = 0; sp < sparkCount; sp++) {
          var angle = (sp / sparkCount) * Math.PI * 2 + Date.now() * 0.01;
          var dist = 28 + chargeRatio * 35;
          var sx = Math.cos(angle) * dist;
          var sy = -42 + Math.sin(angle) * dist;
          ctx.fillStyle = 'rgba(255, 220, 80, ' + (0.5 + Math.random() * 0.5) + ')';
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (player.state === 'jumping') {
      ctx.save();
      var speedLines = 10 + Math.floor(player.getSpeedRatio() * 15);
      ctx.lineCap = 'round';
      for (var s = 0; s < speedLines; s++) {
        var sy = -70 + Math.random() * 100;
        var sx = -50 - Math.random() * 60;
        var len = 20 + Math.random() * 30;
        var alpha = 0.25 + Math.random() * 0.45;
        var lineGrad = ctx.createLinearGradient(sx, sy, sx + len, sy);
        lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
        lineGrad.addColorStop(1, 'rgba(255,255,255,' + alpha + ')');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + len, sy);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (player.state === 'running') {
      ctx.save();
      var dustCount = Math.floor(player.getSpeedRatio() * 5);
      for (var d = 0; d < dustCount; d++) {
        var dx = -12 - Math.random() * 25;
        var dy = 12 - Math.random() * 6;
        var dustAlpha = 0.12 + Math.random() * 0.18;
        var dustSize = 3 + Math.random() * 5;
        ctx.fillStyle = 'rgba(200, 160, 100, ' + dustAlpha + ')';
        ctx.beginPath();
        ctx.arc(dx, dy, dustSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  },

  drawSandParticles: function() {
    var ctx = this.ctx;
    var toRemove = [];

    for (var i = 0; i < this.sandParticles.length; i++) {
      var p = this.sandParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.life--;

      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (var j = toRemove.length - 1; j >= 0; j--) {
      this.sandParticles.splice(toRemove[j], 1);
    }
  },

  spawnSandSplash: function(x, y) {
    for (var i = 0; i < 30; i++) {
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      var speed = 4 + Math.random() * 8;
      this.sandParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        life: 45 + Math.random() * 25,
        maxLife: 70,
        color: Math.random() > 0.5 ? '#E8D4A8' : '#D4BC8C'
      });
    }
    this.shake(6, 10);
  },

  drawHUDCanvas: function(player, gameState) {
    var ctx = this.ctx;
    var cw = this.logicalW;
    var ch = this.logicalH;
    var camX = this.cameraX;

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    var weather = TiaoyuanWeather.get();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    this._roundRect(ctx, camX + cw - 120, 15, 105, 32, 6);
    ctx.fill();
    ctx.fillStyle = weather.color;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(weather.icon, camX + cw - 110, 38);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(weather.name, camX + cw - 75, 38);

    if (player.state === 'charging') {
      var barW = 220;
      var barH = 18;
      var barX = camX + (cw - barW) / 2;
      var barY = 25;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this._roundRect(ctx, barX - 3, barY - 3, barW + 6, barH + 6, 4);
      ctx.fill();

      var ratio = player.getChargeRatio();
      var grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, '#4CAF50');
      grad.addColorStop(0.5, '#FFC107');
      grad.addColorStop(0.75, '#FF9800');
      grad.addColorStop(1, '#F44336');
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, barW * ratio, barH);

      var optX = barX + barW * 0.7;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(optX, barY - 5);
      ctx.lineTo(optX, barY + barH + 5);
      ctx.stroke();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      this._roundRect(ctx, barX, barY, barW, barH, 3);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('蓄力 ' + Math.round(ratio * 100) + '%  (松开空格起跳)', barX + barW / 2, barY + barH + 16);
    }

    if (player.state === 'running' || player.state === 'atBoard') {
      var sRatio = player.getSpeedRatio();
      var sW = 140, sH = 14;
      var sX = camX + 20, sY = ch - 35;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this._roundRect(ctx, sX, sY, sW, sH, 4);
      ctx.fill();

      var sGrad = ctx.createLinearGradient(sX, 0, sX + sW, 0);
      sGrad.addColorStop(0, '#4CAF50');
      sGrad.addColorStop(1, '#FF5722');
      ctx.fillStyle = sGrad;
      ctx.fillRect(sX, sY, sW * sRatio, sH);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      this._roundRect(ctx, sX, sY, sW, sH, 4);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('速度 ' + Math.round(sRatio * 100) + '%', sX + 4, sY - 3);
    }

    if (player.state === 'jumping') {
      var poses = TiaoyuanConfig.POSES;
      for (var i = 0; i < poses.length; i++) {
        var px = camX + cw / 2 - 130 + i * 90;
        var py = ch - 48;
        var active = player.pose === poses[i].id;

        ctx.fillStyle = active ? 'rgba(255,140,0,0.85)' : 'rgba(0,0,0,0.65)';
        this._roundRect(ctx, px, py, 80, 34, 6);
        ctx.fill();

        ctx.strokeStyle = active ? '#FFD700' : '#555';
        ctx.lineWidth = 2;
        this._roundRect(ctx, px, py, 80, 34, 6);
        ctx.stroke();

        ctx.fillStyle = active ? '#fff' : '#bbb';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(poses[i].id + '.' + poses[i].name, px + 40, py + 22);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('按 1/2/3 切换空中姿态  |  手机左右滑动', camX + cw / 2, py - 6);
    }

    ctx.restore();
  },

  _roundRect: function(ctx, x, y, w, h, r) {
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
};
