const API_BASE = '/api';

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

const CONFIG = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    GROUND_Y: window.innerHeight - 100,
    GRAVITY: 0.5,
    PLAYER_SPEED: 5,
    JUMP_FORCE: -12,
    BULLET_SPEED: 15,
    FIRE_RATE: 100,
    MAG_SIZE: 30,
    RELOAD_TIME: 2000,
    TOTAL_AMMO: 90,
    MAX_HEALTH: 100,
    CHECKPOINT_INTERVAL: 100,
    GAME_LENGTH: 1000,
    SCROLL_SPEED: 2
};

const COLORS = {
    BACKGROUND: '#1a1f1a',
    GROUND: '#2d352d',
    GROUND_DARK: '#1f2a1f',
    PLAYER: '#5d7a4d',
    PLAYER_DARK: '#3d5a2d',
    ENEMY: '#7a4d4d',
    ENEMY_DARK: '#5a2d2d',
    BUNKER: '#4a4a3a',
    MINE: '#5a3a3a',
    BOSS_APC: '#6b5a4a',
    BOSS_MORTAR: '#5a4a5a',
    BOSS_TANK: '#4a5a6b',
    BULLET: '#ffd700',
    ENEMY_BULLET: '#ff6b6b',
    HEALTH_PACK: '#8bbd6a',
    AMMO_PACK: '#d4a855',
    PARTICLE_MUZZLE: ['#ffd700', '#ffaa00', '#ff6600'],
    PARTICLE_SHELL: ['#b87333', '#8b4513', '#654321'],
    PARTICLE_BLOOD: ['#8b0000', '#cc0000', '#ff3333'],
    PARTICLE_EXPLOSION: ['#ff6600', '#ffaa00', '#ffff00', '#ffffff']
};

let game = null;

class Particle {
    constructor(x, y, colors, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 10;
        this.vy = options.vy || (Math.random() - 0.5) * 10 - 2;
        this.life = options.life || 30;
        this.maxLife = this.life;
        this.size = options.size || Math.random() * 4 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.gravity = options.gravity !== undefined ? options.gravity : 0.2;
        this.friction = options.friction || 0.98;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, colors, count, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, colors, options));
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

