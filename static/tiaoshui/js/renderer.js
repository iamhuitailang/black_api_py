const Renderer = {
  canvas: null,
  ctx: null,
  config: null,
  
  backgroundElements: {
    clouds: [],
    waterDrops: []
  },

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.config = GameData.CANVAS_CONFIG;
    this.generateBackgroundElements();
    this.setupCanvas();
  },

  setupCanvas() {
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
  },

  generateBackgroundElements() {
    for (let i = 0; i < 5; i++) {
      this.backgroundElements.clouds.push({
        x: Math.random() * this.config.width,
        y: 20 + Math.random() * 80,
        width: 80 + Math.random() * 60,
        speed: 0.2 + Math.random() * 0.3
      });
    }
    
    for (let i = 0; i < 15; i++) {
      this.backgroundElements.waterDrops.push({
        x: Math.random() * this.config.width,
        y: this.config.waterLevel + 20 + Math.random() * 60,
        radius: 2 + Math.random() * 4,
        speed: 0.3 + Math.random() * 0.8,
        alpha: 0.2 + Math.random() * 0.4
      });
    }
  },

  render(state, diver, competition, environment) {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    this.drawBackground(environment);
    this.drawPool();
    this.drawPlatform();
    
    if (diver) {
      this.drawDiver(diver);
    }
    
    if (competition && competition.opponents) {
      this.drawOpponentsPanel(competition);
    }
  },

  drawBackground(environment) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
    
    if (environment.id === 'backlight') {
      gradient.addColorStop(0, '#FF9800');
      gradient.addColorStop(0.25, '#FFB74D');
      gradient.addColorStop(0.5, '#64B5F6');
      gradient.addColorStop(0.7, '#0288D1');
      gradient.addColorStop(1, '#01579B');
    } else if (environment.id === 'outdoor_wind') {
      gradient.addColorStop(0, '#81D4FA');
      gradient.addColorStop(0.3, '#4FC3F7');
      gradient.addColorStop(0.6, '#29B6F6');
      gradient.addColorStop(1, '#0277BD');
    } else {
      gradient.addColorStop(0, '#B3E5FC');
      gradient.addColorStop(0.3, '#81D4FA');
      gradient.addColorStop(0.5, '#4FC3F7');
      gradient.addColorStop(0.7, '#0288D1');
      gradient.addColorStop(1, '#01579B');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.width, this.config.height);
    
    this.drawStadium();
    this.drawAudience();
    
    this.backgroundElements.clouds.forEach(cloud => {
      this.drawCloud(cloud);
      cloud.x += cloud.speed;
      if (cloud.x > this.config.width + cloud.width) {
        cloud.x = -cloud.width;
      }
    });
    
    if (environment.id === 'backlight') {
      ctx.save();
      ctx.globalAlpha = 0.4;
      const sunGradient = ctx.createRadialGradient(650, 60, 0, 650, 60, 120);
      sunGradient.addColorStop(0, 'rgba(255, 235, 59, 1)');
      sunGradient.addColorStop(0.3, 'rgba(255, 193, 7, 0.8)');
      sunGradient.addColorStop(0.6, 'rgba(255, 152, 0, 0.4)');
      sunGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
      ctx.fillStyle = sunGradient;
      ctx.fillRect(530, 0, 240, 180);
      ctx.restore();
    }
    
    if (environment.id === 'outdoor_wind') {
      this.drawWindEffect();
    }
  },

  drawStadium() {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(100, 100, 100, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 310);
    ctx.quadraticCurveTo(100, 190, 200, 175);
    ctx.quadraticCurveTo(280, 165, 350, 175);
    ctx.quadraticCurveTo(420, 185, 500, 210);
    ctx.quadraticCurveTo(600, 195, 700, 175);
    ctx.quadraticCurveTo(750, 168, 800, 180);
    ctx.lineTo(800, 310);
    ctx.lineTo(0, 310);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(80, 80, 80, 0.35)';
    ctx.fillRect(0, 295, this.config.width, 50);
    
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgba(150, 150, 150, ${0.15 + i * 0.1})`;
      ctx.fillRect(0, 300 + i * 15, this.config.width, 3);
    }
    
    this.drawOlympicRings(400, 158);
  },

  drawOlympicRings(cx, cy) {
    const ctx = this.ctx;
    const ringRadius = 14;
    const spacing = 32;
    const lineWidth = 5;
    
    const colors = ['#000000', '#FFD700', '#000000', '#00C853', '#FF1744'];
    const yOffsets = [0, ringRadius * 0.6, 0, ringRadius * 0.6, 0];
    
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = colors[i];
      ctx.beginPath();
      ctx.arc(cx - spacing * 2 + i * spacing, cy + yOffsets[i], ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  drawAudience() {
    const ctx = this.ctx;
    const shirtColors = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#FDD835', '#00ACC1', '#5D4037'];
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 25; col++) {
        const x = 15 + col * 32 + (row % 2) * 16;
        const y = 255 + row * 12;
        
        ctx.fillStyle = shirtColors[(row * 7 + col) % shirtColors.length];
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(x, y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  drawCloud(cloud) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.25, cloud.y - 8, cloud.width * 0.25, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.45, cloud.y, cloud.width * 0.28, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.2, cloud.y + 6, cloud.width * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  drawWindEffect() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 6; i++) {
      const y = 80 + i * 35;
      const offset = (Date.now() / 40 + i * 60) % this.config.width;
      
      ctx.beginPath();
      ctx.moveTo(offset, y);
      ctx.bezierCurveTo(
        offset + 25, y - 8,
        offset + 55, y + 8,
        offset + 90, y
      );
      ctx.stroke();
    }
    ctx.restore();
  },

  drawPool() {
    const ctx = this.ctx;
    const waterLevel = this.config.waterLevel;
    
    const poolGradient = ctx.createLinearGradient(0, waterLevel, 0, this.config.height);
    poolGradient.addColorStop(0, '#4FC3F7');
    poolGradient.addColorStop(0.2, '#29B6F6');
    poolGradient.addColorStop(0.5, '#0288D1');
    poolGradient.addColorStop(1, '#01579B');
    
    ctx.fillStyle = poolGradient;
    ctx.fillRect(0, waterLevel, this.config.width, this.config.height - waterLevel);
    
    ctx.save();
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + i * 0.08})`;
      ctx.lineWidth = 1.5;
      const y = waterLevel + 8 + i * 12;
      const offset = Math.sin(Date.now() / 800 + i * 0.7) * 15;
      
      ctx.beginPath();
      ctx.moveTo(offset, y);
      for (let x = 0; x < this.config.width; x += 15) {
        const waveY = y + Math.sin((x + Date.now() / 400) / 25 + i) * 2;
        ctx.lineTo(x + offset, waveY);
      }
      ctx.stroke();
    }
    ctx.restore();
    
    this.backgroundElements.waterDrops.forEach(drop => {
      ctx.save();
      ctx.globalAlpha = drop.alpha;
      ctx.fillStyle = '#B3E5FC';
      ctx.beginPath();
      ctx.ellipse(drop.x, drop.y, drop.radius, drop.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      drop.y += drop.speed * 0.3;
      if (drop.y > this.config.height) {
        drop.y = waterLevel;
        drop.x = Math.random() * this.config.width;
      }
    });
    
    ctx.fillStyle = 'rgba(0, 150, 200, 0.3)';
    ctx.fillRect(0, waterLevel - 5, this.config.width, 5);
  },

  drawPlatform() {
    const ctx = this.ctx;
    const config = this.config;
    
    const pillarX = config.platformX - config.platformWidth / 2 - 25;
    const pillarX2 = config.platformX + config.platformWidth / 2 + 25;
    
    const pillarGradient = ctx.createLinearGradient(pillarX - 10, 0, pillarX + 10, 0);
    pillarGradient.addColorStop(0, '#546E7A');
    pillarGradient.addColorStop(0.5, '#78909C');
    pillarGradient.addColorStop(1, '#455A64');
    
    ctx.fillStyle = pillarGradient;
    ctx.fillRect(pillarX - 8, 40, 16, config.platformY - 30);
    ctx.fillRect(pillarX2 - 8, 40, 16, config.platformY - 30);
    
    const platformGradient = ctx.createLinearGradient(
      config.platformX - config.platformWidth / 2, 0,
      config.platformX + config.platformWidth / 2, 0
    );
    platformGradient.addColorStop(0, '#78909C');
    platformGradient.addColorStop(0.3, '#B0BEC5');
    platformGradient.addColorStop(0.5, '#ECEFF1');
    platformGradient.addColorStop(0.7, '#B0BEC5');
    platformGradient.addColorStop(1, '#78909C');
    
    ctx.fillStyle = platformGradient;
    ctx.fillRect(
      config.platformX - config.platformWidth / 2 - 10,
      config.platformY - 12,
      config.platformWidth + 20,
      24
    );
    
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(
      config.platformX - config.platformWidth / 2,
      config.platformY - 8,
      config.platformWidth,
      16
    );
    
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#90A4AE';
      ctx.fillRect(
        config.platformX - config.platformWidth / 2 + 5 + i * 12,
        config.platformY - 6,
        2,
        12
      );
    }
  },

  drawDiver(diver) {
    const ctx = this.ctx;
    const body = diver.getBodyState();
    
    ctx.save();
    ctx.translate(body.x, body.y);
    
    ctx.save();
    ctx.rotate(body.somersaultAngle);
    
    if (body.hasEnteredWater) {
      ctx.globalAlpha = 0.4;
    }
    
    this.drawAthlete(body);
    
    ctx.restore();
    
    if (Math.abs(body.twistAngle) > 0.1 && body.isInAir) {
      this.drawTwistIndicator(body);
    }
    
    ctx.restore();
    
    if (body.splashParticles && body.splashParticles.length > 0) {
      this.drawSplash(body.splashParticles);
    }
    
    if (body.waterRipples && body.waterRipples.length > 0) {
      this.drawWaterRipples(body.waterRipples);
    }
  },

  drawAthlete(body) {
    const ctx = this.ctx;
    const skinColor = '#F5C6AA';
    const swimsuitColor = '#0D47A1';
    const swimsuitAccent = '#1565C0';
    const hairColor = '#1A1A1A';
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (body.position === 'tuck') {
      this.drawTuckAthlete(ctx, skinColor, swimsuitColor, swimsuitAccent, hairColor);
    } else if (body.position === 'pike') {
      this.drawPikeAthlete(ctx, skinColor, swimsuitColor, swimsuitAccent, hairColor);
    } else {
      this.drawStraightAthlete(ctx, skinColor, swimsuitColor, swimsuitAccent, hairColor);
    }
  },

  drawTuckAthlete(ctx, skin, suit, accent, hair) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28, 9, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -30, 9, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-3, -28, 1.2, 0, Math.PI * 2);
    ctx.arc(3, -28, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.ellipse(0, -5, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(0, 5, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = skin;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.quadraticCurveTo(-22, 0, -14, 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.quadraticCurveTo(22, 0, 14, 12);
    ctx.stroke();
    
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.quadraticCurveTo(-16, 22, -8, 32);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, 14);
    ctx.quadraticCurveTo(16, 22, 8, 32);
    ctx.stroke();
    
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-8, 32, 4, 0, Math.PI * 2);
    ctx.arc(8, 32, 4, 0, Math.PI * 2);
    ctx.fill();
  },

  drawPikeAthlete(ctx, skin, suit, accent, hair) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -35, 9, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -37, 9, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-3, -35, 1.2, 0, Math.PI * 2);
    ctx.arc(3, -35, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-9, -25);
    ctx.quadraticCurveTo(0, -22, 9, -25);
    ctx.lineTo(12, -5);
    ctx.quadraticCurveTo(0, 0, -12, -5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.quadraticCurveTo(0, 0, 12, -5);
    ctx.lineTo(16, 20);
    ctx.quadraticCurveTo(0, 15, -16, 20);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-14, 20);
    ctx.quadraticCurveTo(0, 18, 14, 20);
    ctx.lineTo(12, 30);
    ctx.quadraticCurveTo(0, 28, -12, 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = skin;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-9, -20);
    ctx.lineTo(-20, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9, -20);
    ctx.lineTo(20, 5);
    ctx.stroke();
    
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-12, 28);
    ctx.lineTo(-18, 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, 28);
    ctx.lineTo(18, 45);
    ctx.stroke();
    
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(-18, 45, 5, 3, 0.3, 0, Math.PI * 2);
    ctx.ellipse(18, 45, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
  },

  drawStraightAthlete(ctx, skin, suit, accent, hair) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -42, 9, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -44, 9, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-3, -42, 1.2, 0, Math.PI * 2);
    ctx.arc(3, -42, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.moveTo(-7, -33);
    ctx.lineTo(7, -33);
    ctx.lineTo(8, -10);
    ctx.lineTo(-8, -10);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.lineTo(10, 20);
    ctx.lineTo(-10, 20);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-10, 20);
    ctx.lineTo(10, 20);
    ctx.lineTo(8, 30);
    ctx.lineTo(-8, 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = skin;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-7, -25);
    ctx.lineTo(-15, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, -25);
    ctx.lineTo(15, 5);
    ctx.stroke();
    
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-8, 28);
    ctx.lineTo(-10, 55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 28);
    ctx.lineTo(10, 55);
    ctx.stroke();
    
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(-10, 55, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(10, 55, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  drawTwistIndicator(body) {
    const ctx = this.ctx;
    const twistNorm = Math.abs(body.twistAngle) % (Math.PI * 2);
    
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#64B5F6';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 35 + i * 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  },

  drawSplash(particles) {
    const ctx = this.ctx;
    
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.5);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, 'rgba(179, 229, 252, 0.8)');
      gradient.addColorStop(1, 'rgba(41, 128, 185, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  },

  drawWaterRipples(ripples) {
    const ctx = this.ctx;
    
    ripples.forEach(ripple => {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  },

  drawOpponentsPanel(competition) {
    const ctx = this.ctx;
    const panelWidth = 115;
    const panelHeight = 145;
    const x = this.config.width - panelWidth - 8;
    const y = 8;
    
    ctx.save();
    
    ctx.fillStyle = 'rgba(13, 71, 161, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, panelWidth, panelHeight, 8);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('📊 实时排名', x + 8, y + 20);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 28);
    ctx.lineTo(x + panelWidth - 8, y + 28);
    ctx.stroke();
    
    ctx.font = '11px Arial';
    competition.opponents.slice(0, 5).forEach((opp, index) => {
      const oppY = y + 45 + index * 18;
      
      ctx.fillStyle = opp.isCurrent ? '#4CAF50' : '#FFFFFF';
      ctx.fillText(`${index + 1}. ${opp.name}`, x + 8, oppY);
      
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'right';
      ctx.fillText(opp.totalScore.toFixed(1), x + panelWidth - 8, oppY);
      ctx.textAlign = 'left';
    });
    
    ctx.restore();
  },

  clear() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    }
  }
};
