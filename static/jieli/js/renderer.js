const Renderer = (function() {
  let canvas, ctx;
  let width, height;
  let trackStartX, trackWidth;
  let laneHeight, laneStartY;
  let handoffFlashTimer = 0;
  let handoffFlashResult = null;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = rect.width;
    height = rect.height;
    trackStartX = width * 0.05;
    trackWidth = width * 0.9;
    laneHeight = Math.max(Math.min(height * 0.12, 60), 35);
    laneStartY = height * 0.15;
  }

  function clear() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
  }

  function drawBackground(weather) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (weather && weather.type === 'rainy') {
      gradient.addColorStop(0, '#546e7a');
      gradient.addColorStop(1, '#78909c');
    } else if (weather && weather.type === 'sunny') {
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
    } else {
      gradient.addColorStop(0, '#90caf9');
      gradient.addColorStop(1, '#a5d6a7');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#8BC34A';
    ctx.fillRect(0, laneStartY - 30, width, height - laneStartY + 50);
  }

  function drawTracks() {
    ctx.fillStyle = '#A1887F';
    ctx.fillRect(trackStartX - 10, laneStartY - 10, trackWidth + 20, CONFIG.LANE_COUNT * laneHeight + 20);

    for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
      const y = laneStartY + i * laneHeight;
      ctx.fillStyle = i % 2 === 0 ? '#D7CCC8' : '#BCAAA4';
      ctx.fillRect(trackStartX, y, trackWidth, laneHeight - 2);

      ctx.strokeStyle = '#795548';
      ctx.lineWidth = 1;
      ctx.strokeRect(trackStartX, y, trackWidth, laneHeight - 2);
    }

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
      const y = laneStartY + i * laneHeight;
      ctx.beginPath();
      ctx.moveTo(trackStartX, y);
      ctx.lineTo(trackStartX, y + laneHeight - 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(trackStartX + trackWidth, y);
      ctx.lineTo(trackStartX + trackWidth, y + laneHeight - 2);
      ctx.stroke();
    }

    for (let leg = 1; leg <= 3; leg++) {
      const handoffX = trackStartX + (trackWidth * leg / 4);
      ctx.fillStyle = '#FFD700';
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
        const y = laneStartY + i * laneHeight;
        const zoneWidth = trackWidth * 0.05;
        ctx.fillRect(handoffX - zoneWidth / 2, y, zoneWidth, laneHeight - 2);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${leg}00m`, handoffX, laneStartY - 35);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('起点', trackStartX, laneStartY - 35);
    ctx.textAlign = 'right';
    ctx.fillText('终点', trackStartX + trackWidth, laneStartY - 35);
  }

  function laneY(lane) {
    return laneStartY + lane * laneHeight;
  }

  function trackX(distance) {
    return trackStartX + (distance / CONFIG.TRACK_LENGTH) * trackWidth;
  }

  function drawRunners(teams) {
    teams.forEach(team => {
      const y = laneY(team.lane) + laneHeight / 2;
      const progress = team.getTotalProgress();
      const x = trackX(progress);

      const runner = team.getCurrentRunner();
      if (!runner) return;

      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, laneHeight / 2 - 8, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const legOffset = Math.sin(runner.animFrame * Math.PI / 2) * 4;
      ctx.fillStyle = team.color;
      ctx.fillRect(-8, -22 + legOffset, 16, 26);

      ctx.fillStyle = '#FFCC80';
      ctx.beginPath();
      ctx.arc(0, -30 + legOffset, 8, 0, Math.PI * 2);
      ctx.fill();

      if (team.isPlayer) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(8, -18 + legOffset, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(team.name, x, laneY(team.lane) + laneHeight + 5);
      }

      const legSwing = Math.sin(runner.animFrame * Math.PI) * 8;
      ctx.strokeStyle = team.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.lineTo(-4 + legSwing, 16);
      ctx.moveTo(4, 4);
      ctx.lineTo(4 - legSwing, 16);
      ctx.stroke();

      ctx.restore();
    });
  }

  function drawHandoffIndicator(team, weather) {
    if (!team.isPlayer) return;
    const runner = team.getCurrentRunner();
    if (!runner || team.currentLegIndex >= 3) return;
    if (runner.hasFinished) return;

    const legProgress = runner.position;
    if (legProgress < CONFIG.HANDOFF_ZONE_START - 5) return;

    const x = trackX(team.getTotalProgress() - runner.position + CONFIG.HANDOFF_ZONE_END);
    const y = laneY(team.lane);

    const zoneAlpha = Math.min(1, (legProgress - CONFIG.HANDOFF_ZONE_START + 5) / 10);
    ctx.globalAlpha = 0.5 * zoneAlpha;
    ctx.fillStyle = Handoff.isInPerfectZone(legProgress) ? '#4CAF50' :
                    Handoff.isInGoodZone(legProgress) ? '#FFC107' :
                    Handoff.isInHandoffZone(legProgress) ? '#FF5722' : '#9E9E9E';
    ctx.fillRect(trackX(team.getTotalProgress() - runner.position + CONFIG.HANDOFF_ZONE_START),
                 y, trackWidth * 0.05, laneHeight - 2);
    ctx.globalAlpha = 1;

    if (Handoff.isInHandoffZone(legProgress)) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(trackX(team.getTotalProgress() - runner.position + CONFIG.HANDOFF_ZONE_START),
                     y, trackWidth * 0.05, laneHeight - 2);
      ctx.setLineDash([]);

      const perfectX = trackX(team.getTotalProgress() - runner.position + CONFIG.HANDOFF_PERFECT_MIN);
      const perfectX2 = trackX(team.getTotalProgress() - runner.position + CONFIG.HANDOFF_PERFECT_MAX);
      ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
      ctx.fillRect(perfectX, y, perfectX2 - perfectX, laneHeight - 2);
    }
  }

  function flashHandoffResult(result) {
    handoffFlashTimer = 1.5;
    handoffFlashResult = result;
  }

  function updateEffects(dt) {
    if (handoffFlashTimer > 0) {
      handoffFlashTimer -= dt;
      if (handoffFlashTimer <= 0) {
        handoffFlashResult = null;
      }
    }
  }

  function drawEffects() {
    if (handoffFlashTimer > 0 && handoffFlashResult) {
      const alpha = Math.min(1, handoffFlashTimer / 1.5);
      ctx.globalAlpha = alpha;

      let color, text;
      if (handoffFlashResult === CONFIG.HANDOFF_RESULT.PERFECT) {
        color = '#4CAF50';
        text = 'PERFECT!';
      } else if (handoffFlashResult === CONFIG.HANDOFF_RESULT.GOOD) {
        color = '#FFC107';
        text = 'GOOD';
      } else {
        color = '#F44336';
        text = 'DROPPED!';
      }

      ctx.fillStyle = color;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, height / 2);
      ctx.globalAlpha = 1;
    }
  }

  function drawCountdown(value) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value > 0 ? value : 'GO!', width / 2, height / 2);
  }

  function drawRain() {
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() * width);
      const y = (Math.random() * height);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 10);
      ctx.stroke();
    }
  }

  function drawWind(weather) {
    if (!weather || (weather.type !== 'tailwind' && weather.type !== 'headwind')) return;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    const dir = weather.type === 'tailwind' ? 1 : -1;
    for (let i = 0; i < 15; i++) {
      const y = 50 + Math.random() * (height - 100);
      const x = Math.random() * width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 30 * dir, y);
      ctx.stroke();
    }
  }

  function render(game) {
    clear();
    drawBackground(game.weather);
    drawTracks();
    drawHandoffIndicator(game.playerTeam, game.weather);
    drawRunners(game.opponentTeams.concat([game.playerTeam]).filter(t => t));
    drawWind(game.weather);
    if (game.weather && game.weather.type === 'rainy') drawRain();
    drawEffects();
  }

  function getLaneY(lane) { return laneY(lane); }
  function getLaneHeight() { return laneHeight; }
  function getLaneStartY() { return laneStartY; }

  return {
    init, resize, clear, render, drawCountdown, flashHandoffResult, updateEffects,
    getLaneY, getLaneHeight, getLaneStartY
  };
})();