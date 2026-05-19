const Renderer = {
  canvas: null,
  ctx: null,
  
  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = Constants.CANVAS_WIDTH * this.dpr;
    this.canvas.height = Constants.CANVAS_HEIGHT * this.dpr;
    this.canvas.style.width = Constants.CANVAS_WIDTH + 'px';
    this.canvas.style.height = Constants.CANVAS_HEIGHT + 'px';
    
    this.ctx.scale(this.dpr, this.dpr);
  },
  
  clear() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, Constants.CANVAS_HEIGHT);
    gradient.addColorStop(0, Constants.COLORS.SKY_TOP);
    gradient.addColorStop(1, Constants.COLORS.SKY_BOTTOM);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
  },
  
  drawBackground() {
    this.ctx.fillStyle = Constants.COLORS.GROUND;
    this.ctx.fillRect(0, Constants.CANVAS_HEIGHT - 40, Constants.CANVAS_WIDTH, 40);
    
    this.ctx.fillStyle = '#2d5016';
    for (let i = 0; i < Constants.CANVAS_WIDTH; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, Constants.CANVAS_HEIGHT - 40);
      this.ctx.lineTo(i + 10, Constants.CANVAS_HEIGHT - 50);
      this.ctx.lineTo(i + 20, Constants.CANVAS_HEIGHT - 40);
      this.ctx.fill();
    }
    
    this.drawCloud(100, 80, 60);
    this.drawCloud(300, 120, 50);
    this.drawCloud(550, 60, 70);
    this.drawCloud(700, 100, 45);
  },
  
  drawCloud(x, y, size) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
  },
  
  drawRope(x) {
    this.ctx.strokeStyle = Constants.COLORS.ROPE;
    this.ctx.lineWidth = Constants.ROPE.WIDTH;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, Constants.PLAYER.FINISH_Y - 20);
    this.ctx.lineTo(x, Constants.PLAYER.START_Y + 60);
    this.ctx.stroke();
    
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 2;
    for (let y = Constants.PLAYER.FINISH_Y; y < Constants.PLAYER.START_Y + 60; y += 15) {
      this.ctx.beginPath();
      this.ctx.moveTo(x - 4, y);
      this.ctx.lineTo(x + 4, y + 7);
      this.ctx.stroke();
    }
    
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(x - 25, Constants.PLAYER.FINISH_Y - 25, 50, 10);
  },
  
  drawFinishLine() {
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, Constants.PLAYER.FINISH_Y);
    this.ctx.lineTo(Constants.CANVAS_WIDTH, Constants.PLAYER.FINISH_Y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('终点', Constants.CANVAS_WIDTH / 2, Constants.PLAYER.FINISH_Y - 35);
  },
  
  drawPlayer(player) {
    const ctx = this.ctx;
    const x = player.x;
    const y = player.y;
    
    ctx.save();
    
    if (player.penaltyTimer > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    }
    
    ctx.strokeStyle = player.color;
    ctx.fillStyle = player.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.arc(x, y - 25, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(x, y - 25, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 4, y - 27, 2, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 27, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 15);
    ctx.stroke();
    
    const armOffset = player.armSwing === 0 ? -8 : 8;
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x - 20, y - 5 + armOffset);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 5);
    ctx.lineTo(x + 20, y - 5 - armOffset);
    ctx.stroke();
    
    const legOffset = player.legSwing === 0 ? -5 : 5;
    ctx.beginPath();
    ctx.moveTo(x, y + 15);
    ctx.lineTo(x - 10, y + 35 + legOffset);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y + 15);
    ctx.lineTo(x + 10, y + 35 - legOffset);
    ctx.stroke();
    
    ctx.restore();
    
    if (player.comboMultiplier > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`x${player.comboMultiplier.toFixed(1)}`, x, y - 50);
    }
  },
  
  drawHUD(game) {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 180, 70);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`时间: ${game.elapsedTime.toFixed(2)}s`, 20, 40);
    
    const highScore = Storage.getHighScore(game.mode, game.difficulty);
    if (highScore) {
      ctx.fillText(`最佳: ${highScore.toFixed(2)}s`, 20, 65);
    } else {
      ctx.fillText('最佳: --', 20, 65);
    }
    
    if (game.mode === Constants.GAME_MODE.VERSUS) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(Constants.CANVAS_WIDTH - 190, 10, 180, 70);
      
      ctx.fillStyle = Constants.COLORS.P1;
      ctx.fillText('玩家1: A/D', Constants.CANVAS_WIDTH - 180, 40);
      ctx.fillStyle = Constants.COLORS.P2;
      ctx.fillText('玩家2: ←/→', Constants.CANVAS_WIDTH - 180, 65);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(Constants.CANVAS_WIDTH - 190, 10, 180, 40);
      ctx.fillStyle = '#fff';
      ctx.fillText('← / → 交替', Constants.CANVAS_WIDTH - 180, 38);
    }
  },
  
  drawCountdown(count) {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = count > 0 ? count.toString() : 'GO!';
    ctx.fillText(text, Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2);
    
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillText(text, Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2);
    ctx.shadowBlur = 0;
  },
  
  drawPauseMenu() {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 - 80);
    
    ctx.font = '24px Arial';
    ctx.fillText('按 ESC 继续', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2);
    ctx.fillText('按 R 重新开始', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 + 40);
    ctx.fillText('按 Q 退出到菜单', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 + 80);
  },
  
  drawFinishScreen(game) {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
    
    if (game.mode === Constants.GAME_MODE.SINGLE) {
      const time = game.winner.finishTime - game.startTime;
      const highScore = Storage.getHighScore(game.mode, game.difficulty);
      const isNewRecord = highScore && time <= highScore;
      
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('恭喜完成!', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 - 100);
      
      ctx.fillStyle = '#fff';
      ctx.font = '32px Arial';
      ctx.fillText(`用时: ${time.toFixed(2)} 秒`, Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 - 30);
      
      if (isNewRecord) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('🎉 新纪录! 🎉', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 + 20);
      }
      
      ctx.fillStyle = '#aaa';
      ctx.font = '20px Arial';
      ctx.fillText('按 R 重新开始', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 + 80);
      ctx.fillText('按 Q 退出到菜单', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 + 115);
    } else {
      ctx.fillStyle = game.winner.color;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`玩家 ${game.winner.id} 获胜!`, Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 - 60);
      
      const time = game.winner.finishTime - game.startTime;
      ctx.fillStyle = '#fff';
      ctx.font = '28px Arial';
      ctx.fillText(`用时: ${time.toFixed(2)} 秒`, Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2);
      
      ctx.fillStyle = '#aaa';
      ctx.font = '20px Arial';
      ctx.fillText('按 R 重新开始', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 + 60);
      ctx.fillText('按 Q 退出到菜单', Constants.CANVAS_WIDTH / 2, Constants.CANVAS_HEIGHT / 2 + 95);
    }
  },
  
  drawMenu(selectedMode, selectedDifficulty) {
    const ctx = this.ctx;
    
    this.drawBackground();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🧗 攀岩比赛 🧗', Constants.CANVAS_WIDTH / 2, 100);
    
    ctx.fillStyle = '#fff';
    ctx.font = '28px Arial';
    ctx.fillText('快速交替按键，向上攀爬！', Constants.CANVAS_WIDTH / 2, 160);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('游戏模式', Constants.CANVAS_WIDTH / 2, 230);
    
    const modes = [
      { key: Constants.GAME_MODE.SINGLE, label: '单人模式', desc: '← / → 交替按键' },
      { key: Constants.GAME_MODE.VERSUS, label: '双人对战', desc: 'P1: A/D | P2: ←/→' }
    ];
    
    modes.forEach((mode, index) => {
      const y = 270 + index * 50;
      const isSelected = selectedMode === mode.key;
      
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(Constants.CANVAS_WIDTH / 2 - 200, y - 25, 400, 45);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(Constants.CANVAS_WIDTH / 2 - 200, y - 25, 400, 45);
      }
      
      ctx.fillStyle = isSelected ? '#FFD700' : '#fff';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(mode.label, Constants.CANVAS_WIDTH / 2 - 180, y + 5);
      
      ctx.fillStyle = '#aaa';
      ctx.font = '16px Arial';
      ctx.fillText(mode.desc, Constants.CANVAS_WIDTH / 2 + 20, y + 5);
    });
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('难度选择', Constants.CANVAS_WIDTH / 2, 390);
    
    const difficulties = ['EASY', 'MEDIUM', 'HARD', 'HELL'];
    difficulties.forEach((diff, index) => {
      const x = 150 + index * 150;
      const y = 430;
      const isSelected = selectedDifficulty === diff;
      const config = Constants.DIFFICULTY[diff];
      
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(x - 60, y - 25, 120, 50);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 60, y - 25, 120, 50);
      }
      
      ctx.fillStyle = isSelected ? '#FFD700' : '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(config.name, x, y + 5);
    });
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('按 空格键 或 点击 开始游戏', Constants.CANVAS_WIDTH / 2, 530);
    ctx.fillStyle = '#aaa';
    ctx.font = '18px Arial';
    ctx.fillText('↑/↓ 选择模式 | ←/→ 选择难度', Constants.CANVAS_WIDTH / 2, 565);
  },
  
  render(game, selectedMode, selectedDifficulty) {
    this.clear();
    
    if (game.state === Constants.GAME_STATE.MENU) {
      this.drawMenu(selectedMode, selectedDifficulty);
      return;
    }
    
    this.drawBackground();
    this.drawFinishLine();
    
    game.players.forEach(player => {
      this.drawRope(player.x);
    });
    
    game.players.forEach(player => {
      this.drawPlayer(player);
    });
    
    this.drawHUD(game);
    
    if (game.state === Constants.GAME_STATE.COUNTDOWN) {
      this.drawCountdown(game.countdown);
    } else if (game.state === Constants.GAME_STATE.PAUSED) {
      this.drawPauseMenu();
    } else if (game.state === Constants.GAME_STATE.FINISHED) {
      this.drawFinishScreen(game);
    }
  }
};
