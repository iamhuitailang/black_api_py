class Character {
    constructor(charType, isPlayer) {
        const charData = CHARACTERS[charType];
        this.charType = charType;
        this.isPlayer = isPlayer;
        this.name = charData.name;
        this.emoji = charData.emoji;
        this.type = charData.type;
        this.specialName = charData.specialName;
        
        this.jumpPower = charData.jumpPower;
        this.weight = charData.weight;
        this.agility = charData.agility;
        this.specialKnockback = charData.specialKnockback;
        this.color = charData.color;
        this.secondaryColor = charData.secondaryColor;
        
        this.width = 50;
        this.height = 70;
        this.x = isPlayer ? 250 : 650;
        this.y = GROUND_Y - this.height;
        this.vx = 0;
        this.vy = 0;
        
        this.facingRight = !isPlayer;
        this.isGrounded = true;
        this.onTrampoline = false;
        this.onEdge = false;
        this.isOut = false;
        
        this.maxStamina = STAMINA.max;
        this.stamina = STAMINA.max;
        this.jumpHeightMultiplier = 1;
        
        this.attackState = ATTACK_STATES.IDLE;
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.attackHitbox = null;
        this.attackAnim = 0;
        this.hasHit = false;
        
        this.knockbackTimer = 0;
        this.damageFlash = 0;
        
        this.lastTrampolineBounce = 0;
        this.lastSpringboardBounce = 0;
        this.trampolineAnim = 0;
        this.springboardAnim = 0;
        
        this.bobPhase = Math.random() * Math.PI * 2;
        this.squash = 1;
        this.stretch = 1;
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    isAttacking() {
        return this.attackState === ATTACK_STATES.ATTACKING;
    }

    getAttackHitbox() {
        return this.attackHitbox;
    }

    moveLeft() {
        if (this.knockbackTimer > 0) return;
        this.vx = -5 * this.agility;
        this.facingRight = false;
    }

    moveRight() {
        if (this.knockbackTimer > 0) return;
        this.vx = 5 * this.agility;
        this.facingRight = true;
    }

    jump(isHigh) {
        if (!this.isGrounded || this.knockbackTimer > 0) return;
        
        const staminaCost = isHigh ? STAMINA.jumpCost * 1.5 : STAMINA.jumpCost;
        if (this.stamina < staminaCost) return;
        
        this.stamina -= staminaCost;
        
        let jumpPower = this.jumpPower * this.jumpHeightMultiplier;
        const maxVelocity = Math.sqrt(2 * GRAVITY * this.weight * 300);
        if (jumpPower > maxVelocity) {
            jumpPower = maxVelocity;
        }
        
        this.vy = -jumpPower;
        this.isGrounded = false;
        this.onTrampoline = false;
        this.squash = 0.7;
        this.stretch = 1.3;
    }

    setJumpHeight(multiplier) {
        this.jumpHeightMultiplier = multiplier;
    }

    attack(type) {
        if (this.attackCooldown > 0 || this.attackState !== ATTACK_STATES.IDLE) return;
        
        const moveData = MOVES[type];
        if (!moveData) return;
        if (this.stamina < moveData.staminaCost) return;
        
        this.stamina -= moveData.staminaCost;
        this.currentAttack = type;
        this.attackState = ATTACK_STATES.ATTACKING;
        this.attackTimer = 150;
        this.attackCooldown = moveData.cooldown;
        this.attackAnim = 1;
        this.hasHit = false;
        
        const range = moveData.range;
        const heightAboveGround = GROUND_Y - this.y;
        
        if (heightAboveGround >= moveData.heightMin && heightAboveGround <= moveData.heightMax) {
            this.attackHitbox = {
                x: this.facingRight ? this.x + this.width : this.x - range,
                y: this.y,
                width: range,
                height: this.height,
                damage: moveData.damage,
                knockback: moveData.knockback,
                type: type
            };
        } else {
            this.attackHitbox = {
                x: this.facingRight ? this.x + this.width : this.x - range,
                y: this.y,
                width: range,
                height: this.height,
                damage: Math.floor(moveData.damage * 0.3),
                knockback: Math.floor(moveData.knockback * 0.3),
                type: type
            };
        }
    }

    updateTimers(deltaTime) {
        if (this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.attackState = ATTACK_STATES.IDLE;
                this.attackHitbox = null;
                this.currentAttack = null;
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= deltaTime;
        }
        
        if (this.damageFlash > 0) {
            this.damageFlash -= deltaTime;
        }
        
        if (this.attackAnim > 0) {
            this.attackAnim -= deltaTime / 300;
        }
        
        if (this.squash < 1) {
            this.squash += 0.1;
            if (this.squash > 1) this.squash = 1;
        }
        if (this.stretch > 1) {
            this.stretch -= 0.1;
            if (this.stretch < 1) this.stretch = 1;
        }
        
        if (this.trampolineAnim > 0) {
            this.trampolineAnim -= deltaTime / 300;
        }
        if (this.springboardAnim > 0) {
            this.springboardAnim -= deltaTime / 300;
        }
        
        if (this.isGrounded) {
            this.stamina = Math.min(STAMINA.max, this.stamina + STAMINA.regenRate);
        } else {
            this.stamina = Math.min(STAMINA.max, this.stamina + STAMINA.regenRate * 0.3);
        }
        
        this.bobPhase += 0.1;
        
        if (this.vy < -5) {
            this.stretch = 1.2;
            this.squash = 0.85;
        } else if (this.vy > 5) {
            this.stretch = 0.9;
            this.squash = 1.1;
        }
    }

    takeDamage(attacker, damage, knockback) {
        this.damageFlash = 200;
        const direction = attacker.x < this.x ? 1 : -1;
        
        let finalKnockback = knockback;
        if (this.onTrampoline) {
            finalKnockback *= 1.5;
        }
        if (this.onEdge) {
            finalKnockback *= 2;
        }
        
        Physics.applyKnockback(this, direction, finalKnockback);
        
        if (this.attackState === ATTACK_STATES.ATTACKING) {
            this.attackState = ATTACK_STATES.IDLE;
            this.attackHitbox = null;
            this.currentAttack = null;
        }
    }

    serialize() {
        return {
            charType: this.charType,
            isPlayer: this.isPlayer,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            facingRight: this.facingRight,
            stamina: this.stamina,
            isOut: this.isOut,
            jumpHeightMultiplier: this.jumpHeightMultiplier,
            attackCooldown: this.attackCooldown,
            knockbackTimer: this.knockbackTimer
        };
    }

    static deserialize(data, isPlayer) {
        const char = new Character(data.charType, isPlayer);
        char.x = data.x;
        char.y = data.y;
        char.vx = data.vx;
        char.vy = data.vy;
        char.facingRight = data.facingRight;
        char.stamina = data.stamina;
        char.isOut = data.isOut;
        char.jumpHeightMultiplier = data.jumpHeightMultiplier;
        char.attackCooldown = data.attackCooldown;
        char.knockbackTimer = data.knockbackTimer;
        return char;
    }
}