class Character {
    constructor(type, x, isPlayer = false) {
        const config = CONFIG.CHARACTERS[type];
        this.type = type;
        this.name = config.name;
        this.isPlayer = isPlayer;
        
        this.x = x;
        this.y = CONFIG.GROUND_Y - 80;
        this.vx = 0;
        this.vy = 0;
        this.width = 60;
        this.height = 80;
        
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.attack = config.attack;
        this.defense = config.defense;
        this.moveSpeed = config.moveSpeed;
        this.attackSpeed = config.attackSpeed;
        this.specialDamage = config.specialDamage;
        this.color = config.color;
        
        this.special = 0;
        this.maxSpecial = 100;
        
        this.facing = isPlayer ? 1 : -1;
        this.state = 'idle';
        this.attackFrame = 0;
        this.attackCooldown = 0;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeLevel = 0;
        
        this.isCrouching = false;
        this.isJumping = false;
        this.isGrounded = true;
        
        this.hitStun = 0;
        this.invincible = 0;
        this.isBlocking = false;
        
        this.comboInput = [];
        this.comboTimer = 0;
        
        this.panRotation = 0;
        this.specialActive = false;
        this.specialTimer = 0;
    }

    update(opponent) {
        if (this.hitStun > 0) {
            this.hitStun--;
            this.state = 'hit';
        }
        
        if (this.invincible > 0) {
            this.invincible--;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) {
                this.comboInput = [];
            }
        }
        
        if (this.specialActive) {
            this.specialTimer--;
            this.panRotation += 0.5;
            if (this.specialTimer <= 0) {
                this.specialActive = false;
                this.state = 'idle';
            }
        }
        
        if (this.isCharging) {
            this.chargeLevel = Math.min(1, (Date.now() - this.chargeStartTime) / CONFIG.CHARGE_TIME);
        }
        
        this.applyPhysics();
        this.handleBoundaries();
        
        if (this.state === 'attack' && !this.specialActive) {
            this.attackFrame++;
            const attackDuration = Math.floor(30 / this.attackSpeed);
            if (this.attackFrame >= attackDuration) {
                this.state = 'idle';
                this.attackFrame = 0;
            }
        }
        
