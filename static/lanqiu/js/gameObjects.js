class BasketballPlayer {
    constructor(x, feetY, isPlayer = true) {
        this.x = x;
        this.feetY = feetY;
        this.isPlayer = isPlayer;
        this.scale = CONSTANTS.DIMENSIONS.PLAYER_SCALE;
        
        this.animationTime = 0;
        this.armWaveAngle = 0;
        this.isCelebrating = false;
        this.celebrationTimer = 0;
        
        this.shirtColor = isPlayer ? 
            CONSTANTS.COLORS.PLAYER_SHIRT : 
            CONSTANTS.COLORS.DEFENDER_SHIRT;
        this.pantsColor = CONSTANTS.COLORS.PLAYER_PANTS;
        this.skinColor = CONSTANTS.COLORS.PLAYER_SKIN;
    }

    update() {
        this.animationTime += 0.02;
        
        if (!this.isCelebrating) {
            this.armWaveAngle = Math.sin(this.animationTime) * 0.15;
        } else {
            this.celebrationTimer--;
            this.armWaveAngle = Math.sin(this.animationTime * 5) * 0.5;
            if (this.celebrationTimer <= 0) {
                this.isCelebrating = false;
            }
        }
    }

    celebrate() {
        this.isCelebrating = true;
        this.celebrationTimer = 90;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.feetY);
        ctx.scale(this.scale, this.scale);
        
        this.drawLegs(ctx);
        this.drawBody(ctx);
        this.drawArms(ctx);
        this.drawHead(ctx);
        
        ctx.restore();
    }

    drawLegs(ctx) {
        ctx.fillStyle = this.pantsColor;
        
        ctx.save();
        ctx.translate(-12, -55);
        ctx.rotate(-0.05 + Math.sin(this.animationTime * 0.5) * 0.05);
        ctx.fillRect(-6, 0, 12, 45);
        ctx.restore();
        
        ctx.save();
        ctx.translate(12, -55);
        ctx.rotate(0.05 - Math.sin(this.animationTime * 0.5) * 0.05);
        ctx.fillRect(-6, 0, 12, 45);
        ctx.restore();
        
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(-20, -12, 16, 12);
        ctx.fillRect(4, -12, 16, 12);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-18, -5, 12, 5);
        ctx.fillRect(6, -5, 12, 5);
    }

    drawBody(ctx) {
        ctx.fillStyle = this.shirtColor;
        
        ctx.beginPath();
        ctx.ellipse(0, -85, 22, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.isPlayer ? '#C0392B' : '#2980B9';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.isPlayer ? '23' : '3', 0, -85);
    }

    drawArms(ctx) {
        ctx.fillStyle = this.skinColor;
        
        ctx.save();
        ctx.translate(-22, -95);
        ctx.rotate(-0.6 + this.armWaveAngle);
        
        ctx.fillRect(-4, 0, 8, 30);
        
        ctx.beginPath();
        ctx.arc(0, 30, 7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        ctx.save();
        ctx.translate(22, -95);
        ctx.rotate(0.6 - this.armWaveAngle);
        
        ctx.fillRect(-4, 0, 8, 30);
        
        ctx.beginPath();
        ctx.arc(0, 30, 7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawHead(ctx) {
        const headY = -135;
        
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(0, headY, 26, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#D4A574';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.fillStyle = '#2C1810';
        ctx.beginPath();
        ctx.arc(0, headY - 12, 22, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(-9, headY - 3, 6, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(9, headY - 3, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(-9, headY - 3, 2.5, 0, Math.PI * 2);
        ctx.arc(9, headY - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        if (this.isCelebrating) {
            ctx.arc(0, headY + 10, 8, 0, Math.PI);
            ctx.stroke();
        } else {
            ctx.arc(0, headY + 12, 6, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    }
}

class Basketball {
    constructor(x, y) {
        this.x = x || CONSTANTS.POSITIONS.PLAYER_X + 40;
        this.y = y || CONSTANTS.POSITIONS.GROUND_Y - 60;
        this.radius = CONSTANTS.DIMENSIONS.BALL_RADIUS;
        
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.isFlying = false;
        
        this.expression = 'normal';
        this.expressionTimer = 0;
    }

    update() {
        if (this.isFlying) {
            this.vy += CONSTANTS.PHYSICS.GRAVITY;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += CONSTANTS.ANIMATION.BALL_ROTATION_SPEED;
        }
        
        if (this.expressionTimer > 0) {
            this.expressionTimer--;
            if (this.expressionTimer <= 0) {
                this.expression = 'normal';
            }
        }
    }

    setExpression(expr, duration = 60) {
        this.expression = expr;
        this.expressionTimer = duration;
    }

    shoot(angleDegrees, power) {
        const radians = angleDegrees * Math.PI / 180;
        this.vx = Math.cos(radians) * power;
        this.vy = -Math.sin(radians) * power;
        this.isFlying = true;
        this.setExpression('happy', 120);
    }

    resetToPlayer() {
        this.x = CONSTANTS.POSITIONS.PLAYER_X + 40;
        this.y = CONSTANTS.POSITIONS.GROUND_Y - 60;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.isFlying = false;
        this.expression = 'normal';
        this.expressionTimer = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        this.drawBody(ctx);
        this.drawLines(ctx);
        this.drawFace(ctx);
        
        ctx.restore();
    }

    drawBody(ctx) {
        const gradient = ctx.createRadialGradient(-4, -4, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#FF9500');
        gradient.addColorStop(0.7, '#FF6B00');
        gradient.addColorStop(1, '#CC5500');
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawLines(ctx) {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.2;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.85, -Math.PI * 0.25, Math.PI * 0.25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.85, Math.PI * 0.75, Math.PI * 1.25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-this.radius, 0);
        ctx.lineTo(this.radius, 0);
        ctx.stroke();
    }

    drawFace(ctx) {
        ctx.save();
        ctx.rotate(-this.rotation);
        
        const eyeY = -2;
        const eyeSpacing = 5;
        const eyeSize = 1.8;
        
        ctx.fillStyle = '#333333';
        
        if (this.expression === 'happy') {
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(0, 5, 5, 0, Math.PI);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
        } else if (this.expression === 'surprised') {
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, eyeSize + 0.5, 0, Math.PI * 2);
            ctx.arc(eyeSpacing, eyeY, eyeSize + 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(0, 6, 3.5, 0, Math.PI * 2);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
        } else {
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(0, 4, 3.5, 0.1, Math.PI - 0.1);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class BasketballHoop {
    constructor() {
        this.centerX = CONSTANTS.POSITIONS.HOOP_X;
        this.centerY = CONSTANTS.POSITIONS.HOOP_CENTER_Y;
        this.radius = CONSTANTS.DIMENSIONS.HOOP_RADIUS;
        
        this.backboardX = CONSTANTS.POSITIONS.BACKBOARD_X;
        this.backboardWidth = CONSTANTS.DIMENSIONS.BACKBOARD_WIDTH;
        this.backboardHeight = CONSTANTS.DIMENSIONS.BACKBOARD_HEIGHT;
        this.backboardY = this.centerY - 55;
        
        this.netSwing = 0;
        this.isOpen = false;
        this.openTimer = 0;
    }

    update() {
        this.netSwing = Math.sin(Date.now() * 0.002) * 0.08;
        
        if (this.openTimer > 0) {
            this.openTimer--;
            if (this.openTimer <= 0) {
                this.isOpen = false;
            }
        }
    }

    openMouth(duration = 50) {
        this.isOpen = true;
        this.openTimer = duration;
    }

    draw(ctx) {
        this.drawBackboard(ctx);
        this.drawRim(ctx);
        this.drawNet(ctx);
    }

    drawBackboard(ctx) {
        ctx.fillStyle = '#5D3A1A';
        ctx.fillRect(this.backboardX - 15, this.backboardY - 40, 15, this.backboardHeight + 80);
        
        const poleGradient = ctx.createLinearGradient(
            this.backboardX - 30, this.backboardY,
            this.backboardX - 15, this.backboardY
        );
        poleGradient.addColorStop(0, '#7A4A2A');
        poleGradient.addColorStop(1, '#5D3A1A');
        ctx.fillStyle = poleGradient;
        ctx.fillRect(this.backboardX - 30, this.backboardY - 60, 15, this.backboardHeight + 120);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.backboardX, this.backboardY, this.backboardWidth, this.backboardHeight);
        
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.backboardX, this.backboardY, this.backboardWidth, this.backboardHeight);
        
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        const targetX = this.backboardX + this.backboardWidth - 45;
        const targetY = this.backboardY + 15;
        ctx.strokeRect(targetX, targetY, 40, 30);
    }

    drawRim(ctx) {
        const rimY = this.centerY;
        
        ctx.strokeStyle = '#FF6600';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        const openOffset = this.isOpen ? 8 : 0;
        
        ctx.beginPath();
        ctx.arc(this.centerX, rimY - openOffset, this.radius, Math.PI + 0.15, -0.15);
        ctx.stroke();
        
        if (this.isOpen) {
            ctx.fillStyle = 'rgba(139, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(this.centerX, rimY + 5, this.radius * 0.7, 0, Math.PI);
            ctx.fill();
        }
    }

    drawNet(ctx) {
        const netLength = CONSTANTS.DIMENSIONS.NET_LENGTH;
        const segments = 5;
        const strings = 7;
        
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.netSwing);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.85;
        
        for (let i = 0; i <= strings; i++) {
            const angle = (Math.PI / strings) * i - Math.PI / 2 + 0.1;
            const startX = Math.cos(angle) * (this.radius - 3);
            const startY = Math.sin(angle) * (this.radius - 3);
            
            if (startX > -this.radius * 0.2) {
                const endX = startX * 0.4;
                const endY = startY + netLength;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
        
        for (let i = 1; i <= segments; i++) {
            const y = (netLength / segments) * i;
            const rAtY = (this.radius - 3) * (1 - i / segments * 0.4);
            
            ctx.beginPath();
            ctx.arc(0, y, rAtY, -Math.PI * 0.25, Math.PI * 0.25);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

class BasketballCourt {
    constructor() {
        this.groundY = CONSTANTS.POSITIONS.GROUND_Y;
        this.courtHeight = CONSTANTS.DIMENSIONS.COURT_HEIGHT;
        this.canvasWidth = CONSTANTS.DIMENSIONS.CANVAS_WIDTH;
        this.canvasHeight = CONSTANTS.DIMENSIONS.CANVAS_HEIGHT;
    }

    draw(ctx) {
        this.drawSky(ctx);
        this.drawGround(ctx);
        this.drawCourtLines(ctx);
    }

    drawSky(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#4682B4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.groundY);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(ctx, 80, 60, 50);
        this.drawCloud(ctx, 350, 90, 40);
        this.drawCloud(ctx, 700, 50, 45);
        this.drawCloud(ctx, 950, 80, 35);
    }

    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.35, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.7, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.35, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGround(ctx) {
        const gradient = ctx.createLinearGradient(0, this.groundY, 0, this.canvasHeight);
        gradient.addColorStop(0, '#FF8C00');
        gradient.addColorStop(1, '#E67E00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, this.groundY, this.canvasWidth, this.courtHeight);
        
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.4)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.courtHeight; i += 18) {
            ctx.beginPath();
            ctx.moveTo(0, this.groundY + i);
            ctx.lineTo(this.canvasWidth, this.groundY + i);
            ctx.stroke();
        }
    }

    drawCourtLines(ctx) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        
        const baseline = this.groundY + 15;
        const freeThrowLine = CONSTANTS.POSITIONS.FREE_THROW_LINE;
        const threePointLine = CONSTANTS.POSITIONS.THREE_POINT_LINE;
        const centerX = this.canvasWidth / 2;
        
        ctx.beginPath();
        ctx.moveTo(0, baseline);
        ctx.lineTo(this.canvasWidth, baseline);
        ctx.stroke();
        
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(freeThrowLine, baseline);
        ctx.lineTo(freeThrowLine, this.canvasHeight);
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(threePointLine, baseline);
        ctx.lineTo(threePointLine, this.canvasHeight);
        ctx.stroke();
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(centerX, this.canvasHeight, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(centerX, this.canvasHeight, 18, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
}

class EffectsSystem {
    constructor() {
        this.effects = [];
    }

    add(type, x, y, options = {}) {
        this.effects.push({
            type,
            x,
            y,
            startTime: Date.now(),
            duration: options.duration || 1000,
            text: options.text || '',
            color: options.color || '#FFD700'
        });
    }

    update() {
        const now = Date.now();
        this.effects = this.effects.filter(e => 
            now - e.startTime < e.duration
        );
    }

    draw(ctx) {
        const now = Date.now();
        
        this.effects.forEach(effect => {
            const elapsed = now - effect.startTime;
            const progress = elapsed / effect.duration;
            
            switch (effect.type) {
                case 'perfect':
                    this.drawPerfect(ctx, effect, progress);
                    break;
                case 'duang':
                    this.drawDuang(ctx, effect, progress);
                    break;
                case 'score':
                    this.drawScore(ctx, effect, progress);
                    break;
                case 'swish':
                    this.drawSwish(ctx, effect, progress);
                    break;
                case 'celebration':
                    this.drawCelebration(ctx, effect, progress);
                    break;
            }
        });
    }

    drawPerfect(ctx, effect, progress) {
        const alpha = 1 - progress;
        const scale = 1 + progress * 0.4;
        const yOffset = -progress * 40;
        
        ctx.save();
        ctx.translate(effect.x, effect.y + yOffset);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'];
        const text = '完美!';
        
        ctx.shadowColor = colors[Math.floor(progress * colors.length) % colors.length];
        ctx.shadowBlur = 15;
        
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < text.length; i++) {
            const charProgress = (progress + i * 0.08) % 1;
            const colorIndex = Math.floor(charProgress * colors.length) % colors.length;
            ctx.fillStyle = colors[colorIndex];
            ctx.fillText(text[i], -35 + i * 40, 0);
        }
        
        ctx.restore();
    }

    drawDuang(ctx, effect, progress) {
        const alpha = 1 - progress;
        const scale = 1 + Math.sin(progress * Math.PI) * 0.25;
        const yOffset = -progress * 25;
        
        ctx.save();
        ctx.translate(effect.x, effect.y + yOffset);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#FF6B00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF6B00';
        ctx.shadowBlur = 12;
        ctx.fillText('Duang~', 0, 0);
        
        ctx.restore();
    }

    drawScore(ctx, effect, progress) {
        const alpha = 1 - progress;
        const scale = 1 + progress * 0.25;
        const yOffset = -progress * 35;
        
        ctx.save();
        ctx.translate(effect.x, effect.y + yOffset);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = effect.color;
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = effect.color;
        ctx.shadowBlur = 8;
        ctx.fillText(effect.text || '+2', 0, 0);
        
        ctx.restore();
    }

    drawSwish(ctx, effect, progress) {
        const alpha = 1 - progress;
        const count = 10;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const dist = progress * 50;
            const px = effect.x + Math.cos(angle) * dist;
            const py = effect.y + Math.sin(angle) * dist;
            const size = 4 * (1 - progress);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawCelebration(ctx, effect, progress) {
        const alpha = 1 - progress;
        const count = 15;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 1.5 + Math.random() * 2;
            const dist = progress * speed * 60;
            const px = effect.x + Math.cos(angle) * dist;
            const py = effect.y + Math.sin(angle) * dist - progress * 80;
            const size = 2.5 + Math.random() * 3;
            
            const colors = ['#FF0000', '#FFD700', '#00FF00', '#0000FF', '#FF00FF'];
            ctx.fillStyle = colors[i % colors.length];
            
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    clear() {
        this.effects = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BasketballPlayer,
        Basketball,
        BasketballHoop,
        BasketballCourt,
        EffectsSystem
    };
}
