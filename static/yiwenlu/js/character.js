import { GAME_CONFIG, CHARACTER_DATA, ATTACK_DATA, SKILL_DATA } from './config.js';

export const CharacterState = {
    IDLE: 'idle',
    WALK: 'walk',
    JUMP: 'jump',
    CROUCH: 'crouch',
    ATTACK_STARTUP: 'attackStartup',
    ATTACK_ACTIVE: 'attackActive',
    ATTACK_RECOVERY: 'attackRecovery',
    HURT: 'hurt',
    SKILL: 'skill',
    ULTIMATE: 'ultimate',
    DEAD: 'dead',
    BLOCK: 'block',
};

export class Character {
    constructor(charId, isPlayer, x) {
        const data = CHARACTER_DATA[charId];
        this.charId = charId;
        this.isPlayer = isPlayer;
        this.name = data.name;
        this.type = data.type;
        this.icon = data.icon;
        this.color = data.color;
        this.secondaryColor = data.secondaryColor;
        
        this.maxHp = data.maxHp;
        this.hp = data.maxHp;
        this.attackPower = data.attack;
        this.defense = data.defense;
        this.speed = data.speed;
        this.jumpPower = data.jumpPower;
        this.skillDamage = data.skillDamage;
        this.ultimateDamage = data.ultimateDamage;
        
        this.x = x;
        this.y = GAME_CONFIG.GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        this.width = 80;
        this.height = 100;
        this.facing = isPlayer ? 1 : -1;
        
        this.state = CharacterState.IDLE;
        this.stateTime = 0;
        this.currentAttack = null;
        this.currentSkill = null;
        this.attackTimer = 0;
        this.hitRegistered = false;
        
        this.energy = 0;
        this.maxEnergy = GAME_CONFIG.MAX_ENERGY;
        this.isGrounded = true;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.isBlocking = false;
        
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.hurtFlash = 0;
        this.knockback = 0;
        
        this.projectiles = [];
        this.effects = [];
    }

    update(deltaTime, opponent) {
        this.stateTime += deltaTime;
        this.animTimer += deltaTime;
        
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        if (this.hurtFlash > 0) {
            this.hurtFlash -= deltaTime;
        }
        
        if (this.knockback !== 0) {
            this.x += this.knockback;
            this.knockback *= 0.8;
            if (Math.abs(this.knockback) < 0.5) {
                this.knockback = 0;
            }
        }
        
        if (this.state === CharacterState.DEAD) {
            return;
        }
        
        if (this.state === CharacterState.HURT) {
            if (this.stateTime > 300) {
                this.setState(CharacterState.IDLE);
            }
            this.applyPhysics();
            return;
        }
        
        if (this.isAttacking()) {
            if (this.currentSkill) {
                this.updateSkill(deltaTime, opponent);
            } else {
                this.updateAttack(deltaTime, opponent);
            }
            this.applyPhysics();
            return;
        }
        
        if (this.state === CharacterState.BLOCK) {
            if (!this.isBlocking) {
                this.setState(CharacterState.IDLE);
            }
            this.applyPhysics();
            return;
        }
        
        this.updatePhysics();
        this.updateFacing(opponent);
    }

    updatePhysics() {
        if (!this.isGrounded) {
            this.vy += GAME_CONFIG.GRAVITY;
            this.y += this.vy;
            
            if (this.y >= GAME_CONFIG.GROUND_Y) {
                this.y = GAME_CONFIG.GROUND_Y;
                this.vy = 0;
                this.isGrounded = true;
                if (this.state === CharacterState.JUMP) {
                    this.setState(CharacterState.IDLE);
                }
            }
        }
        
        if (this.state === CharacterState.WALK) {
            this.x += this.vx;
            this.vx *= GAME_CONFIG.FRICTION;
            if (Math.abs(this.vx) < 0.1) {
                this.vx = 0;
                if (this.isGrounded) {
                    this.setState(CharacterState.IDLE);
                }
            }
        }
        
        this.x = Math.max(50, Math.min(GAME_CONFIG.WIDTH - 50, this.x));
    }

    applyPhysics() {
        this.x += this.vx;
        this.vx *= GAME_CONFIG.FRICTION;
        if (Math.abs(this.vx) < 0.1) {
            this.vx = 0;
        }
        
        if (!this.isGrounded) {
            this.vy += GAME_CONFIG.GRAVITY;
            this.y += this.vy;
            
            if (this.y >= GAME_CONFIG.GROUND_Y) {
                this.y = GAME_CONFIG.GROUND_Y;
                this.vy = 0;
                this.isGrounded = true;
            }
        }
        
        this.x = Math.max(50, Math.min(GAME_CONFIG.WIDTH - 50, this.x));
    }

    updateFacing(opponent) {
        if (opponent) {
            this.facing = opponent.x > this.x ? 1 : -1;
        }
    }

