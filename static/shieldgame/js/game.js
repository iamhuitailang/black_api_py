const API_BASE = '/api';

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover',
    VICTORY: 'victory'
};

const CONFIG = {
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 500,
    GROUND_Y: 420,
    GRAVITY: 0.6,
    PLAYER_SPEED: 4,
    PLAYER_SPEED_BROKEN: 8,
    JUMP_FORCE: -12,
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 60,
    MAX_HP: 100,
    MAX_SHIELD: 80,
    SHIELD_BASH_DAMAGE: 25,
    SHIELD_BASH_COST: 10,
    SHIELD_BASH_KNOCKBACK: 80,
    SHIELD_SMASH_DAMAGE: 40,
    SHIELD_SMASH_COST: 25,
    SHIELD_SMASH_STUN: 3000,
    REPAIR_AMOUNT: 40,
    ATTACK_COOLDOWN: 500,
    SMASH_COOLDOWN: 1500
};

const LEVEL_CONFIG = [
    { level: 1, enemies: [{ type: 'normal', count: 4 }], hasShieldBreaker: false, hasArcher: false },
    { level: 2, enemies: [{ type: 'normal', count: 5 }], hasShieldBreaker: false, hasArcher: false },
    { level: 3, enemies: [{ type: 'normal', count: 6 }], hasShieldBreaker: false, hasArcher: false },
    { level: 4, enemies: [{ type: 'normal', count: 6 }, { type: 'shieldBreaker', count: 2 }], hasShieldBreaker: true, hasArcher: false },
    { level: 5, enemies: [{ type: 'normal', count: 7 }, { type: 'shieldBreaker', count: 3 }], hasShieldBreaker: true, hasArcher: false },
    { level: 6, enemies: [{ type: 'normal', count: 6 }, { type: 'shieldBreaker', count: 4 }], hasShieldBreaker: true, hasArcher: false },
    { level: 7, enemies: [{ type: 'normal', count: 5 }, { type: 'shieldBreaker', count: 3 }, { type: 'archer', count: 2 }], hasShieldBreaker: true, hasArcher: true },
    { level: 8, enemies: [{ type: 'normal', count: 6 }, { type: 'shieldBreaker', count: 4 }, { type: 'archer', count: 3 }], hasShieldBreaker: true, hasArcher: true }
];

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.vx = 0;
        this.vy = 0;
        this.hp = CONFIG.MAX_HP;
        this.maxHp = CONFIG.MAX_HP;
        this.shield = CONFIG.MAX_SHIELD;
        this.maxShield = CONFIG.MAX_SHIELD;
        this.shieldBroken = false;
        this.facing = 1;
        this.isBlocking = false;
        this.isJumping = false;
        this.isAttacking = false;
        this.attackType = null;
        this.attackTimer = 0;
        this.lastAttackTime = 0;
        this.lastSmashTime = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.onGround = true;
    }

    update(keys, game) {
        const speed = this.shieldBroken ? CONFIG.PLAYER_SPEED_BROKEN : CONFIG.PLAYER_SPEED;
        
        if (!this.isAttacking) {
            if (keys['KeyA'] || keys['ArrowLeft']) {
                this.vx = -speed;
                this.facing = -1;
            } else if (keys['KeyD'] || keys['ArrowRight']) {
                this.vx = speed;
                this.facing = 1;
            } else {
                this.vx = 0;
            }
        }

        if ((keys['KeyW'] || keys['ArrowUp']) && this.onGround && !this.isAttacking) {
            this.vy = CONFIG.JUMP_FORCE;
            this.onGround = false;
            this.isJumping = true;
        }

        this.isBlocking = !!(keys['KeyS'] || keys['ArrowDown']) && !this.shieldBroken && this.onGround && !this.isAttacking;
        
        if (this.isBlocking) {
            this.vx = 0;
        }

        this.vy += CONFIG.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.height >= CONFIG.GROUND_Y) {
            this.y = CONFIG.GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
            this.isJumping = false;
        }

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CONFIG.CANVAS_WIDTH) this.x = CONFIG.CANVAS_WIDTH - this.width;

        if (this.isAttacking) {
            this.attackTimer -= 16;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackType = null;
            }
        }

        if (this.invincible) {
            this.invincibleTimer -= 16;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    shieldBash(game) {
        const now = Date.now();
        if (this.shieldBroken || this.isAttacking || this.shield < CONFIG.SHIELD_BASH_COST) {
            return false;
        }
        if (now - this.lastAttackTime < CONFIG.ATTACK_COOLDOWN) {
            return false;
        }

        this.lastAttackTime = now;
        this.shield -= CONFIG.SHIELD_BASH_COST;
        this.isAttacking = true;
        this.attackType = 'bash';
        this.attackTimer = 300;
        game.shieldBashCount++;
        game.shieldDurabilityLost += CONFIG.SHIELD_BASH_COST;

        const attackX = this.facing === 1 ? this.x + this.width : this.x - 60;
        const attackWidth = 60;
        const attackHeight = this.height;

        game.enemies.forEach(enemy => {
            if (this._checkAttackHit(enemy, attackX, attackWidth, attackHeight)) {
                enemy.takeDamage(CONFIG.SHIELD_BASH_DAMAGE, this.facing * CONFIG.SHIELD_BASH_KNOCKBACK, 0, game);
                game.totalDamageDealt += CONFIG.SHIELD_BASH_DAMAGE;
            }
        });

        game.showDamageNumber(
            this.x + this.width / 2 + (this.facing * 30),
            this.y + 20,
            CONFIG.SHIELD_BASH_DAMAGE,
            'enemy-damage'
        );

        this._checkShieldBreak(game);
        return true;
    }

    shieldSmash(game) {
        const now = Date.now();
        if (this.shieldBroken || this.isAttacking || this.shield < CONFIG.SHIELD_SMASH_COST) {
            return false;
        }
        if (now - this.lastSmashTime < CONFIG.SMASH_COOLDOWN) {
            return false;
        }

        this.lastSmashTime = now;
        this.shield -= CONFIG.SHIELD_SMASH_COST;
        this.isAttacking = true;
        this.attackType = 'smash';
        this.attackTimer = 500;
        game.shieldSmashCount++;
        game.shieldDurabilityLost += CONFIG.SHIELD_SMASH_COST;

        const attackX = this.facing === 1 ? this.x + this.width : this.x - 80;
        const attackWidth = 80;
        const attackHeight = this.height + 20;

        game.enemies.forEach(enemy => {
            if (this._checkAttackHit(enemy, attackX, attackWidth, attackHeight)) {
                enemy.takeDamage(CONFIG.SHIELD_SMASH_DAMAGE, this.facing * 40, CONFIG.SHIELD_SMASH_STUN, game);
                game.totalDamageDealt += CONFIG.SHIELD_SMASH_DAMAGE;
            }
        });

        game.showDamageNumber(
            this.x + this.width / 2 + (this.facing * 40),
            this.y + 10,
            CONFIG.SHIELD_SMASH_DAMAGE,
            'enemy-damage'
        );

        this._checkShieldBreak(game);
        return true;
    }

    takeDamage(damage, fromDirection, game) {
        if (this.invincible) return 0;

        if (this.isBlocking && fromDirection === this.facing) {
            if (this.shield >= damage) {
                this.shield -= damage;
                game.shieldBlockCount++;
                game.totalDamageBlocked += damage;
                game.shieldDurabilityLost += damage;
                game.showDamageNumber(
                    this.x + this.width / 2,
                    this.y,
                    damage,
                    'blocked'
                );
                this._checkShieldBreak(game);
                return 0;
            } else {
                const remaining = damage - this.shield;
                game.totalDamageBlocked += this.shield;
                game.shieldDurabilityLost += this.shield;
                this.shield = 0;
                this._breakShield(game);
                this.hp -= remaining;
                game.totalDamageTaken += remaining;
                game.showDamageNumber(
                    this.x + this.width / 2,
                    this.y,
                    remaining,
                    'player-damage'
                );
                this._onHit();
                return remaining;
            }
        }

        this.hp -= damage;
        game.totalDamageTaken += damage;
        game.showDamageNumber(
            this.x + this.width / 2,
            this.y,
            damage,
            'player-damage'
        );
        this._onHit();
        return damage;
    }

    repairShield(game) {
        if (this.shieldBroken) {
            this.shieldBroken = false;
            this.shield = Math.min(CONFIG.REPAIR_AMOUNT, CONFIG.MAX_SHIELD);
            game.repairedTimes++;
            game.repairedAmount += CONFIG.REPAIR_AMOUNT;
            game.showDamageNumber(
                this.x + this.width / 2,
                this.y,
                '+' + CONFIG.REPAIR_AMOUNT,
                'heal'
            );
            return true;
        }
        
        const oldShield = this.shield;
        this.shield = Math.min(this.shield + CONFIG.REPAIR_AMOUNT, CONFIG.MAX_SHIELD);
        const actualRepair = this.shield - oldShield;
        if (actualRepair > 0) {
            game.repairedTimes++;
            game.repairedAmount += actualRepair;
            game.showDamageNumber(
                this.x + this.width / 2,
                this.y,
                '+' + actualRepair,
                'heal'
            );
            return true;
        }
        return false;
    }

    _checkAttackHit(enemy, attackX, attackWidth, attackHeight) {
        return attackX < enemy.x + enemy.width &&
               attackX + attackWidth > enemy.x &&
               this.y < enemy.y + enemy.height &&
               this.y + attackHeight > enemy.y;
    }

    _checkShieldBreak(game) {
        if (this.shield <= 0 && !this.shieldBroken) {
            this._breakShield(game);
        }
    }

    _breakShield(game) {
        this.shield = 0;
        this.shieldBroken = true;
        game.shieldBroken = true;
        game.triggerShieldBreakEffect();
    }

    _onHit() {
        this.invincible = true;
        this.invincibleTimer = 500;
    }

    draw(ctx) {
        ctx.save();
        
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const centerX = this.x + this.width / 2;

        if (this.facing === -1) {
            ctx.translate(centerX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-centerX, 0);
        }

        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.x + 10, this.y + 20, 20, 30);

        ctx.fillStyle = '#f5d0a9';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 12, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 5, 10, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 12, this.y + 50, 6, 10);
        ctx.fillRect(this.x + 22, this.y + 50, 6, 10);

        if (!this.shieldBroken) {
            const shieldX = this.x + 30;
            const shieldY = this.y + 15;
            
            ctx.fillStyle = this.isBlocking ? '#00f2fe' : '#4facfe';
            ctx.beginPath();
            ctx.ellipse(shieldX + 10, shieldY + 15, 12, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.ellipse(shieldX + 7, shieldY + 10, 4, 6, -0.3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#666';
            ctx.fillRect(this.x + 30, this.y + 20, 15, 20);
        }

        if (this.isAttacking) {
            if (this.attackType === 'bash') {
                ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(this.x + 50, this.y + 30, 25, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.attackType === 'smash') {
                ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
                ctx.beginPath();
                ctx.arc(this.x + 55, this.y + 40, 35, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.isBlocking) {
            ctx.strokeStyle = 'rgba(79, 172, 254, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(this.x + 35, this.y + 30, 20, 30, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 35;
        this.height = 50;
        this.vx = 0;
        this.vy = 0;
        this.hp = 50;
        this.maxHp = 50;
        this.damage = 10;
        this.speed = 1.5;
        this.facing = -1;
        this.stunned = false;
        this.stunTimer = 0;
        this.attackCooldown = 0;
        this.attackRange = 40;
        this.onGround = true;
        this.isAttacking = false;
        this.attackTimer = 0;
        
        this._configureByType();
    }

    _configureByType() {
        switch (this.type) {
            case 'normal':
                this.hp = 50;
                this.maxHp = 50;
                this.damage = 10;
                this.speed = 1.5;
                this.color = '#e74c3c';
                break;
            case 'shieldBreaker':
                this.hp = 40;
                this.maxHp = 40;
                this.damage = 20;
                this.speed = 2.5;
                this.color = '#9b59b6';
                this.width = 30;
                this.height = 45;
                break;
            case 'archer':
                this.hp = 35;
                this.maxHp = 35;
                this.damage = 10;
                this.speed = 1;
                this.color = '#2ecc71';
                this.attackRange = 300;
                this.width = 35;
                this.height = 50;
                break;
        }
    }

    update(player, game) {
        if (this.stunned) {
            this.stunTimer -= 16;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
            this.vx *= 0.9;
            this.x += this.vx;
            
            this.vy += CONFIG.GRAVITY;
            this.y += this.vy;
            
            if (this.y + this.height >= CONFIG.GROUND_Y) {
                this.y = CONFIG.GROUND_Y - this.height;
                this.vy = 0;
                this.onGround = true;
            }
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= 16;
        }

        if (this.isAttacking) {
            this.attackTimer -= 16;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }

        const dx = player.x - this.x;
        const distance = Math.abs(dx);
        this.facing = dx > 0 ? 1 : -1;

        if (this.type === 'archer') {
            if (distance < 150) {
                this.vx = -this.facing * this.speed;
            } else if (distance > this.attackRange) {
                this.vx = this.facing * this.speed;
            } else {
                this.vx = 0;
                if (this.attackCooldown <= 0) {
                    this._shootArrow(player, game);
                    this.attackCooldown = 2000;
                }
            }
        } else if (this.type === 'shieldBreaker') {
            if (distance > this.attackRange + 20) {
                this.vx = this.facing * this.speed;
            } else if (distance < this.attackRange) {
                if (player.isBlocking && player.facing === this.facing) {
                    const moveAround = Math.random() > 0.5 ? 1 : -1;
                    this.vx = moveAround * this.speed * 1.5;
                } else {
                    this.vx = 0;
                    if (this.attackCooldown <= 0) {
                        this._attack(player, game);
                        this.attackCooldown = 1200;
                    }
                }
            }
        } else {
            if (distance > this.attackRange) {
                this.vx = this.facing * this.speed;
            } else {
                this.vx = 0;
                if (this.attackCooldown <= 0) {
                    this._attack(player, game);
                    this.attackCooldown = 1500;
                }
            }
        }

        this.vy += CONFIG.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.height >= CONFIG.GROUND_Y) {
            this.y = CONFIG.GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CONFIG.CANVAS_WIDTH) this.x = CONFIG.CANVAS_WIDTH - this.width;
    }

    _attack(player, game) {
        this.isAttacking = true;
        this.attackTimer = 300;
        
        const dx = player.x - this.x;
        const distance = Math.abs(dx);
        
        if (distance < this.attackRange + 20) {
            player.takeDamage(this.damage, this.facing, game);
        }
    }

    _shootArrow(player, game) {
        this.isAttacking = true;
        this.attackTimer = 500;
        game.arrows.push(new Arrow(
            this.x + this.width / 2,
            this.y + 15,
            this.facing,
            this.damage
        ));
    }

    takeDamage(damage, knockback, stunDuration, game) {
        this.hp -= damage;
        this.vx = knockback / 10;
        
        if (stunDuration > 0) {
            this.stunned = true;
            this.stunTimer = stunDuration;
        }

        if (this.hp <= 0) {
            const timeSinceStart = Date.now() - game._gameStartTimestamp;
            if (timeSinceStart < 2000) {
                this.hp = 1;
                return;
            }
            game.enemies = game.enemies.filter(e => e !== this);
            game.checkLevelComplete();
        }
    }

    draw(ctx) {
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        
        if (this.facing === -1) {
            ctx.translate(centerX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-centerX, 0);
        }

        if (this.stunned) {
            ctx.globalAlpha = 0.7;
        }

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 8, this.y + 15, 18, 25);

        ctx.fillStyle = '#c0392b';
        if (this.type === 'shieldBreaker') {
            ctx.fillStyle = '#8e44ad';
        } else if (this.type === 'archer') {
            ctx.fillStyle = '#27ae60';
        }
        ctx.beginPath();
        ctx.arc(this.x + 17, this.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 21, this.y + 8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 10, this.y + 40, 5, 10);
        ctx.fillRect(this.x + 18, this.y + 40, 5, 10);

        if (this.type === 'archer') {
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + 30, this.y + 25, 15, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();
        }

        if (this.stunned) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '14px Arial';
            ctx.fillText('💫', this.x + 5, this.y - 5);
        }

        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(this.x, this.y - 10, this.width * hpPercent, 5);

        ctx.restore();
    }
}

class Arrow {
    constructor(x, y, direction, damage) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 4;
        this.speed = 6;
        this.direction = direction;
        this.damage = damage;
        this.active = true;
    }

    update(player, game) {
        this.x += this.speed * this.direction;

        if (this.x < -50 || this.x > CONFIG.CANVAS_WIDTH + 50) {
            this.active = false;
            return;
        }

        if (this._checkCollision(player)) {
            player.takeDamage(this.damage, this.direction, game);
            this.active = false;
        }
    }

    _checkCollision(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.direction === -1) {
            ctx.scale(-1, 1);
        }
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-10, -2, 18, 4);
        
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(4, -4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-14, -3);
        ctx.lineTo(-14, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class RepairPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.used = false;
        this.glowPhase = 0;
    }

    update() {
        this.glowPhase += 0.05;
    }

    checkPlayerInRange(player) {
        if (this.used) return false;
        const dx = (this.x + this.width / 2) - (player.x + player.width / 2);
        const dy = (this.y + this.height / 2) - (player.y + player.height / 2);
        return Math.sqrt(dx * dx + dy * dy) < 60;
    }

    use() {
        this.used = true;
    }

    draw(ctx) {
        if (this.used) {
            ctx.globalAlpha = 0.3;
        }

        const glow = Math.sin(this.glowPhase) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(46, 213, 115, ${glow * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#27ae60';
        ctx.fillRect(this.x + 15, this.y, 10, this.height);
        ctx.fillRect(this.x + 5, this.y + 15, 30, 10);

        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x + 17, this.y + 2, 6, this.height - 4);
        ctx.fillRect(this.x + 7, this.y + 17, 26, 6);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('修盾', this.x + this.width / 2, this.y + this.height + 15);
        ctx.textAlign = 'left';

        ctx.globalAlpha = 1;
    }
}

