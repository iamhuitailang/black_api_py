const Renderer = {
    canvas: null,
    ctx: null,
    waterOffset: 0,
    particles: [],

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = GameConfig.CANVAS_WIDTH;
        this.canvas.height = GameConfig.CANVAS_HEIGHT;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawBackground(playerProgress) {
        const ctx = this.ctx;
        const { width, height } = this.canvas;
        const gameProgress = playerProgress / GameConfig.GAME_LENGTH;

        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.3);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.3);

        this.drawMountains(height * 0.25);
        this.drawFlags(gameProgress);

        const waterGradient = ctx.createLinearGradient(0, height * 0.3, 0, height);
        waterGradient.addColorStop(0, '#5DADE2');
        waterGradient.addColorStop(0.5, '#3498DB');
        waterGradient.addColorStop(1, '#21618C');
        ctx.fillStyle = waterGradient;
        ctx.fillRect(0, height * 0.3, width, height * 0.7);

        this.drawWaterRipples(gameProgress);
        this.drawLanes();
        this.drawFinishLine(gameProgress, playerProgress);
    },

    drawMountains(baseY) {
        const ctx = this.ctx;
        const { width } = this.canvas;

        ctx.fillStyle = GameConfig.COLORS.mountainDark;
        ctx.beginPath();
        ctx.moveTo(0, baseY + 20);
        for (let x = 0; x <= width; x += 80) {
            const height = 40 + Math.sin(x * 0.02) * 20 + Math.sin(x * 0.05) * 10;
            ctx.lineTo(x, baseY - height);
        }
        ctx.lineTo(width, baseY + 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = GameConfig.COLORS.mountain;
        ctx.beginPath();
        ctx.moveTo(0, baseY + 30);
        for (let x = 0; x <= width; x += 60) {
            const height = 30 + Math.sin(x * 0.03 + 1) * 15 + Math.sin(x * 0.07) * 8;
            ctx.lineTo(x, baseY - height + 10);
        }
        ctx.lineTo(width, baseY + 30);
        ctx.closePath();
        ctx.fill();
    },

    drawFlags(progress) {
        const ctx = this.ctx;
        const { width } = this.canvas;
        const flagY = this.canvas.height * 0.28;

        for (let i = 0; i < 8; i++) {
            const x = (i + 1) * (width / 9);
            const offset = Math.sin(Date.now() * 0.003 + i) * 3;

            ctx.fillStyle = '#5D4037';
            ctx.fillRect(x - 1, flagY - 40, 2, 50);

            ctx.fillStyle = GameConfig.COLORS.flag[i % GameConfig.COLORS.flag.length];
            ctx.beginPath();
            ctx.moveTo(x + 1, flagY - 40);
            ctx.lineTo(x + 25 + offset, flagY - 30);
            ctx.lineTo(x + 1, flagY - 20);
            ctx.closePath();
            ctx.fill();
        }
    },

    drawWaterRipples(progress) {
        const ctx = this.ctx;
        const { width, height } = this.canvas;
        const waterStartY = height * 0.3;

        this.waterOffset = (this.waterOffset + 0.5) % 100;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;

        for (let i = 0; i < 20; i++) {
            const y = waterStartY + 30 + i * 25 + (this.waterOffset % 25);
            const waveOffset = Math.sin(Date.now() * 0.002 + i * 0.5) * 5;

            ctx.beginPath();
            for (let x = 0; x < width; x += 5) {
                const waveY = y + Math.sin(x * 0.02 + Date.now() * 0.003 + i) * 3 + waveOffset;
                if (x === 0) {
                    ctx.moveTo(x, waveY);
                } else {
                    ctx.lineTo(x, waveY);
                }
            }
            ctx.stroke();
        }
    },

    drawLanes() {
        const ctx = this.ctx;
        const { width, height } = this.canvas;
        const waterStartY = height * 0.3;

        for (let i = 0; i <= GameConfig.LANES; i++) {
            const x = GameConfig.LANE_START_X + i * GameConfig.LANE_WIDTH;
            ctx.strokeStyle = i === 0 || i === GameConfig.LANES ? 
                'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(x, waterStartY);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    },

    drawFinishLine(progress, playerProgress) {
        const finishProgress = GameConfig.GAME_LENGTH;
        const relativeProgress = finishProgress - playerProgress;
        const waterStartY = this.canvas.height * 0.3;
        const waterHeight = this.canvas.height - waterStartY;
        const playerScreenY = waterStartY + waterHeight * 0.7;
        const pixelsPerProgress = 2.5;
        const y = playerScreenY - relativeProgress * pixelsPerProgress;

        if (y < waterStartY - 50 || y > this.canvas.height + 50) return;

        for (let x = GameConfig.LANE_START_X; x < GameConfig.LANE_START_X + GameConfig.LANES * GameConfig.LANE_WIDTH; x += 20) {
            const isRed = Math.floor(x / 20) % 2 === 0;
            ctx.fillStyle = isRed ? '#ff4444' : '#ffffff';
            ctx.fillRect(x, y - 5, 20, 10);
        }

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(GameConfig.LANE_START_X, y);
        ctx.lineTo(GameConfig.LANE_START_X + GameConfig.LANES * GameConfig.LANE_WIDTH, y);
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('终点', width / 2, y - 15);
    },

    drawBoat(boat, isPlayer = false) {
        const ctx = this.ctx;
        const colors = boat.config.colors;

        ctx.save();
        ctx.translate(boat.x, boat.y);

        if (boat.hitEffect > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        }

        if (boat.shieldActive) {
            ctx.beginPath();
            ctx.arc(0, 0, 65, 0, Math.PI * 2);
            const shieldGradient = ctx.createRadialGradient(0, 0, 40, 0, 0, 65);
            shieldGradient.addColorStop(0, 'rgba(135, 206, 250, 0.15)');
            shieldGradient.addColorStop(0.6, 'rgba(100, 180, 255, 0.35)');
            shieldGradient.addColorStop(1, 'rgba(64, 164, 223, 0.6)');
            ctx.fillStyle = shieldGradient;
            ctx.fill();
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.002;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * 58, Math.sin(angle) * 58, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (boat.sprintActive) {
            for (let i = 0; i < 6; i++) {
                ctx.fillStyle = `rgba(255, 200, 50, ${0.35 - i * 0.05})`;
                ctx.beginPath();
                ctx.ellipse(0, 25 + i * 10, 28 - i * 3, 10 - i, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-25, 30 + i * 5);
                ctx.lineTo(-35 - i * 10, 50 + i * 10);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(25, 30 + i * 5);
                ctx.lineTo(35 + i * 10, 50 + i * 10);
                ctx.stroke();
            }
        }

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        const hullGradient = ctx.createLinearGradient(0, -30, 0, 30);
        hullGradient.addColorStop(0, colors.bodyDark);
        hullGradient.addColorStop(0.3, colors.body);
        hullGradient.addColorStop(0.7, colors.body);
        hullGradient.addColorStop(1, colors.bodyDark);

        ctx.fillStyle = hullGradient;
        ctx.beginPath();
        ctx.moveTo(45, 0);
        ctx.quadraticCurveTo(55, 12, 40, 32);
        ctx.quadraticCurveTo(20, 38, -20, 38);
        ctx.quadraticCurveTo(-55, 35, -60, 0);
        ctx.quadraticCurveTo(-55, -35, -20, -38);
        ctx.quadraticCurveTo(20, -38, 40, -32);
        ctx.quadraticCurveTo(55, -12, 45, 0);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(45, 0);
        ctx.quadraticCurveTo(55, 12, 40, 32);
        ctx.quadraticCurveTo(20, 38, -20, 38);
        ctx.quadraticCurveTo(-55, 35, -60, 0);
        ctx.quadraticCurveTo(-55, -35, -20, -38);
        ctx.quadraticCurveTo(20, -38, 40, -32);
        ctx.quadraticCurveTo(55, -12, 45, 0);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(40, -12);
        ctx.lineTo(-50, -12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(40, 12);
        ctx.lineTo(-50, 12);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.save();
        ctx.translate(-58, 0);
        
        const headGradient = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
        headGradient.addColorStop(0, colors.dragon);
        headGradient.addColorStop(0.7, colors.body);
        headGradient.addColorStop(1, colors.bodyDark);
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-15, -8);
        ctx.lineTo(-20, -18);
        ctx.lineTo(-10, -12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-15, 8);
        ctx.lineTo(-20, 18);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(-8, -10);
        ctx.lineTo(-5, -22);
        ctx.lineTo(-2, -10);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-8, 10);
        ctx.lineTo(-5, 22);
        ctx.lineTo(-2, 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(3, -4, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(4, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(5, -5, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.quadraticCurveTo(15, 5, 20, 0);
        ctx.quadraticCurveTo(15, -5, 8, -2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 3; i++) {
            const whiskerY = (i - 1) * 4;
            ctx.beginPath();
            ctx.moveTo(6, whiskerY);
            ctx.quadraticCurveTo(15 + i * 2, whiskerY - 3, 25 + i * 3, whiskerY - 5);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();

        ctx.save();
        ctx.translate(48, 0);
        const tailGradient = ctx.createLinearGradient(0, -12, 0, 12);
        tailGradient.addColorStop(0, colors.body);
        tailGradient.addColorStop(0.5, colors.accent);
        tailGradient.addColorStop(1, colors.bodyDark);
        
        ctx.fillStyle = tailGradient;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.quadraticCurveTo(20, -8, 28, 0);
        ctx.quadraticCurveTo(20, 8, 0, 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.moveTo(25, -5);
        ctx.lineTo(35, -10);
        ctx.lineTo(32, 0);
        ctx.lineTo(35, 10);
        ctx.lineTo(25, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const rowerColors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'];
        for (let i = 0; i < 4; i++) {
            const rowerX = -25 + i * 18;
            const rowerY = -5 + Math.sin(Date.now() * 0.01 + i) * 3;
            const oarAngle = Math.sin(Date.now() * 0.01 + i * 0.8) * 0.6;
            
            ctx.fillStyle = rowerColors[i % rowerColors.length];
            ctx.beginPath();
            ctx.arc(rowerX, rowerY - 8, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = rowerColors[i % rowerColors.length];
            ctx.beginPath();
            ctx.ellipse(rowerX, rowerY - 1, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.translate(rowerX + 5, rowerY);
            ctx.rotate(oarAngle);
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(25, 0);
            ctx.stroke();
            ctx.fillStyle = '#CD853F';
            ctx.beginPath();
            ctx.ellipse(25, 0, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.globalAlpha = 1;

        if (isPlayer) {
            ctx.fillStyle = 'rgba(76, 175, 80, 0.9)';
            ctx.beginPath();
            ctx.moveTo(0, -55);
            ctx.lineTo(-10, -42);
            ctx.lineTo(10, -42);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-35, -65, 70, 20);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 13px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(boat.name, 0, -55);

        ctx.restore();
    },

    drawObstacle(obstacle) {
        const ctx = this.ctx;
        const { type, x, y, width, height } = obstacle;

        ctx.save();
        ctx.translate(x, y);

        if (type === 'log') {
            const gradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);
            gradient.addColorStop(0, '#5D4037');
            gradient.addColorStop(0.5, '#8D6E63');
            gradient.addColorStop(1, '#5D4037');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, width/2, height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#4E342E';
            ctx.lineWidth = 1;
            for (let i = -width/3; i <= width/3; i += 15) {
                ctx.beginPath();
                ctx.arc(i, 0, 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (type === 'wave') {
            const waveGradient = ctx.createLinearGradient(0, -height/2, 0, height/2);
            waveGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            waveGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.6)');
            waveGradient.addColorStop(1, 'rgba(50, 150, 200, 0.3)');
            ctx.fillStyle = waveGradient;
            
            ctx.beginPath();
            ctx.moveTo(-width/2, height/4);
            for (let i = 0; i <= width; i += 10) {
                const waveY = Math.sin(i * 0.1 + Date.now() * 0.005) * 10 - height/4;
                ctx.lineTo(-width/2 + i, waveY);
            }
            ctx.lineTo(width/2, height/4);
            ctx.quadraticCurveTo(0, height/2, -width/2, height/4);
            ctx.closePath();
            ctx.fill();
        } else if (type === 'reef') {
            const reefGradient = ctx.createRadialGradient(0, -5, 5, 0, 0, width/2);
            reefGradient.addColorStop(0, '#78909C');
            reefGradient.addColorStop(0.5, '#546E7A');
            reefGradient.addColorStop(1, '#37474F');
            ctx.fillStyle = reefGradient;
            
            ctx.beginPath();
            ctx.moveTo(-width/2, height/3);
            ctx.lineTo(-width/3, -height/3);
            ctx.lineTo(0, -height/2);
            ctx.lineTo(width/3, -height/4);
            ctx.lineTo(width/2, height/3);
            ctx.quadraticCurveTo(0, height/2, -width/2, height/3);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#263238';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    },

    drawSplash(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 30,
                maxLife: 30
            });
        }
    },

    updateParticles() {
        const ctx = this.ctx;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            const alpha = p.life / p.maxLife;
            ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
