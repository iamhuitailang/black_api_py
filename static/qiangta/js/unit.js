class Unit {
    constructor(type, team, x, y) {
        const unitData = GameData.UNIT_TYPES[type];
        this.type = type;
        this.team = team;
        this.x = x;
        this.y = y;
        this.hp = unitData.hp;
        this.maxHp = unitData.hp;
        this.damage = unitData.damage;
        this.attackSpeed = unitData.attackSpeed;
        this.moveSpeed = unitData.moveSpeed;
        this.range = unitData.range;
        this.isFlying = unitData.isFlying;
        this.armor = unitData.armor;
        this.isRanged = unitData.isRanged || false;
        this.blocksRanged = unitData.blocksRanged || false;
        this.aoeDamage = unitData.aoeDamage || false;
        
        this.attackCooldown = 0;
        this.target = null;
        this.targetX = team === 'player' ? Infinity : -Infinity;
        this.width = 30;
        this.height = 30;
    }

    update(deltaTime, gameState) {
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        this.target = this.findTarget(gameState);
        
        if (this.target) {
            const distance = Math.abs(this.x - this.target.x);
            if (distance <= this.range) {
                if (this.attackCooldown <= 0) {
                    this.attack(this.target, gameState);
                    this.attackCooldown = this.attackSpeed;
                }
            } else {
                this.move(deltaTime, gameState);
            }
        } else {
            this.move(deltaTime, gameState);
        }
    }

    move(deltaTime, gameState) {
        const direction = this.team === 'player' ? 1 : -1;
        const moveAmount = this.moveSpeed * deltaTime * 60;
        
        const newX = this.x + direction * moveAmount;
        
        if (!this.checkCollision(newX, gameState)) {
            this.x = newX;
        }
    }

    checkCollision(newX, gameState) {
        if (this.isFlying) return false;
        
        for (const unit of gameState.units) {
            if (unit === this || unit.team === this.team || unit.isFlying) continue;
            
            const overlap = Math.abs(newX - unit.x) < (this.width + unit.width) / 2;
            const sameLane = Math.abs(this.y - unit.y) < this.height;
            
            if (overlap && sameLane) {
                return true;
            }
        }
        return false;
    }

    findTarget(gameState) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        const canvasWidth = gameState.canvas.width || 800;

        for (const unit of gameState.units) {
            if (unit.team === this.team) continue;
            
            if (!this.isFlying && unit.isFlying && this.type !== 'archer') continue;
            
            const distance = Math.abs(unit.x - this.x);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = unit;
            }
        }

        if (!closestEnemy || closestDistance > this.range * 3) {
            if (this.team === 'player') {
                if (this.x >= canvasWidth - GameData.BASE.WIDTH - 50) {
                    return { type: 'base', team: 'enemy', x: canvasWidth - GameData.BASE.WIDTH / 2, y: this.y };
                }
            } else {
                if (this.x <= GameData.BASE.WIDTH + 50) {
                    return { type: 'base', team: 'player', x: GameData.BASE.WIDTH / 2, y: this.y };
                }
            }
        }

        return closestEnemy;
    }

    attack(target, gameState) {
        let damage = this.damage;
        
        if (GameData.COUNTER_SYSTEM[this.type] && 
            GameData.COUNTER_SYSTEM[this.type].includes(target.type)) {
            damage *= GameData.COUNTER_DAMAGE_MULTIPLIER;
        }

        if (target.type !== 'base' && gameState.tower.owner === target.team) {
            damage *= (1 - GameData.TOWER.DEFENSE_BONUS);
        }

        if (gameState.tower.owner === this.team) {
            damage *= (1 + GameData.TOWER.ATTACK_BONUS);
        }

        if (target.armor) {
            damage = Math.max(1, damage - target.armor);
        }

        if (target.blocksRanged && this.isRanged && !this.isFlying) {
            damage *= 0.5;
        }

        if (this.aoeDamage && target.type !== 'base') {
            this.aoeAttack(target, damage, gameState);
        } else {
            this.applyDamage(target, damage, gameState);
        }
    }

    aoeAttack(target, baseDamage, gameState) {
        const aoeRadius = 50;
        for (const unit of gameState.units) {
            if (unit.team === this.team) continue;
            const distance = Math.sqrt(Math.pow(unit.x - target.x, 2) + Math.pow(unit.y - target.y, 2));
            if (distance <= aoeRadius) {
                const damageFalloff = 1 - (distance / aoeRadius) * 0.5;
                this.applyDamage(unit, baseDamage * damageFalloff, gameState);
            }
        }
    }

    applyDamage(target, damage, gameState) {
        if (target.type === 'base') {
            if (target.team === 'enemy') {
                gameState.enemy.baseHp = Math.max(0, gameState.enemy.baseHp - damage);
            } else {
                gameState.player.baseHp = Math.max(0, gameState.player.baseHp - damage);
            }
        } else {
            target.hp -= damage;
        }
    }

    isDead() {
        return this.hp <= 0;
    }
}