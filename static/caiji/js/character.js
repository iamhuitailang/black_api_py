import { CHARACTERS, ATTACKS, ULTIMATES, GROUND_Y, GRAVITY, CANVAS_WIDTH } from './config.js';

export class Character {
    constructor(charType, x, isPlayer = true) {
        const config = CHARACTERS[charType];
        this.charType = charType;
        this.name = config.name;
        this.isPlayer = isPlayer;
        
        this.x = x;
        this.y = GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.attackPower = config.attack;
        this.defense = config.defense;
        this.speed = config.speed;
        this.jumpForce = config.jumpForce;
        
        this.width = 80;
        this.height = 90;
        
        this.facing = isPlayer ? 1 : -1;
        
        this.isJumping = false;
        this.isCrouching = false;
        this.isAttacking = false;
        this.isUltimate = false;
        this.isHurt = false;
        
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackPhase = 'idle';
        
        this.ultimateType = null;
        this.ultimateTimer = 0;
        
        this.hurtTimer = 0;
        this.hitFlashTimer = 0;
        
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        this.color = config.color;
        this.bodyColor = config.bodyColor;
        this.wingColor = config.wingColor;
        
        this.attackHitbox = null;
        this.hasHit = false;
        
        this.aiState = 'idle';
        this.aiTimer = 0;
        this.aiTargetX = 0;
    }

    update(deltaTime, inputManager, opponent) {
        if (this.isPlayer) {
            this.handlePlayerInput(inputManager, opponent);
        } else {
            this.handleAI(opponent);
        }
        
        this.applyPhysics();
        this.updateAttack(deltaTime, opponent);
        this.updateHurt(deltaTime);
        this.updateAnimation(deltaTime);
        
        this.x = Math.max(this.width / 2, Math.min(CANVAS_WIDTH - this.width / 2, this.x));
    }

    handlePlayerInput(inputManager, opponent) {
        if (this.isAttacking || this.isHurt) return;
        
        const movement = inputManager.getMovement();
        
        this.isCrouching = movement.y > 0 && !this.isJumping;
        
        if (!this.isCrouching) {
            this.vx = movement.x * this.speed;
            if (movement.x !== 0) {
                this.facing = movement.x;
            }
        }
        
        if (movement.y < 0 && !this.isJumping) {
            this.vy = -this.jumpForce;
            this.isJumping = true;
        }
        
        const ultimate = inputManager.checkUltimate();
        if (ultimate) {
            this.startUltimate(ultimate, opponent);
            return;
        }
        
        const attack = inputManager.getAttack();
        if (attack) {
            this.startAttack(attack);
        }
    }

