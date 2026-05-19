const Renderer = {
  canvas: null,
  ctx: null,
  animationId: null,
  hoveredPlot: null,
  time: 0,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = Config.CANVAS.WIDTH;
    this.canvas.height = Config.CANVAS.HEIGHT;
  },

  getPlotPosition(plotId) {
    const col = plotId % Config.CANVAS.PLOTS_PER_ROW;
    const row = Math.floor(plotId / Config.CANVAS.PLOTS_PER_ROW);
    const x = Config.CANVAS.PLOT_START_X + col * (Config.CANVAS.PLOT_SIZE + Config.CANVAS.PLOT_GAP);
    const y = Config.CANVAS.PLOT_START_Y + row * (Config.CANVAS.PLOT_SIZE + Config.CANVAS.PLOT_GAP);
    return { x, y };
  },

  getPlotAt(mouseX, mouseY) {
    for (const plot of GameState.plots) {
      const pos = this.getPlotPosition(plot.id);
      if (mouseX >= pos.x && mouseX <= pos.x + Config.CANVAS.PLOT_SIZE &&
          mouseY >= pos.y && mouseY <= pos.y + Config.CANVAS.PLOT_SIZE) {
        return plot;
      }
    }
    return null;
  },

  render() {
    const ctx = this.ctx;
    this.time += 0.02;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.drawHouse();
    this.drawPlots();
    this.drawClouds();
  },

  drawBackground() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.4, '#98D8E8');
    gradient.addColorStop(0.4, '#7CB342');
    gradient.addColorStop(1, '#558B2F');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#689F38';
    for (let i = 0; i < 30; i++) {
      const x = (i * 47) % this.canvas.width;
      const y = 300 + Math.sin(i) * 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 15, y - 20, x + 30, y);
      ctx.fill();
    }

    ctx.fillStyle = '#F5F5F5';
    ctx.beginPath();
    ctx.arc(750, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.arc(750, 80, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.time * 0.1;
      ctx.beginPath();
      ctx.moveTo(750 + Math.cos(angle) * 45, 80 + Math.sin(angle) * 45);
      ctx.lineTo(750 + Math.cos(angle) * 60, 80 + Math.sin(angle) * 60);
      ctx.stroke();
    }
  },

  drawClouds() {
    const ctx = this.ctx;
    const clouds = [
      { x: (this.time * 15) % (this.canvas.width + 200) - 100, y: 50, scale: 1 },
      { x: (this.time * 10 + 300) % (this.canvas.width + 200) - 100, y: 100, scale: 0.8 },
      { x: (this.time * 12 + 600) % (this.canvas.width + 200) - 100, y: 70, scale: 1.2 }
    ];

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    clouds.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 25 * cloud.scale, 0, Math.PI * 2);
      ctx.arc(cloud.x + 25 * cloud.scale, cloud.y - 5, 30 * cloud.scale, 0, Math.PI * 2);
      ctx.arc(cloud.x + 50 * cloud.scale, cloud.y, 25 * cloud.scale, 0, Math.PI * 2);
      ctx.arc(cloud.x + 25 * cloud.scale, cloud.y + 10, 22 * cloud.scale, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  drawHouse() {
    const ctx = this.ctx;
    const hx = 380;
    const hy = 140;

    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(hx, hy + 40, 140, 80);

    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.moveTo(hx - 15, hy + 40);
    ctx.lineTo(hx + 70, hy - 20);
    ctx.lineTo(hx + 155, hy + 40);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3E2723';
    ctx.fillRect(hx + 55, hy + 75, 30, 45);
    ctx.fillStyle = '#795548';
    ctx.fillRect(hx + 57, hy + 77, 26, 41);

    ctx.fillStyle = '#FFF9C4';
    ctx.fillRect(hx + 15, hy + 55, 25, 25);
    ctx.fillRect(hx + 100, hy + 55, 25, 25);
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2;
    ctx.strokeRect(hx + 15, hy + 55, 25, 25);
    ctx.strokeRect(hx + 100, hy + 55, 25, 25);
    ctx.beginPath();
    ctx.moveTo(hx + 27.5, hy + 55);
    ctx.lineTo(hx + 27.5, hy + 80);
    ctx.moveTo(hx + 15, hy + 67.5);
    ctx.lineTo(hx + 40, hy + 67.5);
    ctx.moveTo(hx + 112.5, hy + 55);
    ctx.lineTo(hx + 112.5, hy + 80);
    ctx.moveTo(hx + 100, hy + 67.5);
    ctx.lineTo(hx + 125, hy + 67.5);
    ctx.stroke();

    ctx.fillStyle = '#D84315';
    ctx.beginPath();
    ctx.ellipse(hx + 130, hy + 25, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(hx + 135, hy + 15 + Math.sin(this.time * 2) * 3, 6, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + 140, hy + 8 + Math.sin(this.time * 2 + 1) * 3, 5, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
  },

  drawPlots() {
    const ctx = this.ctx;

    GameState.plots.forEach(plot => {
      const pos = this.getPlotPosition(plot.id);
      this.drawPlot(plot, pos.x, pos.y);
    });
  },

  drawPlot(plot, x, y) {
    const ctx = this.ctx;
    const size = Config.CANVAS.PLOT_SIZE;
    const isHovered = this.hoveredPlot && this.hoveredPlot.id === plot.id;

    if (!plot.unlocked) {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, size, size);

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', x + size / 2, y + size / 2 - 5);
      ctx.font = '12px sans-serif';
      ctx.fillText(`${plot.unlockCost}金币`, x + size / 2, y + size / 2 + 15);
      return;
    }

    const plotType = Config.PLOT_TYPES[plot.type];
    ctx.fillStyle = plotType.color;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = plotType.id === 'greenhouse' ? '#4CAF50' : '#5D4037';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, size, size);

    if (plotType.id !== 'normal') {
      ctx.fillStyle = plotType.id === 'fertile' ? '#388E3C' : '#2E7D32';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(plotType.id === 'fertile' ? '肥沃' : '温室', x + 5, y + 15);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 20 + i * 18);
      ctx.lineTo(x + size - 5, y + 20 + i * 18);
      ctx.stroke();
    }

    if (isHovered) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
    }

    if (plot.crop) {
      this.drawCrop(plot, x, y);
    } else if (GameState.state.selectedSeed && GameState.state.selectedTool === 'hand' && isHovered) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
      ctx.fillRect(x, y, size, size);
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', x + size / 2, y + size / 2 + 10);
    }
  },

  drawCrop(plot, x, y) {
    const ctx = this.ctx;
    const size = Config.CANVAS.PLOT_SIZE;
    const crop = GameState.crops[plot.crop];
    const progress = Farm.getGrowthProgress(plot);
    const stage = Farm.getGrowthStage(plot);
    const cx = x + size / 2;
    const cy = y + size / 2;

    if (progress >= 1) {
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(crop.emoji, cx, cy + 10);

      const bounce = Math.sin(this.time * 5) * 3;
      ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
      ctx.beginPath();
      ctx.roundRect(cx - 25, cy - 42 + bounce, 50, 20, 8);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('可收获', cx, cy - 28 + bounce);
    } else {
      const sizeMultiplier = 0.3 + progress * 0.7;

      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5, 8 * sizeMultiplier, 12 * sizeMultiplier, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#66BB6A';
      ctx.beginPath();
      ctx.ellipse(cx - 10 * sizeMultiplier, cy, 8 * sizeMultiplier, 5 * sizeMultiplier, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 10 * sizeMultiplier, cy, 8 * sizeMultiplier, 5 * sizeMultiplier, 0.3, 0, Math.PI * 2);
      ctx.fill();

      if (stage >= 3) {
        ctx.fillStyle = crop.color;
        ctx.beginPath();
        ctx.arc(cx, cy - 10 * sizeMultiplier, 8 * sizeMultiplier, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const barWidth = size - 10;
    const barHeight = 6;
    const barX = x + 5;
    const barY = y + size - 12;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = progress >= 1 ? '#4CAF50' : '#FFC107';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    if (plot.watered || plot.fertilized) {
      ctx.font = '12px sans-serif';
      if (plot.watered) {
        ctx.fillText('💧', x + 5, y + size - 15);
      }
      if (plot.fertilized) {
        ctx.fillText('🌿', x + 20, y + size - 15);
      }
    }
  },

  drawStartScreen() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#FFFEF5';
    ctx.beginPath();
    ctx.roundRect(this.canvas.width / 2 - 250, this.canvas.height / 2 - 180, 500, 380, 28);
    ctx.fill();
    ctx.strokeStyle = '#6D4C41';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 248, 225, 0.5)';
    ctx.beginPath();
    ctx.roundRect(this.canvas.width / 2 - 230, this.canvas.height / 2 - 160, 460, 340, 20);
    ctx.fill();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#1A0F0A';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeText('🌾 快乐农场', this.canvas.width / 2, this.canvas.height / 2 - 90);
    ctx.fillText('🌾 快乐农场', this.canvas.width / 2, this.canvas.height / 2 - 90);

    ctx.shadowBlur = 6;
    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 22px sans-serif';
    ctx.lineWidth = 2;
    ctx.strokeText('种菜收菜 · 经营你的专属田园', this.canvas.width / 2, this.canvas.height / 2 - 35);
    ctx.fillText('种菜收菜 · 经营你的专属田园', this.canvas.width / 2, this.canvas.height / 2 - 35);

    ctx.shadowBlur = 4;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#4E342E';
    ctx.lineWidth = 2;
    ctx.strokeText('🌱 开垦土地    💧 播种浇水    🌿 施肥加速    💰 收获售卖', this.canvas.width / 2, this.canvas.height / 2 + 10);
    ctx.fillText('🌱 开垦土地    💧 播种浇水    🌿 施肥加速    💰 收获售卖', this.canvas.width / 2, this.canvas.height / 2 + 10);
    ctx.strokeText('🏡 扩建地块    🎁 解锁作物    ⚒️ 升级农具    📈 扩大农场', this.canvas.width / 2, this.canvas.height / 2 + 40);
    ctx.fillText('🏡 扩建地块    🎁 解锁作物    ⚒️ 升级农具    📈 扩大农场', this.canvas.width / 2, this.canvas.height / 2 + 40);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.roundRect(this.canvas.width / 2 - 120, this.canvas.height / 2 + 75, 240, 60, 15);
    ctx.fill();
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(Storage.hasSave() ? '🎮 继续游戏' : '🎮 开始游戏', this.canvas.width / 2, this.canvas.height / 2 + 115);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  },

  drawPauseMenu() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#FFF8E1';
    ctx.beginPath();
    ctx.roundRect(this.canvas.width / 2 - 150, this.canvas.height / 2 - 120, 300, 240, 15);
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ 游戏暂停', this.canvas.width / 2, this.canvas.height / 2 - 70);

    const buttons = [
      { text: '▶ 继续游戏', y: this.canvas.height / 2 - 20, action: 'resume' },
      { text: '🔄 重新开始', y: this.canvas.height / 2 + 30, action: 'restart' },
      { text: '🚪 退出游戏', y: this.canvas.height / 2 + 80, action: 'quit' }
    ];

    buttons.forEach(btn => {
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.roundRect(this.canvas.width / 2 - 100, btn.y, 200, 35, 8);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = '16px sans-serif';
      ctx.fillText(btn.text, this.canvas.width / 2, btn.y + 23);
    });
  },

  handleClick(mouseX, mouseY) {
    if (!GameState.state.isGameStarted) {
      if (mouseX >= this.canvas.width / 2 - 120 && mouseX <= this.canvas.width / 2 + 120 &&
          mouseY >= this.canvas.height / 2 + 75 && mouseY <= this.canvas.height / 2 + 135) {
        GameState.startGame();
      }
      return;
    }

    if (GameState.state.isPaused && GameState.state.showMenu) {
      if (mouseX >= this.canvas.width / 2 - 100 && mouseX <= this.canvas.width / 2 + 100) {
        if (mouseY >= this.canvas.height / 2 - 20 && mouseY <= this.canvas.height / 2 + 15) {
          GameState.togglePause();
        } else if (mouseY >= this.canvas.height / 2 + 30 && mouseY <= this.canvas.height / 2 + 65) {
          if (confirm('确定要重新开始吗？所有进度将丢失！')) {
            GameState.reset();
            GameState.startGame();
          }
        } else if (mouseY >= this.canvas.height / 2 + 80 && mouseY <= this.canvas.height / 2 + 115) {
          GameState.state.isGameStarted = false;
          GameState.state.isPaused = false;
          GameState.state.showMenu = false;
          GameState.notify();
        }
      }
      return;
    }

    const plot = this.getPlotAt(mouseX, mouseY);
    if (plot) {
      Farm.handlePlotClick(plot.id);
    }
  },

  handleMouseMove(mouseX, mouseY) {
    this.hoveredPlot = this.getPlotAt(mouseX, mouseY);
  }
};

window.Renderer = Renderer;
