const Renderer = {
    canvas: null,
    ctx: null,
    width: 960,
    height: 640,
    animationFrame: null,
    lastTime: 0,
    
    particles: [],
    rhythmBars: [],
    scorePopups: [],
    character: {
        x: 480,
        y: 400,
        width: 60,
        height: 80,
        velocityY: 0,
        isJumping: false,
        rotation: 0,
        animationFrame: 0,
        animationTime: 0
    },
    
    equipment: null,
    eventType: null,
    beatTime: 0,
    
    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.ctx.roundRect) {
            this.ctx.roundRect = function(x, y, width, height, radius) {
                if (typeof radius === 'number') {
                    radius = {tl: radius, tr: radius, br: radius, bl: radius};
                } else {
                    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
                    for (var side in defaultRadius) {
                        radius[side] = radius[side] || defaultRadius[side];
                    }
                }
                this.beginPath();
                this.moveTo(x + radius.tl, y);
                this.lineTo(x + width - radius.tr, y);
                this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
                this.lineTo(x + width, y + height - radius.br);
                this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
                this.lineTo(x + radius.bl, y + height);
                this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
                this.lineTo(x, y + radius.tl);
                this.quadraticCurveTo(x, y, x + radius.tl, y);
                this.closePath();
                return this;
            };
        }
        
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        const container = document.getElementById('game-container');
        const rect = container.getBoundingClientRect();
        
        const scale = Math.min(
            rect.width / this.width,
            rect.height / this.height
        );
        
        this.canvas.style.width = (this.width * scale) + 'px';
        this.canvas.style.height = (this.height * scale) + 'px';
        this.canvas.style.left = ((rect.width - this.width * scale) / 2) + 'px';
        this.canvas.style.top = ((rect.height - this.height * scale) / 2) + 'px';
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },
    
    drawBackground(eventType) {
        this.eventType = eventType;
        
        const ctx = this.ctx;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#98FB98');
        skyGradient.addColorStop(1, '#90EE90');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.fillStyle = '#FFE4B5';
        ctx.beginPath();
        ctx.arc(100, 80, 50, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawClouds();
        this.drawEventEquipment(eventType);
        this.drawFloor();
    },
    
    drawClouds() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        this.drawCloud(200, 60, 60);
        this.drawCloud(500, 100, 50);
        this.drawCloud(750, 70, 70);
    },
    
    drawCloud(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawEventEquipment(eventType) {
        const ctx = this.ctx;
        
        switch (eventType) {
            case 'floor':
                this.drawFloorExercise();
                break;
            case 'vault':
                this.drawVaultEquipment();
                break;
            case 'bars':
                this.drawBarsEquipment();
                break;
            case 'horizontal':
                this.drawHorizontalBarEquipment();
                break;
        }
    },
    
    drawFloorExercise() {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(100, 350, 760, 10);
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(100, 350, 760, 10);
    },
    
    drawVaultEquipment() {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(250, 280, 20, 100);
        ctx.fillRect(690, 280, 20, 100);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(230, 260, 260, 30);
        
        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.arc(150, 350, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(140, 360, 20, 20);
    },
    
    drawBarsEquipment() {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(380, 100, 15, 250);
        ctx.fillRect(565, 100, 15, 250);
        
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(350, 150, 260, 12);
        ctx.fillRect(350, 200, 260, 12);
        
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(400, 100);
        ctx.lineTo(380, 100);
        ctx.moveTo(560, 100);
        ctx.lineTo(580, 100);
        ctx.stroke();
    },
    
    drawHorizontalBarEquipment() {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(380, 80, 15, 270);
        ctx.fillRect(565, 80, 15, 270);
        
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(380, 120);
        ctx.lineTo(580, 120);
        ctx.stroke();
        
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(400, 80);
        ctx.lineTo(380, 80);
        ctx.moveTo(560, 80);
        ctx.lineTo(580, 80);
        ctx.stroke();
    },
    
    drawFloor() {
        const ctx = this.ctx;
        
        const floorGradient = ctx.createLinearGradient(0, 450, 0, 640);
        floorGradient.addColorStop(0, '#8FBC8F');
        floorGradient.addColorStop(1, '#228B22');
        
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, 450, this.width, 190);
        
        ctx.fillStyle = '#90EE90';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.width;
            const y = 450 + Math.random() * 10;
            ctx.fillRect(x, y, 3, 15);
        }
    },
    
    drawCharacter(state, currentTime) {
        const ctx = this.ctx;
        const char = this.character;
        
        char.animationTime += currentTime - this.lastTime;
        if (char.animationTime > 80) {
            char.animationFrame = (char.animationFrame + 1) % 8;
            char.animationTime = 0;
        }
        
        ctx.save();
        ctx.translate(char.x, char.y);
        
        switch (state) {
            case 'jumping':
            case 'performing':
                char.velocityY += 0.3;
                char.y += char.velocityY;
                
                if (char.y > 380) {
                    char.y = 380;
                    char.velocityY = -12;
                }
                
                char.rotation += 0.15;
                ctx.rotate(char.rotation);
                break;
            case 'landing':
                char.y = 380;
                char.velocityY = 0;
                char.rotation = 0;
                break;
            case 'swinging':
                char.rotation = Math.sin(currentTime * 0.008) * 0.4;
                ctx.rotate(char.rotation);
                break;
            case 'idle':
            default:
                char.y = 380 + Math.sin(currentTime * 0.003) * 3;
                char.rotation = 0;
                break;
        }
        
        this.drawCuteCharacter(ctx, char, state, currentTime);
        
        ctx.restore();
        
        this.lastTime = currentTime;
    },
    
    drawCuteCharacter(ctx, char, state, currentTime) {
        const bounce = Math.sin(char.animationFrame * Math.PI / 4) * 3;
        const breathe = Math.sin(currentTime * 0.003) * 2;
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#333';
        
        ctx.fillStyle = '#FF6B9D';
        ctx.beginPath();
        ctx.moveTo(-22, 50 + bounce);
        ctx.quadraticCurveTo(-25, 25 + bounce, -20, 5 + bounce);
        ctx.lineTo(20, 5 + bounce);
        ctx.quadraticCurveTo(25, 25 + bounce, 22, 50 + bounce);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(-18, 20 + bounce);
        ctx.quadraticCurveTo(-20, 35 + bounce, -15, 45 + bounce);
        ctx.lineTo(15, 45 + bounce);
        ctx.quadraticCurveTo(20, 35 + bounce, 18, 20 + bounce);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.ellipse(0, -20 + bounce, 22, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, -30 + bounce, 20, Math.PI * 1.1, Math.PI * 1.9);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-18, -35 + bounce);
        ctx.quadraticCurveTo(-25, -50 + bounce, -15, -40 + bounce);
        ctx.quadraticCurveTo(-10, -45 + bounce, -5, -38 + bounce);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(18, -35 + bounce);
        ctx.quadraticCurveTo(25, -50 + bounce, 15, -40 + bounce);
        ctx.quadraticCurveTo(10, -45 + bounce, 5, -38 + bounce);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, -15 + bounce, 22, 10, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(-8, -22 + bounce, 7, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(8, -22 + bounce, 7, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-7, -21 + bounce, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(9, -21 + bounce, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-5, -23 + bounce, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -23 + bounce, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 150, 150, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-14, -15 + bounce, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14, -15 + bounce, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B9D';
        ctx.beginPath();
        ctx.ellipse(0, -12 + bounce, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -8 + bounce, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        const armWave = Math.sin(char.animationFrame * Math.PI / 4) * 15;
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(-15, 10 + bounce);
        ctx.quadraticCurveTo(-30, 20 + bounce + armWave, -28, 35 + bounce + armWave);
        ctx.stroke();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(-28, 35 + bounce + armWave, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(15, 10 + bounce);
        ctx.quadraticCurveTo(30, 20 + bounce - armWave, 28, 35 + bounce - armWave);
        ctx.stroke();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(28, 35 + bounce - armWave, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        const legSpread = Math.sin(char.animationFrame * Math.PI / 4) * 8;
        
        ctx.beginPath();
        ctx.moveTo(-8, 48 + bounce);
        ctx.quadraticCurveTo(-15, 58 + bounce + legSpread, -12, 65 + bounce + legSpread);
        ctx.stroke();
        
        ctx.fillStyle = '#FF4757';
        ctx.beginPath();
        ctx.ellipse(-12, 67 + bounce + legSpread, 8, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(8, 48 + bounce);
        ctx.quadraticCurveTo(15, 58 + bounce - legSpread, 12, 65 + bounce - legSpread);
        ctx.stroke();
        
        ctx.fillStyle = '#FF4757';
        ctx.beginPath();
        ctx.ellipse(12, 67 + bounce - legSpread, 8, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    },
    
    drawRhythmBars(currentTime, qteData) {
        if (!qteData || !qteData.isActive) return;
        
        const ctx = this.ctx;
        const barWidth = 60;
        const barHeight = 20;
        const startX = (this.width - (qteData.beatTimers.length * (barWidth + 10) - 10)) / 2;
        const y = 150;
        
        for (let i = 0; i < qteData.beatTimers.length; i++) {
            const beat = qteData.beatTimers[i];
            const x = startX + i * (barWidth + 10);
            
            if (beat.hit) {
                ctx.fillStyle = Scoring.getQualityColor(beat.quality);
                ctx.globalAlpha = 0.5;
            } else {
                const timing = qteData.getBeatTiming(currentTime, i);
                const absTiming = Math.abs(timing);
                
                if (absTiming < 0.3) {
                    const glowIntensity = 1 - absTiming / 0.3;
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 10 + glowIntensity * 20;
                    ctx.fillStyle = '#4ECDC4';
                } else {
                    ctx.fillStyle = '#666';
                }
            }
            
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 5);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            
            if (!beat.hit) {
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(beat.key, x + barWidth / 2, y + barHeight / 2);
            }
        }
        
        if (qteData.beatTimers.length > 0) {
            const currentBeat = qteData.currentBeat;
            if (currentBeat < qteData.beatTimers.length) {
                const beat = qteData.beatTimers[currentBeat];
                if (!beat.hit) {
                    const x = startX + currentBeat * (barWidth + 10);
                    const elapsed = currentTime - qteData.beatStartTime;
                    const targetTime = beat.targetTime;
                    const progress = Math.min(Math.max((elapsed - targetTime + qteData.beatInterval * 0.3) / (qteData.beatInterval * 0.6), 0), 1);
                    
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x, y + barHeight + 10);
                    ctx.lineTo(x + barWidth * progress, y + barHeight + 10);
                    ctx.stroke();
                }
            }
        }
    },
    
    drawBeatIndicator(currentTime, qteData) {
        if (!qteData || !qteData.isActive) return;
        
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = 280;
        const radius = 30;
        
        const elapsed = currentTime - qteData.beatStartTime;
        const beatPhase = (elapsed % qteData.beatInterval) / qteData.beatInterval;
        const scale = 1 + Math.sin(beatPhase * Math.PI * 2) * 0.2;
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + beatPhase * 0.3})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    },
    
    addScorePopup(text, x, y, color) {
        this.scorePopups.push({
            text: text,
            x: x,
            y: y,
            color: color || '#4ECDC4',
            startTime: performance.now(),
            duration: 1000
        });
    },
    
    updateAndDrawScorePopups(currentTime) {
        const ctx = this.ctx;
        this.scorePopups = this.scorePopups.filter(popup => {
            const elapsed = currentTime - popup.startTime;
            if (elapsed > popup.duration) return false;
            
            const progress = elapsed / popup.duration;
            const alpha = 1 - progress;
            const offsetY = -50 * progress;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = popup.color;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(popup.text, popup.x, popup.y + offsetY);
            ctx.globalAlpha = 1;
            
            return true;
        });
    },
    
    addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                color: color,
                size: Math.random() * 8 + 4,
                startTime: performance.now(),
                duration: 800
            });
        }
    },
    
    updateAndDrawParticles(currentTime) {
        const ctx = this.ctx;
        this.particles = this.particles.filter(particle => {
            const elapsed = currentTime - particle.startTime;
            if (elapsed > particle.duration) return false;
            
            const progress = elapsed / particle.duration;
            const alpha = 1 - progress;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * (1 - progress * 0.5), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            return true;
        });
    },
    
    drawLandingIndicator(isActive, pressProgress) {
        if (!isActive) return;
        
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = 350;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(centerX - 100, centerY - 30, 200, 60, 10);
        ctx.fill();
        
        const gradient = ctx.createLinearGradient(centerX - 90, 0, centerX + 90, 0);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#4ECDC4');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 90, centerY - 20, 180 * pressProgress, 40);
        
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(centerX - 90, centerY - 20, 180, 40);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('按住空格落地!', centerX, centerY);
    },
    
    reset() {
        this.particles = [];
        this.scorePopups = [];
        this.character = {
            x: 480,
            y: 400,
            width: 60,
            height: 80,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            animationFrame: 0,
            animationTime: 0
        };
    }
};
