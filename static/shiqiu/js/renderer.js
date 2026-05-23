window.SIQIU = window.SIQIU || {};

SIQIU.Renderer = {
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  },

  clear() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },

  drawStadium(stadium) {
    const { ctx, canvas } = this;
    const cfg = SIQIU.GAME_CONFIG;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.55);
    skyGrad.addColorStop(0, stadium.sky);
    skyGrad.addColorStop(1, '#c8e6c9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.55);

    const grassTop = canvas.height * 0.42;
    const grassGrad = ctx.createLinearGradient(0, grassTop, 0, canvas.height);
    grassGrad.addColorStop(0, stadium.grass);
    grassGrad.addColorStop(1, stadium.grassDark);
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, grassTop, canvas.width, canvas.height - grassTop);

    this.drawPitchStripes(grassTop, stadium);

    if (stadium.id === 'rain') this.drawRain();
    if (stadium.wind > 0.2) this.drawWindParticles(stadium);

    this.drawPenaltyArea();
    this.drawGoal();
    this.drawCrowd();
  },

  drawCrowd() {
    const { ctx, canvas } = this;
    const crowdY = canvas.height * 0.40;
    const colors = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa', '#fb8c00'];
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.35;
      const x = (i * 5) % canvas.width;
      const y = crowdY - Math.sin(i * 0.7) * 4 - (i % 3) * 3;
      ctx.fillRect(x, y, 4, 6);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, crowdY - 2, canvas.width, 4);
  },

  drawPitchStripes(grassTop, stadium) {
    const { ctx, canvas } = this;
    const stripeH = (canvas.height - grassTop) / 10;
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 === 0 ? stadium.grass : stadium.grassDark;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, grassTop + i * stripeH, canvas.width, stripeH);
    }
    ctx.globalAlpha = 1;
  },

  drawPenaltyArea() {
    const { ctx, canvas } = this;
    const cfg = SIQIU.GAME_CONFIG;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;

    ctx.strokeRect(340, 130, 280, 380);

    ctx.beginPath();
    ctx.arc(cfg.canvasW / 2, cfg.shoterY + 40, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(400, 150);
    ctx.lineTo(400, 460);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(560, 150);
    ctx.lineTo(560, 460);
    ctx.stroke();
  },

  drawGoal() {
    const { ctx } = this;
    const cfg = SIQIU.GAME_CONFIG;
    const x = cfg.goalLeft;
    const y = cfg.goalY;
    const w = cfg.goalRight - cfg.goalLeft;
    const h = cfg.goalHeight;

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let gx = x + 10; gx < x + w; gx += 10) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y + 10; gy < y + h; gy += 10) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 6, y - 6, 6, h + 12);
    ctx.fillRect(x + w, y - 6, 6, h + 12);
    ctx.fillRect(x - 6, y - 6, w + 12, 6);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, y + h - 3, w, 6);
  },

  drawRain() {
    const { ctx, canvas } = this;
    ctx.strokeStyle = 'rgba(180,220,255,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const x = (i * 41 + Date.now() * 0.1) % canvas.width;
      const y = (i * 67 + Date.now() * 0.5) % canvas.height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 8);
      ctx.stroke();
    }
  },

  drawWindParticles(stadium) {
    const { ctx, canvas } = this;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const y = (i * 91 + Date.now() * 0.15 * stadium.wind) % canvas.height;
      const x = (i * 137 + Date.now() * 0.3) % canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 20 * stadium.wind, y);
      ctx.stroke();
    }
  },

  _roundRect(ctx, x, y, w, h, r) {
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
  },

  _darken(hex, amt) {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.max(0, Math.floor(r * (1 - amt)));
    g = Math.max(0, Math.floor(g * (1 - amt)));
    b = Math.max(0, Math.floor(b * (1 - amt)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  _lighten(hex, amt) {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.min(255, Math.floor(r + (255 - r) * amt));
    g = Math.min(255, Math.floor(g + (255 - g) * amt));
    b = Math.min(255, Math.floor(b + (255 - b) * amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  drawShooter(character, aimAngle, power, charging, shotType) {
    const { ctx } = this;
    const cfg = SIQIU.GAME_CONFIG;
    const x = cfg.shoterX;
    const y = cfg.shoterY;
    const scale = 1.8;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const bc = character.color;
    const bcDark = this._darken(bc, 0.3);
    const bcLight = this._lighten(bc, 0.25);
    const skin = '#f5d0a9';
    const skinD = '#c49560';
    const skinL = '#ffe4c4';
    const swing = charging ? Math.sin(Date.now() * 0.012) * 0.3 : 0;

    const drawLeg = (lx, ly, angle, len, isFront) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);

      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.moveTo(-3.5, 0);
      ctx.quadraticCurveTo(-5, len * 0.25, -4, len * 0.5);
      ctx.quadraticCurveTo(-3, len * 0.75, -4, len);
      ctx.lineTo(4, len);
      ctx.quadraticCurveTo(3, len * 0.75, 4, len * 0.5);
      ctx.quadraticCurveTo(5, len * 0.25, 3.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.moveTo(-5, len * 0.45);
      ctx.quadraticCurveTo(-6, len * 0.65, -5.5, len * 0.85);
      ctx.lineTo(5.5, len * 0.85);
      ctx.quadraticCurveTo(6, len * 0.65, 5, len * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, len * 0.65, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1a237e';
      ctx.beginPath();
      ctx.ellipse(1, len * 1.0, 8, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(1, len * 0.97, 6, 1.5, 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawLeg(-4, -14, -0.25 + swing * 0.5, 20, false);
    drawLeg(5, -14, 0.35 - swing * 0.7, 22, true);

    ctx.fillStyle = bc;
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.quadraticCurveTo(-12, -10, -10, -8);
    ctx.lineTo(10, -8);
    ctx.quadraticCurveTo(12, -10, 10, -14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = bcDark;
    ctx.beginPath();
    ctx.ellipse(0, -9, 9, 2, 0, 0, Math.PI);
    ctx.fill();

    const torsoGrad = ctx.createLinearGradient(-10, -36, 10, -18);
    torsoGrad.addColorStop(0, bcLight);
    torsoGrad.addColorStop(0.5, bc);
    torsoGrad.addColorStop(1, bcDark);
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.moveTo(-9, -18);
    ctx.quadraticCurveTo(-11, -28, -9, -36);
    ctx.quadraticCurveTo(0, -40, 9, -36);
    ctx.quadraticCurveTo(11, -28, 9, -18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -26, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bcDark;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -31);
    ctx.lineTo(0, -21);
    ctx.stroke();

    ctx.fillStyle = '#222';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('10', -4, -24);
    ctx.fillText('10', 4, -24);
    ctx.textAlign = 'left';

    ctx.fillStyle = bcDark;
    ctx.beginPath();
    ctx.ellipse(0, -35, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bcLight;
    ctx.beginPath();
    ctx.ellipse(0, -36.5, 7, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawArm = (ax, ay, angle, len, hasBall) => {
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle);

      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, 3, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.moveTo(-2.5, 5);
      ctx.quadraticCurveTo(-4, len * 0.5, -3, len);
      ctx.lineTo(3, len);
      ctx.quadraticCurveTo(4, len * 0.5, 2.5, 5);
      ctx.closePath();
      ctx.fill();

      if (hasBall) {
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(0, len + 3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f9a825';
        ctx.beginPath();
        ctx.arc(0, len + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(0, len + 3, 4, -0.3, 0.3);
        ctx.stroke();
      }

      ctx.restore();
    };

    const armSwing = charging ? Math.sin(Date.now() * 0.012) * 0.4 : 0;
    drawArm(-8, -32, -0.1 + armSwing * 0.4, 16, false);
    drawArm(9, -32, -0.5 + armSwing * 0.6, 18, true);

    const headGrad = ctx.createRadialGradient(-3, -44, 2, 0, -42, 10);
    headGrad.addColorStop(0, skinL);
    headGrad.addColorStop(0.7, skin);
    headGrad.addColorStop(1, skinD);
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -42, 9, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skinD;
    ctx.beginPath();
    ctx.ellipse(-7, -40, 1.5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -40, 1.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2c1810';
    ctx.beginPath();
    ctx.ellipse(0, -47, 10, 5, 0, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-5, -46, 3, 2, -0.3, Math.PI, Math.PI * 1.7, false);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, -46, 3, 2, 0.3, Math.PI * 1.3, Math.PI * 2, false);
    ctx.fill();

    ctx.strokeStyle = '#2c1810';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, -44);
    ctx.quadraticCurveTo(-2, -45.5, 0, -44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -44);
    ctx.quadraticCurveTo(2, -45.5, 0, -44);
    ctx.stroke();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(-3, -41, 1.3, 1.6, 0, 0, Math.PI * 2);
    ctx.ellipse(3, -41, 1.3, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-2.5, -41.5, 0.5, 0, Math.PI * 2);
    ctx.arc(3.5, -41.5, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,150,150,0.3)';
    ctx.beginPath();
    ctx.ellipse(-5, -38, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -38, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -36, 2, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();

    ctx.restore();

    this.drawAimIndicator(aimAngle, power, charging, shotType);
  },

  drawAimIndicator(angle, power, charging, shotType) {
    const { ctx } = this;
    const cfg = SIQIU.GAME_CONFIG;
    const startX = cfg.shoterX;
    const startY = cfg.shoterY - 30;

    const shotColor = shotType.id === 'flat' ? 'rgba(100,200,255,' :
                      shotType.id === 'volley' ? 'rgba(255,120,60,' :
                      'rgba(180,120,255,';

    const segments = 30;
    const rad = SIQIU.Utils.deg2rad(angle);
    const dirX = Math.sin(rad);
    const dirY = -Math.abs(Math.cos(rad));
    const baseSpeed = shotType.baseSpeed * power;
    const lift = shotType.lift * 6 * power;
    const curveAmt = shotType.curve * 0.5;

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const px = startX + dirX * baseSpeed * t * 12 + (shotType.id === 'lob' ? curveAmt * t * t * 60 : 0);
      const py = startY + dirY * baseSpeed * t * 12;
      const pz = lift * t * 8 - 0.35 * t * t * 40;
      const scale = 1 + pz * 0.012;
      const cx = cfg.canvasW / 2;
      const cy = cfg.canvasH / 2;
      const sx = cx + (px - cx) * scale;
      const sy = cy + (py - cy) * scale - pz * 0.8;
      const alpha = charging ? 0.85 - t * 0.6 : 0.5 - t * 0.4;
      const r = 4 + power * 3 - t * 3;
      ctx.fillStyle = shotColor + alpha + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(1, r), 0, Math.PI * 2);
      ctx.fill();
    }

    const endT = 0.8;
    const endX = startX + dirX * baseSpeed * endT * 12 + (shotType.id === 'lob' ? curveAmt * endT * endT * 60 : 0);
    const endY = startY + dirY * baseSpeed * endT * 12;
    const endZ = lift * endT * 8 - 0.35 * endT * endT * 40;
    const escale = 1 + endZ * 0.012;
    const ecx = cfg.canvasW / 2;
    const ecy = cfg.canvasH / 2;
    const esx = ecx + (endX - ecx) * escale;
    const esy = ecy + (endY - ecy) * escale - endZ * 0.8;

    ctx.strokeStyle = charging ? shotColor + '1)' : 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(esx, esy, 8 + power * 4, 0, Math.PI * 2);
    ctx.stroke();
  },

  drawBall(ball) {
    if (!ball) return;
    const { ctx } = this;
    const pos = SIQIU.Physics.getScreenPos(ball);

    if (ball.trail && ball.trail.length > 2) {
      const type = ball.type || 'flat';
      let trailColor, trailWidth;
      if (type === 'flat') {
        trailColor = 'rgba(100,200,255,';
        trailWidth = 4;
      } else if (type === 'volley') {
        trailColor = 'rgba(255,120,60,';
        trailWidth = 6;
      } else {
        trailColor = 'rgba(180,120,255,';
        trailWidth = 5;
      }

      if (type === 'volley') {
        for (let i = 0; i < ball.trail.length - 1; i++) {
          const t = i / ball.trail.length;
          const p1 = ball.trail[i];
          const p2 = ball.trail[i + 1];
          const sp1 = SIQIU.Physics.getScreenPos(p1);
          const sp2 = SIQIU.Physics.getScreenPos(p2);
          ctx.strokeStyle = trailColor + (t * 0.8) + ')';
          ctx.lineWidth = trailWidth * (0.3 + t * 0.7);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sp1.x, sp1.y);
          ctx.lineTo(sp2.x, sp2.y);
          ctx.stroke();
        }
        if (ball.trail.length > 5) {
          const last = ball.trail[ball.trail.length - 1];
          const prev = ball.trail[ball.trail.length - 6];
          const sl = SIQIU.Physics.getScreenPos(last);
          const sp = SIQIU.Physics.getScreenPos(prev);
          const grad = ctx.createLinearGradient(sp.x, sp.y, sl.x, sl.y);
          grad.addColorStop(0, 'rgba(255,200,50,0)');
          grad.addColorStop(1, 'rgba(255,80,20,0.6)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(sl.x, sl.y, 14, 8, Math.atan2(sl.y - sp.y, sl.x - sp.x), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'lob') {
        for (let i = 0; i < ball.trail.length; i++) {
          const t = i / ball.trail.length;
          const p = ball.trail[i];
          const sp = SIQIU.Physics.getScreenPos(p);
          ctx.fillStyle = trailColor + (t * 0.7) + ')';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.r * (0.4 + t * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        for (let i = 0; i < ball.trail.length - 1; i++) {
          const t = i / ball.trail.length;
          const p1 = ball.trail[i];
          const p2 = ball.trail[i + 1];
          const sp1 = SIQIU.Physics.getScreenPos(p1);
          const sp2 = SIQIU.Physics.getScreenPos(p2);
          ctx.strokeStyle = trailColor + (t * 0.6) + ')';
          ctx.lineWidth = trailWidth * (0.2 + t * 0.6);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sp1.x, sp1.y);
          ctx.lineTo(sp2.x, sp2.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + pos.r * 0.7 + ball.z * 0.25, pos.r * 0.9, pos.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(pos.x - pos.r * 0.3, pos.y - pos.r * 0.3, pos.r * 0.1, pos.x, pos.y, pos.r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#c8c8c8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const ang = (ball.x + ball.y) * 0.02;
    const pts = 5;
    for (let i = 0; i < pts; i++) {
      const a = ang + (i / pts) * Math.PI * 2;
      const px = pos.x + Math.cos(a) * pos.r * 0.5;
      const py = pos.y + Math.sin(a) * pos.r * 0.5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    for (let i = 0; i < pts; i++) {
      const a = ang + (i / pts) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(pos.x + Math.cos(a) * pos.r * 0.5, pos.y + Math.sin(a) * pos.r * 0.5, pos.r * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (ball.type === 'lob' && Math.abs(ball.spin) > 0.01) {
      ctx.strokeStyle = 'rgba(180,120,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  drawGoalkeeper(gk) {
    const { ctx } = this;
    const x = gk.x;
    const y = gk.y - gk.jumpZ;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, gk.y + 12, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const breathe = Math.sin(Date.now() * 0.003) * 0.5;
    const bc = '#ffca28';
    const bcD = '#f57c00';
    const skin = '#f5d0a9';
    const skinD = '#d4a574';

    ctx.save();
    ctx.translate(x, y);

    if (gk.state === 'diving' && gk.diveTarget != null) {
      const t = SIQIU.Utils.clamp(gk.diveProgress / gk.diveDuration, 0, 1);
      const dir = gk.diveDirection;

      ctx.rotate(dir * (0.4 + t * 0.7));
      ctx.translate(0, -t * 28);

      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, -42, 18, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bcD;
      ctx.beginPath();
      ctx.ellipse(0, -30, 16, 8, 0, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -40, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1', 0, -36);
      ctx.textAlign = 'left';

      const headGrad = ctx.createRadialGradient(-2, -60, 2, 0, -58, 12);
      headGrad.addColorStop(0, '#ffe4c4');
      headGrad.addColorStop(1, skin);
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -58, 11, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(0, -62, 11, 5, 0, Math.PI * 1.1, Math.PI * 1.9, false);
      ctx.fill();

      const reach = 48 + t * 48;
      const gloveY = -30 - t * 22;
      const gloveX = dir * reach * 0.45;

      ctx.save();
      ctx.translate(dir * 18, -32);
      ctx.rotate(dir * (0.7 + t * 1.0));
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 14, 4, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, 4, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(-dir * 16, -30);
      ctx.rotate(-dir * (0.3 + t * 0.5));
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 12, 3.5, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, 3, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.ellipse(gloveX, gloveY, 22, 14, dir * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.ellipse(gloveX, gloveY, 12, 8, dir * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c62828';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(gloveX, gloveY, 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#1976d2';
      ctx.beginPath();
      ctx.ellipse(-8, -4, 5, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -4, 5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(-9, 13, 7, 4, 0.1, 0, Math.PI * 2);
      ctx.ellipse(9, 13, 7, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-9, 11, 5, 2, 0.1, 0, Math.PI * 2);
      ctx.ellipse(9, 11, 5, 2, 0.1, 0, Math.PI * 2);
      ctx.fill();

    } else if (gk.state === 'jumping' && gk.diveTarget != null) {
      const t = SIQIU.Utils.clamp(gk.diveProgress / gk.diveDuration, 0, 1);

      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, -45, 16, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bcD;
      ctx.beginPath();
      ctx.ellipse(0, -34, 14, 6, 0, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -42, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const headGrad = ctx.createRadialGradient(-2, -62, 2, 0, -60, 11);
      headGrad.addColorStop(0, '#ffe4c4');
      headGrad.addColorStop(1, skin);
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -60, 10, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(0, -64, 10, 4, 0, Math.PI * 1.1, Math.PI * 1.9, false);
      ctx.fill();

      const armUp = 42 + t * 38;

      ctx.save();
      ctx.translate(-13, -48);
      ctx.rotate(-0.55);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 16, 3.5, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, 4, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.ellipse(0, 30, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(0, 30, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(13, -48);
      ctx.rotate(0.55);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 16, 3.5, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, 4, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.ellipse(0, 30, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(0, 30, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.ellipse(0, -50 - armUp, 24, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.ellipse(0, -50 - armUp, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c62828';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -50 - armUp, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#1976d2';
      ctx.beginPath();
      ctx.ellipse(-8, -14, 5, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -14, 5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(-9, 6, 7, 4, 0.1, 0, Math.PI * 2);
      ctx.ellipse(9, 6, 7, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();

    } else if (gk.state === 'recovering') {
      const t = SIQIU.Utils.clamp(gk.reactionCooldown / 24, 0, 1);
      ctx.translate(0, breathe);

      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, -45, 16, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bcD;
      ctx.beginPath();
      ctx.ellipse(0, -33, 14, 7, 0, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -42, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const headGrad = ctx.createRadialGradient(-2, -62, 2, 0, -60, 11);
      headGrad.addColorStop(0, '#ffe4c4');
      headGrad.addColorStop(1, skin);
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -60, 10, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(0, -64, 10, 4, 0, Math.PI * 1.1, Math.PI * 1.9, false);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-3.5, -60, 1.2, 0, Math.PI * 2);
      ctx.arc(3.5, -60, 1.2, 0, Math.PI * 2);
      ctx.fill();

      const armSpread = 1 - t * 0.35;
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.ellipse(-22 * armSpread, -42, 13, 10, -0.3 * armSpread, 0, Math.PI * 2);
      ctx.ellipse(22 * armSpread, -42, 13, 10, 0.3 * armSpread, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(-22 * armSpread, -42, 6, 0, Math.PI * 2);
      ctx.arc(22 * armSpread, -42, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(-12 * armSpread, -44);
      ctx.rotate(-0.35 * armSpread);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 14, 3.5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(12 * armSpread, -44);
      ctx.rotate(0.35 * armSpread);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 14, 3.5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#1976d2';
      ctx.beginPath();
      ctx.ellipse(-8, -14, 5, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -14, 5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(-9, 6, 7, 4, 0.1, 0, Math.PI * 2);
      ctx.ellipse(9, 6, 7, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();

    } else {
      ctx.translate(0, breathe);

      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, -45, 16, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bcD;
      ctx.beginPath();
      ctx.ellipse(0, -33, 14, 7, 0, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, -42, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1', 0, -38);
      ctx.textAlign = 'left';

      const headGrad = ctx.createRadialGradient(-2, -62, 2, 0, -60, 12);
      headGrad.addColorStop(0, '#ffe4c4');
      headGrad.addColorStop(1, skin);
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -60, 11, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = skinD;
      ctx.beginPath();
      ctx.ellipse(-9, -58, 2, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(9, -58, 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(0, -64, 11, 4, 0, Math.PI * 1.1, Math.PI * 1.9, false);
      ctx.fill();

      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -66);
      ctx.quadraticCurveTo(-3, -67.5, 0, -66);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, -66);
      ctx.quadraticCurveTo(3, -67.5, 0, -66);
      ctx.stroke();

      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(-3.5, -61, 1.6, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(3.5, -61, 1.6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-2.8, -61.8, 0.6, 0, Math.PI * 2);
      ctx.arc(4.2, -61.8, 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, -55, 3, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,150,150,0.3)';
      ctx.beginPath();
      ctx.ellipse(-7, -56, 3, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(7, -56, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.ellipse(-22, -42, 14, 10, -0.3, 0, Math.PI * 2);
      ctx.ellipse(22, -42, 14, 10, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(-22, -42, 7, 0, Math.PI * 2);
      ctx.arc(22, -42, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c62828';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-22, -42, 10, 0, Math.PI * 2);
      ctx.arc(22, -42, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(-13, -44);
      ctx.rotate(-0.35);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 14, 3.5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, 3, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(13, -44);
      ctx.rotate(0.35);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(0, 14, 3.5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bc;
      ctx.beginPath();
      ctx.ellipse(0, 3, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#1976d2';
      ctx.beginPath();
      ctx.ellipse(-8, -14, 5, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -14, 5, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(-9, 6, 7, 4, 0.1, 0, Math.PI * 2);
      ctx.ellipse(9, 6, 7, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-9, 4, 5, 2, 0.1, 0, Math.PI * 2);
      ctx.ellipse(9, 4, 5, 2, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  drawHUDOverlay(power, aimAngle, shotType, charging) {
    const { ctx, canvas } = this;
    const cfg = SIQIU.GAME_CONFIG;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(20, canvas.height - 60, 280, 40);
    ctx.strokeStyle = '#ffb547';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, canvas.height - 60, 280, 40);

    const pct = SIQIU.Utils.clamp((power - 1) / (cfg.maxPower - 1), 0, 1);
    const grad = ctx.createLinearGradient(24, 0, 300, 0);
    grad.addColorStop(0, '#4caf50');
    grad.addColorStop(0.6, '#ffc107');
    grad.addColorStop(1, '#f44336');
    ctx.fillStyle = grad;
    ctx.fillRect(24, canvas.height - 56, 272 * pct, 32);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`力度 ${Math.round(pct * 100)}%`, 160, canvas.height - 34);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(canvas.width - 200, canvas.height - 60, 180, 40);
    ctx.strokeStyle = '#7ecfff';
    ctx.strokeRect(canvas.width - 200, canvas.height - 60, 180, 40);

    const typeColor = shotType.id === 'flat' ? '#64b5f6' :
                      shotType.id === 'volley' ? '#ff7043' : '#ba68c8';
    ctx.fillStyle = typeColor;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`招式：${shotType.name}`, canvas.width - 110, canvas.height - 34);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#cfd8dc';
    ctx.fillText(`按 1/2/3 切换`, canvas.width - 110, canvas.height - 20);

    ctx.textAlign = 'left';
  },

  drawFloatingTexts(texts) {
    const { ctx } = this;
    texts.forEach(t => {
      const age = (Date.now() - t.start) / 1000;
      if (age > 1.4) return;
      const alpha = 1 - age / 1.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color || '#ffeb3b';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y - age * 60);
      ctx.fillText(t.text, t.x, t.y - age * 60);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    });
  },

  drawMessage(msg, color) {
    const { ctx, canvas } = this;
    ctx.fillStyle = color || '#ffeb3b';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2 - 60);
    ctx.textAlign = 'left';
  }
};