class Bullet {
    constructor(x, y, angle, isEnemy = false, damage = 10) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.vx = Math.cos(angle) * CONFIG.BULLET_SPEED * (isEnemy ? 0.7 : 1);
        this.vy = Math.sin(angle) * CONFIG.BULLET_SPEED * (isEnemy ? 0.7 : 1);
        this.isEnemy = isEnemy;
        this.damage = damage;
        this.radius = isEnemy ? 4 : 3;
        this.active = true;
    }

    update(worldOffset) {
        this.x += this.vx;
        this.y += this.vy;
        
        const screenX = this.x - worldOffset;
        if (screenX < -100 || screenX > CONFIG.CANVAS_WIDTH + 100 || this.y > CONFIG.CANVAS_HEIGHT) {
            this.active = false;
        }
    }

    draw(ctx, worldOffset) {
        const screenX = this.x - worldOffset;
        ctx.save();
        ctx.fillStyle = this.isEnemy ? COLORS.ENEMY_BULLET : COLORS.BULLET;
        ctx.shadowColor = this.isEnemy ? '#ff0000' : '#ffd700';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(screenX, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.health = CONFIG.MAX_HEALTH;
        this.ammo = CONFIG.MAG_SIZE;
        this.totalAmmo = CONFIG.TOTAL_AMMO;
        this.kills = 0;
        this.distance = 0;
        this.playTime = 0;
        
        this.aimAngle = 0;
        this.facing = 1;
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        this.invincible = false;
        this.invincibleTime = 0;
        
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(keys, mouseX, mouseY, worldOffset) {
        this.vx = 0;
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.vx = -CONFIG.PLAYER_SPEED;
            this.facing = -1;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.vx = CONFIG.PLAYER_SPEED;
            this.facing = 1;
        }
        
        if ((keys['KeyW'] || keys['ArrowUp'] || keys['Space']) && this.onGround) {
            this.vy = CONFIG.JUMP_FORCE;
            this.onGround = false;
        }
        
        this.vy += CONFIG.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        
        const groundLevel = CONFIG.GROUND_Y - this.height;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.vy = 0;
            this.onGround = true;
        }
        
        if (this.x < worldOffset) {
            this.x = worldOffset;
        }
        
        const screenX = this.x - worldOffset + this.width / 2;
        this.aimAngle = Math.atan2(mouseY - (this.y + this.height * 0.3), mouseX - screenX);
        
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animTimer = 0;
            if (this.vx !== 0) {
                this.animFrame = (this.animFrame + 1) % 4;
            } else {
                this.animFrame = 0;
            }
        }
        
        if (this.invincible) {
            this.invincibleTime--;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }
        
        this.distance = Math.floor((this.x - 200) / 10);
    }

    shoot(particles, worldOffset) {
        const now = Date.now();
        if (this.isReloading || this.ammo <= 0 || now - this.lastFireTime < CONFIG.FIRE_RATE) {
            return null;
        }
        
        this.lastFireTime = now;
        this.ammo--;
        
        const gunOffsetX = Math.cos(this.aimAngle) * 30;
        const gunOffsetY = Math.sin(this.aimAngle) * 30;
        const muzzleX = this.x + this.width / 2 + gunOffsetX;
        const muzzleY = this.y + this.height * 0.3 + gunOffsetY;
        
        particles.emit(muzzleX - worldOffset, muzzleY, COLORS.PARTICLE_MUZZLE, 8, {
            vx: Math.cos(this.aimAngle) * 8,
            vy: Math.sin(this.aimAngle) * 8,
            life: 10,
            size: 6,
            gravity: 0
        });
        
        particles.emit(muzzleX - worldOffset + 10, muzzleY, COLORS.PARTICLE_SHELL, 3, {
            vx: 2 + Math.random() * 2,
            vy: -3 - Math.random() * 3,
            life: 60,
            size: 4,
            gravity: 0.3
        });
        
        return new Bullet(muzzleX, muzzleY, this.aimAngle, false, 25);
    }

    reload() {
        if (this.isReloading || this.ammo === CONFIG.MAG_SIZE || this.totalAmmo <= 0) {
            return false;
        }
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        return true;
    }

    updateReload() {
        if (!this.isReloading) return;
        
        const elapsed = Date.now() - this.reloadStartTime;
        const progress = Math.min(elapsed / CONFIG.RELOAD_TIME, 1);
        
        document.getElementById('reloadBar').style.width = (progress * 100) + '%';
        
        if (elapsed >= CONFIG.RELOAD_TIME) {
            const needed = CONFIG.MAG_SIZE - this.ammo;
            const toLoad = Math.min(needed, this.totalAmmo);
            this.ammo += toLoad;
            this.totalAmmo -= toLoad;
            this.isReloading = false;
            document.getElementById('reloadIndicator').classList.add('hidden');
        }
    }

    takeDamage(damage, particles) {
        if (this.invincible) return false;
        
        this.health -= damage;
        this.invincible = true;
        this.invincibleTime = 60;
        
        const screenX = this.x + this.width / 2 - game.worldOffset;
        particles.emit(screenX, this.y + this.height / 2, COLORS.PARTICLE_BLOOD, 15, {
            life: 30,
            size: 5
        });
        
        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, CONFIG.MAX_HEALTH);
    }

    addAmmo(amount) {
        this.totalAmmo += amount;
    }

    draw(ctx, worldOffset) {
        const screenX = this.x - worldOffset;
        
        ctx.save();
        
        if (this.invincible && Math.floor(this.invincibleTime / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.fillStyle = COLORS.PLAYER_DARK;
        const legOffset = this.vx !== 0 ? Math.sin(this.animFrame * Math.PI / 2) * 8 : 0;
        ctx.fillRect(screenX + 8, this.y + 40, 10, 20 - Math.abs(legOffset));
        ctx.fillRect(screenX + 22, this.y + 40, 10, 20 + legOffset);
        
        ctx.fillStyle = COLORS.PLAYER;
        ctx.fillRect(screenX + 5, this.y + 15, 30, 30);
        
        ctx.fillStyle = '#d4c4a8';
        ctx.beginPath();
        ctx.arc(screenX + 20, this.y + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(screenX + 10, this.y + 2, 20, 8);
        
        ctx.save();
        ctx.translate(screenX + 20, this.y + 25);
        ctx.rotate(this.aimAngle);
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, -4, 35, 8);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(5, -2, 25, 4);
        ctx.restore();
        
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.health = 30;
        this.maxHealth = 30;
        this.damage = 10;
        this.speed = 1.5;
        this.lastFireTime = 0;
        this.fireRate = 1500;
        this.detectRange = 500;
        this.patrolDir = Math.random() > 0.5 ? 1 : -1;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(player, worldOffset) {
        const dist = player.x - this.x;
        const screenX = this.x - worldOffset;
        
        if (Math.abs(dist) < this.detectRange) {
            this.patrolDir = dist > 0 ? 1 : -1;
            
            if (Math.abs(dist) > 150) {
                this.x += this.speed * this.patrolDir;
            }
            
            this.animTimer++;
            if (this.animTimer > 10) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
        }
        
        if (screenX > -100 && screenX < CONFIG.CANVAS_WIDTH + 100) {
            return this.tryShoot(player, worldOffset);
        }
        
        return null;
    }

    tryShoot(player, worldOffset) {
        const now = Date.now();
        const dist = Math.abs(player.x - this.x);
        
        if (dist < this.detectRange && now - this.lastFireTime > this.fireRate) {
            this.lastFireTime = now;
            
            const angle = Math.atan2(
                player.y + player.height / 2 - (this.y + 20),
                player.x + player.width / 2 - (this.x + 15)
            );
            
            return new Bullet(this.x + 15, this.y + 20, angle, true, this.damage);
        }
        return null;
    }

    takeDamage(damage, particles, worldOffset) {
        this.health -= damage;
        
        const screenX = this.x - worldOffset;
        particles.emit(screenX + 20, this.y + 20, COLORS.PARTICLE_BLOOD, 10, {
            life: 25,
            size: 4
        });
        
        if (this.health <= 0) {
            this.active = false;
            particles.emit(screenX + 20, this.y + 30, COLORS.PARTICLE_BLOOD, 20, {
                life: 40,
                size: 6
            });
            return true;
        }
        return false;
    }

    draw(ctx, worldOffset) {
        const screenX = this.x - worldOffset;
        
        ctx.save();
        
        ctx.fillStyle = COLORS.ENEMY_DARK;
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 5;
        ctx.fillRect(screenX + 5, this.y + 35, 8, 15 - legOffset);
        ctx.fillRect(screenX + 17, this.y + 35, 8, 15 + legOffset);
        
        ctx.fillStyle = COLORS.ENEMY;
        ctx.fillRect(screenX + 3, this.y + 12, 24, 25);
        
        ctx.fillStyle = '#c4a484';
        ctx.beginPath();
        ctx.arc(screenX + 15, this.y + 8, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(screenX + 7, this.y + 2, 16, 6);
        
        const gunDir = this.patrolDir;
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(screenX + 15, this.y + 18, gunDir * 25, 5);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, this.y - 10, 30, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#5d8b4a' : healthPercent > 0.25 ? '#d4a855' : '#cc5555';
        ctx.fillRect(screenX, this.y - 10, 30 * healthPercent, 4);
        
        ctx.restore();
    }
}

class Bunker {
    constructor(x) {
        this.x = x;
        this.y = CONFIG.GROUND_Y - 80;
        this.width = 100;
        this.height = 80;
        this.active = true;
        this.health = 100;
        this.maxHealth = 100;
        this.lastFireTime = 0;
        this.fireRate = 800;
        this.detectRange = 600;
    }

    update(player, worldOffset) {
        const dist = player.x - this.x;
        const screenX = this.x - worldOffset;
        
        if (screenX > -150 && screenX < CONFIG.CANVAS_WIDTH + 150) {
            return this.tryShoot(player);
        }
        return null;
    }

    tryShoot(player) {
        const now = Date.now();
        const dist = player.x - this.x;
        
        if (dist > 0 && dist < this.detectRange && now - this.lastFireTime > this.fireRate) {
            this.lastFireTime = now;
            
            const angle = Math.atan2(
                player.y + player.height / 2 - (this.y + 25),
                player.x + player.width / 2 - (this.x + this.width - 10)
            );
            
            return new Bullet(this.x + this.width - 10, this.y + 25, angle, true, 15);
        }
        return null;
    }

    takeDamage(damage, particles, worldOffset) {
        this.health -= damage;
        
        const screenX = this.x - worldOffset;
        particles.emit(screenX + this.width / 2, this.y + this.height / 2, COLORS.PARTICLE_EXPLOSION, 5, {
            life: 20,
            size: 4
        });
        
        if (this.health <= 0) {
            this.active = false;
            particles.emit(screenX + this.width / 2, this.y + this.height / 2, COLORS.PARTICLE_EXPLOSION, 30, {
                life: 50,
                size: 8
            });
            return true;
        }
        return false;
    }

    draw(ctx, worldOffset) {
        const screenX = this.x - worldOffset;
        
        ctx.save();
        
        ctx.fillStyle = COLORS.BUNKER;
        ctx.fillRect(screenX, this.y + 20, this.width, this.height - 20);
        
        ctx.fillStyle = '#3a3a2a';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(screenX + i * 20, this.y + 20, 18, 15);
        }
        
        ctx.fillStyle = '#2a2a1a';
        ctx.fillRect(screenX + this.width - 30, this.y + 15, 30, 25);
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(screenX + this.width - 10, this.y + 25, 15, 8);
        
        ctx.fillStyle = '#3a3a2a';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(screenX + 10 + i * 22, this.y + 45, 15, 30);
        }
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX, this.y - 15, this.width, 6);
        ctx.fillStyle = healthPercent > 0.5 ? '#5d8b4a' : healthPercent > 0.25 ? '#d4a855' : '#cc5555';
        ctx.fillRect(screenX, this.y - 15, this.width * healthPercent, 6);
        
        ctx.restore();
    }
}

