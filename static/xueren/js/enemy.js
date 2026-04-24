class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = this.getConfig();
        
        this.width = this.config.width;
        this.height = this.config.height;
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.speed = this.config.speed;
        this.score = this.config.score;
        
        this.velocityX = this.speed * (Math.random() > 0.5 ? 1 : -1);
        this.velocityY = 0;
        this.gravity = CONFIG.GRAVITY;
        
        this.facingRight = this.velocityX > 0;
        this.active = true;
        this.isSnowball = false;
        this.isBoss = type === 'BOSS';
        
        this.animFrame = 0;
        this.animTimer = 0;
        
        if (this.config.jumpy) {
            this.jumpTimer = 0;
            this.jumpInterval = Utils.randomInt(60, 120);
        }
        
        if (this.config.flying) {
            this.flyOffset = Utils.random(0, Math.PI * 2);
            this.baseY = y;
        }
    }
    
    getConfig() {
        switch (this.type) {
            case 'GREEN_MONSTER':
                return CONFIG.ENEMY.GREEN_MONSTER;
            case 'RED_BAT':
                return CONFIG.ENEMY.RED_BAT;
            case 'ICE_OCTOPUS':
                return CONFIG.ENEMY.ICE_OCTOPUS;
            case 'BOSS':
                return CONFIG.ENEMY.BOSS;
            default:
                return CONFIG.ENEMY.GREEN_MONSTER;
        }
    }
    
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.isSnowball = true;
            return true;
        }
        return false;
    }
    
    update(platforms) {
        if (!this.active || this.isSnowball) return;
        
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
        
        if (this.config.flying) {
            this.flyOffset += 0.05;
            this.y = this.baseY + Math.sin(this.flyOffset) * 30;
            this.x += this.velocityX;
            
            if (this.x <= 0 || this.x + this.width >= CONFIG.CANVAS_WIDTH) {
                this.velocityX *= -1;
                this.facingRight = this.velocityX > 0;
            }
            return;
        }
        
        if (this.config.jumpy) {
            this.jumpTimer++;
            if (this.jumpTimer >= this.jumpInterval) {
                this.jumpTimer = 0;
                this.velocityY = -8;
                this.jumpInterval = Utils.randomInt(60, 120);
            }
        }
        
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        platforms.forEach(platform => {
            if (Utils.rectCollision(this.getCollisionRect(), platform.getCollisionRect())) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            }
        });
        
        if (this.y + this.height > CONFIG.CANVAS_HEIGHT) {
            this.y = CONFIG.CANVAS_HEIGHT - this.height;
            this.velocityY = 0;
        }
        
        if (this.x <= 0) {
            this.x = 0;
            this.velocityX = this.speed;
            this.facingRight = true;
        } else if (this.x + this.width >= CONFIG.CANVAS_WIDTH) {
            this.x = CONFIG.CANVAS_WIDTH - this.width;
            this.velocityX = -this.speed;
            this.facingRight = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        switch (this.type) {
            case 'GREEN_MONSTER':
                this.drawGreenMonster(ctx, centerX, centerY);
                break;
            case 'RED_BAT':
                this.drawRedBat(ctx, centerX, centerY);
                break;
            case 'ICE_OCTOPUS':
                this.drawIceOctopus(ctx, centerX, centerY);
                break;
            case 'BOSS':
                this.drawBoss(ctx, centerX, centerY);
                break;
        }
        
        ctx.restore();
    }
    
    drawGreenMonster(ctx, cx, cy) {
        const bounce = this.animFrame * 2;
        
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.ellipse(cx, cy + bounce, this.width / 2 - 2, this.height / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        const eyeOffsetX = this.facingRight ? 4 : -4;
        ctx.beginPath();
        ctx.arc(cx - 6 + eyeOffsetX, cy - 4 + bounce, 6, 0, Math.PI * 2);
        ctx.arc(cx + 6 + eyeOffsetX, cy - 4 + bounce, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx - 5 + eyeOffsetX, cy - 3 + bounce, 3, 0, Math.PI * 2);
        ctx.arc(cx + 7 + eyeOffsetX, cy - 3 + bounce, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#228B22';
        const waveOffset = Math.sin(Date.now() / 200) * 2;
        ctx.beginPath();
        ctx.arc(cx - 10 + waveOffset, cy - this.height / 2 + 5, 5, 0, Math.PI * 2);
        ctx.arc(cx + waveOffset, cy - this.height / 2, 6, 0, Math.PI * 2);
        ctx.arc(cx + 10 - waveOffset, cy - this.height / 2 + 5, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawRedBat(ctx, cx, cy) {
        const wingFlap = this.animFrame * 10;
        
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 3, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.quadraticCurveTo(cx - this.width / 2, cy - wingFlap, cx - this.width / 2 + 5, cy + 10);
        ctx.lineTo(cx - 5, cy + 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy);
        ctx.quadraticCurveTo(cx + this.width / 2, cy - wingFlap, cx + this.width / 2 - 5, cy + 10);
        ctx.lineTo(cx + 5, cy + 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 2, 3, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 8);
        ctx.lineTo(cx - 10, cy - 18);
        ctx.lineTo(cx - 2, cy - 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx + 6, cy - 8);
        ctx.lineTo(cx + 10, cy - 18);
        ctx.lineTo(cx + 2, cy - 10);
        ctx.closePath();
        ctx.fill();
    }
    
    drawIceOctopus(ctx, cx, cy) {
        const wave = Math.sin(Date.now() / 150) * 3;
        
        ctx.strokeStyle = this.config.color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 6) * i - Math.PI / 2 + Math.PI / 12;
            const tentacleWave = Math.sin(Date.now() / 150 + i) * 5;
            
            ctx.beginPath();
            ctx.moveTo(
                cx + Math.cos(angle) * 10,
                cy + Math.sin(angle) * 10 + 10
            );
            ctx.quadraticCurveTo(
                cx + Math.cos(angle) * 20 + tentacleWave,
                cy + Math.sin(angle) * 20 + 15,
                cx + Math.cos(angle) * 25 + tentacleWave * 2,
                cy + this.height / 2 - 5
            );
            ctx.stroke();
        }
        
        const gradient = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, this.width / 2);
        gradient.addColorStop(0, CONFIG.COLORS.WHITE);
        gradient.addColorStop(0.5, this.config.color);
        gradient.addColorStop(1, '#008B8B');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 5, this.width / 2 - 4, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.hp < this.maxHp) {
            const hpRatio = this.hp / this.maxHp;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(cx - this.width / 2 + 2, cy - this.height / 2 - 10, this.width - 4, 6);
            
            ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : '#FF5722';
            ctx.fillRect(cx - this.width / 2 + 2, cy - this.height / 2 - 10, (this.width - 4) * hpRatio, 6);
        }
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 8, 8, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy - 8, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx - 7, cy - 7, 4, 0, Math.PI * 2);
        ctx.arc(cx + 9, cy - 7, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBoss(ctx, cx, cy) {
        const breathe = Math.sin(Date.now() / 500) * 3;
        
        const gradient = ctx.createRadialGradient(cx - 10, cy - 10, 0, cx, cy, this.width / 2);
        gradient.addColorStop(0, '#A0522D');
        gradient.addColorStop(0.5, this.config.color);
        gradient.addColorStop(1, '#5D3A1A');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(cx, cy, this.width / 2 + breathe, this.height / 2 + breathe, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, this.width / 3, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx - 15, cy - 15, 10, 0, Math.PI * 2);
        ctx.arc(cx + 15, cy - 15, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx - 15, cy - 15, 5, 0, Math.PI * 2);
        ctx.arc(cx + 15, cy - 15, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx, cy + 15, 15, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy + 15);
        ctx.lineTo(cx - 8, cy + 28);
        ctx.lineTo(cx - 4, cy + 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy + 15);
        ctx.lineTo(cx + 8, cy + 28);
        ctx.lineTo(cx + 12, cy + 15);
        ctx.closePath();
        ctx.fill();
        
        const hpRatio = this.hp / this.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(cx - this.width / 2, cy - this.height / 2 - 15, this.width, 10);
        ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : (hpRatio > 0.25 ? '#FF9800' : '#F44336');
        ctx.fillRect(cx - this.width / 2, cy - this.height / 2 - 15, this.width * hpRatio, 10);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', cx, cy - this.height / 2 - 20);
    }
}
