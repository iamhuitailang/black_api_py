import { CANVAS_WIDTH, GROUND_Y, GRAVITY, JUMP_FORCE, ATTACK_DAMAGE, ATTACK_DURATION, ATTACK_COOLDOWN } from './constants.js';

export class Cat {
    constructor(characterData, x, isPlayer = true) {
        this.character = characterData;
        this.x = x;
        this.y = GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        this.width = 120;
        this.height = 100;
        this.isPlayer = isPlayer;
        this.facing = isPlayer ? 1 : -1;

        this.health = characterData.maxHealth;
        this.maxHealth = characterData.maxHealth;
        this.speed = characterData.speed;
        this.attackPower = characterData.attackPower;
        this.colors = characterData.colors;

        this.isJumping = false;
        this.isCrouching = false;
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackFrame = 0;
        this.attackCooldowns = {};
        this.isHurt = false;
        this.hurtFrame = 0;

        this.animationFrame = 0;
        this.tailWag = 0;
    }

    update(keys, opponent) {
        this.animationFrame++;
        this.tailWag = Math.sin(this.animationFrame * 0.1) * 10;

        if (this.isHurt) {
            this.hurtFrame--;
            if (this.hurtFrame <= 0) {
                this.isHurt = false;
            }
        }

        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame >= ATTACK_DURATION[this.currentAttack]) {
                this.isAttacking = false;
                this.currentAttack = null;
            }
            return;
        }

        for (let attack in this.attackCooldowns) {
            if (this.attackCooldowns[attack] > 0) {
                this.attackCooldowns[attack]--;
            }
        }

        if (this.isPlayer) {
            this.handlePlayerInput(keys);
        } else {
            this.handleAI(opponent);
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.y >= GROUND_Y) {
            this.y = GROUND_Y;
            this.vy = 0;
            this.isJumping = false;
        }

        if (this.x < 50) this.x = 50;
        if (this.x > CANVAS_WIDTH - 150) this.x = CANVAS_WIDTH - 150;

        this.vx *= 0.8;
        if (!this.isJumping) {
            this.vy += GRAVITY;
        }
    }

    handlePlayerInput(keys) {
        if (keys.ArrowLeft) {
            this.vx = -this.speed;
            this.facing = -1;
        }
        if (keys.ArrowRight) {
            this.vx = this.speed;
            this.facing = 1;
        }

        if (keys.ArrowUp && !this.isJumping && !this.isCrouching) {
            this.vy = JUMP_FORCE;
            this.isJumping = true;
        }

        this.isCrouching = keys.ArrowDown && !this.isJumping;
    }

    handleAI(opponent) {
        const distance = opponent.x - this.x;
        const absDistance = Math.abs(distance);

        if (absDistance > 200) {
            this.vx = distance > 0 ? this.speed * 0.7 : -this.speed * 0.7;
            this.facing = distance > 0 ? 1 : -1;
        } else if (absDistance < 100) {
            this.vx = distance > 0 ? -this.speed * 0.5 : this.speed * 0.5;
        }

        if (absDistance < 180 && Math.random() < 0.02) {
            this.vy = JUMP_FORCE * 0.8;
            this.isJumping = true;
        }

        if (absDistance < 150 && Math.random() < 0.03) {
            const attacks = ['light_paw', 'heavy_paw', 'light_tail'];
            this.attack(attacks[Math.floor(Math.random() * attacks.length)]);
        }
    }

    attack(type) {
        if (this.isAttacking) return false;
        if (this.attackCooldowns[type] && this.attackCooldowns[type] > 0) return false;

        this.isAttacking = true;
        this.currentAttack = type;
        this.attackFrame = 0;
        this.attackCooldowns[type] = ATTACK_COOLDOWN[type];
        return true;
    }

    getAttackHitbox() {
        if (!this.isAttacking) return null;

        const attackProgress = this.attackFrame / ATTACK_DURATION[this.currentAttack];
        if (attackProgress < 0.3 || attackProgress > 0.7) return null;

        let hitboxWidth, hitboxHeight, offsetX;

        switch (this.currentAttack) {
            case 'light_paw':
                hitboxWidth = 60;
                hitboxHeight = 40;
                offsetX = 70;
                break;
            case 'heavy_paw':
                hitboxWidth = 80;
                hitboxHeight = 50;
                offsetX = 80;
                break;
            case 'light_tail':
                hitboxWidth = 70;
                hitboxHeight = 35;
                offsetX = -50;
                break;
            case 'heavy_tail':
                hitboxWidth = 90;
                hitboxHeight = 45;
                offsetX = -60;
                break;
            case 'special':
                hitboxWidth = 200;
                hitboxHeight = 100;
                offsetX = 100;
                break;
            default:
                return null;
        }

        return {
            x: this.x + (this.facing > 0 ? offsetX : -offsetX - hitboxWidth + this.width),
            y: this.y - this.height / 2 - hitboxHeight / 2,
            width: hitboxWidth,
            height: hitboxHeight
        };
    }

    takeDamage(attackType, attackPower) {
        const baseDamage = ATTACK_DAMAGE[attackType];
        const damage = Math.floor(baseDamage * attackPower);
        this.health = Math.max(0, this.health - damage);
        this.isHurt = true;
        this.hurtFrame = 15;
        return damage;
    }

    getState() {
        return {
            characterId: this.character.id,
            x: this.x,
            y: this.y,
            health: this.health,
            facing: this.facing,
            isJumping: this.isJumping,
            isCrouching: this.isCrouching,
            isAttacking: this.isAttacking,
            currentAttack: this.currentAttack,
            attackFrame: this.attackFrame,
            attackCooldowns: this.attackCooldowns,
            isHurt: this.isHurt,
            hurtFrame: this.hurtFrame
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.health = state.health;
        this.facing = state.facing;
        this.isJumping = state.isJumping;
        this.isCrouching = state.isCrouching;
        this.isAttacking = state.isAttacking;
        this.currentAttack = state.currentAttack;
        this.attackFrame = state.attackFrame;
        this.attackCooldowns = state.attackCooldowns || {};
        this.isHurt = state.isHurt;
        this.hurtFrame = state.hurtFrame || 0;
    }
}
