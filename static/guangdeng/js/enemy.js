class Enemy {
    constructor(type, pathSystem) {
        const config = CONFIG.ENEMIES[type];
        
        if (!config) {
            console.error('Enemy config not found for type:', type);
            return;
        }
        
        this.type = type;
        this.config = config;
        this.pathSystem = pathSystem;
        
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.armor = config.armor;
        this.speed = config.speed;
        this.reward = config.reward;
        this.flying = config.flying || false;
        this.canRevive = config.canRevive || false;
        this.hasRevived = false;
        this.isBoss = config.isBoss || false;
        
        this.x = 0;
        this.y = 0;
        this.distanceTraveled = 0;
        this.dead = false;
        this.reachedEnd = false;
        
        this.blocked = false;
        this.blocker = null;
        
        this.burning = false;
        this.burnDamage = 0;
        this.burnDuration = 0;
        
        this.stunned = false;
        this.stunDuration = 0;
        
        this.summonCooldown = 0;
        this.rangedCooldown = 0;
        
        this.size = config.size || 15;
        this.color = config.color || '#ff0000';
        
        const startPos = pathSystem.getPointAtDistance(0);
        this.x = startPos.x;
        this.y = startPos.y;
    }

    update(dt, enemies, towers, effects) {
        if (this.dead) return;

        if (this.burning) {
            this.burnDuration -= dt;
            if (this.burnDuration <= 0) {
                this.burning = false;
            } else {
                this.takeDamage(this.burnDamage * dt);
            }
        }

        if (this.stunned) {
            this.stunDuration -= dt;
            if (this.stunDuration <= 0) {
                this.stunned = false;
            }
            return;
        }

        if (this.blocked && this.blocker) {
            if (this.blocker.hp && this.blocker.hp <= 0) {
                this.blocked = false;
                this.blocker = null;
            }
        }

        if (!this.blocked) {
            this.distanceTraveled += this.speed * dt * 30;
            
            const pos = this.pathSystem.getPointAtDistance(this.distanceTraveled);
            
            if (pos.endOfPath) {
                this.reachedEnd = true;
                this.dead = true;
                return;
            }
            
            this.x = pos.x;
            this.y = pos.y;
        }

        if (this.config.summonSkeletons) {
            this.summonCooldown -= dt;
            if (this.summonCooldown <= 0) {
                this.summonCooldown = 8;
                for (let i = 0; i < 2; i++) {
                    const skeleton = new Enemy('skeleton', this.pathSystem);
                    skeleton.distanceTraveled = this.distanceTraveled - 20 - i * 10;
                    const pos = this.pathSystem.getPointAtDistance(Math.max(0, skeleton.distanceTraveled));
                    skeleton.x = pos.x;
                    skeleton.y = pos.y;
                    enemies.push(skeleton);
                }
                effects.push({
                    type: 'summon',
                    x: this.x,
                    y: this.y,
                    duration: 0.5,
                    maxDuration: 0.5
                });
            }
        }

        if (this.config.healAura) {
            const nearby = Utils.findEnemiesInRange(enemies, this.x, this.y, this.config.healRadius || 80);
            for (const ally of nearby) {
                if (ally !== this && !ally.dead) {
                    ally.hp = Math.min(ally.hp + this.config.healAura * dt, ally.maxHp);
                }
            }
        }

        if (this.config.stunAttack && Math.random() < 0.01) {
            effects.push({
                type: 'stunWave',
                x: this.x,
                y: this.y,
                duration: 0.5,
                maxDuration: 0.5
            });
        }
    }

    takeDamage(damage, ignoreArmor = false) {
        const finalDamage = Utils.calculateDamage(damage, this.armor, ignoreArmor);
        this.hp -= finalDamage;
        
        if (this.hp <= 0 && !this.dead) {
            if (this.canRevive && !this.hasRevived) {
                this.hp = this.maxHp * 0.5;
                this.hasRevived = true;
            } else {
                this.die();
            }
        }
        
        return finalDamage;
    }

    die() {
        this.dead = true;
        if (this.blocker) {
            this.blocker.blockedEnemy = null;
        }
    }

    applyBurn(damage, duration) {
        this.burning = true;
        this.burnDamage = damage;
        this.burnDuration = Math.max(this.burnDuration, duration);
    }

    applyStun(duration) {
        this.stunned = true;
        this.stunDuration = Math.max(this.stunDuration, duration);
    }

    getSize() {
        return this.config.size || 15;
    }

    getColor() {
        return this.config.color || '#ff0000';
    }
}
