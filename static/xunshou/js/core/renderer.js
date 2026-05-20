const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    dpr: 1,
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(this.dpr, this.dpr);
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },
    
    drawBackground(level, scrollX) {
        const bg = level.background;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, bg.skyTop);
        gradient.addColorStop(0.6, bg.skyBottom);
        gradient.addColorStop(1, '#FFE4E1');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawSpotlights(scrollX);
        this.drawCircusTent(scrollX);
        this.drawBalloons(scrollX);
        this.drawAudience(scrollX);
        this.drawStringLights(scrollX);
    },
    
    drawSpotlights(scrollX) {
        const time = Date.now() / 1000;
        const colors = ['rgba(255, 100, 100, 0.15)', 'rgba(100, 255, 100, 0.15)', 'rgba(100, 100, 255, 0.15)', 'rgba(255, 255, 100, 0.15)'];
        
        for (let i = 0; i < 4; i++) {
            const x = (i * this.width / 4 + scrollX * 0.02) % this.width;
            const angle = Math.sin(time + i) * 0.3;
            
            this.ctx.save();
            this.ctx.translate(x, 0);
            this.ctx.rotate(angle);
            
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, colors[i]);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.moveTo(-30, 0);
            this.ctx.lineTo(-100, this.height);
            this.ctx.lineTo(100, this.height);
            this.ctx.lineTo(30, 0);
            this.ctx.closePath();
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.restore();
        }
    },
    
    drawCircusTent(scrollX) {
        const centerX = this.width / 2 - scrollX * 0.05;
        const baseY = this.height - 80;
        const tentWidth = 600;
        const tentHeight = 250;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - tentWidth / 2, baseY);
        this.ctx.quadraticCurveTo(centerX - tentWidth / 4, baseY - tentHeight * 0.3, centerX, baseY - tentHeight);
        this.ctx.quadraticCurveTo(centerX + tentWidth / 4, baseY - tentHeight * 0.3, centerX + tentWidth / 2, baseY);
        this.ctx.closePath();
        
        const gradient = this.ctx.createLinearGradient(centerX, baseY - tentHeight, centerX, baseY);
        gradient.addColorStop(0, '#FF4444');
        gradient.addColorStop(0.5, '#CC2222');
        gradient.addColorStop(1, '#AA1111');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 4;
        for (let i = 0; i < 7; i++) {
            const t = i / 6;
            const leftX = centerX - tentWidth / 2 + t * tentWidth;
            const rightX = centerX + tentWidth / 2 - t * tentWidth;
            const heightY = baseY - tentHeight * (1 - Math.abs(t - 0.5) * 2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, baseY - tentHeight);
            this.ctx.lineTo(leftX, heightY);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#8B0000';
        this.ctx.fillRect(centerX - 60, baseY - 100, 120, 100);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(centerX - 70, baseY - 110, 140, 15);
        this.ctx.fillRect(centerX - 70, baseY - 5, 140, 10);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(centerX, baseY - tentHeight, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.arc(centerX, baseY - tentHeight - 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawBalloons(scrollX) {
        const balloonColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#DDA0DD'];
        const time = Date.now() / 1000;
        
        for (let i = 0; i < 12; i++) {
            const x = ((i * 180 - scrollX * 0.15) % (this.width + 200)) - 100;
            const y = 60 + (i % 3) * 50 + Math.sin(time + i * 0.5) * 10;
            const color = balloonColors[i % balloonColors.length];
            const size = 25 + (i % 3) * 5;
            
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, size * 0.8, size, 0, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.3, color);
            gradient.addColorStop(1, this.darkenColor(color, 0.3));
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.fillStyle = this.darkenColor(color, 0.2);
            this.ctx.beginPath();
            this.ctx.moveTo(x - 5, y + size);
            this.ctx.lineTo(x + 5, y + size);
            this.ctx.lineTo(x, y + size + 8);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + size + 8);
            this.ctx.quadraticCurveTo(x + 10, y + size + 30, x - 5, y + size + 50);
            this.ctx.stroke();
        }
    },
    
    drawAudience(scrollX) {
        const baseY = this.height - 100;
        const audienceX = -scrollX * 0.3;
        
        for (let i = -1; i < this.width / 30 + 2; i++) {
            const x = audienceX + i * 30;
            if (x < -30 || x > this.width + 30) continue;
            
            const headY = baseY - 20 + (i % 3) * 10;
            
            this.ctx.fillStyle = ['#FFE4C4', '#DEB887', '#D2B48C'][i % 3];
            this.ctx.beginPath();
            this.ctx.arc(x, headY, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'][i % 4];
            this.ctx.beginPath();
            this.ctx.ellipse(x, headY - 10, 10, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.beginPath();
            this.ctx.arc(x, headY - 18, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },
    
    drawStringLights(scrollX) {
        const time = Date.now() / 500;
        const y = 40;
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        for (let i = 0; i <= this.width; i += 20) {
            const waveY = y + Math.sin((i + scrollX * 0.5) * 0.02) * 5;
            this.ctx.lineTo(i, waveY);
        }
        this.ctx.stroke();
        
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        for (let i = 0; i < this.width / 50 + 2; i++) {
            const x = ((i * 50 - scrollX * 0.5) % (this.width + 100)) - 50;
            const waveY = y + Math.sin((x + scrollX * 0.5) * 0.02) * 5;
            const colorIndex = Math.floor((x + scrollX * 0.5) / 50) % colors.length;
            const flicker = 0.7 + Math.sin(time + i) * 0.3;
            
            this.ctx.beginPath();
            this.ctx.arc(x, waveY + 8, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = colors[(colorIndex + colors.length) % colors.length];
            this.ctx.globalAlpha = flicker;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            this.ctx.shadowColor = colors[(colorIndex + colors.length) % colors.length];
            this.ctx.shadowBlur = 10 * flicker;
            this.ctx.beginPath();
            this.ctx.arc(x, waveY + 8, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    },
    
    drawGround(level, scrollX) {
        const groundY = this.height - 60;
        const bg = level.background;
        
        const ringGradient = this.ctx.createRadialGradient(
            this.width / 2, groundY + 30, 50,
            this.width / 2, groundY + 30, Math.max(this.width, 400)
        );
        ringGradient.addColorStop(0, '#FFD700');
        ringGradient.addColorStop(0.3, '#FFA500');
        ringGradient.addColorStop(0.6, '#8B4513');
        ringGradient.addColorStop(1, '#654321');
        
        this.ctx.fillStyle = ringGradient;
        this.ctx.fillRect(0, groundY, this.width, 60);
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.ellipse(this.width / 2, groundY + 25, Math.min(this.width * 0.4, 300), 20, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.ellipse(this.width / 2, groundY + 25, Math.min(this.width * 0.35, 260), 15, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#5D3A1A';
        this.ctx.fillRect(0, groundY, this.width, 8);
        
        const grassOffset = -scrollX % 60;
        this.ctx.fillStyle = '#228B22';
        for (let i = -1; i < this.width / 60 + 2; i++) {
            const x = grassOffset + i * 60;
            for (let j = 0; j < 3; j++) {
                const gx = x + j * 20;
                this.ctx.beginPath();
                this.ctx.moveTo(gx, groundY);
                this.ctx.quadraticCurveTo(gx + 3, groundY - 12, gx + 6, groundY);
                this.ctx.fill();
            }
        }
    },
    
    drawPlayer(player) {
        const { x, y, width, height, isDucking, character, isJumping, velocityY } = player;
        const char = CHARACTERS[character];
        const colors = char.colors;
        
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        
        if (isDucking) {
            this.ctx.scale(1, 0.6);
        }
        
        if (velocityY < 0) {
            this.ctx.rotate(-0.1);
        } else if (velocityY > 0) {
            this.ctx.rotate(0.1);
        }
        
        if (character === 'lion') {
            this.drawLion(width, height, colors);
        } else if (character === 'fox') {
            this.drawFox(width, height, colors);
        } else if (character === 'deer') {
            this.drawDeer(width, height, colors);
        }
        
        this.ctx.restore();
    },
    
    drawLion(width, height, colors) {
        const w = width * 0.8;
        const h = height * 0.8;
        
        this.ctx.fillStyle = colors.mane;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, w * 0.45, 0, Math.PI * 2);
        this.ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const px = Math.cos(angle) * w * 0.4;
            const py = Math.sin(angle) * w * 0.4;
            this.ctx.beginPath();
            this.ctx.arc(px, py, w * 0.15, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = colors.face;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -h * 0.05, w * 0.25, h * 0.2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-w * 0.1, -h * 0.1, w * 0.04, 0, Math.PI * 2);
        this.ctx.arc(w * 0.1, -h * 0.1, w * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-w * 0.08, -h * 0.12, w * 0.02, 0, Math.PI * 2);
        this.ctx.arc(w * 0.12, -h * 0.12, w * 0.02, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -h * 0.02, w * 0.04, h * 0.03, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, h * 0.02, w * 0.08, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.stroke();
    },
    
    drawFox(width, height, colors) {
        const w = width * 0.8;
        const h = height * 0.8;
        
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(-w * 0.3, -h * 0.1, w * 0.15, h * 0.08, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-w * 0.1, -h * 0.25);
        this.ctx.lineTo(-w * 0.2, -h * 0.45);
        this.ctx.lineTo(0, -h * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.1, -h * 0.25);
        this.ctx.lineTo(w * 0.2, -h * 0.45);
        this.ctx.lineTo(0, -h * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = colors.belly;
        this.ctx.beginPath();
        this.ctx.ellipse(0, h * 0.1, w * 0.25, h * 0.15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-w * 0.08, -h * 0.15, w * 0.04, 0, Math.PI * 2);
        this.ctx.arc(w * 0.08, -h * 0.15, w * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-w * 0.06, -h * 0.17, w * 0.02, 0, Math.PI * 2);
        this.ctx.arc(w * 0.1, -h * 0.17, w * 0.02, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -h * 0.05, w * 0.03, h * 0.02, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(w * 0.35, h * 0.1, w * 0.2, h * 0.1, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.ellipse(w * 0.45, h * 0.12, w * 0.08, h * 0.05, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawDeer(width, height, colors) {
        const w = width * 0.8;
        const h = height * 0.8;
        
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, h * 0.05, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = colors.spots;
        for (let i = 0; i < 5; i++) {
            const sx = (i - 2) * w * 0.15;
            const sy = h * 0.05 + (i % 2 === 0 ? -h * 0.1 : h * 0.1);
            this.ctx.beginPath();
            this.ctx.ellipse(sx, sy, w * 0.05, h * 0.03, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(-w * 0.25, -h * 0.15, w * 0.18, h * 0.15, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = colors.antlers;
        this.ctx.strokeStyle = colors.antlers;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(-w * 0.3, -h * 0.25);
        this.ctx.lineTo(-w * 0.35, -h * 0.5);
        this.ctx.moveTo(-w * 0.32, -h * 0.4);
        this.ctx.lineTo(-w * 0.4, -h * 0.45);
        this.ctx.moveTo(-w * 0.28, -h * 0.35);
        this.ctx.lineTo(-w * 0.2, -h * 0.4);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-w * 0.15, -h * 0.25);
        this.ctx.lineTo(-w * 0.1, -h * 0.5);
        this.ctx.moveTo(-w * 0.12, -h * 0.4);
        this.ctx.lineTo(-w * 0.05, -h * 0.45);
        this.ctx.moveTo(-w * 0.17, -h * 0.35);
        this.ctx.lineTo(-w * 0.25, -h * 0.4);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-w * 0.3, -h * 0.15, w * 0.03, 0, Math.PI * 2);
        this.ctx.arc(-w * 0.18, -h * 0.15, w * 0.03, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-w * 0.28, -h * 0.17, w * 0.015, 0, Math.PI * 2);
        this.ctx.arc(-w * 0.16, -h * 0.17, w * 0.015, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(-w * 0.24, -h * 0.08, w * 0.025, h * 0.02, 0, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawObstacle(obstacle) {
        const { x, y, width, height, type } = obstacle;
        const config = OBSTACLE_TYPES[type];
        
        if (type === 'log') {
            this.drawLog(x, y, width, height, config);
        } else if (type === 'spike') {
            this.drawSpike(x, y, width, height, config);
        } else if (type === 'fireball') {
            this.drawFireball(x, y, width, height, config, obstacle.phase);
        }
    },
    
    drawLog(x, y, width, height, config) {
        this.ctx.fillStyle = config.color;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 8);
        this.ctx.fill();
        
        this.ctx.fillStyle = this.darkenColor(config.color, 0.3);
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.ellipse(x + 15 + i * 20, y + height / 2, 8, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.strokeStyle = this.lightenColor(config.color, 0.2);
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 10, y + 5 + i * 10);
            this.ctx.lineTo(x + width - 10, y + 5 + i * 10);
            this.ctx.stroke();
        }
    },
    
    drawSpike(x, y, width, height, config) {
        this.ctx.fillStyle = config.color;
        
        const spikeCount = 3;
        const spikeWidth = width / spikeCount;
        
        for (let i = 0; i < spikeCount; i++) {
            const sx = x + i * spikeWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(sx, y + height);
            this.ctx.lineTo(sx + spikeWidth / 2, y);
            this.ctx.lineTo(sx + spikeWidth, y + height);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = this.lightenColor(config.color, 0.3);
        for (let i = 0; i < spikeCount; i++) {
            const sx = x + i * spikeWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(sx + spikeWidth * 0.3, y + height * 0.6);
            this.ctx.lineTo(sx + spikeWidth / 2, y + height * 0.2);
            this.ctx.lineTo(sx + spikeWidth * 0.55, y + height * 0.6);
            this.ctx.closePath();
            this.ctx.fill();
        }
    },
    
    drawFireball(x, y, width, height, config, phase) {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const radius = width / 2;
        
        const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.3, '#FFA500');
        gradient.addColorStop(0.6, '#FF4500');
        gradient.addColorStop(1, '#8B0000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        const flicker = Math.sin(phase * 10) * 2;
        this.ctx.fillStyle = '#FFFF88';
        this.ctx.beginPath();
        this.ctx.arc(cx - 3, cy - 3, radius * 0.4 + flicker, 0, Math.PI * 2);
        this.ctx.fill();
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + phase * 5;
            const fx = cx + Math.cos(angle) * (radius + 5);
            const fy = cy + Math.sin(angle) * (radius + 5);
            
            this.ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(fx, fy, 5 + Math.sin(phase * 8 + i) * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },
    
    drawFireHoop(hoop) {
        const { x, y, width, height, passed, phase } = hoop;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const outerRadius = width / 2;
        const innerRadius = width / 2 - 10;
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 12;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#A0522D';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, outerRadius + 6, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, outerRadius - 6, 0, Math.PI * 2);
        this.ctx.stroke();
        
        const flameCount = 12;
        for (let i = 0; i < flameCount; i++) {
            const angle = (i / flameCount) * Math.PI * 2 + phase * 3;
            const fx = cx + Math.cos(angle) * (outerRadius - 5);
            const fy = cy + Math.sin(angle) * (outerRadius - 5);
            
            const flameHeight = 15 + Math.sin(phase * 8 + i) * 5;
            const flameWidth = 8;
            
            const gradient = this.ctx.createRadialGradient(fx, fy, 0, fx, fy, flameHeight);
            gradient.addColorStop(0, passed ? '#00FF00' : '#FFFF00');
            gradient.addColorStop(0.5, passed ? '#00AA00' : '#FFA500');
            gradient.addColorStop(1, passed ? '#006600' : '#FF4500');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(fx, fy - flameHeight);
            this.ctx.quadraticCurveTo(fx + flameWidth, fy - flameHeight * 0.5, fx, fy + 5);
            this.ctx.quadraticCurveTo(fx - flameWidth, fy - flameHeight * 0.5, fx, fy - flameHeight);
            this.ctx.fill();
        }
        
        if (passed) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },
    
    drawFinishLine(x, levelLength) {
        const groundY = this.height - 60;
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x, 0, 5, groundY);
        
        this.ctx.fillStyle = '#FFF';
        for (let i = 0; i < groundY / 30; i++) {
            this.ctx.fillRect(x, i * 30, 5, 15);
        }
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏁 终点', x + 25, 50);
    },
    
    drawParticles(particles) {
        particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    },
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    },
    
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 255 * amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 255 * amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 255 * amount);
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
};
