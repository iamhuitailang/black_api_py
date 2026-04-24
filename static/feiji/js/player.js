class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 55;
        this.speed = 6;
        this.targetX = x;
        this.targetY = y;
        this.isMoving = false;
        
        this.hasShield = false;
        this.shieldTimer = 0;
        this.shieldDuration = 3;
        
        this.hasDoubleBullet = false;
        this.doubleBulletTimer = 0;
        this.doubleBulletDuration = 15;
        
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 60;
        
        this.enginePhase = 0;
        this.bobPhase = 0;
    }
    
    update(canvasWidth, canvasHeight, keys, mousePos, mouseActive) {
        if (mouseActive) {
            this.targetX = mousePos.x;
            this.targetY = mousePos.y;
        } else {
            let dx = 0;
            let dy = 0;
            
            if (keys.ArrowLeft || keys.KeyA) dx -= 1;
            if (keys.ArrowRight || keys.KeyD) dx += 1;
            if (keys.ArrowUp || keys.KeyW) dy -= 1;
            if (keys.ArrowDown || keys.KeyS) dy += 1;
            
            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;
                
                this.targetX = this.x + dx * this.speed * 10;
                this.targetY = this.y + dy * this.speed * 10;
            }
        }
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 2) {
            this.x += (dx / dist) * Math.min(this.speed, dist);
            this.y += (dy / dist) * Math.min(this.speed, dist);
        }
        
        this.x = Utils.clamp(this.x, this.width / 2, canvasWidth - this.width / 2);
        this.y = Utils.clamp(this.y, this.height / 2 + 50, canvasHeight - this.height / 2);
        
        if (this.hasShield) {
            this.shieldTimer -= 1/60;
            if (this.shieldTimer <= 0) {
                this.hasShield = false;
                this.shieldTimer = 0;
            }
        }
        
        if (this.hasDoubleBullet) {
            this.doubleBulletTimer -= 1/60;
            if (this.doubleBulletTimer <= 0) {
                this.hasDoubleBullet = false;
                this.doubleBulletTimer = 0;
            }
        }
        
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.invincibleTimer = 0;
            }
        }
        
        this.enginePhase += 0.3;
        this.bobPhase += 0.05;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.bobPhase) * 3);
        
        if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (this.hasShield) {
            this.drawShield(ctx);
        }
        
        this.drawEngineFlame(ctx);
        
        this.drawShip(ctx);
        
        ctx.restore();
    }
    
    drawEngineFlame(ctx) {
        const flameHeight = 15 + Math.sin(this.enginePhase) * 5;
        const flameWidth = 8 + Math.sin(this.enginePhase * 1.5) * 2;
        
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15;
        
        const gradient = ctx.createLinearGradient(0, 20, 0, 20 + flameHeight);
        gradient.addColorStop(0, '#ff8800');
        gradient.addColorStop(0.5, '#ff4400');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.beginPath();
        ctx.moveTo(-flameWidth, 20);
        ctx.quadraticCurveTo(0, 20 + flameHeight * 1.5, flameWidth, 20);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        
        const innerGradient = ctx.createLinearGradient(0, 20, 0, 20 + flameHeight * 0.6);
        innerGradient.addColorStop(0, '#ffff00');
        innerGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.beginPath();
        ctx.moveTo(-flameWidth * 0.5, 20);
        ctx.quadraticCurveTo(0, 20 + flameHeight * 0.8, flameWidth * 0.5, 20);
        ctx.closePath();
        ctx.fillStyle = innerGradient;
        ctx.fill();
    }
    
    drawShip(ctx) {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(-25, 15);
        ctx.lineTo(-30, 5);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-20, 15);
        ctx.closePath();
        ctx.fillStyle = '#008855';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(25, 15);
        ctx.lineTo(30, 5);
        ctx.lineTo(20, 0);
        ctx.lineTo(20, 15);
        ctx.closePath();
        ctx.fillStyle = '#008855';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-15, 5);
        ctx.lineTo(-15, 20);
        ctx.lineTo(15, 20);
        ctx.lineTo(15, 5);
        ctx.closePath();
        ctx.fillStyle = '#00cc66';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-10, 5);
        ctx.lineTo(10, 5);
        ctx.closePath();
        ctx.fillStyle = '#00ff88';
        ctx.fill();
        
        ctx.shadowColor = '#88ccff';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(136, 204, 255, 0.7)';
        ctx.fill();
        ctx.strokeStyle = '#88ccff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(-10, 10, 2, 0, Math.PI * 2);
        ctx.arc(10, 10, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff88';
        ctx.fill();
    }
    
    drawShield(ctx) {
        const shieldPulse = Math.sin(Date.now() / 100) * 0.1 + 1;
        const alpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;
        
        ctx.save();
        ctx.scale(shieldPulse, shieldPulse);
        
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 170, 255, ${alpha + 0.3})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 170, 255, ${alpha})`;
        ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Date.now() / 1000;
            const x = Math.cos(angle) * 35;
            const y = Math.sin(angle) * 35;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00ccff';
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    takeDamage() {
        if (this.hasShield || this.invincible) {
            return false;
        }
        
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        return true;
    }
    
    activateShield() {
        this.hasShield = true;
        this.shieldTimer = this.shieldDuration;
    }
    
    activateDoubleBullet() {
        this.hasDoubleBullet = true;
        this.doubleBulletTimer = this.doubleBulletDuration;
    }
    
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
