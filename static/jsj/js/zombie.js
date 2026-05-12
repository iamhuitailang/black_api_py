class Zombie {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = CONFIG.ZOMBIES[type];
        this.size = this.config.size;
        this.speed = this.config.speed;
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.score = this.config.score;
        this.color = this.config.color;
        this.angle = 0;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.1;
    }

    update(playerX, playerY) {
        this.angle = Utils.angle(this.x, this.y, playerX, playerY);
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.wobbleOffset += this.wobbleSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        
        const wobble = Math.sin(this.wobbleOffset) * 0.08;
        ctx.rotate(wobble);
        
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        bodyGradient.addColorStop(0, '#5a6b4a');
        bodyGradient.addColorStop(0.7, this.color);
        bodyGradient.addColorStop(1, '#2a3520');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.45, -this.size * 0.3);
        ctx.quadraticCurveTo(-this.size * 0.55, 0, -this.size * 0.5, this.size * 0.5);
        ctx.quadraticCurveTo(-this.size * 0.3, this.size * 0.8, 0, this.size * 0.7);
        ctx.quadraticCurveTo(this.size * 0.3, this.size * 0.8, this.size * 0.5, this.size * 0.5);
        ctx.quadraticCurveTo(this.size * 0.55, 0, this.size * 0.45, -this.size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#4a5a3a';
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.5, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = '#1a1510';
        ctx.beginPath();
        ctx.arc(-this.size * 0.15, -this.size * 0.55, this.size * 0.12, 0, Math.PI * 2);
        ctx.arc(this.size * 0.15, -this.size * 0.55, this.size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-this.size * 0.15, -this.size * 0.55, this.size * 0.06, 0, Math.PI * 2);
        ctx.arc(this.size * 0.15, -this.size * 0.55, this.size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.12, -this.size * 0.35);
        ctx.quadraticCurveTo(0, -this.size * 0.25, this.size * 0.12, -this.size * 0.35);
        ctx.quadraticCurveTo(0, -this.size * 0.2, -this.size * 0.12, -this.size * 0.35);
        ctx.fill();
        
        ctx.fillStyle = '#6a5a4a';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.size * 0.05 - this.size * 0.02, -this.size * 0.32);
            ctx.lineTo(i * this.size * 0.05, -this.size * 0.25);
            ctx.lineTo(i * this.size * 0.05 + this.size * 0.02, -this.size * 0.32);
            ctx.fill();
        }
        
        ctx.fillStyle = '#4a5a3a';
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.4, -this.size * 0.1);
        ctx.lineTo(-this.size * 0.7, this.size * 0.4);
        ctx.lineTo(-this.size * 0.55, this.size * 0.45);
        ctx.lineTo(-this.size * 0.3, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.size * 0.4, -this.size * 0.1);
        ctx.lineTo(this.size * 0.7, this.size * 0.4);
        ctx.lineTo(this.size * 0.55, this.size * 0.45);
        ctx.lineTo(this.size * 0.3, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#3a4a2a';
        ctx.fillRect(-this.size * 0.3, this.size * 0.6, this.size * 0.2, this.size * 0.5);
        ctx.fillRect(this.size * 0.1, this.size * 0.6, this.size * 0.2, this.size * 0.5);
        
        if (this.health < this.maxHealth) {
            const barWidth = this.size * 1.5;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#222';
            ctx.fillRect(-barWidth / 2, -this.size - 18, barWidth, barHeight);
            
            const healthGradient = ctx.createLinearGradient(-barWidth / 2, 0, barWidth / 2, 0);
            healthGradient.addColorStop(0, '#8b0000');
            healthGradient.addColorStop(1, '#ff4444');
            ctx.fillStyle = healthGradient;
            ctx.fillRect(-barWidth / 2, -this.size - 18, barWidth * healthPercent, barHeight);
        }
        
        ctx.restore();
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    isTouchingPlayer(player) {
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        return dist < this.size + player.size * 0.5;
    }
}

class FireZombie extends Zombie {
    constructor(x, y) {
        super(x, y, 'FIRE');
        this.fireParticles = [];
    }

    update(playerX, playerY) {
        super.update(playerX, playerY);
        
        if (Math.random() < 0.3) {
            this.fireParticles.push({
                x: this.x + Utils.random(-10, 10),
                y: this.y + Utils.random(-10, 10),
                life: 1,
                size: Utils.random(3, 6)
            });
        }
        
        this.fireParticles = this.fireParticles.filter(p => {
            p.life -= 0.05;
            p.size *= 0.95;
            return p.life > 0;
        });
    }

