class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.active = true;
        this.id = Utils.uuid();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}

class PlayerTank extends Entity {
    constructor(x, y, config) {
        super(x, y, GameConfig.PLAYER.WIDTH, GameConfig.PLAYER.HEIGHT);
        
        this.level = config.level || 1;
        this.hp = config.hp || GameConfig.PLAYER.BASE_HP;
        this.maxHp = config.maxHp || this.hp;
        this.attack = config.attack || GameConfig.PLAYER.BASE_ATTACK;
        this.fireRate = config.fireRate || GameConfig.PLAYER.BASE_FIRE_RATE;
        this.speed = config.speed || GameConfig.PLAYER.BASE_SPEED;
        this.bulletCount = config.bulletCount || GameConfig.PLAYER.BASE_BULLET_COUNT;
        this.skinId = config.skinId || 1;
        
        this.lastFireTime = 0;
        this.invincible = false;
        this.invincibleTime = 0;
        this.flashTimer = 0;
        this.visible = true;
        
        this.direction = { left: false, right: false };
        this.firing = false;
    }

    update(deltaTime, canvasWidth) {
        if (this.direction.left) {
            this.x -= this.speed;
        }
        if (this.direction.right) {
            this.x += this.speed;
        }
        
        this.x = Utils.clamp(this.x, 0, canvasWidth - this.width);
        
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            this.flashTimer += deltaTime;
            this.visible = Math.floor(this.flashTimer / 100) % 2 === 0;
            
            if (this.invincibleTime <= 0) {
                this.invincible = false;
                this.visible = true;
            }
        }
    }

    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    fire(currentTime) {
        if (!this.canFire(currentTime)) return null;
        
        this.lastFireTime = currentTime;
        
        const bullets = [];
        const centerX = this.x + this.width / 2;
        const centerY = this.y;
        
        if (this.bulletCount === 1) {
            bullets.push(new Bullet(centerX - 4, centerY, -1, this.attack, true));
        } else if (this.bulletCount === 2) {
            bullets.push(new Bullet(centerX - 15, centerY, -1, this.attack, true));
            bullets.push(new Bullet(centerX + 7, centerY, -1, this.attack, true));
        } else {
            bullets.push(new Bullet(centerX - 4, centerY, -1, this.attack, true));
            bullets.push(new Bullet(centerX - 20, centerY + 10, -1, this.attack, true));
            bullets.push(new Bullet(centerX + 12, centerY + 10, -1, this.attack, true));
        }
        
        return bullets;
    }

    takeDamage(damage) {
        if (this.invincible) return false;
        
        this.hp -= damage;
        this.invincible = true;
        this.invincibleTime = 2000;
        this.flashTimer = 0;
        
        return this.hp <= 0;
    }

    draw(ctx) {
        if (!this.visible) return;
        
        const skinColor = GameConfig.getSkinColor(this.skinId);
        
        ctx.save();
        
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y + 10, this.width - 10, this.height - 15, 5);
        ctx.fill();
        
        ctx.fillStyle = '#374151';
        ctx.fillRect(this.x, this.y + this.height - 12, 10, 12);
        ctx.fillRect(this.x + this.width - 10, this.y + this.height - 12, 10, 12);
        
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const leftX = this.x + 2 + i * 2.5;
            const rightX = this.x + this.width - 8 + i * 2.5;
            ctx.beginPath();
            ctx.moveTo(leftX, this.y + this.height - 10);
            ctx.lineTo(leftX, this.y + this.height - 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(rightX, this.y + this.height - 10);
            ctx.lineTo(rightX, this.y + this.height - 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = this.skinId === 5 ? '#c084fc' : '#6b7280';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 25, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.skinId === 5 ? '#e879f9' : '#9ca3af';
        ctx.fillRect(this.x + this.width / 2 - 3, this.y + 2, 6, 23);
        
        if (this.skinId >= 3) {
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(this.x + this.width / 2 - 18, this.y + 8, 6, 17);
        }
        
        if (this.skinId >= 3) {
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(this.x + this.width / 2 + 12, this.y + 8, 6, 17);
        }
        
        if (this.skinId === 5) {
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + 2);
            ctx.lineTo(this.x + this.width / 2, this.y - 30);
            ctx.stroke();
            
            ctx.fillStyle = '#e879f9';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - 30, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        if (this.skinId === 4) {
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(this.x + 5, this.y + 10, this.width - 10, this.height - 15, 5);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class EnemyTank extends Entity {
    constructor(x, y, type) {
        const config = GameConfig.ENEMIES[type];
        super(x, y, config.width, config.height);
        
        this.type = type;
        this.config = config;
        this.hp = config.hp;
        this.maxHp = config.maxHp;
        this.speed = config.speed;
        this.attack = config.attack;
        this.score = config.score;
        this.exp = config.exp;
        this.color = config.color;
        
        this.lastFireTime = 0;
        this.fireRate = config.fireRate;
        this.directionY = 1;
        this.directionX = 0;
        
        this.randomMoveTimer = 0;
        this.targetX = x;
    }

    update(deltaTime, canvasWidth, canvasHeight) {
        this.y += this.speed * this.directionY;
        
        if (this.config.randomMove) {
            this.randomMoveTimer -= deltaTime;
            if (this.randomMoveTimer <= 0) {
                this.randomMoveTimer = Utils.random(500, 1500);
                this.targetX = Utils.random(0, canvasWidth - this.width);
            }
            
            const dx = this.targetX - this.x;
            if (Math.abs(dx) > 2) {
                this.x += Math.sign(dx) * this.speed * 0.8;
            }
        }
        
        if (this.config.isSuicide) {
            this.x += this.directionX * this.speed * 0.5;
            if (this.x <= 0 || this.x >= canvasWidth - this.width) {
                this.directionX *= -1;
            }
        }
        
        this.x = Utils.clamp(this.x, 0, canvasWidth - this.width);
        
        if (this.y > canvasHeight) {
            this.active = false;
        }
    }

    canFire(currentTime) {
        if (this.fireRate === 0) return false;
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    fire(currentTime) {
        if (!this.canFire(currentTime)) return null;
        
        this.lastFireTime = currentTime;
        
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;
        
        if (this.config.isBoss) {
            return [
                new Bullet(centerX - 4, bottomY, 1, this.attack, false),
                new Bullet(centerX - 20, bottomY, 1, this.attack, false),
                new Bullet(centerX + 12, bottomY, 1, this.attack, false)
            ];
        }
        
        return [new Bullet(centerX - 4, bottomY, 1, this.attack, false)];
    }

    takeDamage(damage) {
        this.hp -= damage;
        return this.hp <= 0;
    }

    draw(ctx) {
        ctx.save();
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10, 4);
        ctx.fill();
        
        ctx.fillStyle = '#374151';
        ctx.fillRect(this.x, this.y, 10, this.height);
        ctx.fillRect(this.x + this.width - 10, this.y, 10, this.height);
        
        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(this.x + this.width / 2 - 3, this.y + this.height - 5, 6, 15);
        
        if (this.config.isBoss) {
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 8);
            ctx.stroke();
            
            ctx.shadowColor = '#dc2626';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(this.x + 3, this.y + 3, this.width - 6, this.height - 6, 6);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        if (this.config.isAir) {
            ctx.fillStyle = '#a78bfa';
            ctx.fillRect(this.x - 8, this.y + this.height / 2 - 2, this.width + 16, 4);
            
            const rotorAngle = (Date.now() / 50) % (Math.PI * 2);
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + 10);
            ctx.rotate(rotorAngle);
            ctx.fillStyle = '#c4b5fd';
            ctx.fillRect(-15, -2, 30, 4);
            ctx.restore();
        }
        
        if (this.config.isSuicide) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💣', this.x + this.width / 2, this.y + this.height / 2 + 7);
        }
        
        if (this.maxHp > 1) {
            const barWidth = this.width;
            const barHeight = 4;
            const barY = this.y - 8;
            
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(this.x, barY, barWidth, barHeight);
            
            const hpPercent = this.hp / this.maxHp;
            ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(this.x, barY, barWidth * hpPercent, barHeight);
        }
        
        ctx.restore();
    }
}

class Bullet extends Entity {
    constructor(x, y, direction, damage, isPlayer) {
        super(x, y, 8, 16);
        this.direction = direction;
        this.damage = damage;
        this.isPlayer = isPlayer;
        this.speed = 10;
    }

    update(deltaTime) {
        this.y += this.speed * this.direction;
        
        if (this.y < -20 || this.y > GameConfig.CANVAS_HEIGHT + 20) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        
        if (this.isPlayer) {
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#00ffff');
            gradient.addColorStop(1, '#0088ff');
            
            ctx.fillStyle = gradient;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 4);
            ctx.fill();
        } else {
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#ff4444');
            gradient.addColorStop(1, '#ff0000');
            
            ctx.fillStyle = gradient;
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 8;
            
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 4);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Particle extends Entity {
    constructor(x, y, color, type = 'explosion') {
        super(x, y, 4, 4);
        
        this.color = color;
        this.type = type;
        this.vx = Utils.randomFloat(-3, 3);
        this.vy = Utils.randomFloat(-3, 3);
        this.life = 1;
        this.decay = 0.03;
        this.size = Utils.random(3, 8);
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy += 0.1;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class MuzzleFlash extends Entity {
    constructor(x, y, isPlayer) {
        super(x, y, 20, 20);
        this.isPlayer = isPlayer;
        this.life = 1;
        this.decay = 0.15;
        this.size = 15;
    }

    update(deltaTime) {
        this.life -= this.decay;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        
        const color = this.isPlayer ? '#00ffff' : '#ff4444';
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * this.life
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, this.isPlayer ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 68, 68, 0.5)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