    updateAttack(deltaTime, opponent) {
        if (!this.currentAttack) return;
        
        const attackData = ATTACK_DATA[this.currentAttack];
        
        if (this.state === CharacterState.ATTACK_STARTUP) {
            if (this.stateTime >= attackData.startup) {
                this.setState(CharacterState.ATTACK_ACTIVE);
                this.hitRegistered = false;
            }
        } else if (this.state === CharacterState.ATTACK_ACTIVE) {
            if (!this.hitRegistered) {
                if (this.checkHit(opponent, attackData.range, attackData.height)) {
                    this.hitTarget(opponent, attackData);
                    this.hitRegistered = true;
                }
            }
            if (this.stateTime >= attackData.startup + attackData.active) {
                this.setState(CharacterState.ATTACK_RECOVERY);
            }
        } else if (this.state === CharacterState.ATTACK_RECOVERY) {
            if (this.stateTime >= attackData.startup + attackData.active + attackData.recovery) {
                this.finishAttack();
            }
        }
    }

    updateSkill(deltaTime, opponent) {
        if (!this.currentSkill) return;
        
        const skillData = SKILL_DATA[this.currentSkill];
        
        if (skillData.invincible) {
            this.isInvincible = true;
        }
        
        if (this.state === CharacterState.ATTACK_STARTUP) {
            if (this.stateTime >= skillData.startup) {
                this.setState(CharacterState.ATTACK_ACTIVE);
                this.hitRegistered = false;
                
                if (skillData.type === 'projectile') {
                    this.fireProjectile(skillData);
                }
            }
        } else if (this.state === CharacterState.ATTACK_ACTIVE) {
            if (skillData.type === 'projectile') {
                this.updateProjectiles(deltaTime, opponent);
            } else if (skillData.type === 'rush') {
                this.x += this.facing * 10;
                if (!this.hitRegistered && this.checkHit(opponent, skillData.range, 100)) {
                    this.hitTarget(opponent, skillData, true);
                    this.hitRegistered = true;
                }
            } else if (skillData.type === 'aoe') {
                if (!this.hitRegistered && this.checkHit(opponent, skillData.range, 100)) {
                    this.hitTarget(opponent, skillData, true);
                    this.hitRegistered = true;
                }
            } else if (skillData.type === 'quake') {
                if (!this.hitRegistered && Math.abs(opponent.x - this.x) < skillData.range && opponent.isGrounded) {
                    this.hitTarget(opponent, skillData, true);
                    this.hitRegistered = true;
                }
            }
            
            if (this.stateTime >= skillData.startup + skillData.active) {
                this.setState(CharacterState.ATTACK_RECOVERY);
            }
        } else if (this.state === CharacterState.ATTACK_RECOVERY) {
            this.updateProjectiles(deltaTime, opponent);
            if (this.stateTime >= skillData.startup + skillData.active + skillData.recovery) {
                this.finishAttack();
            }
        }
    }

    fireProjectile(skillData) {
        this.projectiles.push({
            x: this.x + this.facing * 40,
            y: this.y - 50,
            vx: this.facing * skillData.speed,
            damage: skillData.damage + this.skillDamage,
            active: true,
            life: 2000,
            type: this.type,
        });
    }

    updateProjectiles(deltaTime, opponent) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx;
            proj.life -= deltaTime;
            
            if (proj.active && !opponent.isInvincible) {
                const dx = proj.x - opponent.x;
                const dy = proj.y - (opponent.y - 50);
                if (Math.sqrt(dx * dx + dy * dy) < 50) {
                    this.hitTarget(opponent, { damage: proj.damage }, true);
                    proj.active = false;
                }
            }
            
            if (proj.life <= 0 || proj.x < 0 || proj.x > GAME_CONFIG.WIDTH || !proj.active) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkHit(opponent, range, height) {
        const dx = opponent.x - this.x;
        const thisCenterY = this.y - 50;
        const opponentCenterY = opponent.y - 50;
        const dy = Math.abs(opponentCenterY - thisCenterY);
        return this.facing * dx > 0 && Math.abs(dx) < range && dy < height;
    }

    hitTarget(opponent, attackData, isSkill = false) {
        let damage = attackData.damage;
        if (isSkill) {
            damage += this.skillDamage;
        } else {
            damage += this.attackPower;
        }
        
        if (opponent.isBlocking && opponent.state === CharacterState.BLOCK) {
            damage = Math.floor(damage * 0.3);
            opponent.energy = Math.min(opponent.maxEnergy, opponent.energy + GAME_CONFIG.ENERGY_PER_BLOCK);
        } else {
            damage = Math.max(1, damage - opponent.defense);
            opponent.energy = Math.min(opponent.maxEnergy, opponent.energy + GAME_CONFIG.ENERGY_PER_HIT);
        }
        
        opponent.takeDamage(damage, this.facing);
        this.energy = Math.min(this.maxEnergy, this.energy + (attackData.energyGain || 10));
        
        this.addEffect(this.x + this.facing * 40, this.y - 50, 'hit');
        opponent.addEffect(opponent.x, opponent.y - 50, 'hurt');
    }

