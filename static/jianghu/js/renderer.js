const Renderer = {
  particles: [],

  init() {
    this.particles = [];
  },

  render(ctx, game) {
    this.drawBackground(ctx);
    this.drawGround(ctx);

    if (game.player && game.ai) {
      this.drawCharacter(ctx, game.ai);
      this.drawCharacter(ctx, game.player);

      this.drawAttackEffect(ctx, game.player);
      this.drawAttackEffect(ctx, game.ai);

      this.drawDamageNumbers(ctx, game.damageEffects);
    }

    this.drawHUD(ctx, game);
    this.updateParticles(ctx);
  },

  drawBackground(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#f5ede0');
    gradient.addColorStop(0.5, '#e8dcc8');
    gradient.addColorStop(1, '#d9c9b0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    this.drawInkMountain(ctx, 0, 380, w * 0.6, 180, 'rgba(80, 60, 40, 0.08)');
    this.drawInkMountain(ctx, w * 0.3, 360, w * 0.7, 200, 'rgba(60, 40, 20, 0.06)');

    this.drawInkTree(ctx, 80, 485, 100, 'rgba(50, 40, 30, 0.12)');
    this.drawInkTree(ctx, 1100, 480, 95, 'rgba(50, 40, 30, 0.1)');

    this.drawBamboo(ctx, 45, 495, 130);
    this.drawBamboo(ctx, 1150, 490, 125);
  },

  drawInkMountain(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + w * 0.15, y - h * 0.1, x + w * 0.3, y + h * 0.2);
    ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.3, x + w * 0.7, y + h * 0.15);
    ctx.quadraticCurveTo(x + w * 0.85, y - h * 0.15, x + w, y + h * 0.25);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  },

  drawInkTree(ctx, x, y, height, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 3, y - height * 0.5, x, y - height);
    ctx.stroke();
  },

  drawBamboo(ctx, x, y, height) {
    ctx.strokeStyle = 'rgba(70, 90, 60, 0.25)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 2, y - height * 0.5, x, y - height);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(50, 70, 40, 0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const nodeY = y - (height * i / 6);
      ctx.beginPath();
      ctx.moveTo(x - 8, nodeY);
      ctx.lineTo(x + 8, nodeY);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(80, 100, 70, 0.2)';
    for (let i = 0; i < 5; i++) {
      const leafY = y - height * 0.35 - i * 22;
      ctx.beginPath();
      ctx.ellipse(x + 18, leafY, 22, 6, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - 16, leafY - 10, 20, 5, -0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawGround(ctx) {
    const groundY = CONFIG.CANVAS.GROUND_Y;

    ctx.fillStyle = 'rgba(90, 70, 50, 0.15)';
    ctx.fillRect(0, groundY, ctx.canvas.width, ctx.canvas.height - groundY);

    ctx.strokeStyle = 'rgba(70, 50, 30, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(ctx.canvas.width, groundY);
    ctx.stroke();

    this.drawGrass(ctx, 150, groundY, 18);
    this.drawGrass(ctx, 500, groundY, 20);
    this.drawGrass(ctx, 850, groundY, 19);
  },

  drawGrass(ctx, x, y, height) {
    ctx.strokeStyle = 'rgba(80, 100, 70, 0.35)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 5, y);
      ctx.quadraticCurveTo(x + i * 5 - 2, y - height * 0.6, x + i * 5 + 2, y - height);
      ctx.stroke();
    }
  },

  drawCharacter(ctx, char) {
    ctx.save();
    ctx.translate(char.x + char.bodyWidth / 2, char.y + char.bodyHeight);

    if (char.facing === -1) {
      ctx.scale(-1, 1);
    }

    if (char.hitFlash > 0 && Math.floor(char.hitFlash / 50) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    if (char.isDead) {
      ctx.rotate(Math.PI / 2);
      ctx.globalAlpha = 0.7;
    }

    let bodyH = char.bodyHeight;
    if (char.isCrouching) {
      bodyH = char.bodyHeight * 0.7;
      ctx.translate(0, char.bodyHeight - bodyH);
    }

    this.drawRobe(ctx, bodyH, char.color);
    this.drawBody(ctx, bodyH, char.color);
    this.drawHead(ctx, bodyH);
    this.drawHairAndHat(ctx, bodyH, char.color);
    this.drawArmsAndLegs(ctx, bodyH, char);

    if (char.isBlocking) {
      this.drawBlockEffect(ctx, bodyH);
    }

    ctx.restore();
  },

  drawRobe(ctx, h, color) {
    const gradient = ctx.createLinearGradient(-30, -h, 30, 0);
    gradient.addColorStop(0, this.lightenColor(color, 25));
    gradient.addColorStop(0.5, this.lightenColor(color, 15));
    gradient.addColorStop(1, this.darkenColor(color, 10));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-28, -h + 28);
    ctx.quadraticCurveTo(-32, -h * 0.4, -28, -12);
    ctx.quadraticCurveTo(-22, -3, 0, 0);
    ctx.quadraticCurveTo(22, -3, 28, -12);
    ctx.quadraticCurveTo(32, -h * 0.4, 28, -h + 28);
    ctx.quadraticCurveTo(15, -h + 18, 0, -h + 20);
    ctx.quadraticCurveTo(-15, -h + 18, -28, -h + 28);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.darkenColor(color, 25);
    ctx.lineWidth = 2;
    ctx.stroke();
  },

  drawBody(ctx, h, color) {
    const gradient = ctx.createLinearGradient(-15, -h, 15, 0);
    gradient.addColorStop(0, this.lightenColor(color, 8));
    gradient.addColorStop(1, this.darkenColor(color, 5));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-18, -h + 35);
    ctx.quadraticCurveTo(-20, -h * 0.45, -12, -22);
    ctx.quadraticCurveTo(0, -30, 12, -22);
    ctx.quadraticCurveTo(20, -h * 0.45, 18, -h + 35);
    ctx.quadraticCurveTo(0, -h + 42, -18, -h + 35);
    ctx.closePath();
    ctx.fill();
  },

  drawHead(ctx, h) {
    const headY = -h + 10;

    ctx.fillStyle = '#ebd0b0';
    ctx.beginPath();
    ctx.arc(0, headY, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(120, 90, 60, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.arc(-5, headY - 1, 2, 0, Math.PI * 2);
    ctx.arc(5, headY - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, headY + 6, 4, 0.3, Math.PI - 0.3);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 160, 150, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-10, headY + 4, 4, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(10, headY + 4, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  drawHairAndHat(ctx, h, color) {
    const headY = -h + 10;

    ctx.fillStyle = '#1a0f05';
    ctx.beginPath();
    ctx.arc(0, headY - 4, 18, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, headY - 10);
    ctx.quadraticCurveTo(0, headY - 26, 10, headY - 10);
    ctx.quadraticCurveTo(0, headY - 14, -10, headY - 10);
    ctx.fill();

    ctx.fillStyle = this.darkenColor(color, 15);
    ctx.beginPath();
    ctx.arc(0, headY - 22, 4, 0, Math.PI * 2);
    ctx.fill();
  },

  drawArmsAndLegs(ctx, h, char) {
    const swing = char.isAttacking ? Math.sin(Date.now() / 50) * 0.35 : Math.sin(Date.now() / 280) * 0.08;
    const armColor = this.lightenColor(char.color, 18);
    const legColor = this.darkenColor(char.color, 18);

    ctx.save();
    ctx.translate(-20, -h + 45);
    ctx.rotate(-0.35 + swing);
    this.drawLimb(ctx, 9, 50, armColor, this.darkenColor(char.color, 22));
    ctx.restore();

    ctx.save();
    ctx.translate(20, -h + 45);
    ctx.rotate(char.isAttacking ? 1.2 + swing : 0.35 + swing);
    this.drawLimb(ctx, 9, 50, armColor, this.darkenColor(char.color, 22));
    ctx.restore();

    const legSpread = char.isGrounded ? 0 : 0.22;

    ctx.save();
    ctx.translate(-10, -15);
    ctx.rotate(legSpread);
    this.drawLimb(ctx, 10, h * 0.3, legColor, this.darkenColor(char.color, 30));
    ctx.restore();

    ctx.save();
    ctx.translate(10, -15);
    ctx.rotate(-legSpread);
    this.drawLimb(ctx, 10, h * 0.3, legColor, this.darkenColor(char.color, 30));
    ctx.restore();
  },

  drawLimb(ctx, w, h, color, dark) {
    const gradient = ctx.createLinearGradient(-w / 2, 0, w / 2, h);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, dark);

    ctx.fillStyle = gradient;
    this.roundRect(ctx, -w / 2, 0, w, h, 5);
    ctx.fill();
  },

  drawBlockEffect(ctx, h) {
    ctx.strokeStyle = 'rgba(100, 160, 240, 0.45)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, -h / 2, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(100, 160, 240, 0.08)';
    ctx.beginPath();
    ctx.arc(0, -h / 2, 55, 0, Math.PI * 2);
    ctx.fill();
  },

  drawAttackEffect(ctx, char) {
    if (!char.isAttacking || !char.currentAttack) return;

    ctx.save();
    ctx.translate(char.x + char.bodyWidth / 2, char.y + char.bodyHeight / 2);

    const dir = char.facing;
    const time = Date.now() / 70;

    if (char.currentAttack === 'lightPunch' || char.currentAttack === 'heavyPunch') {
      const range = char.currentAttack === 'heavyPunch' ? 85 : 65;
      this.drawPunchEffect(ctx, dir, range, time, char.color);
    } else if (char.currentAttack === 'lightKick' || char.currentAttack === 'heavyKick') {
      const range = char.currentAttack === 'heavyKick' ? 105 : 80;
      this.drawKickEffect(ctx, dir, range, time, char.color);
    } else if (char.currentAttack === 'skill') {
      this.drawSkillEffect(ctx, dir, time, char);
    }

    ctx.restore();
  },

  drawPunchEffect(ctx, dir, range, time, color) {
    ctx.strokeStyle = this.darkenColor(color, 18);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(dir * 28, -25);
    ctx.quadraticCurveTo(
      dir * range * 0.5,
      -32 + Math.sin(time) * 5,
      dir * range,
      -25 + Math.sin(time) * 3
    );
    ctx.stroke();

    ctx.fillStyle = this.lightenColor(color, 28);
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(dir * range, -25, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    this.addParticle(dir * range, -25, color);
  },

  drawKickEffect(ctx, dir, range, time, color) {
    ctx.strokeStyle = this.darkenColor(color, 12);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(dir * 25, 18);
    ctx.quadraticCurveTo(
      dir * range * 0.4,
      35 + Math.sin(time) * 10,
      dir * range,
      18 + Math.sin(time) * 5
    );
    ctx.stroke();

    ctx.fillStyle = this.lightenColor(color, 22);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(dir * range, 18, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    this.addParticle(dir * range, 18, color);
  },

  drawSkillEffect(ctx, dir, time, char) {
    const base = char.color;

    for (let i = 0; i < 5; i++) {
      const offset = i * 22;
      const alpha = 1 - i * 0.14;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.lightenColor(base, i * 10);
      ctx.lineWidth = 7 - i;
      ctx.beginPath();
      ctx.arc(dir * (35 + offset), 0, 38 + i * 8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = this.lightenColor(base, 35);
    for (let i = 0; i < 10; i++) {
      const angle = (time + i * 0.5) % (Math.PI * 2);
      const dist = 55 + Math.sin(time + i) * 28;
      ctx.beginPath();
      ctx.arc(
        dir * dist * Math.cos(angle),
        dist * Math.sin(angle),
        4 + Math.sin(time + i) * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = this.darkenColor(base, 28);
    ctx.lineWidth = 2;
    ctx.font = 'bold 18px "KaiTi", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.strokeText(char.skillName, dir * 85, -55);
    ctx.fillText(char.skillName, dir * 85, -55);

    for (let i = 0; i < 2; i++) {
      this.addParticle(dir * (55 + Math.random() * 70), (Math.random() - 0.5) * 55, base);
    }
  },

  addParticle(x, y, color) {
    if (this.particles.length > 15) {
      this.particles.shift();
    }
    this.particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      life: 450,
      maxLife: 450,
      size: 3 + Math.random() * 4,
      color: color
    });
  },

  updateParticles(ctx) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 16;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = this.darkenColor(p.color, 8);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  drawDamageNumbers(ctx, effects) {
    effects.forEach(effect => {
      const alpha = Math.min(1, effect.life / 600);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#c41e3a';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.font = 'bold 28px "KaiTi", "STKaiti", serif';
      ctx.textAlign = 'center';
      ctx.strokeText(`-${effect.damage}`, effect.x, effect.y);
      ctx.fillText(`-${effect.damage}`, effect.x, effect.y);
    });
    ctx.globalAlpha = 1;
  },

  drawHUD(ctx, game) {
    if (!game.player || !game.ai) return;

    this.drawStatusBar(ctx, game.player, 30, 25, true);
    this.drawStatusBar(ctx, game.ai, ctx.canvas.width - 340, 25, false);
    this.drawRoundInfo(ctx, game);
  },

  drawStatusBar(ctx, char, x, y, isLeft) {
    const width = 310;
    const barH = 24;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.roundRect(ctx, x - 4, y - 4, width + 8, barH + 50, 6);
    ctx.fill();

    ctx.fillStyle = '#3a2a1a';
    this.roundRect(ctx, x, y, width, barH, 4);
    ctx.fill();

    const hpPct = char.hp / char.maxHp;
    const hpW = width * hpPct;

    let hpColor = hpPct < 0.3 ? '#c41e3a' : (hpPct < 0.6 ? '#d4a017' : '#2d5a27');
    const hpGrad = ctx.createLinearGradient(x, y, x, y + barH);
    hpGrad.addColorStop(0, this.lightenColor(hpColor, 18));
    hpGrad.addColorStop(0.5, hpColor);
    hpGrad.addColorStop(1, this.darkenColor(hpColor, 18));

    ctx.fillStyle = hpGrad;
    this.roundRect(ctx, x, y, hpW, barH, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    this.roundRect(ctx, x, y, hpW, barH / 2, 4);
    ctx.fill();

    ctx.strokeStyle = '#1a0f05';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, width, barH, 4);
    ctx.stroke();

    const mpY = y + barH + 5;
    const mpH = 11;

    ctx.fillStyle = '#1a2a3a';
    this.roundRect(ctx, x, mpY, width, mpH, 3);
    ctx.fill();

    const mpPct = char.mp / char.maxMp;
    const mpW = width * mpPct;
    const mpGrad = ctx.createLinearGradient(x, mpY, x, mpY + mpH);
    mpGrad.addColorStop(0, '#6a9ac8');
    mpGrad.addColorStop(1, '#2a5a8a');

    ctx.fillStyle = mpGrad;
    this.roundRect(ctx, x, mpY, mpW, mpH, 3);
    ctx.fill();

    ctx.strokeStyle = '#0a1a2a';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, mpY, width, mpH, 3);
    ctx.stroke();

    ctx.fillStyle = '#1a0f05';
    ctx.font = 'bold 16px "KaiTi", "STKaiti", serif';
    ctx.textBaseline = 'middle';

    if (isLeft) {
      ctx.textAlign = 'left';
      ctx.fillText(char.name, x, mpY + mpH + 15);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(char.name, x + width, mpY + mpH + 15);
    }

    ctx.font = '13px "KaiTi", "STKaiti", serif';
    ctx.fillStyle = '#5a4a3a';

    if (isLeft) {
      ctx.fillText(`${Math.ceil(char.hp)}/${char.maxHp}`, x + width - 75, y + barH / 2);
    } else {
      ctx.fillText(`${Math.ceil(char.hp)}/${char.maxHp}`, x + 75, y + barH / 2);
    }
  },

  drawRoundInfo(ctx, game) {
    const cx = ctx.canvas.width / 2;

    ctx.fillStyle = 'rgba(42, 26, 10, 0.65)';
    this.roundRect(ctx, cx - 80, 22, 160, 52, 6);
    ctx.fill();

    ctx.fillStyle = '#daa520';
    ctx.font = 'bold 18px "KaiTi", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${game.round} 局`, cx, 42);

    ctx.fillStyle = '#f5deb3';
    ctx.font = '15px "KaiTi", "STKaiti", serif';
    ctx.fillText(`${game.playerWins} : ${game.aiWins}`, cx, 64);
  },

  roundRect(ctx, x, y, w, h, r) {
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

  lightenColor(color, percent) {
    if (color.startsWith('rgb')) {
      const m = color.match(/\d+/g);
      if (m) return `rgb(${Math.min(255, +m[0] + 2.55 * percent | 0)}, ${Math.min(255, +m[1] + 2.55 * percent | 0)}, ${Math.min(255, +m[2] + 2.55 * percent | 0)})`;
    }
    const n = parseInt(color.replace('#', ''), 16);
    return `rgb(${Math.min(255, (n >> 16) + 2.55 * percent | 0)}, ${Math.min(255, ((n >> 8) & 255) + 2.55 * percent | 0)}, ${Math.min(255, (n & 255) + 2.55 * percent | 0)})`;
  },

  darkenColor(color, percent) {
    if (color.startsWith('rgb')) {
      const m = color.match(/\d+/g);
      if (m) return `rgb(${Math.max(0, +m[0] - 2.55 * percent | 0)}, ${Math.max(0, +m[1] - 2.55 * percent | 0)}, ${Math.max(0, +m[2] - 2.55 * percent | 0)})`;
    }
    const n = parseInt(color.replace('#', ''), 16);
    return `rgb(${Math.max(0, (n >> 16) - 2.55 * percent | 0)}, ${Math.max(0, ((n >> 8) & 255) - 2.55 * percent | 0)}, ${Math.max(0, (n & 255) - 2.55 * percent | 0)})`;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer;
}
