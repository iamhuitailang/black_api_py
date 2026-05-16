class Character {
    constructor(type, x, y, isPlayer = true) {
        const charConfig = CONFIG.CHARACTER_TYPES[type];
        this.type = type;
        this.name = charConfig.name;
        this.emoji = charConfig.emoji;
        this.speed = charConfig.speed;
        this.jumpPower = charConfig.jumpPower;
        this.defense = charConfig.defense;
        this.attackBonus = charConfig.attackBonus || 1;
        
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 80;
        this.height = 100;
        
        this.health = CONFIG.MAX_HEALTH;
        this.maxHealth = CONFIG.MAX_HEALTH;
        
        this.isPlayer = isPlayer;
        this.facing = isPlayer ? 1 : -1;
        
        this.isJumping = false;
        this.isCrouching = false;
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackTimer = 0;
        this.hitActive = false;
        
        this.isInvincible = false;
        this.invincibleTimer = 0;
        
        this.isHit = false;
        this.hitTimer = 0;
        
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        this.projectiles = [];
    }

    update(deltaTime) {
        this.vy += CONFIG.GRAVITY;
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0) this.x = 0;
        if (this.x > CONFIG.CANVAS_WIDTH - this.width) {
            this.x = CONFIG.CANVAS_WIDTH - this.width;
        }
        
        if (this.y >= CONFIG.GROUND_Y - this.height) {
            this.y = CONFIG.GROUND_Y - this.height;
            this.vy = 0;
            this.isJumping = false;
        }
        
        this.vx *= 0.9;
        
        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.currentAttack = null;
                this.hitActive = false;
            }
        }
        
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        if (this.isHit) {
            this.hitTimer -= deltaTime;
            if (this.hitTimer <= 0) {
                this.isHit = false;
            }
        }
        
        this.updateProjectiles(deltaTime);
        
        this.animationTimer += deltaTime;
        if (this.animationTimer > 100) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 4;
        }
    }

    moveLeft() {
        if (!this.isAttacking) {
            this.vx = -this.speed;
            this.facing = -1;
        }
    }

    moveRight() {
        if (!this.isAttacking) {
            this.vx = this.speed;
            this.facing = 1;
        }
    }

    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    resolveCollision(other) {
        const overlapLeft = (this.x + this.width) - other.x;
        const overlapRight = (other.x + other.width) - this.x;
        
        if (overlapLeft < overlapRight) {
            this.x -= overlapLeft / 2;
            other.x += overlapLeft / 2;
        } else {
            this.x += overlapRight / 2;
            other.x -= overlapRight / 2;
        }
        
        this.vx = 0;
        other.vx = 0;
    }

    stopMove() {
        this.vx = 0;
    }

    jump() {
        if (!this.isJumping && !this.isAttacking) {
            this.vy = -this.jumpPower;
            this.isJumping = true;
        }
    }

    crouch() {
        if (!this.isJumping && !this.isAttacking) {
            this.isCrouching = true;
            this.height = 60;
        }
    }

    standUp() {
        this.isCrouching = false;
        this.height = 100;
    }

    attack(attackType) {
        if (this.isAttacking) return false;
        
        const attack = CONFIG.ATTACKS[attackType];
        if (!attack) return false;
        
        this.isAttacking = true;
        this.currentAttack = attackType;
        this.attackTimer = attack.startup + attack.duration;
        this.hitActive = false;
        
        setTimeout(() => {
            this.hitActive = true;
        }, attack.startup);
        
        return true;
    }

    specialMove(specialType) {
        if (this.isAttacking) return false;
        
        const special = CONFIG.SPECIALS[specialType];
        if (!special) return false;
        
        this.isAttacking = true;
        this.currentAttack = specialType;
        this.attackTimer = 500;
        this.hitActive = true;
        
        if (special.type === 'projectile') {
            this.fireProjectile();
        }
        
        if (special.invincible) {
            this.isInvincible = true;
            this.invincibleTimer = 500;
        }
        
        return true;
    }

    fireProjectile() {
        this.projectiles.push({
            x: this.x + (this.facing > 0 ? this.width : 0),
            y: this.y + this.height / 2,
            vx: this.facing * 10,
            damage: CONFIG.SPECIALS.laughWave.damage,
            emoji: '💥'
        });
    }

    updateProjectiles(deltaTime) {
        this.projectiles = this.projectiles.filter(p => {
            p.x += p.vx;
            return p.x > 0 && p.x < CONFIG.CANVAS_WIDTH;
        });
    }

    takeDamage(damage) {
        if (this.isInvincible) return false;
        
        const actualDamage = Math.floor(damage / this.defense);
        this.health = Math.max(0, this.health - actualDamage);
        
        this.isHit = true;
        this.hitTimer = 200;
        this.isInvincible = true;
        this.invincibleTimer = 500;
        
        return true;
    }

    getHitbox() {
        return {
            x: this.x + (this.facing > 0 ? this.width : -CONFIG.ATTACKS[this.currentAttack].range),
            y: this.y,
            width: CONFIG.ATTACKS[this.currentAttack].range,
            height: this.height
        };
    }

    getBodybox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isAlive() {
        return this.health > 0;
    }
}