class Mine {
    constructor(x) {
        this.x = x;
        this.y = CONFIG.GROUND_Y - 15;
        this.width = 30;
        this.height = 15;
        this.active = true;
        this.damage = 50;
        this.triggerRange = 40;
        this.exploded = false;
    }

    update(player, particles, worldOffset) {
        if (!this.active || this.exploded) return;
        
        const dist = Math.abs(player.x + player.width / 2 - (this.x + this.width / 2));
        const playerY = player.y + player.height;
        
        if (dist < this.triggerRange && playerY >= this.y - 10) {
            this.explode(particles, worldOffset);
            player.takeDamage(this.damage, particles);
        }
    }

    explode(particles, worldOffset) {
        this.exploded = true;
        this.active = false;
        
        const screenX = this.x - worldOffset;
        particles.emit(screenX + this.width / 2, this.y, COLORS.PARTICLE_EXPLOSION, 40, {
            life: 60,
            size: 10,
            vx: (Math.random() - 0.5) * 20,
            vy: -Math.random() * 15 - 5,
            gravity: 0.3
        });
    }

    draw(ctx, worldOffset) {
        if (this.exploded) return;
        
        const screenX = this.x - worldOffset;
        
        ctx.save();
        
        ctx.fillStyle = COLORS.MINE;
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2, this.y + 5, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#7a4a4a';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, this.y - 2, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Boss {
    constructor(x, type) {
        this.x = x;
        this.type = type;
        this.active = true;
        this.phase = 1;
        this.lastFireTime = 0;
        this.lastSpecialTime = 0;
        this.animTimer = 0;
        
        this.config = this.getConfig();
        this.health = this.config.maxHealth;
        this.maxHealth = this.config.maxHealth;
        this.y = CONFIG.GROUND_Y - this.config.height;
    }

    getConfig() {
        switch(this.type) {
            case 'apc':
                return {
                    name: '装甲运输车',
                    width: 120,
                    height: 70,
                    maxHealth: 300,
                    fireRate: 400,
                    specialRate: 3000,
                    damage: 12,
                    color: COLORS.BOSS_APC,
                    specialCount: 3
                };
            case 'mortar':
                return {
                    name: '迫击炮阵地',
                    width: 100,
                    height: 90,
                    maxHealth: 400,
                    fireRate: 2000,
                    specialRate: 5000,
                    damage: 30,
                    color: COLORS.BOSS_MORTAR,
                    specialCount: 5
                };
            case 'tank':
                return {
                    name: '主战坦克',
                    width: 150,
                    height: 80,
                    maxHealth: 600,
                    fireRate: 600,
                    specialRate: 4000,
                    damage: 20,
                    color: COLORS.BOSS_TANK,
                    specialCount: 8
                };
            default:
                return {
                    name: 'BOSS',
                    width: 100,
                    height: 80,
                    maxHealth: 300,
                    fireRate: 500,
                    specialRate: 3000,
                    damage: 15,
                    color: '#666',
                    specialCount: 3
                };
        }
    }

    update(player, worldOffset) {
        this.animTimer++;
        const bullets = [];
        
        const now = Date.now();
        
        if (now - this.lastFireTime > this.config.fireRate) {
            this.lastFireTime = now;
            bullets.push(this.fire(player));
        }
        
        if (now - this.lastSpecialTime > this.config.specialRate) {
            this.lastSpecialTime = now;
            for (let i = 0; i < this.config.specialCount; i++) {
                setTimeout(() => {
                    if (this.active) {
                        this.fireSpecial(player, worldOffset);
                    }
                }, i * 200);
            }
        }
        
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent <= 0.3 && this.phase === 1) {
            this.phase = 2;
            this.config.fireRate *= 0.7;
            this.config.specialRate *= 0.8;
        }
        
        return bullets.filter(b => b !== null);
    }

