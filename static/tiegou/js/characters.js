class Captain {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 120;
        this.height = 150;
        this.isAttacking = false;
        this.attackFrame = 0;
        this.attackSpeed = 8;
        this.hookAngle = 0;
        this.breathOffset = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
    }

    update() {
        this.breathOffset = Math.sin(Date.now() * 0.003) * 3;
        
        this.blinkTimer++;
        if (this.blinkTimer > 180) {
            this.isBlinking = true;
            if (this.blinkTimer > 188) {
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }

        if (this.isAttacking) {
            this.attackFrame++;
            this.hookAngle = Math.sin(this.attackFrame * 0.3) * 50;
            
            if (this.attackFrame > this.attackSpeed * 3) {
                this.isAttacking = false;
                this.attackFrame = 0;
                this.hookAngle = 0;
            }
        }
    }

    attack() {
        if (!this.isAttacking) {
            this.isAttacking = true;
            this.attackFrame = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.breathOffset);
        
        this.drawBody(ctx);
        this.drawHead(ctx);
        this.drawHook(ctx);
        
        ctx.restore();
    }

    drawBody(ctx) {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(0, 25, 45, 55, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.ellipse(0, 8, 48, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(-10, 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(-10, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#4A90D9';
        ctx.beginPath();
        ctx.ellipse(-20, 68, 14, 18, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(20, 68, 14, 18, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C1810';
        ctx.beginPath();
        ctx.ellipse(-20, 85, 16, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(20, 85, 16, 8, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHead(ctx) {
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(0, -38, 42, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C1810';
        ctx.beginPath();
        ctx.ellipse(0, -70, 45, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.moveTo(-42, -62);
        ctx.quadraticCurveTo(0, -105, 42, -62);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -80, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(2, -82, 3, 0, Math.PI * 2);
        ctx.fill();
        
        if (!this.isBlinking) {
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.ellipse(-16, -40, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(16, -40, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2C1810';
            ctx.beginPath();
            ctx.arc(-14, -38, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(18, -38, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(-12, -40, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(20, -40, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#2C1810';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-24, -40);
            ctx.lineTo(-8, -40);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(8, -40);
            ctx.lineTo(24, -40);
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-32, -28, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(32, -28, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(-28, -32, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('X', -33, -28);
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -18, 12, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    drawHook(ctx) {
        ctx.save();
        ctx.translate(45, -5);
        ctx.rotate((this.hookAngle - 20) * Math.PI / 180);
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(10, 0, 22, 20, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(32, -10);
        ctx.lineTo(88, -10);
        ctx.quadraticCurveTo(92, -10, 92, -6);
        ctx.lineTo(92, 6);
        ctx.quadraticCurveTo(92, 10, 88, 10);
        ctx.lineTo(32, 10);
        ctx.quadraticCurveTo(28, 10, 28, 6);
        ctx.lineTo(28, -6);
        ctx.quadraticCurveTo(28, -10, 32, -10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#E8E8E8';
        ctx.fillRect(30, -8, 58, 5);
        
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(92, -8);
        ctx.quadraticCurveTo(120, 5, 110, 18);
        ctx.quadraticCurveTo(100, 25, 95, 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(92, 8);
        ctx.quadraticCurveTo(120, 30, 110, 42);
        ctx.quadraticCurveTo(100, 50, 95, 35);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(58, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(58, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    containsPoint(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        return Math.sqrt(dx * dx + dy * dy) < 60;
    }
}

class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'big' ? 100 : 70;
        this.height = type === 'big' ? 130 : 100;
        this.speed = type === 'big' ? 1.2 : Utils.random(1.8, 2.5);
        this.walkFrame = Utils.randomInt(0, 100);
        this.isDead = false;
        this.deathFrame = 0;
        this.hitFlash = 0;
    }

    update() {
        if (this.isDead) {
            this.deathFrame++;
            return;
        }
        
        this.x -= this.speed;
        this.walkFrame += 0.15;
        
        if (this.hitFlash > 0) {
            this.hitFlash--;
        }
    }

    hit() {
        this.isDead = true;
        this.deathFrame = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.isDead) {
            ctx.globalAlpha = Math.max(0, 1 - this.deathFrame / 30);
            ctx.translate(0, -this.deathFrame * 2);
            ctx.rotate(this.deathFrame * 0.1);
        }
        
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2)';
        }
        
        if (this.type === 'big') {
            this.drawBigPirate(ctx);
        } else {
            this.drawNormalPirate(ctx);
        }
        
        if (!this.isDead) {
            const hitRadius = this.type === 'big' ? 55 : 35;
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, hitRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }

    drawNormalPirate(ctx) {
        const walkBob = Math.sin(this.walkFrame * Math.PI) * 3;
        
        ctx.fillStyle = '#4ECDC4';
        ctx.beginPath();
        ctx.ellipse(0, 15 + walkBob, 28, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0 + walkBob, 30, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(0, -25 + walkBob, 26, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, -42 + walkBob, 28, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.arc(0, -48 + walkBob, 22, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(0, -55 + walkBob, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-1, -58 + walkBob, 2, 5);
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-10, -25 + walkBob, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -25 + walkBob, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(-9, -24 + walkBob, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -24 + walkBob, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-7, -26 + walkBob, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(13, -26 + walkBob, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#F39C12';
        ctx.beginPath();
        ctx.ellipse(0, -12 + walkBob, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -8 + walkBob, 10, 0.15, Math.PI - 0.15);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-20, -18 + walkBob, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(20, -18 + walkBob, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3498DB';
        const legOffset = Math.sin(this.walkFrame * Math.PI * 2) * 5;
        ctx.beginPath();
        ctx.ellipse(-14 + legOffset, 50 + walkBob, 12, 16, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14 - legOffset, 50 + walkBob, 12, 16, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.ellipse(-14 + legOffset, 65 + walkBob, 14, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14 - legOffset, 65 + walkBob, 14, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.ellipse(-30, 10 + walkBob, 9, 14, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(30, 10 + walkBob, 9, 14, -0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBigPirate(ctx) {
        const walkBob = Math.sin(this.walkFrame * Math.PI) * 4;
        
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.ellipse(0, 20 + walkBob, 48, 58, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#F1C40F';
        ctx.beginPath();
        ctx.ellipse(0, 0 + walkBob, 50, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E74C3C';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(i * 18, 0 + walkBob, 7, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(0, -30 + walkBob, 45, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.ellipse(0, -62 + walkBob, 48, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.moveTo(-45, -52 + walkBob);
        ctx.quadraticCurveTo(0, -100 + walkBob, 45, -52 + walkBob);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(0, -75 + walkBob, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1A1A1A';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('☠', -7, -70 + walkBob);
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(-18, -30 + walkBob, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(18, -30 + walkBob, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(-16, -28 + walkBob, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(20, -28 + walkBob, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.ellipse(0, -5 + walkBob, 20, 16, 0, 0, Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#922B21';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 6, -5 + walkBob);
            ctx.lineTo(i * 6, 8 + walkBob);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#34495E';
        const legOffset = Math.sin(this.walkFrame * Math.PI * 2) * 6;
        ctx.beginPath();
        ctx.ellipse(-25 + legOffset, 72 + walkBob, 18, 24, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(25 - legOffset, 72 + walkBob, 18, 24, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.ellipse(-25 + legOffset, 94 + walkBob, 20, 9, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(25 - legOffset, 94 + walkBob, 20, 9, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.ellipse(-52, 12 + walkBob, 14, 32, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(52, 12 + walkBob, 14, 32, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    containsPoint(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        const hitRadius = this.type === 'big' ? 55 : 35;
        return Math.sqrt(dx * dx + dy * dy) < hitRadius;
    }

    isOffScreen() {
        return this.x < -100;
    }

    reachedCaptain(captainX) {
        return this.x < captainX + 80;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = Utils.random(-5, 5);
        this.vy = Utils.random(-8, -2);
        this.life = 1;
        this.decay = Utils.random(0.02, 0.05);
        this.size = Utils.random(4, 10);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}