    handleAI(opponent) {
        if (this.isAttacking || this.isHurt) return;
        
        this.aiTimer -= 16;
        if (this.aiTimer <= 0) {
            this.aiTimer = Math.random() * 1000 + 500;
            
            const dist = opponent.x - this.x;
            const absDist = Math.abs(dist);
            
            this.facing = dist > 0 ? 1 : -1;
            
            if (absDist > 200) {
                this.aiState = 'approach';
            } else if (absDist < 100) {
                this.aiState = 'attack';
            } else {
                this.aiState = Math.random() > 0.5 ? 'attack' : 'idle';
            }
            
            if (Math.random() > 0.85 && !this.isJumping) {
                this.vy = -this.jumpForce;
                this.isJumping = true;
            }
        }
        
        if (this.aiState === 'approach') {
            const dist = opponent.x - this.x;
            this.vx = Math.sign(dist) * this.speed * 0.7;
        } else if (this.aiState === 'attack') {
            const attacks = ['lightPeck', 'heavyPeck', 'lightWing', 'heavyWing'];
            const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
            this.startAttack(randomAttack);
            this.aiState = 'idle';
        } else {
            this.vx *= 0.8;
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
        
        if (!this.isAttacking) {
            this.vx *= 0.85;
        }
    }

    startAttack(attackType) {
        if (this.isAttacking || this.isHurt) return;
        
        this.isAttacking = true;
        this.currentAttack = attackType;
        this.attackPhase = 'startup';
        this.attackTimer = ATTACKS[attackType].startup;
        this.hasHit = false;
        this.vx *= 0.3;
    }

    startUltimate(ultimateType, opponent) {
        if (this.isAttacking || this.isHurt || this.isUltimate) return;
        
        this.isUltimate = true;
        this.isAttacking = true;
        this.ultimateType = ultimateType;
        this.ultimateTimer = 800;
        this.hasHit = false;
        
        const dist = opponent.x - this.x;
        this.facing = dist > 0 ? 1 : -1;
        
        if (ultimateType === 'flyingPeck' || ultimateType === 'slidePeck') {
            this.vx = this.facing * ULTIMATES[ultimateType].speed;
        } else if (ultimateType === 'wingSpin') {
            this.vx = 0;
        }
    }

    updateAttack(deltaTime, opponent) {
        if (!this.isAttacking) return;
        
        if (this.isUltimate) {
            this.ultimateTimer -= deltaTime;
            if (this.ultimateTimer <= 0) {
                this.isUltimate = false;
                this.isAttacking = false;
                this.ultimateType = null;
                this.attackHitbox = null;
                this.vx = 0;
            } else {
                this.updateUltimateHitbox(opponent);
            }
            return;
        }
        
        this.attackTimer -= deltaTime;
        
        if (this.attackPhase === 'startup' && this.attackTimer <= 0) {
            this.attackPhase = 'active';
            this.attackTimer = 100;
            this.createAttackHitbox();
        } else if (this.attackPhase === 'active') {
            this.checkAttackHit(opponent);
            if (this.attackTimer <= 0) {
                this.attackPhase = 'recovery';
                this.attackTimer = ATTACKS[this.currentAttack].recovery;
                this.attackHitbox = null;
            }
        } else if (this.attackPhase === 'recovery' && this.attackTimer <= 0) {
            this.isAttacking = false;
            this.currentAttack = null;
            this.attackPhase = 'idle';
        }
    }

    createAttackHitbox() {
        const attack = ATTACKS[this.currentAttack];
        const range = attack.range;
        this.attackHitbox = {
            x: this.x + this.facing * (this.width / 2 + range / 2),
            y: this.y - this.height / 2,
            width: range,
            height: this.height * 0.8
        };
    }

    updateUltimateHitbox(opponent) {
        let hitbox;
        
        if (this.ultimateType === 'flyingPeck') {
            hitbox = {
                x: this.x + this.facing * 60,
                y: this.y - this.height / 2,
                width: 100,
                height: this.height * 0.7
            };
        } else if (this.ultimateType === 'wingSpin') {
            hitbox = {
                x: this.x,
                y: this.y - this.height / 2,
                width: 180,
                height: this.height
            };
        } else if (this.ultimateType === 'slidePeck') {
            hitbox = {
                x: this.x + this.facing * 50,
                y: this.y - this.height / 3,
                width: 120,
                height: this.height * 0.5
            };
        }
        
        this.attackHitbox = hitbox;
        this.checkAttackHit(opponent);
    }

    checkAttackHit(opponent) {
        if (!this.attackHitbox || this.hasHit) return;
        
        const hitbox = this.attackHitbox;
        const oppX = opponent.x;
        const oppY = opponent.y - opponent.height / 2;
        
        if (hitbox.x - hitbox.width / 2 < oppX + opponent.width / 2 &&
            hitbox.x + hitbox.width / 2 > oppX - opponent.width / 2 &&
            hitbox.y - hitbox.height / 2 < oppY + opponent.height &&
            hitbox.y + hitbox.height / 2 > oppY) {
            
            this.hasHit = true;
            let damage;
            
            if (this.isUltimate) {
                damage = ULTIMATES[this.ultimateType].damage + this.attackPower * 0.5;
            } else {
                damage = ATTACKS[this.currentAttack].damage + this.attackPower * 0.3;
            }
            
            opponent.takeDamage(damage);
        }
    }

    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense * 0.3);
        this.health -= actualDamage;
        this.isHurt = true;
        this.hurtTimer = 300;
        this.hitFlashTimer = 200;
        
        this.vx = -this.facing * 5;
        this.vy = -3;
        
        if (this.health <= 0) {
            this.health = 0;
        }
    }

    updateHurt(deltaTime) {
        if (this.isHurt) {
            this.hurtTimer -= deltaTime;
            this.hitFlashTimer -= deltaTime;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
            }
        }
    }

    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer > 100) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 4;
        }
    }

    getState() {
        return {
            charType: this.charType,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            health: this.health,
            facing: this.facing,
            isJumping: this.isJumping,
            isCrouching: this.isCrouching,
            isAttacking: this.isAttacking,
            isUltimate: this.isUltimate,
            isHurt: this.isHurt,
            currentAttack: this.currentAttack,
            ultimateType: this.ultimateType
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.vx = state.vx;
        this.vy = state.vy;
        this.health = state.health;
        this.facing = state.facing;
        this.isJumping = state.isJumping;
        this.isCrouching = state.isCrouching;
        this.isAttacking = state.isAttacking;
        this.isUltimate = state.isUltimate;
        this.isHurt = state.isHurt;
        this.currentAttack = state.currentAttack;
        this.ultimateType = state.ultimateType;
    }
}