    fire(player) {
        const gunX = this.x + this.config.width - 20;
        const gunY = this.y + this.config.height * 0.4;
        
        const angle = Math.atan2(
            player.y + player.height / 2 - gunY,
            player.x + player.width / 2 - gunX
        );
        
        return new Bullet(gunX, gunY, angle, true, this.config.damage);
    }

    fireSpecial(player, worldOffset) {
        if (!this.active) return;
        
        const centerX = this.x + this.config.width / 2;
        const centerY = this.y + this.config.height / 2;
        
        if (this.type === 'apc') {
            for (let i = -2; i <= 2; i++) {
                const angle = Math.atan2(
                    player.y + player.height / 2 - centerY,
                    player.x + player.width / 2 - centerX
                ) + i * 0.2;
                game.bullets.push(new Bullet(centerX, centerY, angle, true, 10));
            }
        } else if (this.type === 'mortar') {
            const angle = Math.atan2(
                player.y + player.height / 2 - centerY,
                player.x + player.width / 2 - centerX
            );
            game.bullets.push(new Bullet(centerX, centerY, angle - 0.5, true, 25));
            game.bullets.push(new Bullet(centerX, centerY, angle, true, 30));
            game.bullets.push(new Bullet(centerX, centerY, angle + 0.5, true, 25));
        } else if (this.type === 'tank') {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                game.bullets.push(new Bullet(centerX, centerY, angle, true, 15));
            }
        }
        
        game.particles.emit(centerX - worldOffset, centerY, COLORS.PARTICLE_EXPLOSION, 15, {
            life: 30,
            size: 6
        });
    }

    takeDamage(damage, particles, worldOffset) {
        this.health -= damage;
        
        const screenX = this.x - worldOffset;
        particles.emit(screenX + this.config.width / 2, this.y + this.config.height / 2, COLORS.PARTICLE_EXPLOSION, 8, {
            life: 25,
            size: 5
        });
        
        if (this.health <= 0) {
            this.active = false;
            particles.emit(screenX + this.config.width / 2, this.y + this.config.height / 2, COLORS.PARTICLE_EXPLOSION, 50, {
                life: 80,
                size: 12,
                vx: (Math.random() - 0.5) * 25,
                vy: -Math.random() * 20 - 8,
                gravity: 0.2
            });
            return true;
        }
        return false;
    }

    draw(ctx, worldOffset) {
        const screenX = this.x - worldOffset;
        
        ctx.save();
        
        if (this.type === 'apc') {
            this.drawAPC(ctx, screenX);
        } else if (this.type === 'mortar') {
            this.drawMortar(ctx, screenX);
        } else if (this.type === 'tank') {
            this.drawTank(ctx, screenX);
        }
        
        ctx.restore();
    }

    drawAPC(ctx, screenX) {
        ctx.fillStyle = this.config.color;
        ctx.fillRect(screenX, this.y + 15, this.config.width, this.config.height - 25);
        
        ctx.fillStyle = '#4a3a2a';
        ctx.beginPath();
        ctx.ellipse(screenX + 25, this.y + this.config.height - 10, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(screenX + 95, this.y + this.config.height - 10, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(screenX + 30, this.y, 60, 25);
        
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(screenX + 55, this.y + 5, 55, 8);
        
        ctx.fillStyle = '#2a2a2a';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(screenX + 10 + i * 30, this.y + 20, 20, 25);
        }
    }

    drawMortar(ctx, screenX) {
        ctx.fillStyle = '#3a3a2a';
        ctx.fillRect(screenX, this.y + 50, this.config.width, 40);
        
        ctx.fillStyle = '#5a4a5a';
        ctx.beginPath();
        ctx.arc(screenX + this.config.width / 2, this.y + 45, 35, 0, Math.PI * 2);
        ctx.fill();
        
        const recoil = Math.sin(this.animTimer * 0.3) * 5;
        ctx.save();
        ctx.translate(screenX + this.config.width / 2, this.y + 35);
        ctx.rotate(-0.5 + recoil * 0.02);
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, -8, 60, 16);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(5, -4, 50, 8);
        ctx.restore();
        
        ctx.fillStyle = '#4a4a3a';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(screenX + 10 + i * 25, this.y + 50);
            ctx.lineTo(screenX + 20 + i * 25, this.y + 30);
            ctx.lineTo(screenX + 30 + i * 25, this.y + 50);
            ctx.fill();
        }
    }

    drawTank(ctx, screenX) {
        ctx.fillStyle = '#3a4a3a';
        ctx.fillRect(screenX + 10, this.y + 50, this.config.width - 20, 30);
        
        ctx.fillStyle = '#2a3a2a';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(screenX + 25 + i * 20, this.y + this.config.height - 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = this.config.color;
        ctx.fillRect(screenX + 5, this.y + 20, this.config.width - 10, 35);
        
        ctx.fillStyle = '#3a5a6b';
        ctx.beginPath();
        ctx.arc(screenX + this.config.width / 2, this.y + 25, 30, 0, Math.PI * 2);
        ctx.fill();
        
        const turretAngle = Math.sin(this.animTimer * 0.05) * 0.3;
        ctx.save();
        ctx.translate(screenX + this.config.width / 2, this.y + 25);
        ctx.rotate(turretAngle);
        ctx.fillStyle = '#2a3a4a';
        ctx.fillRect(0, -6, 70, 12);
        ctx.fillStyle = '#4a5a6b';
        ctx.fillRect(5, -3, 60, 6);
        ctx.restore();
        
        ctx.fillStyle = '#2a4a3a';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(screenX + 15 + i * 30, this.y + 25, 20, 25);
        }
    }
}

