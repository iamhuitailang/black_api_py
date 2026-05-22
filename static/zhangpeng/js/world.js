const World = {
  bgLayers: [],
  particles: [],
  dustParticles: [],
  stageOverlay: { color: 'rgba(255, 250, 220, 0)', intensity: 0 },

  init() {
    this.bgLayers = this.generateBackground();
    this.particles = [];
    this.dustParticles = [];
  },

  setStageOverlay(overlay) {
    if (overlay) this.stageOverlay = overlay;
  },

  generateBackground() {
    const layers = [];
    for (let x = 0; x < GameConfig.WORLD_WIDTH; x += 200) {
      layers.push({
        x: x + Math.random() * 50,
        type: 'tent_pole',
        height: 120 + Math.random() * 60
      });
    }
    return layers;
  },

  addDust(x, y, amount = 5) {
    for (let i = 0; i < amount; i++) {
      this.dustParticles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        size: 3 + Math.random() * 5,
        life: 30 + Math.random() * 20,
        maxLife: 50
      });
    }
  },

  addParticle(x, y, color) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: -2 - Math.random() * 3,
      size: 3 + Math.random() * 4,
      life: 40,
      maxLife: 40,
      color
    });
  },

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;
      if (p.life <= 0) this.dustParticles.splice(i, 1);
    }
  },

  renderBackground(ctx, cameraX) {
    const intensity = this.stageOverlay.intensity || 0;

    let skyTop, skyMid, skyBot;
    if (intensity === 0) {
      skyTop = '#FFEAA7';
      skyMid = '#FDCB6E';
      skyBot = '#E17055';
    } else if (intensity === 1) {
      skyTop = '#FFB86B';
      skyMid = '#FF7F50';
      skyBot = '#D35400';
    } else {
      skyTop = '#FF6B6B';
      skyMid = '#E74C3C';
      skyBot = '#8B0000';
    }

    const skyGrad = ctx.createLinearGradient(0, 0, 0, GameConfig.CANVAS_HEIGHT);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(0.5, skyMid);
    skyGrad.addColorStop(1, skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    if (intensity >= 1) {
      ctx.save();
      const pulse = 0.15 + Math.sin(Date.now() * 0.004) * 0.08;
      ctx.fillStyle = `rgba(180, 60, 40, ${pulse + intensity * 0.05})`;
      for (let i = 0; i < 6; i++) {
        const sx = (i * 180 - cameraX * 0.3) % (GameConfig.WORLD_WIDTH + 400) - 100;
        const sy = 30 + (i % 2) * 25;
        ctx.beginPath();
        ctx.arc(sx, sy, 40, 0, Math.PI * 2);
        ctx.arc(sx + 35, sy - 12, 30, 0, Math.PI * 2);
        ctx.arc(sx + 70, sy, 40, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(223, 230, 233, 0.6)';
      for (let i = 0; i < 8; i++) {
        const cloudX = (i * 200 - cameraX * 0.2) % (GameConfig.WORLD_WIDTH + 400) - 100;
        const cloudY = 40 + (i % 3) * 30;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY - 10, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 20, cloudY + 10, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = 'rgba(45, 52, 54, 0.3)';
    for (let x = 0; x < GameConfig.WORLD_WIDTH; x += 300) {
      const mx = x - cameraX * 0.4;
      if (mx > -100 && mx < GameConfig.CANVAS_WIDTH + 100) {
        ctx.beginPath();
        ctx.moveTo(mx, GameConfig.GROUND_Y - 80);
        ctx.lineTo(mx + 80, GameConfig.GROUND_Y - 140);
        ctx.lineTo(mx + 160, GameConfig.GROUND_Y - 100);
        ctx.lineTo(mx + 240, GameConfig.GROUND_Y - 160);
        ctx.lineTo(mx + 320, GameConfig.GROUND_Y - 90);
        ctx.lineTo(mx + 320, GameConfig.GROUND_Y);
        ctx.lineTo(mx, GameConfig.GROUND_Y);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(-cameraX * 0.5, 0);
    for (let x = 0; x < GameConfig.WORLD_WIDTH; x += 250) {
      const shake = Math.sin(Date.now() * 0.003 + x * 0.01) * 3 + intensity * 2;
      this.renderTent(ctx, x + shake, GameConfig.GROUND_Y - 150, x / GameConfig.WORLD_WIDTH, intensity);
    }
    ctx.restore();

    if (this.stageOverlay.color) {
      ctx.save();
      ctx.fillStyle = this.stageOverlay.color;
      ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
      ctx.restore();
    }

    if (intensity >= 2) {
      ctx.save();
      const emberAlpha = 0.4 + Math.sin(Date.now() * 0.008) * 0.15;
      ctx.fillStyle = `rgba(255, 80, 40, ${emberAlpha})`;
      for (let i = 0; i < 15; i++) {
        const ex = (Date.now() * 0.05 + i * 73) % GameConfig.CANVAS_WIDTH;
        const ey = (Date.now() * 0.08 * (0.5 + i * 0.05) + i * 47) % GameConfig.GROUND_Y;
        ctx.beginPath();
        ctx.arc(ex, ey, 2 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    this.renderStageBoundaries(ctx, cameraX);
  },

  renderStageBoundaries(ctx, cameraX) {
    ctx.save();
    
    for (let i = 0; i < GameConfig.STAGES.length - 1; i++) {
      const boundaryX = GameConfig.STAGES[i].endX - cameraX;
      if (boundaryX > -50 && boundaryX < GameConfig.CANVAS_WIDTH + 50) {
        const pulse = 0.5 + Math.sin(Date.now() * 0.006) * 0.3;
        
        ctx.globalAlpha = pulse * 0.6;
        ctx.strokeStyle = i === 0 ? '#FDCB6E' : '#E74C3C';
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 10]);
        ctx.beginPath();
        ctx.moveTo(boundaryX, 0);
        ctx.lineTo(boundaryX, GameConfig.GROUND_Y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.globalAlpha = pulse;
        ctx.fillStyle = i === 0 ? '#FDCB6E' : '#E74C3C';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('▼ ' + GameConfig.STAGES[i + 1].name + ' ▼', boundaryX, 30);
      }
    }
    
    ctx.restore();
  },

  renderTent(ctx, x, y, progress, intensity) {
    const colors = ['#E17055', '#00B894', '#0984E3', '#A29BFE', '#FDCB6E'];
    const collapseAmount = Math.min(1, progress * 0.8 + intensity * 0.1);
    const height = 140 * (1 - collapseAmount * 0.5);
    const tilt = Math.sin(Date.now() * 0.002 + x * 0.01) * collapseAmount * (0.1 + intensity * 0.08);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    ctx.fillStyle = '#E17055';
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.lineTo(0, -height);
    ctx.lineTo(100, 0);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const stripeStart = -100 + i * 50;
      ctx.beginPath();
      ctx.moveTo(stripeStart, 0);
      ctx.lineTo(stripeStart + 25, -height * 0.3);
      ctx.lineTo(stripeStart + 25, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#636E72';
    ctx.lineWidth = 4;
    for (let i = -80; i <= 80; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i * 0.3, -height * 0.6);
      ctx.stroke();
    }

    if (progress > 0.3 || intensity > 0) {
      ctx.fillStyle = 'rgba(45, 52, 54, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-30, -height * 0.5, 15, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(25, -height * 0.35, 12, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.moveTo(0, -height);
    ctx.lineTo(-5, -height - 15);
    ctx.lineTo(5, -height - 15);
    ctx.closePath();
    ctx.fill();

    if (intensity >= 1 && progress > 0.2) {
      ctx.fillStyle = `rgba(255, 100, 50, ${0.3 + Math.random() * 0.2})`;
      for (let i = 0; i < 3; i++) {
        const fx = -60 + i * 50 + Math.random() * 20;
        const fy = -height * 0.3 - Math.random() * 30;
        ctx.beginPath();
        ctx.arc(fx, fy, 6 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  },

  renderGround(ctx, cameraX) {
    const intensity = this.stageOverlay.intensity || 0;
    const groundBase = intensity === 0 ? '#8B6914' : intensity === 1 ? '#7A5A10' : '#5C4008';
    const groundStripe = intensity === 0 ? '#A0852C' : intensity === 1 ? '#8A6F18' : '#6E5010';

    ctx.fillStyle = groundBase;
    ctx.fillRect(0, GameConfig.GROUND_Y, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_Y);

    ctx.fillStyle = groundStripe;
    for (let x = -cameraX % 40; x < GameConfig.CANVAS_WIDTH; x += 40) {
      ctx.fillRect(x, GameConfig.GROUND_Y, 20, 4);
    }

    ctx.fillStyle = intensity >= 2 ? '#3A2000' : '#6B4F0A';
    ctx.fillRect(0, GameConfig.GROUND_Y, GameConfig.CANVAS_WIDTH, 3);

    ctx.fillStyle = 'rgba(178, 190, 195, 0.3)';
    for (let x = -cameraX % 80; x < GameConfig.CANVAS_WIDTH; x += 80) {
      ctx.fillRect(x, GameConfig.GROUND_Y + 15, 40, 3);
    }

    if (intensity >= 1) {
      ctx.fillStyle = `rgba(139, 69, 19, ${0.25 + intensity * 0.1})`;
      for (let x = -cameraX * 1.1 % 120; x < GameConfig.CANVAS_WIDTH; x += 120) {
        ctx.fillRect(x, GameConfig.GROUND_Y + 25, 8, 5);
        ctx.fillRect(x + 40, GameConfig.GROUND_Y + 35, 6, 4);
      }
    }
  },

  renderSafeZone(ctx, cameraX) {
    const x = GameConfig.SAFE_ZONE_X - cameraX;
    if (x > -200 && x < GameConfig.CANVAS_WIDTH + 200) {
      const pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;

      ctx.save();
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillStyle = '#00B894';
      ctx.fillRect(x - 100, 0, 200, GameConfig.GROUND_Y);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#00B894';
      ctx.fillRect(x - 100, GameConfig.GROUND_Y - 5, 200, 5);
      ctx.restore();

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('★ 安全区 ★', x, GameConfig.GROUND_Y - 30);
      ctx.font = '14px Arial';
      ctx.fillText('抵达此处即可脱险', x, GameConfig.GROUND_Y - 12);

      ctx.fillStyle = '#FDCB6E';
      for (let i = 0; i < 3; i++) {
        const flagX = x - 80 + i * 80;
        ctx.fillRect(flagX, GameConfig.GROUND_Y - 50, 3, 50);
        ctx.beginPath();
        ctx.moveTo(flagX + 3, GameConfig.GROUND_Y - 50);
        ctx.lineTo(flagX + 20, GameConfig.GROUND_Y - 40);
        ctx.lineTo(flagX + 3, GameConfig.GROUND_Y - 30);
        ctx.closePath();
        ctx.fill();
      }
    }
  },

  renderStartZone(ctx, cameraX) {
    const x = 50 - cameraX;
    if (x > -100 && x < GameConfig.CANVAS_WIDTH + 100) {
      ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
      ctx.fillRect(x, 0, 3, GameConfig.GROUND_Y);
      ctx.fillStyle = '#E74C3C';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('起点', x, 40);
    }
  },

  renderParticles(ctx, cameraX) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const p of this.dustParticles) {
      ctx.save();
      ctx.globalAlpha = (p.life / p.maxLife) * 0.6;
      ctx.fillStyle = '#B2BEC3';
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  renderProgressMarkers(ctx, cameraX, playerX) {
    for (let i = 0; i < GameConfig.STAGES.length; i++) {
      const stage = GameConfig.STAGES[i];
      const x = stage.endX - cameraX;
      if (x > -50 && x < GameConfig.CANVAS_WIDTH + 50) {
        ctx.fillStyle = i === 0 ? '#E17055' : i === 1 ? '#0984E3' : '#00B894';
        ctx.fillRect(x - 2, GameConfig.GROUND_Y - 30, 4, 30);
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(stage.name, x, GameConfig.GROUND_Y - 35);
      }
    }
  }
};
