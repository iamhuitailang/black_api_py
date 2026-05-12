class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = CONFIG.PLAYER.SIZE;
        this.speed = CONFIG.PLAYER.SPEED;
        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
        this.angle = 0;
        this.color = CONFIG.PLAYER.COLOR;
        
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.85;
        
        this.weaponManager = new WeaponManager();
        this.weaponManager.init();
        
        this.buffs = [];
        this.invincible = false;
        this.invincibleTimer = 0;
        this.hurtFlash = 0;
    }

    addBuff(type, duration) {
        const existingBuff = this.buffs.find(b => b.type === type);
        if (existingBuff) {
            existingBuff.duration = Math.max(existingBuff.duration, duration);
            existingBuff.endTime = Date.now() + duration;
        } else {
            this.buffs.push({
                type,
                duration,
                endTime: Date.now() + duration
            });
        }
    }

    hasBuff(type) {
        return this.buffs.some(b => b.type === type);
    }

    updateBuffs() {
        const now = Date.now();
        this.buffs = this.buffs.filter(b => now < b.endTime);
    }

    update(keys, mouseX, mouseY) {
        this.updateBuffs();
        
        let moveX = 0;
        let moveY = 0;
        
        if (keys['w'] || keys['W'] || keys['ArrowUp']) moveY -= 1;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) moveY += 1;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) moveX += 1;
        
        if (moveX !== 0 && moveY !== 0) {
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= len;
            moveY /= len;
        }
        
        let currentSpeed = this.speed;
        if (this.hasBuff('speed')) {
            currentSpeed *= 1.5;
        }
        
        this.vx += moveX * currentSpeed * 0.3;
        this.vy += moveY * currentSpeed * 0.3;
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.x = Utils.clamp(this.x, this.size, window.innerWidth - this.size);
        this.y = Utils.clamp(this.y, this.size, window.innerHeight - this.size);
        
        this.angle = Utils.angle(this.x, this.y, mouseX, mouseY);
        
        this.weaponManager.update();
        
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.hurtFlash > 0) {
            this.hurtFlash--;
        }
    }

    shoot(bullets, particleSystem) {
        const weapon = this.weaponManager.getCurrentWeapon();
        if (!weapon) return false;
        
        const gunX = this.x + Math.cos(this.angle) * this.size;
        const gunY = this.y + Math.sin(this.angle) * this.size;
        
        return weapon.shoot(gunX, gunY, this.angle, bullets, particleSystem);
    }

    takeDamage(amount) {
        if (this.hasBuff('shield') || this.invincible) {
            return false;
        }
        
        this.health -= amount;
        this.hurtFlash = 10;
        this.invincible = true;
        this.invincibleTimer = 30;
        
        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        if (this.hurtFlash > 0 && this.hurtFlash % 3 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (this.hasBuff('shield')) {
            ctx.strokeStyle = '#4488ff';
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 20;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        if (this.hasBuff('speed')) {
            ctx.shadowColor = '#ffdd00';
            ctx.shadowBlur = 10;
        }
        
        ctx.fillStyle = '#0a0a0a';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.beginPath();
        ctx.moveTo(-8, -this.size * 0.1);
        ctx.lineTo(-12, this.size * 0.9);
        ctx.lineTo(-4, this.size * 0.9);
        ctx.lineTo(-2, this.size * 0.4);
        ctx.lineTo(2, this.size * 0.4);
        ctx.lineTo(4, this.size * 0.9);
        ctx.lineTo(12, this.size * 0.9);
        ctx.lineTo(8, -this.size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.4, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, -this.size * 0.38, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(-6, -this.size * 0.45);
        ctx.lineTo(-15, -this.size * 0.1);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-4, -this.size * 0.35);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(6, -this.size * 0.45);
        ctx.lineTo(18, -this.size * 0.55);
        ctx.lineTo(22, -this.size * 0.45);
        ctx.lineTo(10, -this.size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(18, -this.size * 0.52, 25, 6);
        ctx.fillRect(38, -this.size * 0.55, 8, 12);
        
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(-2, this.size * 0.4);
        ctx.lineTo(-8, this.size);
        ctx.lineTo(-3, this.size);
        ctx.lineTo(1, this.size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(2, this.size * 0.4);
        ctx.lineTo(8, this.size);
        ctx.lineTo(3, this.size);
        ctx.lineTo(-1, this.size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    getCurrentWeapon() {
        return this.weaponManager.getCurrentWeapon();
    }

    switchWeapon(direction) {
        if (direction > 0) {
            this.weaponManager.nextWeapon();
        } else {
            this.weaponManager.previousWeapon();
        }
    }

    reload() {
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            weapon.startReload();
        }
    }

    checkWeaponUnlocks(score) {
        this.weaponManager.checkUnlocks(score);
    }
}
