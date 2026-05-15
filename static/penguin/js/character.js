import { CHARACTERS, CONFIG, ATTACKS } from './config.js';

export class Character {
    constructor(type, x, y, isPlayer = true) {
        const config = CHARACTERS[type];
        this.type = type;
        this.name = config.name;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = config.size;
        this.height = config.size;
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.energy = 0;
        this.maxEnergy = 100;
        this.speed = config.speed;
        this.jumpForce = config.jumpForce;
        this.friction = config.friction;
        this.defense = config.defense;
        this.slideDamage = config.slideDamage;
        this.color = config.color;
        this.bellyColor = config.bellyColor;
        this.isPlayer = isPlayer;
        this.facing = isPlayer ? 1 : -1;
        
        this.isGrounded = false;
        this.isJumping = false;
        this.isCrouching = false;
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackPhase = 'idle';
        
        this.isFrozen = false;
        this.frozenTimer = 0;
        this.isStunned = false;
        this.stunTimer = 0;
        this.slowMultiplier = 1;
        
        this.cooldowns = {
            lightSlide: 0,
            heavySlide: 0,
            iceCone: 0,
            jumpAttack: 0
        };
        
        this.isSliding = false;
        this.slideParticles = [];
    }

    update(deltaTime, keys, opponent) {
        if (this.isFrozen) {
            this.frozenTimer -= deltaTime;
            if (this.frozenTimer <= 0) {
                this.isFrozen = false;
            }
            return;
        }

        if (this.isStunned) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
            }
            return;
        }

        this.updateCooldowns(deltaTime);
        this.handleMovement(keys, deltaTime);
        this.handleAttacks(keys, opponent, deltaTime);
        this.updateSlideParticles(deltaTime);
    }

    updateCooldowns(deltaTime) {
        for (let key in this.cooldowns) {
            if (this.cooldowns[key] > 0) {
                this.cooldowns[key] -= deltaTime;
            }
        }
    }

    handleMovement(keys, deltaTime) {
        if (this.isAttacking && this.attackPhase !== 'idle') return;

        const actualSpeed = this.speed * this.slowMultiplier;

        if (keys.left) {
            this.vx = -actualSpeed;
            this.facing = -1;
        } else if (keys.right) {
            this.vx = actualSpeed;
            this.facing = 1;
        } else {
            this.vx *= this.friction;
        }

        if (keys.up && this.isGrounded && !this.isAttacking) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
        }

        this.isCrouching = keys.down && this.isGrounded && !this.isAttacking;
        if (this.isCrouching) {
            this.vx *= 0.5;
        }
    }

    handleAttacks(keys, opponent, deltaTime) {
        if (this.isAttacking) {
            this.updateAttack(opponent, deltaTime);
            return;
        }

        if (!this.isGrounded && keys.jumpAttack && this.cooldowns.jumpAttack <= 0) {
            this.startAttack('jumpAttack');
            return;
        }

        if (keys.light && this.cooldowns.lightSlide <= 0) {
            this.startAttack('lightSlide');
        } else if (keys.heavy && this.cooldowns.heavySlide <= 0) {
            this.startAttack('heavySlide');
        }
    }

    startAttack(attackType) {
        this.isAttacking = true;
        this.currentAttack = attackType;
        this.attackPhase = 'startup';
        this.attackTimer = ATTACKS[attackType].startup * 1000;
        this.cooldowns[attackType] = ATTACKS[attackType].cooldown;
        
        if (attackType === 'lightSlide' || attackType === 'heavySlide') {
            this.isSliding = true;
            this.vx = this.facing * (attackType === 'heavySlide' ? 12 : 8);
        }
    }

    updateAttack(opponent, deltaTime) {
        const attack = ATTACKS[this.currentAttack];
        this.attackTimer -= deltaTime;

        if (this.attackPhase === 'startup' && this.attackTimer <= 0) {
            this.attackPhase = 'active';
            this.attackTimer = 100;
            this.checkAttackHit(opponent, attack);
        } else if (this.attackPhase === 'active' && this.attackTimer <= 0) {
            this.attackPhase = 'recovery';
            this.attackTimer = attack.recovery * 1000;
        } else if (this.attackPhase === 'recovery' && this.attackTimer <= 0) {
            this.finishAttack();
        }
    }

    checkAttackHit(opponent, attack) {
        const attackX = this.x + (this.facing > 0 ? this.width : -attack.range);
        const attackWidth = attack.range;
        
        if (this.currentAttack === 'iceCone') {
            return;
        }

        const hitY = this.isGrounded ? this.y + this.height * 0.3 : this.y;
        const hitHeight = this.isGrounded ? this.height * 0.7 : this.height;
        
        if (this.rectIntersect(
            attackX, hitY, attackWidth, hitHeight,
            opponent.x, opponent.y, opponent.width, opponent.height
        )) {
            this.applyDamage(opponent, attack);
        }
    }

    applyDamage(opponent, attack) {
        const actualDamage = Math.max(1, attack.damage - opponent.defense * 0.3);
        opponent.takeDamage(actualDamage);
        opponent.vx = this.facing * attack.knockback * 1.5;
        opponent.vy = -attack.knockback * 0.8;
        opponent.isGrounded = false;
        
        this.energy = Math.min(this.maxEnergy, this.energy + 10);
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.createHitEffect();
    }

    takeKnockback(direction, force) {
        this.vx = direction * force;
        this.vy = -force * 0.3;
        this.isGrounded = false;
    }

    finishAttack() {
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackPhase = 'idle';
        this.isSliding = false;
    }

    applyPhysics(otherCharacter = null) {
        this.vy += CONFIG.GRAVITY;
        
        this.x += this.vx;
        this.y += this.vy;

        const groundY = CONFIG.ARENA.y;
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.isJumping = false;
        }

        const leftBound = CONFIG.ARENA.x;
        const rightBound = CONFIG.ARENA.x + CONFIG.ARENA.width;
        
        if (this.isGrounded) {
            if (this.x < leftBound) {
                this.vx += 0.5;
            }
            if (this.x + this.width > rightBound) {
                this.vx -= 0.5;
            }
        }
        
        if (otherCharacter) {
            this.resolveCollision(otherCharacter);
        }
    }

    resolveCollision(other) {
        const overlapX = Math.min(
            this.x + this.width - other.x,
            other.x + other.width - this.x
        );
        const overlapY = Math.min(
            this.y + this.height - other.y,
            other.y + other.height - this.y
        );
        
        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                const pushDir = this.x < other.x ? -1 : 1;
                const pushAmount = overlapX / 2 + 2;
                this.x += pushDir * pushAmount;
                other.x -= pushDir * pushAmount;
                
                this.vx *= 0.5;
                other.vx *= 0.5;
            } else {
                const pushDir = this.y < other.y ? -1 : 1;
                const pushAmount = overlapY / 2 + 2;
                this.y += pushDir * pushAmount;
                other.y -= pushDir * pushAmount;
                
                this.vy *= 0.5;
                other.vy *= 0.5;
            }
        }
    }

    isOutOfArena() {
        const leftBound = CONFIG.ARENA.x;
        const rightBound = CONFIG.ARENA.x + CONFIG.ARENA.width;
        const centerX = this.x + this.width / 2;
        
        const horizontalOut = centerX < leftBound - 30 || centerX > rightBound + 30;
        const verticalOut = this.y > CONFIG.ARENA.y + 50;
        
        return horizontalOut || verticalOut;
    }

    getFallProgress() {
        const leftBound = CONFIG.ARENA.x;
        const rightBound = CONFIG.ARENA.x + CONFIG.ARENA.width;
        const centerX = this.x + this.width / 2;
        
        let progress = 0;
        if (centerX < leftBound) {
            progress = Math.min(1, (leftBound - centerX) / 80);
        } else if (centerX > rightBound) {
            progress = Math.min(1, (centerX - rightBound) / 80);
        }
        
        if (this.y > CONFIG.ARENA.y) {
            progress = Math.max(progress, Math.min(1, (this.y - CONFIG.ARENA.y) / 100));
        }
        
        return progress;
    }

    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    freeze(duration) {
        this.isFrozen = true;
        this.frozenTimer = duration;
    }

    stun(duration) {
        this.isStunned = true;
        this.stunTimer = duration;
    }

    applySlow(multiplier, duration) {
        this.slowMultiplier = multiplier;
        setTimeout(() => {
            this.slowMultiplier = 1;
        }, duration);
    }

    createHitEffect() {
        const maxParticles = 30;
        const count = Math.min(6, maxParticles - this.slideParticles.length);
        for (let i = 0; i < count; i++) {
            this.slideParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 400,
                color: '#00d4ff'
            });
        }
    }

    updateSlideParticles(deltaTime) {
        this.slideParticles = this.slideParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            return p.life > 0;
        });

        if (this.isSliding && this.slideParticles.length < 20 && Math.random() > 0.6) {
            this.slideParticles.push({
                x: this.x + this.width / 2 - this.facing * this.width / 2,
                y: this.y + this.height - 5,
                vx: -this.facing * Math.random() * 2,
                vy: -Math.random() * 1.5,
                life: 250,
                color: '#a5f3fc'
            });
        }
    }

    getState() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            health: this.health,
            energy: this.energy,
            facing: this.facing,
            isGrounded: this.isGrounded,
            isCrouching: this.isCrouching,
            isAttacking: this.isAttacking,
            currentAttack: this.currentAttack,
            attackPhase: this.attackPhase,
            attackTimer: this.attackTimer,
            isFrozen: this.isFrozen,
            frozenTimer: this.frozenTimer,
            isStunned: this.isStunned,
            stunTimer: this.stunTimer
        };
    }

    loadState(state) {
        Object.assign(this, state);
    }
}