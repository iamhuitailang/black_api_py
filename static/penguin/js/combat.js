import { ATTACKS, ULTIMATES, CONFIG } from './config.js';

export class Projectile {
    constructor(x, y, direction, damage, knockback, speed = 12, type = 'iceCone') {
        this.x = x;
        this.y = y;
        this.vx = direction * speed;
        this.vy = 0;
        this.width = 25;
        this.height = 25;
        this.damage = damage;
        this.knockback = knockback;
        this.type = type;
        this.lifetime = 3000;
        this.active = true;
        this.rotation = 0;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.lifetime -= deltaTime;
        this.rotation += 0.2;
        
        if (this.lifetime <= 0 || 
            this.x < CONFIG.ARENA.x - 100 || 
            this.x > CONFIG.ARENA.x + CONFIG.ARENA.width + 100) {
            this.active = false;
        }
    }

    checkCollision(target) {
        return this.x < target.x + target.width &&
               this.x + this.width > target.x &&
               this.y < target.y + target.height &&
               this.y + this.height > target.y;
    }
}

export class UltimateEffect {
    constructor(type, x, y, direction, owner) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.owner = owner;
        this.config = ULTIMATES[type];
        this.active = true;
        this.lifetime = 1500;
        this.width = this.config.range;
        this.height = 100;
        this.hasHit = new Set();
        this.projectiles = [];
        this.spawnTimer = 0;
        this.spawnIndex = 0;
    }

    updateIceStormProjectileSpawn(deltaTime) {
        if (this.type !== 'iceStorm') return;
        
        this.spawnTimer += deltaTime;
        const spawnInterval = 150;
        
        while (this.spawnTimer >= spawnInterval && this.spawnIndex < this.config.coneCount) {
            const angle = (Math.random() - 0.5) * Math.PI / 3;
            this.projectiles.push({
                x: this.x,
                y: this.y - 50,
                vx: Math.cos(angle) * this.direction * 8,
                vy: Math.sin(angle) * 8 - 3,
                width: 20,
                height: 20,
                damage: this.config.damage / this.config.coneCount,
                knockback: this.config.knockback,
                active: true
            });
            this.spawnTimer -= spawnInterval;
            this.spawnIndex++;
        }
    }

    update(deltaTime, opponent) {
        this.lifetime -= deltaTime;
        
        if (this.type === 'polarWave') {
            this.x += this.direction * 8;
            this.checkWaveHit(opponent);
        } else if (this.type === 'whaleRush') {
            this.x += this.direction * this.config.speed;
            this.checkWaveHit(opponent);
        } else if (this.type === 'iceStorm') {
            this.updateIceStormProjectileSpawn(deltaTime);
            this.updateIceStorm(deltaTime, opponent);
        }

        if (this.lifetime <= 0) {
            this.active = false;
            this.projectiles = [];
        }
    }

    checkWaveHit(opponent) {
        if (this.hasHit.has(opponent)) return;

        const hitboxX = this.direction > 0 ? this.x - this.width : this.x;
        if (this.rectIntersect(
            hitboxX, opponent.y, this.width, this.height,
            opponent.x, opponent.y, opponent.width, opponent.height
        )) {
            this.applyEffect(opponent);
            this.hasHit.add(opponent);
        }
    }

    updateIceStorm(deltaTime, opponent) {
        this.projectiles.forEach(p => {
            if (!p.active) return;
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;

            if (this.rectIntersect(p.x, p.y, p.width, p.height,
                    opponent.x, opponent.y, opponent.width, opponent.height)) {
                if (!this.hasHit.has(opponent)) {
                    opponent.takeDamage(p.damage);
                    opponent.takeKnockback(this.direction, p.knockback);
                    opponent.stun(this.config.stunDuration / this.config.coneCount);
                    this.hasHit.add(opponent);
                    setTimeout(() => this.hasHit.delete(opponent), 300);
                }
                p.active = false;
            }

            if (p.y > CONFIG.CANVAS_HEIGHT) {
                p.active = false;
            }
        });

        this.projectiles = this.projectiles.filter(p => p.active);
    }

    applyEffect(opponent) {
        opponent.takeDamage(this.config.damage);
        opponent.takeKnockback(this.direction, this.config.knockback * 1.5);
        
        if (this.config.slowEffect) {
            opponent.applySlow(this.config.slowEffect, this.config.duration);
        }
        if (this.config.stunDuration) {
            opponent.stun(this.config.stunDuration);
        }
    }

    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
}

export class CombatSystem {
    constructor() {
        this.projectiles = [];
        this.ultimateEffects = [];
    }

    fireProjectile(character) {
        const attack = ATTACKS.iceCone;
        const startX = character.x + (character.facing > 0 ? character.width : 0);
        const startY = character.y + character.height / 2 - 10;
        
        this.projectiles.push(new Projectile(
            startX, startY, character.facing,
            attack.damage + character.slideDamage * 0.3,
            attack.knockback,
            attack.speed
        ));
    }

    useUltimate(character, ultimateType) {
        const ultimate = ULTIMATES[ultimateType];
        if (character.energy < ultimate.energyCost) return false;

        character.energy -= ultimate.energyCost;
        
        const effectX = character.x + character.width / 2;
        const effectY = character.y + character.height / 2;
        
        this.ultimateEffects.push(new UltimateEffect(
            ultimateType, effectX, effectY, character.facing, character
        ));

        return true;
    }

    update(deltaTime, player, opponent) {
        this.projectiles.forEach(p => {
            p.update(deltaTime);
            
            const target = p.vx > 0 ? opponent : player;
            if (p.checkCollision(target) && !target.isFrozen) {
                target.takeDamage(p.damage);
                target.takeKnockback(p.vx > 0 ? 1 : -1, p.knockback);
                p.active = false;
            }
        });

        this.ultimateEffects.forEach(effect => {
            effect.update(deltaTime, effect.owner === player ? opponent : player);
        });

        this.projectiles = this.projectiles.filter(p => p.active);
        this.ultimateEffects = this.ultimateEffects.filter(e => e.active);
    }

    getState() {
        return {
            projectiles: this.projectiles.map(p => ({
                x: p.x, y: p.y, vx: p.vx,
                damage: p.damage, knockback: p.knockback,
                type: p.type, lifetime: p.lifetime
            })),
            ultimateEffects: this.ultimateEffects.map(e => ({
                type: e.type, x: e.x, y: e.y,
                direction: e.direction, lifetime: e.lifetime
            }))
        };
    }

    loadState(state) {
        this.projectiles = state.projectiles.map(p => {
            const proj = new Projectile(p.x, p.y, 1, p.damage, p.knockback);
            proj.vx = p.vx;
            proj.lifetime = p.lifetime;
            return proj;
        });
    }

    clear() {
        this.projectiles = [];
        this.ultimateEffects = [];
    }
}