class Pickup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 25;
        this.height = 25;
        this.active = true;
        this.vy = -5;
        this.bounceCount = 0;
        this.animTimer = 0;
    }

    update(player, worldOffset) {
        this.animTimer++;
        
        this.vy += 0.3;
        this.y += this.vy;
        
        if (this.y > CONFIG.GROUND_Y - this.height) {
            this.y = CONFIG.GROUND_Y - this.height;
            if (this.bounceCount < 2) {
                this.vy = -this.vy * 0.5;
                this.bounceCount++;
            } else {
                this.vy = 0;
            }
        }
        
        const dist = Math.sqrt(
            Math.pow(player.x + player.width / 2 - (this.x + this.width / 2), 2) +
            Math.pow(player.y + player.height / 2 - (this.y + this.height / 2), 2)
        );
        
        if (dist < 40) {
            this.collect(player);
            return true;
        }
        
        return false;
    }

    collect(player) {
        this.active = false;
        
        if (this.type === 'health') {
            player.heal(30);
        } else if (this.type === 'ammo') {
            player.addAmmo(30);
        }
    }

    draw(ctx, worldOffset) {
        const screenX = this.x - worldOffset;
        const bobOffset = Math.sin(this.animTimer * 0.1) * 3;
        
        ctx.save();
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.type === 'health' ? COLORS.HEALTH_PACK : COLORS.AMMO_PACK;
        
        ctx.fillStyle = this.type === 'health' ? COLORS.HEALTH_PACK : COLORS.AMMO_PACK;
        ctx.fillRect(screenX, this.y + bobOffset, this.width, this.height);
        
        ctx.fillStyle = '#fff';
        if (this.type === 'health') {
            ctx.fillRect(screenX + 10, this.y + 4 + bobOffset, 5, 17);
            ctx.fillRect(screenX + 4, this.y + 10 + bobOffset, 17, 5);
        } else {
            ctx.fillRect(screenX + 5, this.y + 5 + bobOffset, 5, 15);
            ctx.fillRect(screenX + 12, this.y + 5 + bobOffset, 5, 15);
            ctx.fillRect(screenX + 19, this.y + 5 + bobOffset, 5, 15);
        }
        
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        
        this.state = GameState.MENU;
        this.player = null;
        this.enemies = [];
        this.bunkers = [];
        this.mines = [];
        this.bullets = [];
        this.pickups = [];
        this.bosses = [];
        this.particles = new ParticleSystem();
        
        this.worldOffset = 0;
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        
        this.playerId = null;
        this.playerName = '';
        this.saveId = null;
        this.lastCheckpoint = 0;
        this.gameStartTime = 0;
        
        this.currentBoss = null;
        this.bossSpawned = { 300: false, 600: false, 900: false };
        
        this.setupEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyR' && this.state === GameState.PLAYING) {
                if (this.player.reload()) {
                    document.getElementById('reloadIndicator').classList.remove('hidden');
                    document.getElementById('reloadBar').style.width = '0%';
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseDown = true;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
            }
        });
        
        window.addEventListener('resize', () => {
            CONFIG.CANVAS_WIDTH = window.innerWidth;
            CONFIG.CANVAS_HEIGHT = window.innerHeight;
            CONFIG.GROUND_Y = window.innerHeight - 100;
            this.canvas.width = CONFIG.CANVAS_WIDTH;
            this.canvas.height = CONFIG.CANVAS_HEIGHT;
        });
    }

    async registerPlayer(name) {
        try {
            const response = await fetch(`${API_BASE}/game/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_name: name })
            });
            const data = await response.json();
            if (data.code === 0) {
                this.playerId = data.data.id;
                this.playerName = data.data.player_name;
                return true;
            }
        } catch (e) {
            console.error('Register error:', e);
        }
        return false;
    }

    async startNewGame() {
        try {
            const response = await fetch(`${API_BASE}/game/newgame?player_id=${this.playerId}`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.code === 0) {
                this.saveId = data.data.save_id;
                return true;
            }
        } catch (e) {
            console.error('New game error:', e);
        }
        return false;
    }

    async saveCheckpoint(distance) {
        if (this.saveId === null) return;
        
        try {
            await fetch(`${API_BASE}/game/checkpoint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId,
                    game_save_id: this.saveId,
                    checkpoint_distance: distance,
                    arrival_time: this.getPlayTime(),
                    kills_at_checkpoint: this.player.kills,
                    health_at_checkpoint: this.player.health,
                    current_ammo: this.player.ammo,
                    current_total_ammo: this.player.totalAmmo
                })
            });
            
            this.showCheckpointSave();
        } catch (e) {
            console.error('Save checkpoint error:', e);
        }
    }

    async completeGame(victory) {
        if (this.saveId === null) return null;
        
        try {
            const response = await fetch(`${API_BASE}/game/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId,
                    game_save_id: this.saveId,
                    total_time: this.getPlayTime(),
                    total_kills: this.player.kills
                })
            });
            const data = await response.json();
            return data.data;
        } catch (e) {
            console.error('Complete game error:', e);
            return null;
        }
    }

    async getLeaderboard() {
        try {
            const response = await fetch(`${API_BASE}/game/leaderboard/get`);
            const data = await response.json();
            return data.data;
        } catch (e) {
            console.error('Get leaderboard error:', e);
            return { items: [], total: 0 };
        }
    }

    initGame() {
        this.player = new Player(200, CONFIG.GROUND_Y - 60);
        this.enemies = [];
        this.bunkers = [];
        this.mines = [];
        this.bullets = [];
        this.pickups = [];
        this.bosses = [];
        this.particles = new ParticleSystem();
        this.worldOffset = 0;
        this.lastCheckpoint = 0;
        this.gameStartTime = Date.now();
        this.currentBoss = null;
        this.bossSpawned = { 300: false, 600: false, 900: false };
        
        this.spawnInitialContent();
        
        document.getElementById('bossHealthBar').classList.add('hidden');
    }

    spawnInitialContent() {
        for (let i = 100; i < CONFIG.GAME_LENGTH; i += 50 + Math.random() * 50) {
            if (Math.random() > 0.5 && !this.isBossZone(i)) {
                this.enemies.push(new Enemy(i * 10, CONFIG.GROUND_Y - 60, 'infantry'));
            }
        }
        
        for (let i = 150; i < CONFIG.GAME_LENGTH; i += 150 + Math.random() * 100) {
            if (!this.isBossZone(i)) {
                this.bunkers.push(new Bunker(i * 10));
            }
        }
        
        for (let i = 80; i < CONFIG.GAME_LENGTH; i += 80 + Math.random() * 60) {
            if (Math.random() > 0.6 && !this.isBossZone(i)) {
                this.mines.push(new Mine(i * 10));
            }
        }
    }

    isBossZone(distance) {
        return (distance >= 290 && distance <= 310) ||
               (distance >= 590 && distance <= 610) ||
               (distance >= 890 && distance <= 910);
    }

    spawnBoss(distance) {
        let type = '';
        if (distance >= 290 && distance <= 310 && !this.bossSpawned[300]) {
            type = 'apc';
            this.bossSpawned[300] = true;
        } else if (distance >= 590 && distance <= 610 && !this.bossSpawned[600]) {
            type = 'mortar';
            this.bossSpawned[600] = true;
        } else if (distance >= 890 && distance <= 910 && !this.bossSpawned[900]) {
            type = 'tank';
            this.bossSpawned[900] = true;
        }
        
        if (type) {
            const boss = new Boss(this.player.x + CONFIG.CANVAS_WIDTH - 100, type);
            this.bosses.push(boss);
            this.currentBoss = boss;
            
            document.getElementById('bossName').textContent = boss.config.name;
            document.getElementById('bossHealthBar').classList.remove('hidden');
            
            return true;
        }
        return false;
    }

    getPlayTime() {
        return (Date.now() - this.gameStartTime) / 1000;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showCheckpointSave() {
        const el = document.getElementById('checkpointSave');
        el.classList.remove('hidden');
        setTimeout(() => {
            el.classList.add('hidden');
        }, 2000);
    }

    update() {
        if (this.state !== GameState.PLAYING) return;
        
        const player = this.player;
        
        player.update(this.keys, this.mouseX, this.mouseY, this.worldOffset);
        player.updateReload();
        
        if (this.mouseDown && !player.isReloading) {
            const bullet = player.shoot(this.particles, this.worldOffset);
            if (bullet) {
                this.bullets.push(bullet);
            }
        }
        
        const targetOffset = player.x - CONFIG.CANVAS_WIDTH * 0.3;
        this.worldOffset = Math.max(0, targetOffset);
        
        const currentDistance = player.distance;
        if (currentDistance > this.lastCheckpoint && currentDistance % CONFIG.CHECKPOINT_INTERVAL === 0) {
            this.lastCheckpoint = currentDistance;
            this.saveCheckpoint(currentDistance);
        }
        
        this.spawnBoss(currentDistance);
        
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            const bullet = enemy.update(player, this.worldOffset);
            if (bullet) this.bullets.push(bullet);
        });
        
        this.bunkers.forEach(bunker => {
            if (!bunker.active) return;
            const bullet = bunker.update(player, this.worldOffset);
            if (bullet) this.bullets.push(bullet);
        });
        
        this.mines.forEach(mine => {
            mine.update(player, this.particles, this.worldOffset);
        });
        
        this.bosses.forEach(boss => {
            if (!boss.active) return;
            const bullets = boss.update(player, this.worldOffset);
            bullets.forEach(b => this.bullets.push(b));
        });
        
        this.pickups = this.pickups.filter(pickup => {
            if (!pickup.active) return false;
            return !pickup.update(player, this.worldOffset);
        });
        
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet.active) return false;
            bullet.update(this.worldOffset);
            
            if (!bullet.isEnemy) {
                for (let enemy of this.enemies) {
                    if (!enemy.active) continue;
                    const dist = Math.sqrt(
                        Math.pow(bullet.x - (enemy.x + 15), 2) +
                        Math.pow(bullet.y - (enemy.y + 25), 2)
                    );
                    if (dist < 25) {
                        if (enemy.takeDamage(bullet.damage, this.particles, this.worldOffset)) {
                            player.kills++;
                            this.tryDropPickup(enemy.x + 15, enemy.y);
                        }
                        bullet.active = false;
                        return false;
                    }
                }
                
                for (let bunker of this.bunkers) {
                    if (!bunker.active) continue;
                    if (bullet.x > bunker.x && bullet.x < bunker.x + bunker.width &&
                        bullet.y > bunker.y && bullet.y < bunker.y + bunker.height) {
                        if (bunker.takeDamage(bullet.damage, this.particles, this.worldOffset)) {
                            player.kills++;
                            this.tryDropPickup(bunker.x + bunker.width / 2, bunker.y + 20, 0.8);
                        }
                        bullet.active = false;
                        return false;
                    }
                }
                
                for (let boss of this.bosses) {
                    if (!boss.active) continue;
                    if (bullet.x > boss.x && bullet.x < boss.x + boss.config.width &&
                        bullet.y > boss.y && bullet.y < boss.y + boss.config.height) {
                        if (boss.takeDamage(bullet.damage, this.particles, this.worldOffset)) {
                            player.kills++;
                            this.currentBoss = null;
                            document.getElementById('bossHealthBar').classList.add('hidden');
                            this.tryDropPickup(boss.x + boss.config.width / 2, boss.y + 30, 1, 2);
                        }
                        bullet.active = false;
                        return false;
                    }
                }
            } else {
                const dist = Math.sqrt(
                    Math.pow(bullet.x - (player.x + player.width / 2), 2) +
                    Math.pow(bullet.y - (player.y + player.height / 2), 2)
                );
                if (dist < 30) {
                    if (player.takeDamage(bullet.damage, this.particles)) {
                        this.gameOver(false);
                    }
                    bullet.active = false;
                    return false;
                }
            }
            
            return bullet.active;
        });
        
        this.enemies = this.enemies.filter(e => e.active);
        this.bunkers = this.bunkers.filter(b => b.active);
        this.mines = this.mines.filter(m => m.active);
        this.bosses = this.bosses.filter(b => b.active);
        
        this.particles.update();
        
        this.updateUI();
        
        if (player.distance >= CONFIG.GAME_LENGTH) {
            this.gameOver(true);
        }
    }

    tryDropPickup(x, y, chance = 0.3, count = 1) {
        for (let i = 0; i < count; i++) {
            if (Math.random() < chance) {
                const type = Math.random() > 0.5 ? 'health' : 'ammo';
                this.pickups.push(new Pickup(x + (i - count / 2) * 30, y, type));
            }
        }
    }

    updateUI() {
        const player = this.player;
        
        document.getElementById('healthBar').style.width = (player.health / CONFIG.MAX_HEALTH * 100) + '%';
        document.getElementById('healthText').textContent = `${player.health}/${CONFIG.MAX_HEALTH}`;
        document.getElementById('ammoCurrent').textContent = player.ammo;
        document.getElementById('ammoTotal').textContent = player.totalAmmo;
        document.getElementById('distanceText').textContent = player.distance;
        document.getElementById('killsText').textContent = player.kills;
        document.getElementById('timeText').textContent = this.formatTime(this.getPlayTime());
        
        const nextCheckpoint = Math.ceil(player.distance / CONFIG.CHECKPOINT_INTERVAL) * CONFIG.CHECKPOINT_INTERVAL;
        const progress = ((player.distance % CONFIG.CHECKPOINT_INTERVAL) / CONFIG.CHECKPOINT_INTERVAL * 100).toFixed(0);
        document.getElementById('checkpointIndicator').textContent = `下一检查点: ${nextCheckpoint}米 (${progress}%)`;
        
        if (this.currentBoss && this.currentBoss.active) {
            const healthPercent = this.currentBoss.health / this.currentBoss.maxHealth * 100;
            document.getElementById('bossHealthFill').style.width = healthPercent + '%';
        }
    }

    draw() {
        const ctx = this.ctx;
        
        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        this.drawBackground();
        this.drawGround();
        
        this.mines.forEach(mine => mine.draw(ctx, this.worldOffset));
        this.pickups.forEach(pickup => pickup.draw(ctx, this.worldOffset));
        
        this.enemies.forEach(enemy => enemy.draw(ctx, this.worldOffset));
        this.bunkers.forEach(bunker => bunker.draw(ctx, this.worldOffset));
        this.bosses.forEach(boss => boss.draw(ctx, this.worldOffset));
        
        if (this.player) {
            this.player.draw(ctx, this.worldOffset);
        }
        
        this.bullets.forEach(bullet => bullet.draw(ctx, this.worldOffset));
        this.particles.draw(ctx);
        
        this.drawCrosshair();
    }

    drawBackground() {
        const ctx = this.ctx;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#2a352a');
        gradient.addColorStop(0.5, '#1f2a1f');
        gradient.addColorStop(1, '#1a1f1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        ctx.fillStyle = '#2a352a';
        for (let i = 0; i < 5; i++) {
            const x = (i * 300 - this.worldOffset * 0.1) % (CONFIG.CANVAS_WIDTH + 300) - 150;
            ctx.beginPath();
            ctx.moveTo(x, CONFIG.GROUND_Y - 100);
            ctx.lineTo(x + 150, CONFIG.GROUND_Y - 200);
            ctx.lineTo(x + 300, CONFIG.GROUND_Y - 100);
            ctx.fill();
        }
        
        ctx.fillStyle = '#334033';
        for (let i = 0; i < 10; i++) {
            const x = (i * 150 - this.worldOffset * 0.3) % (CONFIG.CANVAS_WIDTH + 150) - 75;
            ctx.fillRect(x, CONFIG.GROUND_Y - 60, 20, 60);
        }
        
        ctx.fillStyle = '#3d4a3d';
        for (let i = 0; i < 20; i++) {
            const x = (i * 80 - this.worldOffset * 0.5) % (CONFIG.CANVAS_WIDTH + 80) - 40;
            ctx.beginPath();
            ctx.arc(x, CONFIG.GROUND_Y - 5, 8, Math.PI, 0);
            ctx.fill();
        }
    }

    drawGround() {
        const ctx = this.ctx;
        
        ctx.fillStyle = COLORS.GROUND;
        ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);
        
        ctx.fillStyle = COLORS.GROUND_DARK;
        for (let i = 0; i < CONFIG.CANVAS_WIDTH; i += 50) {
            const x = (i - this.worldOffset % 50);
            ctx.fillRect(x, CONFIG.GROUND_Y, 25, 5);
        }
        
        ctx.strokeStyle = '#4a5a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, CONFIG.GROUND_Y);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.GROUND_Y);
        ctx.stroke();
        
        ctx.fillStyle = '#5a6a5a';
        const progress = this.player ? this.player.distance / CONFIG.GAME_LENGTH : 0;
        ctx.fillRect(50, 30, (CONFIG.CANVAS_WIDTH - 100) * progress, 8);
        
        ctx.strokeStyle = '#4a5a4a';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 30, CONFIG.CANVAS_WIDTH - 100, 8);
        
        ctx.fillStyle = '#8b9a6d';
        for (let i = 1; i < 10; i++) {
            const x = 50 + (CONFIG.CANVAS_WIDTH - 100) * (i / 10);
            ctx.fillRect(x - 1, 28, 2, 12);
        }
    }

    drawCrosshair() {
        const ctx = this.ctx;
        
        ctx.strokeStyle = 'rgba(200, 200, 150, 0.8)';
        ctx.lineWidth = 2;
        
        const size = 15;
        const gap = 5;
        
        ctx.beginPath();
        ctx.moveTo(this.mouseX - size, this.mouseY);
        ctx.lineTo(this.mouseX - gap, this.mouseY);
        ctx.moveTo(this.mouseX + gap, this.mouseY);
        ctx.lineTo(this.mouseX + size, this.mouseY);
        ctx.moveTo(this.mouseX, this.mouseY - size);
        ctx.lineTo(this.mouseX, this.mouseY - gap);
        ctx.moveTo(this.mouseX, this.mouseY + gap);
        ctx.lineTo(this.mouseX, this.mouseY + size);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.mouseX, this.mouseY, 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    async gameOver(victory) {
        this.state = victory ? GameState.VICTORY : GameState.GAME_OVER;
        
        const result = await this.completeGame(victory);
        
        const title = document.getElementById('gameOverTitle');
        title.textContent = victory ? '任务完成!' : '任务失败';
        title.className = victory ? 'victory' : '';
        
        document.getElementById('finalDistance').textContent = this.player.distance;
        document.getElementById('finalKills').textContent = this.player.kills;
        document.getElementById('finalTime').textContent = this.formatTime(this.getPlayTime());
        
        if (victory && result) {
            document.getElementById('rankText').classList.remove('hidden');
            document.getElementById('finalRank').textContent = result.rank || '-';
        } else {
            document.getElementById('rankText').classList.add('hidden');
        }
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    start() {
        this.state = GameState.PLAYING;
        this.initGame();
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('leaderboardScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    showMenu() {
        this.state = GameState.MENU;
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('leaderboardScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    async showLeaderboard() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('leaderboardScreen').classList.remove('hidden');
        
        const data = await this.getLeaderboard();
        const listEl = document.getElementById('leaderboardList');
        listEl.innerHTML = '';
        
        data.items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `leaderboard-item ${index < 3 ? 'top' + (index + 1) : ''}`;
            div.innerHTML = `
                <div class="rank-number">${item.rank}</div>
                <div class="player-info">
                    <div class="player-name">${item.player_name}</div>
                    <div class="player-stats">击杀: ${item.total_kills}</div>
                </div>
                <div class="player-time">${this.formatTime(item.total_time)}</div>
            `;
            listEl.appendChild(div);
        });
        
        if (data.items.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: #6b7a5d;">暂无记录</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    game.gameLoop();
    
    document.getElementById('startBtn').addEventListener('click', async () => {
        const nameInput = document.getElementById('playerName');
        const name = nameInput.value.trim();
        
        if (!name) {
            nameInput.focus();
            return;
        }
        
        if (await game.registerPlayer(name)) {
            if (await game.startNewGame()) {
                game.start();
            }
        }
    });
    
    document.getElementById('leaderboardBtn').addEventListener('click', () => {
        game.showLeaderboard();
    });
    
    document.getElementById('backBtn').addEventListener('click', () => {
        game.showMenu();
    });
    
    document.getElementById('restartBtn').addEventListener('click', async () => {
        if (await game.startNewGame()) {
            game.start();
        }
    });
    
    document.getElementById('menuBtn').addEventListener('click', () => {
        game.showMenu();
    });
});
