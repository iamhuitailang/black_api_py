class Character {
    constructor(type, x, y, facing = 1) {
        const config = GameConfig.CHARACTERS[type];
        this.type = type;
        this.name = config.name;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 50;
        this.height = 100;
        this.facing = facing;
        this.groundY = GameConfig.GROUND_Y;
        
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.attack = config.attack;
        this.defense = config.defense;
        this.speed = config.speed;
        this.jumpForce = config.jumpForce;
        this.faceColors = config.faceColors;
        this.ultimateDamage = config.ultimateDamage;
        this.bodyColor = config.bodyColor;
        this.costumeColor = config.costumeColor;
        
        this.maxEnergy = 100;
        this.energy = 0;
        
        this.isJumping = false;
        this.isCrouching = false;
        this.isAttacking = false;
        this.isHurt = false;
        this.isBlocking = false;
        this.isInvincible = false;
        this.isDead = false;
        
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackPhase = 'idle';
        
        this.hurtTimer = 0;
        this.invincibleTimer = 0;
        this.blockTimer = 0;
        
        this.currentFace = 0;
        this.faceNames = ['红脸', '黑脸', '粉脸', '蓝脸'];
        
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.state = 'idle';
    }
    
    update(deltaTime) {
        if (this.isDead) return;
        
        if (this.isHurt) {
            this.hurtTimer -= deltaTime;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
                this.state = 'idle';
            }
        }
        
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        if (this.isBlocking) {
            this.blockTimer -= deltaTime;
            if (this.blockTimer <= 0) {
                this.isBlocking = false;
            }
        }
        
        if (this.isAttacking) {
            this.updateAttack(deltaTime);
        }
        
        this.vy += GameConfig.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.y >= this.groundY - this.height) {
            this.y = this.groundY - this.height;
            this.vy = 0;
            this.isJumping = false;
        }
        
        if (this.x < 0) this.x = 0;
        if (this.x > GameConfig.CANVAS_WIDTH - this.width) {
            this.x = GameConfig.CANVAS_WIDTH - this.width;
        }
        
        this.animTimer += deltaTime;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        if (!this.isAttacking && !this.isHurt) {
            if (this.isJumping) {
                this.state = 'jump';
            } else if (this.isCrouching) {
                this.state = 'crouch';
            } else if (Math.abs(this.vx) > 0.1) {
                this.state = 'walk';
            } else {
                this.state = 'idle';
            }
        }
    }
    
    updateAttack(deltaTime) {
        this.attackTimer -= deltaTime;
        
        if (this.attackPhase === 'startup') {
            if (this.attackTimer <= 0) {
                this.attackPhase = 'active';
                this.attackTimer = 100;
            }
        } else if (this.attackPhase === 'active') {
            if (this.attackTimer <= 0) {
                this.attackPhase = 'recovery';
                this.attackTimer = this.currentAttack.recovery;
            }
        } else if (this.attackPhase === 'recovery') {
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.currentAttack = null;
                this.attackPhase = 'idle';
                this.state = 'idle';
            }
        }
    }
    
    move(direction) {
        if (this.isHurt || this.isDead) return;
        if (this.isAttacking) {
            this.vx = direction * this.speed * 0.3;
        } else {
            this.vx = direction * this.speed;
        }
    }
    
    stop() {
        this.vx = 0;
    }
    
    jump() {
        if (this.isJumping || this.isAttacking || this.isHurt || this.isDead || this.isCrouching) return;
        this.vy = -this.jumpForce;
        this.isJumping = true;
        this.state = 'jump';
    }
    
    crouch(isCrouching) {
        if (this.isJumping || this.isAttacking || this.isHurt || this.isDead) return;
        this.isCrouching = isCrouching;
    }
    
    attack(attackType) {
        if (this.isDead) return false;
        
        const attack = GameConfig.ATTACKS[attackType];
        if (!attack) return false;
        
        if (this.isAttacking || this.isHurt) {
            return false;
        }
        
        this.currentAttack = attack;
        this.isAttacking = true;
        this.attackPhase = 'startup';
        this.attackTimer = attack.startup;
        this.state = attack.type === 'kick' ? 'kick' : 'punch';
        
        return true;
    }
    
    ultimate(ultimateType) {
        if (this.energy < this.maxEnergy || this.isDead) return false;
        
        const ultimate = GameConfig.ULTIMATES[ultimateType];
        if (!ultimate) return false;
        
        this.energy = 0;
        this.currentAttack = { ...ultimate, startup: 200, recovery: 500, range: 200 };
        this.isAttacking = true;
        this.attackPhase = 'startup';
        this.attackTimer = 200;
        this.state = 'ultimate';
        
        if (ultimate.invincible) {
            this.isInvincible = true;
            this.invincibleTimer = 800;
        }
        
        return true;
    }
    
    switchFace() {
        this.currentFace = (this.currentFace + 1) % 4;
        this.addEnergy(5);
    }
    
    takeDamage(damage, attacker) {
        if (this.isInvincible || this.isDead) return 0;
        
        let actualDamage = damage - this.defense;
        if (this.isBlocking) {
            actualDamage = Math.floor(actualDamage * 0.3);
        }
        actualDamage = Math.max(1, actualDamage);
        
        this.health -= actualDamage;
        this.isHurt = true;
        this.hurtTimer = 300;
        this.state = 'hurt';
        
        if (attacker) {
            this.vx = (this.x > attacker.x ? 1 : -1) * 5;
        }
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.state = 'dead';
        }
        
        this.addEnergy(10);
        
        return actualDamage;
    }
    
    addEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }
    
    block() {
        if (this.isAttacking || this.isJumping || this.isHurt || this.isDead) return;
        this.isBlocking = true;
        this.blockTimer = 200;
    }
    
    getAttackHitbox() {
        if (!this.isAttacking || this.attackPhase !== 'active') return null;
        
        const attackRange = this.currentAttack.range;
        return {
            x: this.facing === 1 ? this.x + this.width : this.x - attackRange,
            y: this.y + 20,
            width: attackRange,
            height: this.height - 40
        };
    }
    
    getHitbox() {
        const hitboxHeight = this.isCrouching ? (this.height - 20) * 0.6 : this.height - 20;
        const hitboxY = this.isCrouching ? this.y + this.height - hitboxHeight - 10 : this.y + 10;
        return {
            x: this.x + 10,
            y: hitboxY,
            width: this.width - 20,
            height: hitboxHeight
        };
    }
    
    getCurrentFaceColor() {
        const faces = [
            '#ff4444',
            '#333333',
            '#ff69b4',
            '#4488ff'
        ];
        return faces[this.currentFace];
    }
    
    getCurrentFaceName() {
        return this.faceNames[this.currentFace];
    }
    
    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            facing: this.facing,
            health: this.health,
            energy: this.energy,
            currentFace: this.currentFace,
            isDead: this.isDead
        };
    }
    
    static deserialize(data) {
        const char = new Character(data.type, data.x, data.y, data.facing);
        char.health = data.health;
        char.energy = data.energy;
        char.currentFace = data.currentFace;
        char.isDead = data.isDead;
        return char;
    }
}