    draw(ctx) {
        this.fireParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.life > 0.5 ? '#ff6600' : '#ffcc00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        super.draw(ctx);
    }
}

class BossZombie extends Zombie {
    constructor(x, y) {
        super(x, y, 'BOSS');
        this.phase = 0;
        this.attackCooldown = 0;
    }

    update(playerX, playerY) {
        super.update(playerX, playerY);
        this.phase = (this.phase + 0.01) % (Math.PI * 2);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.shadowColor = '#8b0000';
        ctx.shadowBlur = 20 + Math.sin(this.phase) * 10;
        
        super.draw(ctx);
        
        ctx.shadowBlur = 0;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', 0, -this.size - 10);
        
        ctx.restore();
    }
}

class ZombieFactory {
    static create(x, y, type) {
        switch (type) {
            case 'FIRE':
                return new FireZombie(x, y);
            case 'BOSS':
                return new BossZombie(x, y);
            default:
                return new Zombie(x, y, type);
        }
    }

    static createRandom(x, y, bossChance = 0.05) {
        const types = Object.keys(CONFIG.ZOMBIES);
        const weights = types.map(t => {
            if (t === 'BOSS') return bossChance;
            return CONFIG.ZOMBIES[t].spawnChance;
        });
        
        const type = Utils.weightedChoice(types, weights);
        return this.create(x, y, type);
    }
}

class ZombieManager {
    constructor() {
        this.zombies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.maxZombies = 10;
        this.bossChance = 0.05;
    }

    setDifficulty(wave) {
        const diffConfig = CONFIG.DIFFICULTY.slice().reverse().find(d => wave >= d.wave);
        if (diffConfig) {
            this.spawnInterval = diffConfig.spawnInterval;
            this.maxZombies = diffConfig.maxZombies;
            this.bossChance = diffConfig.bossChance;
        }
    }

    spawn(canvasWidth, canvasHeight) {
        if (this.zombies.length >= this.maxZombies) return;
        
        const pos = Utils.getRandomSpawnPosition(canvasWidth, canvasHeight);
        const zombie = ZombieFactory.createRandom(pos.x, pos.y, this.bossChance);
        this.zombies.push(zombie);
    }

    update(player) {
        this.zombies.forEach(z => z.update(player.x, player.y));
    }

    draw(ctx) {
        this.zombies.forEach(z => z.draw(ctx));
    }

    checkBulletCollisions(bullets, particleSystem, game) {
        let scoreGained = 0;
        let kills = 0;
        
        bullets = bullets.filter(bullet => {
            let bulletHit = false;
            
            this.zombies = this.zombies.filter(zombie => {
                if (bulletHit) return true;
                
                const dist = Utils.distance(bullet.x, bullet.y, zombie.x, zombie.y);
                if (dist < zombie.size + bullet.size) {
                    bulletHit = true;
                    const isDead = zombie.takeDamage(bullet.damage);
                    
                    particleSystem.emitBlood(bullet.x, bullet.y, 8);
                    
                    if (isDead) {
                        particleSystem.emitZombieDeath(zombie.x, zombie.y, zombie.size);
                        scoreGained += zombie.score;
                        kills++;
                        
                        if (zombie.type === 'FIRE') {
                            particleSystem.emitExplosion(zombie.x, zombie.y, 40);
                            this.explosionDamage(zombie.x, zombie.y, 100, 1);
                        }
                        
                        return false;
                    }
                }
                return true;
            });
            
            return !bulletHit;
        });
        
        return { bullets, scoreGained, kills };
    }

    explosionDamage(x, y, radius, damage) {
        this.zombies.forEach(zombie => {
            const dist = Utils.distance(x, y, zombie.x, zombie.y);
            if (dist < radius) {
                zombie.takeDamage(damage);
            }
        });
    }

    checkPlayerCollision(player, game) {
        this.zombies.forEach(zombie => {
            if (zombie.isTouchingPlayer(player)) {
                game.playerTakeDamage(10);
            }
        });
    }

    killAll() {
        const scores = this.zombies.reduce((sum, z) => sum + z.score, 0);
        this.zombies = [];
        return scores;
    }

    clear() {
        this.zombies = [];
    }

    get count() {
        return this.zombies.length;
    }
}
