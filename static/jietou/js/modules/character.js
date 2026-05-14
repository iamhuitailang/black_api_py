import { CANVAS_WIDTH, GROUND_Y, GRAVITY, MAX_HEALTH, MAX_ENERGY, ATTACK_TYPES, CHARACTER_TYPES, ENEMY_TYPES, ENERGY_COST_BLOCK } from './constants.js';

export class Character {
    constructor(x, type, isEnemy = false, enemyType = 'NORMAL') {
        this.x = x;
        this.y = GROUND_Y;
        this.width = 60;
        this.height = 100;
        this.vx = 0;
        this.vy = 0;
        this.isEnemy = isEnemy;
        this.facing = isEnemy ? -1 : 1;
        
        if (isEnemy) {
            this.enemyConfig = ENEMY_TYPES[enemyType] || ENEMY_TYPES.NORMAL;
            this.characterType = CHARACTER_TYPES[this.enemyConfig.characterType];
        } else {
            this.characterType = CHARACTER_TYPES[enemyType] || CHARACTER_TYPES.NORMAL;
            this.enemyConfig = null;
        }
        
        this.speed = this.characterType.speed;
        this.jumpPower = this.characterType.jumpPower;
        
        this.health = MAX_HEALTH * (this.enemyConfig ? this.enemyConfig.healthMultiplier : 1);
        this.maxHealth = this.health;
        this.energy = 0;
        this.isDead = false;
        
        this.isJumping = false;
        this.isBlocking = false;
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackHitBox = null;
        
        this.isStunned = false;
        this.stunTimer = 0;
        
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.comboCount = 0;
        this.lastLightAttackTime = 0;
        
        this.state = 'idle';
    }

    update(deltaTime, input, opponent) {
        if (this.isDead) return;

        if (this.isStunned) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
                this.state = 'idle';
            }
            this.applyPhysics();
            return;
        }

        if (this.isAttacking) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.currentAttack = null;
                this.attackHitBox = null;
                this.state = 'idle';
            }
            this.applyPhysics();
            return;
        }

        if (!this.isEnemy) {
            this.handlePlayerInput(input);
        }

        this.applyPhysics();
        this.updateAnimation(deltaTime);
        this.checkAttackHit(opponent);
    }

    handlePlayerInput(input) {
        if (input.isBlock() && this.energy >= ENERGY_COST_BLOCK) {
            this.isBlocking = true;
            this.state = 'block';
            this.vx = 0;
        } else {
            this.isBlocking = false;
        }

        if (!this.isBlocking) {
            const dir = input.getMoveDirection();
            if (dir !== 0) {
                this.vx = dir * this.speed;
                this.facing = dir;
                this.state = 'walk';
            } else {
                this.vx = 0;
                if (!this.isJumping) {
                    this.state = 'idle';
                }
            }

            if (input.isJump() && !this.isJumping) {
                this.vy = -this.jumpPower;
                this.isJumping = true;
                this.state = 'jump';
            }

            if (input.isLightAttack()) {
                this.lightAttack();
            }

            if (input.isHeavyAttack()) {
                this.heavyAttack();
            }

            if (input.isUltimate() && this.energy >= 100) {
                this.ultimate();
            }
        }
    }

    lightAttack() {
        const now = Date.now();
        let attackType;

        if (this.isJumping) {
            attackType = ATTACK_TYPES.JUMP_LIGHT;
        } else if (now - this.lastLightAttackTime < 300 && this.comboCount > 0) {
            attackType = ATTACK_TYPES.LIGHT_KICK;
            this.comboCount = 0;
        } else {
            attackType = ATTACK_TYPES.LIGHT_PUNCH;
            this.comboCount = 1;
        }

        this.lastLightAttackTime = now;
        this.startAttack(attackType);
    }

    heavyAttack() {
        const attackType = this.isJumping ? ATTACK_TYPES.JUMP_HEAVY : ATTACK_TYPES.HEAVY_PUNCH;
        this.startAttack(attackType);
    }

    ultimate() {
        this.startAttack(ATTACK_TYPES.ULTIMATE);
        this.energy = 0;
    }

    startAttack(attackType) {
        this.isAttacking = true;
        this.currentAttack = attackType;
        this.attackTimer = attackType.duration;
        this.state = 'attack';
        this.vx = 0;

        const attackSpeed = this.characterType.attackSpeedBonus || 1;
        this.attackTimer /= attackSpeed;

        this.attackHitBox = {
            x: this.facing > 0 ? this.x + this.width / 2 : this.x - attackType.range,
            y: this.y - this.height / 2,
            width: attackType.range,
            height: 80
        };
    }

    checkAttackHit(opponent) {
        if (!this.isAttacking || !this.attackHitBox || opponent.isDead) return;

        const hitBox = this.attackHitBox;
        const opponentX = opponent.x;
        const opponentY = opponent.y - opponent.height / 2;

        if (hitBox.x < opponentX + opponent.width &&
            hitBox.x + hitBox.width > opponentX &&
            hitBox.y < opponentY + opponent.height &&
            hitBox.y + hitBox.height > opponentY) {
            
            this.onHit(opponent);
            this.attackHitBox = null;
        }
    }

    onHit(opponent) {
        const attack = this.currentAttack;
        let damage = attack.damage * this.characterType.damageMultiplier;

        if (opponent.characterType.dodgeChance && Math.random() < opponent.characterType.dodgeChance) {
            return;
        }

        if (opponent.isBlocking && !attack.unblockable) {
            if (attack.breakBlock) {
                opponent.isBlocking = false;
            } else {
                damage *= 0.5;
                opponent.energy -= ENERGY_COST_BLOCK;
            }
        }

        opponent.takeDamage(damage, attack);
        opponent.vx = this.facing * attack.knockback;
        
        this.energy = Math.min(MAX_ENERGY, this.energy + attack.energyGain);
    }

    takeDamage(damage, attack) {
        this.health = Math.max(0, this.health - damage * this.characterType.defenseMultiplier);
        this.isStunned = true;
        this.stunTimer = attack.stunTime;
        this.isAttacking = false;
        this.state = 'hit';

        if (this.health <= 0) {
            this.isDead = true;
            this.state = 'dead';
        }
    }

    applyPhysics() {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y >= GROUND_Y) {
            this.y = GROUND_Y;
            this.vy = 0;
            this.isJumping = false;
        }

        this.x = Math.max(this.width / 2, Math.min(CANVAS_WIDTH - this.width / 2, this.x));

        if (!this.isAttacking && !this.isStunned) {
            this.vx *= 0.8;
        }
    }

    updateAnimation(deltaTime) {
        this.animTimer += deltaTime;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.facing, 1);

        if (this.isEnemy) {
            ctx.strokeStyle = '#ff4444';
        } else {
            ctx.strokeStyle = '#44ff44';
        }

        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        this.drawStickman(ctx);

        ctx.restore();
    }

    drawStickman(ctx) {
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.arc(0, -70, 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -55);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(-25, -20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(25, -20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-20, 25);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(20, 25);
        ctx.stroke();
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            energy: this.energy,
            facing: this.facing,
            characterTypeId: this.characterType.id,
            isDead: this.isDead
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.health = state.health;
        this.maxHealth = state.maxHealth;
        this.energy = state.energy;
        this.facing = state.facing;
        this.isDead = state.isDead;
    }
}