const STORAGE_KEY = 'shield_game_state';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.MENU;
        this.currentLevel = 1;
        this.selectedLevel = 1;
        this.playerName = '勇士';
        
        this.player = null;
        this.enemies = [];
        this.arrows = [];
        this.repairPoint = null;
        
        this.keys = {};
        this.gameTime = 0;
        this.lastTime = 0;
        this.animationId = null;
        this._gameStartTimestamp = 0;
        
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.shieldBashCount = 0;
        this.shieldSmashCount = 0;
        this.shieldBlockCount = 0;
        this.totalDamageBlocked = 0;
        this.shieldDurabilityLost = 0;
        this.repairedTimes = 0;
        this.repairedAmount = 0;
        this.shieldBroken = false;
        
        this.animationId = null;
        this._savedState = null;
        this._lastSaveSecond = -1;
        
        this._loadSavedState();
        this.init();
    }

    init() {
        this._setupEventListeners();
        this._loadPlayerStats();
        this._createLevelButtons();
    }

    _loadSavedState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                this._savedState = JSON.parse(saved);
            }
        } catch (e) {
            console.log('Failed to load saved state:', e);
        }
    }

    _saveState() {
        if (this.state !== GameState.PLAYING && this.state !== GameState.PAUSED) {
            return;
        }
        
        try {
            const state = {
                playerName: this.playerName,
                currentLevel: this.currentLevel,
                gameTime: this.gameTime,
                _gameStartTimestamp: this._gameStartTimestamp,
                totalDamageDealt: this.totalDamageDealt,
                totalDamageTaken: this.totalDamageTaken,
                shieldBashCount: this.shieldBashCount,
                shieldSmashCount: this.shieldSmashCount,
                shieldBlockCount: this.shieldBlockCount,
                totalDamageBlocked: this.totalDamageBlocked,
                shieldDurabilityLost: this.shieldDurabilityLost,
                repairedTimes: this.repairedTimes,
                repairedAmount: this.repairedAmount,
                shieldBroken: this.shieldBroken,
                player: {
                    x: this.player.x,
                    y: this.player.y,
                    hp: this.player.hp,
                    shield: this.player.shield,
                    shieldBroken: this.player.shieldBroken,
                    facing: this.player.facing
                },
                enemies: this.enemies.map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.type,
                    hp: e.hp,
                    maxHp: e.maxHp,
                    facing: e.facing,
                    stunned: e.stunned,
                    stunTimer: e.stunTimer
                })),
                repairPoint: {
                    x: this.repairPoint.x,
                    y: this.repairPoint.y,
                    used: this.repairPoint.used
                },
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.log('Failed to save state:', e);
        }
    }

    _clearSavedState() {
        localStorage.removeItem(STORAGE_KEY);
        this._savedState = null;
    }

    _checkResumeGame() {
        if (!this._savedState) return false;
        if (this._savedState.playerName !== this.playerName) return false;
        
        const savedLevel = this._savedState.currentLevel;
        const savedAt = this._savedState.savedAt || Date.now();
        const timeAgo = Math.floor((Date.now() - savedAt) / 1000);
        
        if (confirm(`发现未完成的游戏（第${savedLevel}关，${timeAgo}秒前保存），是否继续？\n点击"确定"继续进度，点击"取消"重新开始`)) {
            this._resumeGame();
            return true;
        }
        this._clearSavedState();
        return false;
    }

    _resumeGame() {
        if (!this._savedState) return false;
        
        const state = this._savedState;
        
        if (!state.player || state.player.hp <= 0) {
            console.log('存档数据无效：玩家HP异常');
            this._clearSavedState();
            return false;
        }
        if (!state.enemies || state.enemies.length === 0) {
            console.log('存档数据无效：敌人数据异常');
            this._clearSavedState();
            return false;
        }
        
        this.currentLevel = state.currentLevel || 1;
        this.gameTime = state.gameTime || 0;
        this._gameStartTimestamp = state._gameStartTimestamp || Date.now();
        this.totalDamageDealt = state.totalDamageDealt || 0;
        this.totalDamageTaken = state.totalDamageTaken || 0;
        this.shieldBashCount = state.shieldBashCount || 0;
        this.shieldSmashCount = state.shieldSmashCount || 0;
        this.shieldBlockCount = state.shieldBlockCount || 0;
        this.totalDamageBlocked = state.totalDamageBlocked || 0;
        this.shieldDurabilityLost = state.shieldDurabilityLost || 0;
        this.repairedTimes = state.repairedTimes || 0;
        this.repairedAmount = state.repairedAmount || 0;
        this.shieldBroken = !!state.shieldBroken;

        this.player = new Player(state.player.x, state.player.y);
        this.player.hp = Math.max(1, state.player.hp);
        this.player.shield = Math.max(0, state.player.shield);
        this.player.shieldBroken = !!state.player.shieldBroken;
        this.player.facing = state.player.facing || 1;

        this.enemies = state.enemies
            .filter(e => e && e.hp > 0 && e.type)
            .map(e => {
                const enemy = new Enemy(e.x, e.y, e.type);
                enemy.hp = Math.max(1, e.hp);
                enemy.maxHp = e.maxHp || enemy.maxHp;
                enemy.facing = e.facing || -1;
                enemy.stunned = !!e.stunned;
                enemy.stunTimer = e.stunTimer || 0;
                return enemy;
            });

        if (this.enemies.length === 0) {
            console.log('存档恢复后敌人列表为空，重新生成敌人');
            const levelConfig = LEVEL_CONFIG[this.currentLevel - 1];
            let xPos = CONFIG.CANVAS_WIDTH - 100;
            levelConfig.enemies.forEach(enemyGroup => {
                for (let i = 0; i < enemyGroup.count; i++) {
                    const enemy = new Enemy(xPos, CONFIG.GROUND_Y - 50, enemyGroup.type);
                    enemy.facing = -1;
                    this.enemies.push(enemy);
                    xPos -= 80 + Math.random() * 40;
                }
            });
        }

        this.arrows = [];
        this.repairPoint = new RepairPoint(
            (state.repairPoint && state.repairPoint.x) || CONFIG.CANVAS_WIDTH / 2 - 20,
            (state.repairPoint && state.repairPoint.y) || CONFIG.GROUND_Y - 50
        );
        if (state.repairPoint) {
            this.repairPoint.used = !!state.repairPoint.used;
        }

        this.keys = {};
        this._showScreen('game-screen');
        this.state = GameState.PLAYING;
        this._gameStartTimestamp = Date.now();
        this.lastTime = performance.now();
        this._updateHUD();
        this._render();
        this._saveState();
        this._gameLoop();
        return true;
    }

    _setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (this.state === GameState.PLAYING) {
                if (e.code === 'KeyJ') {
                    this.player.shieldBash(this);
                } else if (e.code === 'KeyK') {
                    this.player.shieldSmash(this);
                } else if (e.code === 'KeyE') {
                    this._tryRepair();
                } else if (e.code === 'Escape') {
                    this.pauseGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('beforeunload', () => {
            this._saveState();
        });

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartLevel());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('gameover-restart-btn').addEventListener('click', () => this.restartLevel());
        document.getElementById('gameover-menu-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('victory-menu-btn').addEventListener('click', () => this.quitToMenu());
        
        document.getElementById('player-name').addEventListener('input', (e) => {
            this.playerName = e.target.value || '勇士';
            this._loadPlayerStats();
        });
    }

    _createLevelButtons() {
        const container = document.getElementById('level-buttons');
        container.innerHTML = '';
        
        for (let i = 1; i <= 8; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;
            btn.dataset.level = i;
            
            if (i === 1) {
                btn.classList.add('selected');
            }
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedLevel = i;
            });
            
            container.appendChild(btn);
        }
    }

    async _loadPlayerStats() {
        try {
            const response = await fetch(`${API_BASE}/shieldgame/getshieldstats?player_name=${encodeURIComponent(this.playerName)}`);
            const result = await response.json();
            
            const statsDiv = document.getElementById('player-stats');
            if (result.code === 0 && result.data) {
                const data = result.data;
                statsDiv.innerHTML = `
                    <p>游戏次数: ${data.game_count || 0}</p>
                    <p>盾击: ${data.total_bash || 0} 次 | 盾砸: ${data.total_smash || 0} 次</p>
                    <p>格挡: ${data.total_block || 0} 次</p>
                    <p>抵挡伤害: ${data.total_damage_blocked || 0}</p>
                    <p>碎盾次数: ${data.total_broken || 0}</p>
                `;
            } else {
                statsDiv.innerHTML = '<p>暂无记录</p>';
            }
        } catch (e) {
            console.log('Failed to load player stats:', e);
            document.getElementById('player-stats').innerHTML = '<p>加载失败</p>';
        }
    }

    startGame() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput.value.trim();
        
        if (!playerName) {
            alert('请输入玩家名称！');
            nameInput.focus();
            return;
        }
        
        this.playerName = playerName;
        this.currentLevel = parseInt(this.selectedLevel, 10);
        
        if (this.currentLevel < 1 || this.currentLevel > 8) {
            alert('请选择有效的关卡！');
            return;
        }
        
        const shouldResume = this._checkResumeGame();
        if (shouldResume) {
            return;
        }
        
        this._clearSavedState();
        this.keys = {};
        this._initLevel();
        
        if (this.enemies.length === 0 || !this.player || this.player.hp <= 0) {
            alert('关卡初始化失败，请重试！');
            return;
        }
        
        this._showScreen('game-screen');
        this.state = GameState.PLAYING;
        this._gameStartTimestamp = Date.now();
        this.lastTime = performance.now();
        this._saveState();
        this._render();
        this._gameLoop();
    }

    _initLevel() {
        this.player = new Player(100, CONFIG.GROUND_Y - CONFIG.PLAYER_HEIGHT);
        this.enemies = [];
        this.arrows = [];
        this.gameTime = 0;
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.shieldBashCount = 0;
        this.shieldSmashCount = 0;
        this.shieldBlockCount = 0;
        this.totalDamageBlocked = 0;
        this.shieldDurabilityLost = 0;
        this.repairedTimes = 0;
        this.repairedAmount = 0;
        this.shieldBroken = false;
        this._lastSaveSecond = -1;
        this._gameStartTimestamp = 0;

        const levelConfig = LEVEL_CONFIG[this.currentLevel - 1];
        if (!levelConfig || !levelConfig.enemies) {
            console.error('Invalid level configuration for level:', this.currentLevel);
            return;
        }
        
        let xPos = CONFIG.CANVAS_WIDTH - 100;
        levelConfig.enemies.forEach(enemyGroup => {
            if (!enemyGroup.type || !enemyGroup.count || enemyGroup.count <= 0) {
                return;
            }
            for (let i = 0; i < enemyGroup.count; i++) {
                const enemy = new Enemy(xPos, CONFIG.GROUND_Y - 50, enemyGroup.type);
                if (enemy.hp <= 0) {
                    console.error('Enemy created with invalid HP:', enemy);
                    continue;
                }
                enemy.facing = -1;
                this.enemies.push(enemy);
                xPos -= 80 + Math.random() * 40;
            }
        });

        this.repairPoint = new RepairPoint(CONFIG.CANVAS_WIDTH / 2 - 20, CONFIG.GROUND_Y - 50);

        this._updateHUD();
    }

    _gameLoop() {
        if (this.state !== GameState.PLAYING) {
            return;
        }

        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;
        this.gameTime += delta / 1000;

        this._update();
        this._render();
        this._updateHUD();

        if (Math.floor(this.gameTime) % 5 === 0 && Math.floor(this.gameTime) !== this._lastSaveSecond) {
            this._saveState();
            this._lastSaveSecond = Math.floor(this.gameTime);
        }

        this.animationId = requestAnimationFrame(() => this._gameLoop());
    }

    _update() {
        this.player.update(this.keys, this);

        this.enemies.forEach(enemy => {
            enemy.update(this.player, this);
        });

        this.arrows = this.arrows.filter(arrow => {
            arrow.update(this.player, this);
            return arrow.active;
        });

        if (this.repairPoint) {
            this.repairPoint.update();
        }

        const timeSinceStart = Date.now() - this._gameStartTimestamp;
        if (timeSinceStart > 2000 && this.player.hp <= 0) {
            this._gameOver();
        }
    }

    _render() {
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this._drawBackground();
        this._drawGround();

        if (this.repairPoint) {
            this.repairPoint.draw(this.ctx);
        }

        this.arrows.forEach(arrow => arrow.draw(this.ctx));

        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        this.player.draw(this.ctx);

        if (this.repairPoint && this.repairPoint.checkPlayerInRange(this.player) && !this.repairPoint.used) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('按 E 修复盾牌', this.player.x + this.player.width / 2, this.player.y - 20);
            this.ctx.textAlign = 'left';
        }
    }

    _drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 37 + this.gameTime * 5) % CONFIG.CANVAS_WIDTH;
            const y = (i * 23) % (CONFIG.GROUND_Y - 100) + 20;
            const size = (i % 3) + 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#1a2a3a';
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.GROUND_Y - 50);
        for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += 100) {
            const y = CONFIG.GROUND_Y - 50 - Math.sin(x * 0.01) * 40 - 30;
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.GROUND_Y);
        this.ctx.lineTo(0, CONFIG.GROUND_Y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    _drawGround() {
        const groundGradient = this.ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, CONFIG.CANVAS_HEIGHT);
        groundGradient.addColorStop(0, '#3d5a3d');
        groundGradient.addColorStop(0.3, '#2d4a2d');
        groundGradient.addColorStop(1, '#1d3a1d');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);

        this.ctx.strokeStyle = '#4a7c4a';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, CONFIG.GROUND_Y);
        this.ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.GROUND_Y);
        this.ctx.stroke();
    }

    _tryRepair() {
        if (this.repairPoint && this.repairPoint.checkPlayerInRange(this.player) && !this.repairPoint.used) {
            if (this.player.repairShield(this)) {
                this.repairPoint.use();
            }
        }
    }

    _updateHUD() {
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('hp-fill').style.width = hpPercent + '%';
        document.getElementById('hp-text').textContent = `${Math.max(0, Math.floor(this.player.hp))}/${this.player.maxHp}`;

        const shieldPercent = (this.player.shield / this.player.maxShield) * 100;
        const shieldFill = document.getElementById('shield-fill');
        shieldFill.style.width = shieldPercent + '%';
        document.getElementById('shield-text').textContent = `${Math.max(0, Math.floor(this.player.shield))}/${this.player.maxShield}`;
        
        shieldFill.classList.remove('low', 'critical');
        if (this.player.shieldBroken) {
            shieldFill.style.width = '0%';
        } else if (shieldPercent <= 20) {
            shieldFill.classList.add('critical');
        } else if (shieldPercent <= 40) {
            shieldFill.classList.add('low');
        }

        document.getElementById('level-info').textContent = `第 ${this.currentLevel} 关`;
        const levelConfig = LEVEL_CONFIG[this.currentLevel - 1];
        const totalEnemies = levelConfig.enemies.reduce((sum, e) => sum + e.count, 0);
        const killedEnemies = totalEnemies - this.enemies.length;
        document.getElementById('enemy-count').textContent = `敌人: ${killedEnemies}/${totalEnemies}`;

        document.getElementById('timer').textContent = `时间: ${Math.floor(this.gameTime)}s`;

        const statusText = document.getElementById('shield-status-text');
        if (this.player.shieldBroken) {
            statusText.textContent = '盾牌状态：已破碎（移动速度翻倍）';
            statusText.classList.add('broken');
        } else {
            statusText.textContent = '盾牌状态：完好';
            statusText.classList.remove('broken');
        }

        const bashSkill = document.getElementById('skill-bash');
        const smashSkill = document.getElementById('skill-smash');
        const blockSkill = document.getElementById('skill-block');
        const repairSkill = document.getElementById('skill-repair');

        bashSkill.classList.toggle('disabled', this.player.shieldBroken || this.player.shield < CONFIG.SHIELD_BASH_COST);
        smashSkill.classList.toggle('disabled', this.player.shieldBroken || this.player.shield < CONFIG.SHIELD_SMASH_COST);
        blockSkill.classList.toggle('disabled', this.player.shieldBroken);
        blockSkill.classList.toggle('active', this.player.isBlocking);
        repairSkill.classList.toggle('disabled', !this.repairPoint || this.repairPoint.used);
    }

    showDamageNumber(x, y, value, type) {
        const container = document.getElementById('damage-numbers');
        const num = document.createElement('div');
        num.className = `damage-number ${type}`;
        num.textContent = value;
        num.style.left = x + 'px';
        num.style.top = y + 'px';
        container.appendChild(num);
        
        setTimeout(() => num.remove(), 1000);
    }

    triggerShieldBreakEffect() {
        const effect = document.getElementById('shield-break-effect');
        effect.classList.remove('active');
        void effect.offsetWidth;
        effect.classList.add('active');
    }

    checkLevelComplete() {
        if (this.state !== GameState.PLAYING) {
            return;
        }
        const timeSinceStart = Date.now() - this._gameStartTimestamp;
        if (timeSinceStart < 2000) {
            return;
        }
        if (this.enemies.length === 0) {
            this._victory();
        }
    }

    _victory() {
        this.state = GameState.VICTORY;
        cancelAnimationFrame(this.animationId);
        this._clearSavedState();

        document.getElementById('victory-level').textContent = this.currentLevel;
        document.getElementById('victory-hp').textContent = Math.floor(this.player.hp);
        document.getElementById('victory-shield').textContent = Math.floor(this.player.shield);
        document.getElementById('victory-bash').textContent = this.shieldBashCount;
        document.getElementById('victory-smash').textContent = this.shieldSmashCount;
        document.getElementById('victory-block').textContent = this.shieldBlockCount;
        document.getElementById('victory-blocked-dmg').textContent = this.totalDamageBlocked;
        document.getElementById('victory-time').textContent = Math.floor(this.gameTime);

        const nextBtn = document.getElementById('next-level-btn');
        if (this.currentLevel >= 8) {
            nextBtn.textContent = '🎉 全部通关！';
            nextBtn.disabled = true;
        } else {
            nextBtn.textContent = '下一关';
            nextBtn.disabled = false;
        }

        this._showScreen('victory-screen');
        this._submitRecord(true);
    }

    _gameOver() {
        this.state = GameState.GAME_OVER;
        cancelAnimationFrame(this.animationId);
        this._clearSavedState();

        document.getElementById('gameover-title').textContent = '💀 游戏结束 💀';
        document.getElementById('final-level').textContent = this.currentLevel;
        document.getElementById('final-hp').textContent = 0;
        document.getElementById('final-shield').textContent = Math.floor(this.player.shield);
        document.getElementById('final-bash').textContent = this.shieldBashCount;
        document.getElementById('final-smash').textContent = this.shieldSmashCount;
        document.getElementById('final-block').textContent = this.shieldBlockCount;
        document.getElementById('final-blocked-dmg').textContent = this.totalDamageBlocked;
        document.getElementById('final-time').textContent = Math.floor(this.gameTime);

        this._showScreen('gameover-screen');
        this._submitRecord(false);
    }

    async _submitRecord(cleared) {
        try {
            const data = {
                player_name: this.playerName,
                level: this.currentLevel,
                cleared: cleared ? 1 : 0,
                final_hp: Math.floor(this.player.hp),
                final_shield_durability: Math.floor(this.player.shield),
                shield_broken: this.shieldBroken ? 1 : 0,
                total_damage_dealt: this.totalDamageDealt,
                total_damage_taken: this.totalDamageTaken,
                play_time_seconds: Math.floor(this.gameTime),
                shield_bash_count: this.shieldBashCount,
                shield_smash_count: this.shieldSmashCount,
                shield_block_count: this.shieldBlockCount,
                total_damage_blocked: this.totalDamageBlocked,
                shield_durability_lost: this.shieldDurabilityLost,
                repaired_times: this.repairedTimes,
                repaired_amount: this.repairedAmount
            };

            await fetch(`${API_BASE}/shieldgame/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            this._loadPlayerStats();
        } catch (e) {
            console.log('Failed to submit record:', e);
        }
    }

    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            cancelAnimationFrame(this.animationId);
            this._saveState();
            this._showScreen('pause-screen');
        }
    }

    resumeGame() {
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this._hideScreen('pause-screen');
            this.lastTime = performance.now();
            this._render();
            this._gameLoop();
        }
    }

    restartLevel() {
        this._clearSavedState();
        this._hideAllScreens();
        this._showScreen('game-screen');
        this._initLevel();
        this.state = GameState.PLAYING;
        this._gameStartTimestamp = Date.now();
        this.lastTime = performance.now();
        this._render();
        this._gameLoop();
    }

    nextLevel() {
        if (this.currentLevel < 8) {
            this._clearSavedState();
            this.currentLevel++;
            this.selectedLevel = this.currentLevel;
            this._hideAllScreens();
            this._showScreen('game-screen');
            this._initLevel();
            this.state = GameState.PLAYING;
            this._gameStartTimestamp = Date.now();
            this.lastTime = performance.now();
            this._render();
            this._gameLoop();
        }
    }

    quitToMenu() {
        this.state = GameState.MENU;
        cancelAnimationFrame(this.animationId);
        this._saveState();
        this._hideAllScreens();
        this._showScreen('start-screen');
        this._loadPlayerStats();
    }

    _showScreen(screenId) {
        document.getElementById(screenId).classList.add('active');
    }

    _hideScreen(screenId) {
        document.getElementById(screenId).classList.remove('active');
    }

    _hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
