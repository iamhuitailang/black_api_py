class Snowball {
    constructor(enemy) {
        this.enemy = enemy;
        this.x = enemy.x;
        this.y = enemy.y;
        this.width = CONFIG.SNOWBALL.WIDTH;
        this.height = CONFIG.SNOWBALL.HEIGHT;
        
        this.isRolling = false;
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = CONFIG.GRAVITY;
        
        this.restoreTime = CONFIG.SNOWBALL.RESTORE_TIME;
        this.createdAt = Date.now();
        this.rollingStartAt = 0;
        
        this.active = true;
        this.rotation = 0;
        this.destroyedEnemies = 0;
    }
    
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    startRolling(direction) {
        this.isRolling = true;
        this.velocityX = direction * CONFIG.SNOWBALL.ROLL_SPEED;
        this.rollingStartAt = Date.now();
    }
    
    checkRestore() {
        if (this.isRolling) return false;
        
        const elapsed = Date.now() - this.createdAt;
        if (elapsed >= this.restoreTime) {
            this.active = false;
            return true;
        }
        return false;
    }
    
    getRestoreProgress() {
        if (this.isRolling) return 0;
        const elapsed = Date.now() - this.createdAt;
        return Math.min(1, elapsed / this.restoreTime);
    }
    
    update(platforms, enemies, snowballs) {
        if (!this.active) return;
        
        if (this.checkRestore()) {
            return;
        }
        
        if (this.isRolling) {
            this.x += this.velocityX;
            this.rotation += this.velocityX > 0 ? 0.2 : -0.2;
            
            this.velocityY += this.gravity;
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
            
            if (this.x < -this.width || this.x > CONFIG.CANVAS_WIDTH) {
                this.active = false;
            }
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        const gradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, CONFIG.COLORS.WHITE);
        gradient.addColorStop(0.7, CONFIG.COLORS.LIGHT_BLUE);
        gradient.addColorStop(1, CONFIG.COLORS.ICE_BLUE);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-8, -8, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        if (!this.isRolling) {
            const progress = this.getRestoreProgress();
            if (progress > 0.5) {
                ctx.save();
                ctx.globalAlpha = (progress - 0.5) * 2;
                ctx.strokeStyle = this.enemy.config.color;
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    this.width / 2 + 5,
                    0, Math.PI * 2
                );
                ctx.stroke();
                ctx.restore();
            }
            
            const remaining = Math.ceil((this.restoreTime - (Date.now() - this.createdAt)) / 1000);
            if (remaining <= 3) {
                ctx.save();
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#FF6B6B';
                ctx.textAlign = 'center';
                ctx.fillText(remaining + 's', this.x + this.width / 2, this.y - 5);
                ctx.restore();
            }
        }
    }
}