        if (this.state !== 'attack' && this.state !== 'hit' && !this.specialActive) {
            if (Math.abs(this.vx) > 0.5) {
                this.state = 'walk';
            } else if (this.isCrouching) {
                this.state = 'crouch';
            } else if (!this.isGrounded) {
                this.state = 'jump';
            } else if (this.state !== 'attack') {
                this.state = 'idle';
            }
        }
    }

    applyPhysics() {
        this.vy += CONFIG.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= CONFIG.FRICTION;
        
        if (this.y >= CONFIG.GROUND_Y - this.height) {
            this.y = CONFIG.GROUND_Y - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.isJumping = false;
        }
    }

    handleBoundaries() {
        if (this.x < CONFIG.BOUNDARY_LEFT - 100) {
            this.x = CONFIG.BOUNDARY_LEFT - 100;
        }
        if (this.x > CONFIG.BOUNDARY_RIGHT - this.width + 100) {
            this.x = CONFIG.BOUNDARY_RIGHT - this.width + 100;
        }
    }

    moveLeft() {
        if (this.hitStun > 0 || this.specialActive) return;
        this.vx = -this.moveSpeed;
        this.facing = -1;
    }

    moveRight() {
        if (this.hitStun > 0 || this.specialActive) return;
        this.vx = this.moveSpeed;
        this.facing = 1;
    }

    jump() {
        if (this.hitStun > 0 || !this.isGrounded || this.specialActive) return;
        this.vy = -15;
        this.isGrounded = false;
        this.isJumping = true;
        this.isCrouching = false;
    }

    crouch() {
        if (this.hitStun > 0 || !this.isGrounded || this.specialActive) return;
        this.isCrouching = true;
        this.vx *= 0.3;
    }

    standUp() {
        this.isCrouching = false;
    }

    lightAttack() {
        if (this.attackCooldown > 0 || this.hitStun > 0 || this.specialActive) return null;
        
        this.state = 'attack';
        this.attackFrame = 0;
        this.attackCooldown = Math.floor(25 / this.attackSpeed);
        this.isCharging = false;
        this.chargeLevel = 0;
        
        return {
            damage: this.attack,
            knockback: CONFIG.KNOCKBACK_FORCE,
            type: 'light'
        };
    }

    heavyAttack() {
        if (this.attackCooldown > 0 || this.hitStun > 0 || this.specialActive) return null;
        
        this.state = 'attack';
        this.attackFrame = 0;
        this.attackCooldown = Math.floor(40 / this.attackSpeed);
        this.isCharging = false;
        
        const chargeMultiplier = 1 + this.chargeLevel * (CONFIG.MAX_CHARGE_MULTIPLIER - 1);
        this.chargeLevel = 0;
        
        return {
            damage: Math.floor(this.attack * 1.8 * chargeMultiplier),
            knockback: CONFIG.KNOCKBACK_FORCE * 1.5 * chargeMultiplier,
            type: 'heavy'
        };
    }

    startCharge() {
        if (this.attackCooldown > 0 || this.hitStun > 0 || this.specialActive) return;
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.chargeLevel = 0;
    }

    specialAttack() {
        if (this.special < CONFIG.SPECIAL_COST || this.hitStun > 0 || this.specialActive) return null;
        
        this.special -= CONFIG.SPECIAL_COST;
        this.specialActive = true;
        this.specialTimer = 60;
        this.state = 'attack';
        this.attackFrame = 0;
        
        return {
            damage: this.specialDamage,
            knockback: CONFIG.KNOCKBACK_FORCE * 2,
            type: 'special'
        };
    }

    takeDamage(attackInfo, fromX) {
        if (this.invincible > 0) return;
        
        const direction = fromX < this.x ? 1 : -1;
        
        let damage = attackInfo.damage - this.defense;
        if (this.isBlocking && attackInfo.type !== 'heavy' && attackInfo.type !== 'special') {
            damage = Math.floor(damage * 0.3);
        } else {
            damage = Math.max(1, damage);
            this.vx = direction * attackInfo.knockback;
            this.hitStun = 20;
            this.invincible = 30;
        }
        
        this.health = Math.max(0, this.health - damage);
        this.special = Math.min(this.maxSpecial, this.special + Math.floor(damage * 0.5));
        
        return damage;
    }

    gainSpecial() {
        this.special = Math.min(this.maxSpecial, this.special + CONFIG.SPECIAL_GAIN_PER_HIT);
    }

    isOutOfBounds() {
        return this.x < CONFIG.BOUNDARY_LEFT - 50 || this.x > CONFIG.BOUNDARY_RIGHT - this.width + 50;
    }

    getAttackHitbox() {
        const panReach = 70;
        const panWidth = 40;
        const panHeight = this.isCrouching ? 30 : 50;
        
        let x, y;
        
        if (this.facing === 1) {
            x = this.x + this.width;
        } else {
            x = this.x - panWidth;
        }
        
        y = this.y + (this.isCrouching ? 40 : 20);
        
        return {
            x: x,
            y: y,
            width: panReach,
            height: panHeight
        };
    }

    addComboInput(input) {
        this.comboInput.push(input);
        this.comboTimer = 30;
        
        if (this.comboInput.length > 6) {
            this.comboInput.shift();
        }
    }

    checkSpecialCombo() {
        const pattern = ['down', 'down-right', 'right'];
        const input = this.comboInput.slice(-3);
        
        if (input.length < 3) return false;
        
        for (let i = 0; i < pattern.length; i++) {
            if (input[i] !== pattern[i]) return false;
        }
        
        return true;
    }

    getState() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            health: this.health,
            special: this.special,
            facing: this.facing,
            state: this.state,
            isCrouching: this.isCrouching,
            isGrounded: this.isGrounded,
            isCharging: this.isCharging,
            chargeLevel: this.chargeLevel,
            specialActive: this.specialActive,
            specialTimer: this.specialTimer
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.vx = state.vx;
        this.vy = state.vy;
        this.health = state.health;
        this.special = state.special;
        this.facing = state.facing;
        this.state = state.state;
        this.isCrouching = state.isCrouching;
        this.isGrounded = state.isGrounded;
        this.isCharging = state.isCharging;
        this.chargeLevel = state.chargeLevel;
        this.specialActive = state.specialActive;
        this.specialTimer = state.specialTimer;
    }
}