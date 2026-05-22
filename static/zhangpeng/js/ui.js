const UI = {
  game: null,

  init(game) {
    this.game = game;
  },

  render(ctx) {
    ctx.imageSmoothingEnabled = true;
    this.renderHUD(ctx);
    this.renderProgressBar(ctx);
    this.renderActiveEffects(ctx);
  },

  text(ctx, text, x, y, color, fontSize, fontWeight, align) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = color;
    ctx.font = (fontWeight || 'bold') + ' ' + (fontSize || '14px') + ' Arial';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    const rx = Math.round(x);
    const ry = Math.round(y);
    ctx.fillText(text, rx, ry);
    ctx.restore();
  },

  renderHUD(ctx) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, 280, 90);
    ctx.strokeStyle = '#FDCB6E';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 280, 90);

    const hpPercent = this.game.player.hp / this.game.player.maxHp;
    ctx.fillStyle = '#2D3436';
    ctx.fillRect(20, 25, 200, 18);
    ctx.fillStyle = hpPercent > 0.5 ? '#00B894' : hpPercent > 0.25 ? '#FDCB6E' : '#E74C3C';
    ctx.fillRect(20, 25, 200 * hpPercent, 18);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 25, 200, 18);

    this.text(ctx, `\u2764 ${this.game.player.hp} / ${this.game.player.maxHp}`, 25, 34, '#FFF', '12px', 'bold', 'left');

    this.text(ctx, `得分: ${this.game.player.score}`, 20, 55, '#FDCB6E', '14px', 'bold', 'left');

    const stage = GameConfig.STAGES[this.game.stageIndex];
    if (stage) {
      this.text(ctx, stage.name, 280, 55, '#74B9FF', '14px', 'bold', 'right');
    }

    this.renderDangerLevel(ctx);

    this.text(ctx, this.game.player.cfg.name, 145, 82, '#A29BFE', '11px', 'bold', 'center');

    ctx.restore();
  },

  renderDangerLevel(ctx) {
    const level = this.game.stageIndex;
    const levelNames = ['轻度危险', '中度危险', '极度危险'];
    const levelColors = ['#00B894', '#FDCB6E', '#E74C3C'];
    const bgColors = ['rgba(0,184,148,0.3)', 'rgba(253,203,110,0.3)', 'rgba(231,76,60,0.4)'];

    ctx.fillStyle = bgColors[level];
    ctx.fillRect(20, 68, 260, 12);

    ctx.fillStyle = levelColors[level];
    const barWidth = 260 * ((level + 1) / 3);
    ctx.fillRect(20, 68, barWidth, 12);

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 68, 260, 12);

    this.text(ctx, '危险等级: ' + levelNames[level], 150, 74, '#FFF', '10px', 'bold', 'center');
  },

  renderProgressBar(ctx) {
    const barWidth = GameConfig.CANVAS_WIDTH - 200;
    const barX = 100;
    const barY = 15;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX - 5, barY - 5, barWidth + 10, 20);
    ctx.fillStyle = '#2D3436';
    ctx.fillRect(barX, barY, barWidth, 10);

    const progress = Math.min(1, this.game.player.x / GameConfig.SAFE_ZONE_X);
    const grad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    grad.addColorStop(0, '#E17055');
    grad.addColorStop(0.5, '#FDCB6E');
    grad.addColorStop(1, '#00B894');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barWidth * progress, 10);

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, 10);

    this.text(ctx, `${Math.floor(progress * 100)}%`, barX + barWidth / 2, barY + 5, '#FFF', '12px', 'bold', 'center');

    for (let i = 0; i < GameConfig.STAGES.length; i++) {
      const stage = GameConfig.STAGES[i];
      const markerX = barX + barWidth * (stage.endX / GameConfig.SAFE_ZONE_X);
      ctx.fillStyle = i === 0 ? '#E17055' : i === 1 ? '#0984E3' : '#00B894';
      ctx.fillRect(markerX - 2, barY - 3, 4, 16);
    }

    ctx.restore();
  },

  renderActiveEffects(ctx) {
    const effects = this.game.player.activeEffects;
    let y = 115;
    const x = 20;

    ctx.save();

    if (effects.speed > 0) {
      this.renderEffectBadge(ctx, x, y, '⚡', '加速', effects.speed, 5000, '#00D2D3');
      y += 30;
    }
    if (effects.shield > 0) {
      this.renderEffectBadge(ctx, x, y, '🛡', '护盾', effects.shield, 3000, '#FDCB6E');
      y += 30;
    }
    if (effects.smoke > 0) {
      this.renderEffectBadge(ctx, x, y, '💨', '隐身', effects.smoke, 4000, '#B2BEC3');
      y += 30;
    }

    ctx.restore();
  },

  renderEffectBadge(ctx, x, y, icon, name, remaining, maxDuration, color) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, 120, 25);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 120, 25);

    this.text(ctx, icon, x + 5, y + 12, '#FFF', '16px', 'bold', 'left');
    this.text(ctx, name, x + 28, y + 7, '#FFF', '11px', 'bold', 'left');

    const seconds = Math.ceil(remaining / 1000);
    this.text(ctx, `${seconds}s`, x + 115, y + 12, '#FFF', '14px', 'bold', 'right');

    const barWidth = 80;
    const barPercent = remaining / maxDuration;
    ctx.fillStyle = '#2D3436';
    ctx.fillRect(x + 28, y + 15, barWidth, 5);
    ctx.fillStyle = color;
    ctx.fillRect(x + 28, y + 15, barWidth * barPercent, 5);
  },

  renderCharacterSelect(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    this.text(ctx, '帐篷塌了！', GameConfig.CANVAS_WIDTH / 2, 80, '#FDCB6E', '48px', 'bold', 'center');
    this.text(ctx, '选择你的逃生角色', GameConfig.CANVAS_WIDTH / 2, 120, '#FFF', '18px', 'normal', 'center');

    const characters = Object.keys(GameConfig.CHARACTERS);
    const cardWidth = 260;
    const cardHeight = 300;
    const gap = 30;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (GameConfig.CANVAS_WIDTH - totalWidth) / 2;

    for (let i = 0; i < characters.length; i++) {
      const charType = characters[i];
      const cfg = GameConfig.CHARACTERS[charType];
      const cx = startX + i * (cardWidth + gap);
      const cy = 160;

      const isSelected = this.game.selectedCharacter === charType;
      const isHovered = this.game.hoveredCharacter === charType;

      ctx.fillStyle = isSelected ? 'rgba(253, 203, 110, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(cx, cy, cardWidth, cardHeight);
      ctx.strokeStyle = isSelected ? '#FDCB6E' : isHovered ? '#74B9FF' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.strokeRect(cx, cy, cardWidth, cardHeight);

      this.renderCharacterPreview(ctx, cx + cardWidth / 2, cy + 120, charType);

      this.text(ctx, cfg.name, cx + cardWidth / 2, cy + 190, cfg.color, '22px', 'bold', 'center');

      this.text(ctx, cfg.desc, cx + cardWidth / 2, cy + 215, '#DFE6E9', '13px', 'normal', 'center');

      this.text(ctx, `HP: ${cfg.hp}`, cx + 40, cy + 245, '#A29BFE', '12px', 'bold', 'center');
      this.text(ctx, `速度: ${cfg.speed.toFixed(1)}`, cx + cardWidth / 2, cy + 245, '#00D2D3', '12px', 'bold', 'center');
      this.text(ctx, `跳跃: ${cfg.jumpPower}`, cx + cardWidth - 40, cy + 245, '#FDCB6E', '12px', 'bold', 'center');

      if (cfg.crouchSpeedBonus > 0) {
        this.text(ctx, `下蹲加速+${cfg.crouchSpeedBonus}`, cx + cardWidth / 2, cy + 265, '#00B894', '12px', 'bold', 'center');
      }
      if (cfg.airTimeBonus > 0) {
        this.text(ctx, `滞空+${cfg.airTimeBonus}`, cx + cardWidth / 2, cy + 265, '#00B894', '12px', 'bold', 'center');
      }
      if (cfg.damageReduction > 0.15) {
        this.text(ctx, `减伤${Math.floor(cfg.damageReduction * 100)}%`, cx + cardWidth / 2, cy + 265, '#00B894', '12px', 'bold', 'center');
      }

      if (isSelected) {
        this.text(ctx, '\u2713 已选择', cx + cardWidth / 2, cy + cardHeight - 15, '#FDCB6E', '14px', 'bold', 'center');
      } else if (isHovered) {
        this.text(ctx, '点击选择', cx + cardWidth / 2, cy + cardHeight - 15, '#74B9FF', '14px', 'bold', 'center');
      }
    }

    if (this.game.selectedCharacter) {
      this.text(ctx, '点击开始游戏', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT - 40, '#00B894', '24px', 'bold', 'center');
    } else {
      this.text(ctx, '选择角色开始逃生', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT - 40, '#B2BEC3', '18px', 'normal', 'center');
    }

    ctx.restore();
  },

  renderCharacterPreview(ctx, x, y, charType) {
    const cfg = GameConfig.CHARACTERS[charType];
    ctx.save();

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 25);
    ctx.lineTo(x + 18, y + 25);
    ctx.lineTo(x + 14, y - 10);
    ctx.lineTo(x - 14, y - 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cfg.accent;
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.arc(x, y - 22, 16, 0, Math.PI * 2);
    ctx.fill();

    if (charType === 'clown') {
      ctx.fillStyle = cfg.hat;
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 32);
      ctx.lineTo(x + 16, y - 32);
      ctx.lineTo(x + 12, y - 48);
      ctx.lineTo(x - 12, y - 48);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(x, y - 48, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF4757';
      ctx.beginPath();
      ctx.arc(x, y - 18, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (charType === 'trainer') {
      ctx.fillStyle = cfg.hat;
      ctx.fillRect(x - 18, y - 38, 36, 8);
      ctx.fillRect(x - 14, y - 50, 28, 14);
    } else if (charType === 'acrobat') {
      ctx.fillStyle = cfg.hat;
      ctx.beginPath();
      ctx.moveTo(x - 14, y - 32);
      ctx.lineTo(x + 14, y - 32);
      ctx.lineTo(x, y - 55);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#2D3436';
    ctx.beginPath();
    ctx.arc(x - 5, y - 24, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 24, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  renderStartScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    this.text(ctx, '帐篷塌了！', GameConfig.CANVAS_WIDTH / 2, 100, '#E17055', '56px', 'bold', 'center');
    this.text(ctx, '\uD83C\uDFC3 狂奔逃生 \uD83C\uDFC3', GameConfig.CANVAS_WIDTH / 2, 150, '#FDCB6E', '24px', 'bold', 'center');
    this.text(ctx, '操控马戏团演员躲避坍塌建筑、掉落杂物与失控动物', GameConfig.CANVAS_WIDTH / 2, 200, '#FFF', '16px', 'normal', 'center');
    this.text(ctx, '狂奔逃生抵达安全区域完成逃亡', GameConfig.CANVAS_WIDTH / 2, 225, '#FFF', '16px', 'normal', 'center');

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(GameConfig.CANVAS_WIDTH / 2 - 200, 260, 400, 180);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(GameConfig.CANVAS_WIDTH / 2 - 200, 260, 400, 180);

    this.text(ctx, '操作说明', GameConfig.CANVAS_WIDTH / 2, 290, '#74B9FF', '18px', 'bold', 'center');

    ctx.fillStyle = '#DFE6E9';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const controls = [
      '\u2190 \u2192 或 A D : 左右移动',
      '\u2191 或 W 或 空格 : 跳跃 (长按跳更高)',
      '\u2193 或 S : 下蹲低头',
      'Shift : 冲刺',
      'P : 暂停 / 继续'
    ];
    controls.forEach((text, i) => {
      ctx.fillText(text, GameConfig.CANVAS_WIDTH / 2 - 150, 320 + i * 22);
    });

    if (this.game.hasSave) {
      this.text(ctx, '检测到存档 - 点击继续游戏', GameConfig.CANVAS_WIDTH / 2, 480, '#00B894', '18px', 'bold', 'center');
      this.text(ctx, '(按 N 键开始新游戏)', GameConfig.CANVAS_WIDTH / 2, 505, '#B2BEC3', '14px', 'normal', 'center');
    } else {
      this.text(ctx, '点击选择角色开始游戏', GameConfig.CANVAS_WIDTH / 2, 480, '#FDCB6E', '20px', 'bold', 'center');
    }

    ctx.restore();
  },

  renderPauseScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    this.text(ctx, '\u23F8 暂停', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 - 30, '#FDCB6E', '48px', 'bold', 'center');
    this.text(ctx, '按 P 继续游戏', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 + 20, '#FFF', '18px', 'normal', 'center');
    this.text(ctx, '进度已自动保存', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 + 50, '#FFF', '18px', 'normal', 'center');

    ctx.restore();
  },

  renderGameOverScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    this.text(ctx, '\uD83D\uDC80 逃生失败 \uD83D\uDC80', GameConfig.CANVAS_WIDTH / 2, 120, '#E74C3C', '56px', 'bold', 'center');
    this.text(ctx, '生命值归零，你被帐篷掩埋了...', GameConfig.CANVAS_WIDTH / 2, 170, '#FFF', '20px', 'normal', 'center');
    this.text(ctx, `最终得分: ${this.game.player.score}`, GameConfig.CANVAS_WIDTH / 2, 230, '#FDCB6E', '32px', 'bold', 'center');

    const progress = Math.floor((this.game.player.x / GameConfig.SAFE_ZONE_X) * 100);
    this.text(ctx, `逃亡进度: ${progress}%`, GameConfig.CANVAS_WIDTH / 2, 270, '#74B9FF', '20px', 'normal', 'center');
    this.text(ctx, '点击重新开始', GameConfig.CANVAS_WIDTH / 2, 350, '#00B894', '24px', 'bold', 'center');
    this.text(ctx, '(存档将被清除)', GameConfig.CANVAS_WIDTH / 2, 380, '#A29BFE', '16px', 'normal', 'center');

    ctx.restore();
  },

  renderVictoryScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    this.text(ctx, '\uD83C\uDF89 成功逃生！\uD83C\uDF89', GameConfig.CANVAS_WIDTH / 2, 120, '#00B894', '56px', 'bold', 'center');
    this.text(ctx, '你成功抵达了安全区域！', GameConfig.CANVAS_WIDTH / 2, 170, '#FFF', '20px', 'normal', 'center');
    this.text(ctx, `最终得分: ${this.game.player.score}`, GameConfig.CANVAS_WIDTH / 2, 230, '#FDCB6E', '32px', 'bold', 'center');

    const hpBonus = Math.floor(this.game.player.hp * 5);
    this.text(ctx, `剩余血量奖励: +${hpBonus}`, GameConfig.CANVAS_WIDTH / 2, 265, '#FF6B6B', '18px', 'normal', 'center');

    const stageBonus = (this.game.stageIndex + 1) * 100;
    this.text(ctx, `通关奖励: +${stageBonus}`, GameConfig.CANVAS_WIDTH / 2, 290, '#74B9FF', '18px', 'normal', 'center');

    this.text(ctx, '点击再来一次', GameConfig.CANVAS_WIDTH / 2, 380, '#00B894', '24px', 'bold', 'center');

    ctx.restore();
  },

  renderTransition(ctx, alpha, color) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
    ctx.restore();
  },

  renderStageBanner(ctx, text, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, GameConfig.CANVAS_HEIGHT / 2 - 50, GameConfig.CANVAS_WIDTH, 100);

    this.text(ctx, text, GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2, '#FDCB6E', '36px', 'bold', 'center');
    ctx.restore();
  }
};
