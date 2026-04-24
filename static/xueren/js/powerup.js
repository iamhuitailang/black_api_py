class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.POWERUP.WIDTH;
        this.height = CONFIG.POWERUP.HEIGHT;
        this.type = type;
        
        this.velocityY = 0;
        this.gravity = CONFIG.GRAVITY * 0.5;
        this.active = true;
        this.bobOffset = Utils.random(0, Math.PI * 2);
        this.collected = false;
        
        this.config = this.getConfig();
    }
    
    getConfig() {
        switch (this.type) {
            case 'health':
                return CONFIG.POWERUP.RED_POTION;
            case 'bigShot':
                return CONFIG.POWERUP.BLUE_POTION;
            case 'speed':
                return CONFIG.POWERUP.YELLOW_POTION;
            case 'invincible':
                return CONFIG.POWERUP.STAR;
            default:
                return CONFIG.POWERUP.RED_POTION;
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
    
    update(platforms) {
        if (!this.active || this.collected) return;
        
        this.bobOffset += 0.05;
        
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        let landed = false;
        platforms.forEach(platform => {
            if (Utils.rectCollision(this.getCollisionRect(), platform.getCollisionRect())) {
                if (this.velocityY > 0) {
                    if (this.y + this.height - this.velocityY <= platform.y + 10) {
                        this.y = platform.y - this.height;
                        this.velocityY = 0;
                        landed = true;
                    }
                }
            }
        });
        
        if (!landed && this.y + this.height > CONFIG.CANVAS_HEIGHT - 40) {
            this.y = CONFIG.CANVAS_HEIGHT - 40 - this.height;
            this.velocityY = 0;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const bobY = Math.sin(this.bobOffset) * 3;
        const drawY = this.y + bobY;
        
        ctx.save();
        
        if (this.type === 'invincible') {
            ctx.strokeStyle = CONFIG.COLORS.WHITE;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                drawY + this.height / 2,
                this.width / 2 + 5,
                0, Math.PI * 2
            );
            ctx.stroke();
        }
        
        if (this.type === 'invincible') {
            this.drawStar(ctx, this.x + this.width / 2, drawY + this.height / 2, 12, 5);
        } else {
            this.drawPotion(ctx, this.x, drawY);
        }
        
        ctx.restore();
    }
    
    drawPotion(ctx, x, y) {
        const centerX = x + this.width / 2;
        const centerY = y + this.height / 2;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(centerX - 4, y, 8, 6);
        
        ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
        ctx.strokeStyle = CONFIG.COLORS.WHITE;
        ctx.lineWidth = 2;
        Utils.drawRoundRect(ctx, x + 2, y + 6, this.width - 4, this.height - 8, 6, true, true);
        
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + this.height - 4);
        ctx.lineTo(x + this.width - 6, y + this.height - 4);
        ctx.lineTo(x + this.width - 8, y + 15);
        ctx.lineTo(x + 8, y + 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(centerX - 3, y + 12, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawStar(ctx, cx, cy, outerRadius, points) {
        const innerRadius = outerRadius / 2;
        const step = Math.PI / points;
        let rotation = Math.PI / 2 * 3;
        
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.5, this.config.color);
        gradient.addColorStop(1, '#FFA500');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < points; i++) {
            let x = cx + Math.cos(rotation) * outerRadius;
            let y = cy + Math.sin(rotation) * outerRadius;
            ctx.lineTo(x, y);
            rotation += step;
            
            x = cx + Math.cos(rotation) * innerRadius;
            y = cy + Math.sin(rotation) * innerRadius;
            ctx.lineTo(x, y);
            rotation += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static getRandomType() {
        const types = ['health', 'bigShot', 'speed', 'invincible'];
        const weights = [0.35, 0.25, 0.25, 0.15];
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return types[i];
            }
        }
        
        return types[0];
    }
}

class PowerupManager {
    constructor() {
        this.powerups = [];
        this.activeEffects = {};
    }
    
    spawn(x, y) {
        if (Math.random() < CONFIG.POWERUP.DROP_CHANCE) {
            const type = Powerup.getRandomType();
            this.powerups.push(new Powerup(x, y, type));
        }
    }
    
    collect(powerup, player, game) {
        powerup.collected = true;
        powerup.active = false;
        
        game.particleSystem.createPowerupSparkle(
            powerup.x + powerup.width / 2,
            powerup.y + powerup.height / 2,
            powerup.config.color
        );
        
        switch (powerup.type) {
            case 'health':
                if (game.lives < 5) {
                    game.lives++;
                    game.updateUI();
                }
                break;
                
            case 'bigShot':
                this.startEffect('bigShot', CONFIG.PROJECTILE.BIG_DURATION);
                player.hasBigShot = true;
                break;
                
            case 'speed':
                this.startEffect('speed', 10000);
                player.speedMultiplier = CONFIG.PLAYER.SPEED_BOOST;
                break;
                
            case 'invincible':
                this.startEffect('invincible', CONFIG.PLAYER.INVINCIBLE_DURATION);
                player.isInvincible = true;
                player.invincibleEndTime = Date.now() + CONFIG.PLAYER.INVINCIBLE_DURATION;
                break;
        }
    }
    
    startEffect(type, duration) {
        this.activeEffects[type] = {
            active: true,
            endTime: Date.now() + duration,
            duration: duration
        };
    }
    
    updateEffects(player) {
        const now = Date.now();
        
        Object.keys(this.activeEffects).forEach(type => {
            const effect = this.activeEffects[type];
            if (effect && effect.active) {
                if (now >= effect.endTime) {
                    effect.active = false;
                    
                    switch (type) {
                        case 'bigShot':
                            player.hasBigShot = false;
                            break;
                        case 'speed':
                            player.speedMultiplier = 1;
                            break;
                        case 'invincible':
                            player.isInvincible = false;
                            break;
                    }
                }
            }
        });
    }
    
    getActiveEffects() {
        return Object.keys(this.activeEffects).filter(
            type => this.activeEffects[type].active
        );
    }
    
    getRemainingTime(type) {
        const effect = this.activeEffects[type];
        if (!effect || !effect.active) return 0;
        return Math.max(0, effect.endTime - Date.now());
    }
    
    update(platforms, player, game) {
        this.updateEffects(player);
        
        this.powerups = this.powerups.filter(powerup => {
            if (!powerup.active) return false;
            
            powerup.update(platforms);
            
            if (Utils.rectCollision(powerup.getCollisionRect(), player.getCollisionRect())) {
                this.collect(powerup, player, game);
                return false;
            }
            
            return true;
        });
    }
    
    draw(ctx) {
        this.powerups.forEach(powerup => powerup.draw(ctx));
    }
    
    clear() {
        this.powerups = [];
        this.activeEffects = {};
    }
}
