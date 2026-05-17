class Character {
    constructor(config, x, y, facingRight = true) {
        this.name = config.name;
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.maxEnergy = config.maxEnergy;
        this.energy = 0;
        this.moveSpeed = config.moveSpeed;
        this.jumpForce = config.jumpForce;
        this.width = config.width;
        this.height = config.height;
        this.color = config.color;
        this.secondaryColor = config.secondaryColor;
        this.attackPower = config.attackPower || 10;
        
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.groundY = GameConfig.GROUND_Y - this.height;
        this.facingRight = facingRight;
        this.isGrounded = true;
        
        this.state = GameConfig.CHARACTER_STATES.IDLE;
        this.stateTimer = 0;
        this.hitstunTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackHit = false;
        
        this.comboSequence = [];
        this.comboTimer = 0;
        this.currentCombo = null;
        
        this.blocking = false;
        
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(deltaTime, opponent) {
        this.updatePhysics(deltaTime);
        this.updateState(deltaTime);
        this.updateTimers(deltaTime);
        this.updateFacing(opponent);
        this.updateAnimation(deltaTime);
    }
    
    updatePhysics(deltaTime) {
        if (!this.isGrounded) {
            this.vy += GameConfig.GRAVITY;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.vy = 0;
            this.isGrounded = true;
            if (this.state === GameConfig.CHARACTER_STATES.JUMPING) {
                this.setState(GameConfig.CHARACTER_STATES.IDLE);
            }
        }
        
        this.vx *= GameConfig.FRICTION;
        
        if (this.x < 0) this.x = 0;
        if (this.x > GameConfig.CANVAS_WIDTH - this.width) {
            this.x = GameConfig.CANVAS_WIDTH - this.width;
        }
    }
    
    updateState(deltaTime) {
        if (this.stateTimer > 0) {
            this.stateTimer -= deltaTime;
            if (this.stateTimer <= 0) {
                if (this.state !== GameConfig.CHARACTER_STATES.DEAD) {
                    this.setState(GameConfig.CHARACTER_STATES.IDLE);
                }
            }
        }
    }
    
    updateTimers(deltaTime) {
        if (this.hitstunTimer > 0) {
            this.hitstunTimer -= deltaTime;
            if (this.hitstunTimer <= 0) {
                this.blocking = false;
            }
        }
        
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        
        if (this.currentAttack && this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.endAttack();
            }
        }
    }
    
    updateFacing(opponent) {
        if (opponent && this.state !== GameConfig.CHARACTER_STATES.DEAD) {
            this.facingRight = this.x < opponent.x;
        }
    }
    
    updateAnimation(deltaTime) {
        this.animTimer += deltaTime;
        const frameTime = 100;
        if (this.animTimer >= frameTime) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
    
    canAct() {
        return this.state !== GameConfig.CHARACTER_STATES.DEAD &&
               this.hitstunTimer <= 0 &&
               !this.isAttacking() &&
               this.state !== GameConfig.CHARACTER_STATES.HURT;
    }
    
    isAttacking() {
        return this.state === GameConfig.CHARACTER_STATES.PUNCHING ||
               this.state === GameConfig.CHARACTER_STATES.KICKING ||
               this.state === GameConfig.CHARACTER_STATES.SPECIAL ||
               this.state === GameConfig.CHARACTER_STATES.GRABBING;
    }
    
    moveLeft() {
        if (this.canAct() || this.state === GameConfig.CHARACTER_STATES.WALKING) {
            this.vx = -this.moveSpeed;
            if (this.isGrounded && !this.isAttacking()) {
                this.setState(GameConfig.CHARACTER_STATES.WALKING);
            }
        }
    }
    
    moveRight() {
        if (this.canAct() || this.state === GameConfig.CHARACTER_STATES.WALKING) {
            this.vx = this.moveSpeed;
            if (this.isGrounded && !this.isAttacking()) {
                this.setState(GameConfig.CHARACTER_STATES.WALKING);
            }
        }
    }
    
    stopMoving() {
        if (this.isGrounded && !this.isAttacking() && this.hitstunTimer <= 0) {
            this.vx = 0;
            if (this.state === GameConfig.CHARACTER_STATES.WALKING) {
                this.setState(GameConfig.CHARACTER_STATES.IDLE);
            }
        }
    }
    
    jump() {
        if (this.canAct() && this.isGrounded) {
            this.vy = -this.jumpForce;
            this.isGrounded = false;
            this.setState(GameConfig.CHARACTER_STATES.JUMPING);
        }
    }
    
    startAttack(attackType) {
        if (!this.canAct()) return false;
        
        if (attackType === GameConfig.ATTACK_TYPES.SPECIAL) {
            if (this.energy < attackType.energyCost) return false;
            this.energy -= attackType.energyCost;
            this.invincible = true;
            this.invincibleTimer = attackType.duration;
        }
        
        if (!this.isGrounded) {
            attackType = GameConfig.ATTACK_TYPES.JUMP_ATTACK;
        }
        
        this.currentAttack = attackType;
        this.attackTimer = attackType.duration;
        this.attackHit = false;
        
        if (attackType === GameConfig.ATTACK_TYPES.GRAB) {
            this.setState(GameConfig.CHARACTER_STATES.GRABBING);
        } else if (attackType === GameConfig.ATTACK_TYPES.SPECIAL) {
            this.setState(GameConfig.CHARACTER_STATES.SPECIAL);
        } else if (attackType.name.includes('kick')) {
            this.setState(GameConfig.CHARACTER_STATES.KICKING);
        } else {
            this.setState(GameConfig.CHARACTER_STATES.PUNCHING);
        }
        
        this.addToCombo(attackType.name);
        
        return true;
    }
    
    endAttack() {
        this.currentAttack = null;
        this.attackTimer = 0;
        if (this.state !== GameConfig.CHARACTER_STATES.DEAD &&
            this.state !== GameConfig.CHARACTER_STATES.HURT) {
            if (!this.isGrounded) {
                this.setState(GameConfig.CHARACTER_STATES.JUMPING);
            } else {
                this.setState(GameConfig.CHARACTER_STATES.IDLE);
            }
        }
    }
    
    addToCombo(attackName) {
        this.comboSequence.push(attackName);
        this.comboTimer = GameConfig.COMBO_TIMEOUT;
        
        if (this.comboSequence.length > 3) {
            this.comboSequence.shift();
        }
        
        const comboKey = this.comboSequence.join(',');
        if (GameConfig.COMBO_SEQUENCES[comboKey]) {
            this.currentCombo = GameConfig.COMBO_SEQUENCES[comboKey];
        }
    }
    
    resetCombo() {
        this.comboSequence = [];
        this.currentCombo = null;
    }
    
    getComboBonus() {
        if (this.currentCombo) {
            const combo = this.currentCombo;
            this.currentCombo = null;
            return combo;
        }
        return null;
    }
    
    startBlock() {
        if (this.canAct() && this.isGrounded) {
            this.blocking = true;
            this.setState(GameConfig.CHARACTER_STATES.BLOCKING);
        }
    }
    
    stopBlock() {
        if (this.state === GameConfig.CHARACTER_STATES.BLOCKING) {
            this.blocking = false;
            this.setState(GameConfig.CHARACTER_STATES.IDLE);
        }
    }
    
    takeDamage(damage, hitstun, knockback, attacker, canBlock = true) {
        if (this.state === GameConfig.CHARACTER_STATES.DEAD || this.invincible) return 0;
        
        let actualDamage = damage;
        
        if (this.blocking && canBlock) {
            actualDamage = Math.floor(damage * 0.3);
            this.energy = Math.min(this.maxEnergy, this.energy + 5);
        } else {
            this.setState(GameConfig.CHARACTER_STATES.HURT);
            this.stateTimer = hitstun;
            this.hitstunTimer = hitstun;
            this.resetCombo();
        }
        
        this.health -= actualDamage;
        
        const knockbackDir = attacker.x < this.x ? 1 : -1;
        this.vx = knockback * knockbackDir;
        
        if (this.health <= 0) {
            this.health = 0;
            this.setState(GameConfig.CHARACTER_STATES.DEAD);
        }
        
        return actualDamage;
    }
    
    addEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }
    
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    getAttackHitbox() {
        if (!this.currentAttack) return null;
        
        const attackRange = this.currentAttack.range;
        const attackWidth = attackRange;
        const attackHeight = this.height * 0.6;
        const attackY = this.y + this.height * 0.2;
        
        let attackX;
        if (this.facingRight) {
            attackX = this.x + this.width;
        } else {
            attackX = this.x - attackWidth;
        }
        
        return {
            x: attackX,
            y: attackY,
            width: attackWidth,
            height: attackHeight
        };
    }
    
    isInRange(opponent) {
        const distance = Math.abs(this.x + this.width / 2 - (opponent.x + opponent.width / 2));
        return distance < 100;
    }
    
    serialize() {
        return {
            name: this.name,
            maxHealth: this.maxHealth,
            health: this.health,
            maxEnergy: this.maxEnergy,
            energy: this.energy,
            moveSpeed: this.moveSpeed,
            jumpForce: this.jumpForce,
            width: this.width,
            height: this.height,
            color: this.color,
            secondaryColor: this.secondaryColor,
            attackPower: this.attackPower,
            x: this.x,
            y: this.y,
            facingRight: this.facingRight,
            state: this.state
        };
    }
    
    static deserialize(data) {
        const char = new Character(data, data.x, data.y, data.facingRight);
        char.health = data.health;
        char.energy = data.energy;
        char.state = data.state;
        return char;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Character;
}
