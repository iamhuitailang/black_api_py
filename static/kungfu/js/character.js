class Character {
    constructor(config, isPlayer = true) {
        this.id = config.id;
        this.name = config.name;
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.attack = config.attack;
        this.defense = config.defense;
        this.speed = config.speed;
        this.jumpPower = config.jumpPower;
        this.ultDamage = config.ultDamage;
        this.colors = config.colors;
        this.isPlayer = isPlayer;

        this.width = 60;
        this.height = 100;
        this.x = isPlayer ? 150 : 810;
        this.y = GameData.gameConfig.groundY - this.height;
        this.velocityX = 0;
        this.velocityY = 0;

        this.state = GameData.states.IDLE;
        this.facing = isPlayer ? 1 : -1;
        this.isGrounded = true;
        this.isBlocking = false;
        this.isCrouching = false;

        this.energy = 50;
        this.maxEnergy = GameData.gameConfig.maxEnergy;

        this.attackTimer = 0;
        this.attackType = null;
        this.attackPhase = null;
        this.attackHit = false;

        this.hurtTimer = 0;
        this.hurtDuration = 300;

        this.knockdownTimer = 0;
        this.knockdownDuration = 1000;

        this.animFrame = 0;
        this.animTimer = 0;

        this.hitEffectTimer = 0;
        this.hitEffectX = 0;
        this.hitEffectY = 0;
        this.blockTimer = 0;
    }

    update(deltaTime, opponent) {
        if (this.state === GameData.states.DEAD) return;

        try {
            this.updatePhysics(deltaTime);
            this.updateFacing(opponent);
            this.updateState(deltaTime);
            this.updateAnimation(deltaTime);

            if (this.hitEffectTimer > 0) {
                this.hitEffectTimer -= deltaTime;
            }

            this.sanityCheck();
        } catch (e) {
            console.error('角色更新错误:', e, this);
            this.recoverFromError();
        }
    }

    updatePhysics(deltaTime) {
        if (!this.isGrounded) {
            this.velocityY += GameData.gameConfig.gravity;
            this.y += this.velocityY;

            const groundY = GameData.gameConfig.groundY - this.height;
            if (this.y >= groundY) {
                this.y = groundY;
                this.velocityY = 0;
                this.isGrounded = true;
                if (this.state === GameData.states.JUMPING) {
                    this.state = GameData.states.IDLE;
                }
            }
        }

        if (this.state === GameData.states.WALKING) {
            this.x += this.velocityX;
        }

        this.x = Math.max(this.width / 2, Math.min(GameData.gameConfig.canvasWidth - this.width / 2, this.x));
    }

    updateFacing(opponent) {
        if (this.state !== GameData.states.ATTACKING && this.state !== GameData.states.HURT) {
            this.facing = opponent.x > this.x ? 1 : -1;
        }
    }

    updateState(deltaTime) {
        if (this.state === GameData.states.ATTACKING) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                if (this.attackPhase === 'startup') {
                    this.attackPhase = 'active';
                    this.attackTimer = 100;
                } else if (this.attackPhase === 'active') {
                    this.attackPhase = 'recovery';
                    this.attackTimer = GameData.attacks[this.attackType].recovery;
                } else {
                    this.state = GameData.states.IDLE;
                    this.attackType = null;
                    this.attackPhase = null;
                    this.attackHit = false;
                }
            }
        }

        if (this.state === GameData.states.HURT) {
            this.hurtTimer -= deltaTime;
            if (this.hurtTimer <= 0) {
                this.state = GameData.states.IDLE;
            }
        }

        if (this.state === GameData.states.KNOCKDOWN) {
            this.knockdownTimer -= deltaTime;
            if (this.knockdownTimer <= 0) {
                this.state = GameData.states.IDLE;
            }
        }
    }

    updateAnimation(deltaTime) {
        this.animTimer += deltaTime;
        if (this.animTimer >= 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    move(direction) {
        if (this.canAct()) {
            this.state = GameData.states.WALKING;
            this.velocityX = direction * this.speed;
        }
    }

    stopMove() {
        if (this.state === GameData.states.WALKING) {
            this.state = GameData.states.IDLE;
            this.velocityX = 0;
        }
    }

    jump() {
        if (this.canAct() && this.isGrounded) {
            this.state = GameData.states.JUMPING;
            this.velocityY = -this.jumpPower;
            this.isGrounded = false;
        }
    }

    crouch(isCrouching) {
        if (this.canAct() && this.isGrounded) {
            this.isCrouching = isCrouching;
            this.state = isCrouching ? GameData.states.CROUCHING : GameData.states.IDLE;
        }
    }

    block(isBlocking) {
        if (this.canAct() && this.isGrounded) {
            this.isBlocking = isBlocking;
            this.state = isBlocking ? GameData.states.BLOCKING : GameData.states.IDLE;
        }
    }

    attack(attackType) {
        if (!this.canAct()) return false;

        const attackData = GameData.attacks[attackType];
        if (this.energy < attackData.energyCost) return false;

        this.energy -= attackData.energyCost;
        this.isBlocking = false;
        this.isCrouching = false;
        this.state = GameData.states.ATTACKING;
        this.attackType = attackType;
        this.attackPhase = 'startup';
        this.attackTimer = attackData.startup;
        this.attackHit = false;
        this.velocityX = 0;
        this.blockTimer = 0;

        return true;
    }

    takeDamage(damage, attacker) {
        if (this.state === GameData.states.DEAD) return;

        let actualDamage = damage;

        if (this.isBlocking) {
            actualDamage = Math.floor(damage * 0.3);
            this.energy = Math.min(this.maxEnergy, this.energy + GameData.gameConfig.energyOnBlock);
        } else {
            actualDamage = Math.max(1, damage - this.defense);
            this.energy = Math.min(this.maxEnergy, this.energy + GameData.gameConfig.energyOnGetHit);
        }

        this.health = Math.max(0, this.health - actualDamage);

        this.hitEffectTimer = 300;
        this.hitEffectX = this.x;
        this.hitEffectY = this.y + this.height / 2;

        if (this.health <= 0) {
            this.state = GameData.states.DEAD;
        } else if (!this.isBlocking) {
            this.state = GameData.states.HURT;
            this.hurtTimer = this.hurtDuration;
            this.velocityX = attacker.facing * 3;
        }

        return actualDamage;
    }

    addEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    canAct() {
        return this.state !== GameData.states.ATTACKING &&
               this.state !== GameData.states.HURT &&
               this.state !== GameData.states.KNOCKDOWN &&
               this.state !== GameData.states.DEAD;
    }

    sanityCheck() {
        if (this.state === GameData.states.ATTACKING) {
            if (!this.attackType || !GameData.attacks[this.attackType]) {
                console.warn('攻击状态异常，自动恢复', this);
                this.recoverFromError();
            }
        }

        if (this.y > GameData.gameConfig.groundY) {
            this.y = GameData.gameConfig.groundY - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        }

        if (this.x < this.width / 2) this.x = this.width / 2;
        if (this.x > GameData.gameConfig.canvasWidth - this.width / 2) {
            this.x = GameData.gameConfig.canvasWidth - this.width / 2;
        }

        if (this.energy < 0) this.energy = 0;
        if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
        if (this.health < 0) this.health = 0;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
    }

    recoverFromError() {
        this.state = this.isGrounded ? GameData.states.IDLE : GameData.states.JUMPING;
        this.attackType = null;
        this.attackPhase = null;
        this.attackTimer = 0;
        this.attackHit = false;
        this.hurtTimer = 0;
        this.knockdownTimer = 0;
        this.blockTimer = 0;
        this.isBlocking = false;
        this.isCrouching = false;
    }

    getAttackHitbox() {
        if (this.state !== GameData.states.ATTACKING || this.attackPhase !== 'active') {
            return null;
        }

        const attackData = GameData.attacks[this.attackType];
        const range = attackData.range;

        return {
            x: this.facing === 1 ? this.x + this.width / 2 : this.x - this.width / 2 - range,
            y: this.y + 20,
            width: range,
            height: 60
        };
    }

    getBodyHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    reset() {
        this.health = this.maxHealth;
        this.energy = 0;
        this.x = this.isPlayer ? 150 : 810;
        this.y = GameData.gameConfig.groundY - this.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.state = GameData.states.IDLE;
        this.facing = this.isPlayer ? 1 : -1;
        this.isGrounded = true;
        this.isBlocking = false;
        this.isCrouching = false;
        this.attackType = null;
        this.attackPhase = null;
        this.attackTimer = 0;
        this.hurtTimer = 0;
        this.knockdownTimer = 0;
        this.blockTimer = 0;
    }

    serialize() {
        return {
            id: this.id,
            health: this.health,
            energy: this.energy,
            x: this.x,
            y: this.y,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            state: this.state,
            facing: this.facing,
            isGrounded: this.isGrounded,
            isBlocking: this.isBlocking,
            isCrouching: this.isCrouching,
            attackType: this.attackType,
            attackPhase: this.attackPhase,
            attackTimer: this.attackTimer,
            hurtTimer: this.hurtTimer,
            knockdownTimer: this.knockdownTimer,
            blockTimer: this.blockTimer
        };
    }

    deserialize(data) {
        this.health = data.health;
        this.energy = data.energy;
        this.x = data.x;
        this.y = data.y;
        this.velocityX = data.velocityX;
        this.velocityY = data.velocityY;
        this.state = data.state;
        this.facing = data.facing;
        this.isGrounded = data.isGrounded;
        this.isBlocking = data.isBlocking;
        this.isCrouching = data.isCrouching;
        this.attackType = data.attackType;
        this.attackPhase = data.attackPhase;
        this.attackTimer = data.attackTimer;
        this.hurtTimer = data.hurtTimer;
        this.knockdownTimer = data.knockdownTimer;
        this.blockTimer = data.blockTimer || 0;
    }
}
