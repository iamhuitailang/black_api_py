class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.rotation = 0;
        this.rotationSpeed = 0.05;
        this.pulsePhase = 0;
        this.alpha = 1;
    }
    
    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
        this.pulsePhase += 0.1;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = 0.8 + Math.sin(this.pulsePhase) * 0.2;
        
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        ctx.scale(pulse, pulse);
        
        switch(this.type) {
            case 'shield':
                this.drawShield(ctx);
                break;
            case 'doubleBullet':
                this.drawDoubleBullet(ctx);
                break;
            case 'bomb':
                this.drawBomb(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawShield(ctx) {
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 170, 255, 0.5)';
        ctx.fill();
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡️', 0, 0);
    }
    
    drawDoubleBullet(ctx) {
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.roundRect(-12, -8, 8, 16, 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(4, -8, 8, 16, 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
    }
    
    drawBomb(ctx) {
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(0, 2, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#333333';
        ctx.fill();
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, -15);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        if (Math.sin(this.pulsePhase * 3) > 0) {
            ctx.beginPath();
            ctx.arc(0, -17, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6600';
            ctx.fill();
        }
        
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', 0, 2);
    }
    
    isOutOfBounds(canvasHeight) {
        return this.y > canvasHeight + 50;
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

class PowerupManager {
    constructor() {
        this.powerups = [];
        this.dropChance = 0.15;
    }
    
    spawn(x, y) {
        if (Math.random() > this.dropChance) return;
        
        const types = ['shield', 'doubleBullet', 'bomb'];
        const weights = [0.4, 0.4, 0.2];
        
        let random = Math.random();
        let type = types[0];
        
        for (let i = 0; i < weights.length; i++) {
            if (random < weights[i]) {
                type = types[i];
                break;
            }
            random -= weights[i];
        }
        
        this.powerups.push(new Powerup(x, y, type));
    }
    
    update(canvasHeight) {
        this.powerups = this.powerups.filter(powerup => {
            powerup.update();
            return !powerup.isOutOfBounds(canvasHeight);
        });
    }
    
    draw(ctx) {
        this.powerups.forEach(powerup => powerup.draw(ctx));
    }
    
    clear() {
        this.powerups = [];
    }
    
    remove(powerup) {
        const index = this.powerups.indexOf(powerup);
        if (index > -1) {
            this.powerups.splice(index, 1);
        }
    }
}