    takeDamage(damage, attackerFacing) {
        this.hp = Math.max(0, this.hp - damage);
        this.hurtFlash = 200;
        this.knockback = attackerFacing * 8;
        this.isInvincible = true;
        this.invincibleTimer = GAME_CONFIG.INVINCIBLE_TIME;
        
        if (this.hp <= 0) {
            this.setState(CharacterState.DEAD);
        } else if (this.state !== CharacterState.HURT) {
            this.setState(CharacterState.HURT);
        }
    }

    move(direction) {
        if (this.isAttacking() || this.state === CharacterState.HURT || this.state === CharacterState.DEAD) return;
        
        if (direction !== 0) {
            this.vx = direction * this.speed;
            if (this.isGrounded && this.state !== CharacterState.JUMP) {
                this.setState(CharacterState.WALK);
            }
        }
    }

    jump() {
        if (!this.isGrounded || this.isAttacking() || this.state === CharacterState.HURT || this.state === CharacterState.DEAD) return;
        
        this.vy = -this.jumpPower;
        this.isGrounded = false;
        this.setState(CharacterState.JUMP);
        this.addEffect(this.x, this.y, 'jump');
    }

    crouch(isCrouching) {
        if (this.isAttacking() || this.state === CharacterState.HURT || this.state === CharacterState.DEAD) return;
        
        if (isCrouching && this.isGrounded) {
            this.setState(CharacterState.CROUCH);
        } else if (this.state === CharacterState.CROUCH) {
            this.setState(CharacterState.IDLE);
        }
    }

    attack(attackType) {
        if (this.isAttacking() || this.state === CharacterState.HURT || this.state === CharacterState.DEAD) return false;
        if (!ATTACK_DATA[attackType]) return false;
        
        this.currentAttack = attackType;
        this.currentSkill = null;
        this.setState(CharacterState.ATTACK_STARTUP);
        return true;
    }

    useSkill(skillId) {
        if (this.isAttacking() || this.state === CharacterState.HURT || this.state === CharacterState.DEAD) return false;
        if (!SKILL_DATA[skillId]) return false;
        
        this.currentSkill = skillId;
        this.currentAttack = null;
        this.setState(CharacterState.ATTACK_STARTUP);
        return true;
    }

    useUltimate(skillId) {
        if (this.energy < this.maxEnergy) return false;
        if (this.isAttacking() || this.state === CharacterState.HURT || this.state === CharacterState.DEAD) return false;
        
        this.energy = 0;
        this.currentSkill = skillId;
        this.currentAttack = null;
        this.setState(CharacterState.ATTACK_STARTUP);
        return true;
    }

    block(isBlocking) {
        if (this.isAttacking() || this.state === CharacterState.HURT || this.state === CharacterState.DEAD) return;
        if (!this.isGrounded) return;
        
        this.isBlocking = isBlocking;
        if (isBlocking) {
            this.setState(CharacterState.BLOCK);
        } else if (this.state === CharacterState.BLOCK) {
            this.setState(CharacterState.IDLE);
        }
    }

    finishAttack() {
        this.currentAttack = null;
        this.currentSkill = null;
        this.hitRegistered = false;
        this.setState(CharacterState.IDLE);
    }

    setState(newState) {
        this.state = newState;
        this.stateTime = 0;
    }

    isAttacking() {
        return this.state === CharacterState.ATTACK_STARTUP ||
               this.state === CharacterState.ATTACK_ACTIVE ||
               this.state === CharacterState.ATTACK_RECOVERY ||
               this.state === CharacterState.SKILL ||
               this.state === CharacterState.ULTIMATE;
    }

    addEffect(x, y, type) {
        this.effects.push({
            x, y, type,
            life: 500,
            maxLife: 500,
            frame: 0,
        });
    }

    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].life -= deltaTime;
            this.effects[i].frame++;
            if (this.effects[i].life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }

    reset(x) {
        this.hp = this.maxHp;
        this.energy = 0;
        this.x = x;
        this.y = GAME_CONFIG.GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        this.state = CharacterState.IDLE;
        this.stateTime = 0;
        this.currentAttack = null;
        this.currentSkill = null;
        this.attackTimer = 0;
        this.hitRegistered = false;
        this.isGrounded = true;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.isBlocking = false;
        this.hurtFlash = 0;
        this.knockback = 0;
        this.projectiles = [];
        this.effects = [];
        this.facing = this.isPlayer ? 1 : -1;
    }
}
