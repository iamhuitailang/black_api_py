class Character {
    constructor(charId, x, isPlayer = true) {
        const config = CHARACTERS[charId];
        this.charId = charId;
        this.name = config.name;
        this.icon = config.icon;
        this.color = config.color;
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.attackDamage = config.attackDamage;
        this.defense = config.defense;
        this.moveSpeed = config.moveSpeed;
        this.escapeSpeed = config.escapeSpeed;
        this.pinTime = config.pinTime;
        this.ultimateName = config.ultimateName;
        
        this.x = x;
        this.y = CONFIG.GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        this.width = 60;
        this.height = 100;
        
        this.state = PLAYER_STATE.IDLE;
        this.isPlayer = isPlayer;
        this.facing = isPlayer ? 1 : -1;
        
        this.attackCooldown = 0;
        this.attackTimer = 0;
        this.currentAttack = null;
        
        this.grappleTarget = null;
        this.downTimer = 0;
        this.escapeProgress = 0;
        
        this.animationFrame = 0;
        this.animationTimer = 0;
    }
    
    update(deltaTime, opponent) {
        this.animationTimer += deltaTime;
        if (this.animationTimer > 100) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 4;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.state === PLAYER_STATE.DOWN) {
            this.downTimer -= deltaTime;
            if (this.downTimer <= 0) {
                this.state = PLAYER_STATE.IDLE;
                this.y = CONFIG.GROUND_Y;
            }
            return;
        }
        
        if (this.state === PLAYER_STATE.PINNED) {
            return;
        }
        
        if (this.state === PLAYER_STATE.ATTACKING) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.state = PLAYER_STATE.IDLE;
                this.currentAttack = null;
            }
            return;
        }
        
        if (this.state === PLAYER_STATE.JUMPING) {
            this.vy += CONFIG.GRAVITY;
            this.y += this.vy;
            
            if (this.y >= CONFIG.GROUND_Y) {
                this.y = CONFIG.GROUND_Y;
                this.vy = 0;
                this.state = PLAYER_STATE.IDLE;
            }
        }
        
        const newX = this.x + this.vx;
        
        if (opponent && opponent.state !== PLAYER_STATE.DOWN && opponent.state !== PLAYER_STATE.PINNED) {
            const minDistance = 70;
            const distance = Math.abs(newX - opponent.x);
            
            if (distance < minDistance) {
                if (newX < opponent.x) {
                    this.x = opponent.x - minDistance;
                } else {
                    this.x = opponent.x + minDistance;
                }
                this.vx = 0;
            } else {
                this.x = newX;
            }
        } else {
            this.x = newX;
        }
        
        this.x = Math.max(CONFIG.RING.x + 50, Math.min(CONFIG.RING.x + CONFIG.RING.width - 50 - this.width, this.x));
        
        if (opponent) {
            this.facing = opponent.x > this.x ? 1 : -1;
        }
    }
    
    move(direction) {
        if (this.state === PLAYER_STATE.IDLE || this.state === PLAYER_STATE.WALKING) {
            this.vx = direction * this.moveSpeed;
            if (direction !== 0) {
                this.state = PLAYER_STATE.WALKING;
                this.facing = direction;
            } else {
                this.state = PLAYER_STATE.IDLE;
            }
        }
    }
    
    jump() {
        if (this.state === PLAYER_STATE.IDLE || this.state === PLAYER_STATE.WALKING) {
            this.vy = -15;
            this.state = PLAYER_STATE.JUMPING;
        }
    }
    
    crouch(isCrouching) {
        if (this.state === PLAYER_STATE.IDLE || this.state === PLAYER_STATE.WALKING) {
            this.state = isCrouching ? PLAYER_STATE.CROUCHING : PLAYER_STATE.IDLE;
        }
    }
    
    attack(type, opponent) {
        if (this.attackCooldown > 0 || this.state !== PLAYER_STATE.IDLE && this.state !== PLAYER_STATE.WALKING && this.state !== PLAYER_STATE.CROUCHING) {
            return false;
        }
        
        const distance = Math.abs(opponent.x - this.x);
        if (distance > CONFIG.ATTACK_DISTANCE) {
            return false;
        }
        
        const attackConfig = CONFIG.ATTACKS[type];
        if (!attackConfig) return false;
        
        this.state = PLAYER_STATE.ATTACKING;
        this.currentAttack = type;
        this.attackCooldown = attackConfig.cooldown;
        this.attackTimer = 500;
        
        const damage = Math.max(1, this.attackDamage * attackConfig.damage - opponent.defense);
        opponent.takeDamage(damage);
        
        if (type === 'THROW' || type === 'ULTIMATE') {
            opponent.knockDown();
        }
        
        return true;
    }
    
    pin(opponent) {
        if (opponent.state !== PLAYER_STATE.DOWN && opponent.state !== PLAYER_STATE.PINNED) {
            return false;
        }
        
        const distance = Math.abs(opponent.x - this.x);
        if (distance > CONFIG.GRAPPLE_DISTANCE) {
            return false;
        }
        
        this.state = PLAYER_STATE.PINNING;
        opponent.state = PLAYER_STATE.PINNED;
        this.grappleTarget = opponent;
        opponent.grappleTarget = this;
        
        return true;
    }
    
    escape() {
        if (this.state !== PLAYER_STATE.PINNED) return false;
        
        this.escapeProgress += this.escapeSpeed * 0.1;
        if (this.escapeProgress >= 100) {
            this.state = PLAYER_STATE.IDLE;
            this.grappleTarget.state = PLAYER_STATE.IDLE;
            this.grappleTarget.grappleTarget = null;
            this.grappleTarget = null;
            this.escapeProgress = 0;
            return true;
        }
        return false;
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        if (this.health <= 0) {
            this.knockDown();
        }
    }
    
    knockDown() {
        this.state = PLAYER_STATE.DOWN;
        this.downTimer = 3000;
        this.y = CONFIG.GROUND_Y + 40;
    }
    
    reset(x) {
        this.health = this.maxHealth;
        this.x = x;
        this.y = CONFIG.GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        this.state = PLAYER_STATE.IDLE;
        this.attackCooldown = 0;
        this.attackTimer = 0;
        this.currentAttack = null;
        this.grappleTarget = null;
        this.downTimer = 0;
        this.escapeProgress = 0;
    }
}