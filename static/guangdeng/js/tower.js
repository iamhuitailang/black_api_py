class Tower {
    constructor(type, x, y, slotIndex, level = 0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.slotIndex = slotIndex;
        this.level = level;
        this.config = CONFIG.TOWERS[type].levels[level];
        this.attackCooldown = 0;
        this.target = null;
        this.totalDamage = 0;
        this.kills = 0;
        this.soldiers = [];
        this.skillCooldown = 0;
        
        if (type === 'barracks') {
            this.spawnSoldiers();
        }
    }

    getStats() {
        return this.config;
    }

    canUpgrade() {
        return this.level < CONFIG.TOWERS[this.type].levels.length - 1;
    }

    getUpgradeCost() {
        if (!this.canUpgrade()) return 0;
        return CONFIG.TOWERS[this.type].levels[this.level + 1].cost;
    }

    getSellValue() {
        let totalCost = 0;
        for (let i = 0; i <= this.level; i++) {
            totalCost += CONFIG.TOWERS[this.type].levels[i].cost;
        }
        return Math.floor(totalCost * 0.6);
    }

    upgrade() {
        if (!this.canUpgrade()) return false;
        this.level++;
        this.config = CONFIG.TOWERS[this.type].levels[this.level];
        
        if (this.type === 'barracks') {
            this.spawnSoldiers();
        }
        return true;
    }

    spawnSoldiers() {
        this.soldiers = [];
        for (let i = 0; i < this.config.soldierCount; i++) {
            this.soldiers.push({
                x: this.x + Utils.random(-20, 20),
                y: this.y + Utils.random(-20, 20),
                hp: this.config.soldierHP,
                maxHp: this.config.soldierHP,
                damage: this.config.soldierDamage,
                armor: this.config.armor || 0,
                target: null,
                attackCooldown: 0,
                blockedEnemy: null,
                isCharging: false,
                chargeCooldown: 0
            });
        }
    }

    update(dt, enemies, projectiles, effects) {
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this.skillCooldown = Math.max(0, this.skillCooldown - dt);

        if (this.type === 'barracks') {
            this.updateSoldiers(dt, enemies, effects);
        } else {
            this.updateAttack(dt, enemies, projectiles, effects);
        }
    }

    updateAttack(dt, enemies, projectiles, effects) {
        if (!this.target || this.target.dead || !this.isInRange(this.target)) {
            this.target = this.findTarget(enemies);
        }

        if (this.target && this.attackCooldown <= 0) {
            this.attack(this.target, projectiles, effects);
            this.attackCooldown = 1 / this.config.attackSpeed;
        }
    }

    updateSoldiers(dt, enemies, effects) {
        for (const soldier of this.soldiers) {
            if (soldier.hp <= 0) continue;

            soldier.attackCooldown = Math.max(0, soldier.attackCooldown - dt);
            soldier.chargeCooldown = Math.max(0, soldier.chargeCooldown - dt);

            if (!soldier.blockedEnemy || soldier.blockedEnemy.dead) {
                soldier.blockedEnemy = null;
                
                const nearbyEnemy = Utils.findClosestEnemy(
                    enemies, soldier.x, soldier.y, 80, false, true
                );
                
                if (nearbyEnemy) {
                    const dist = Utils.distance(soldier.x, soldier.y, nearbyEnemy.x, nearbyEnemy.y);
                    if (dist <= 25) {
                        soldier.blockedEnemy = nearbyEnemy;
                        nearbyEnemy.blocked = true;
                        nearbyEnemy.blocker = soldier;
                    } else {
                        const dx = nearbyEnemy.x - soldier.x;
                        const dy = nearbyEnemy.y - soldier.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        soldier.x += (dx / dist) * 50 * dt;
                        soldier.y += (dy / dist) * 50 * dt;
                    }
                }
            }

            if (soldier.blockedEnemy && soldier.attackCooldown <= 0) {
                const damage = Utils.randomInt(soldier.damage.min, soldier.damage.max);
                const finalDamage = Utils.calculateDamage(damage, soldier.blockedEnemy.armor);
                soldier.blockedEnemy.takeDamage(finalDamage);
                soldier.attackCooldown = 1;
                
                effects.push({
                    type: 'hit',
                    x: soldier.blockedEnemy.x,
                    y: soldier.blockedEnemy.y,
                    duration: 0.2,
                    maxDuration: 0.2
                });
            }
        }

        this.soldiers = this.soldiers.filter(s => s.hp > 0);
        
        if (this.soldiers.length < this.config.soldierCount) {
            const respawnTime = 5;
            if (!this.respawnTimer) this.respawnTimer = 0;
            this.respawnTimer += dt;
            
            if (this.respawnTimer >= respawnTime) {
                this.respawnTimer = 0;
                this.soldiers.push({
                    x: this.x + Utils.random(-20, 20),
                    y: this.y + Utils.random(-20, 20),
                    hp: this.config.soldierHP,
                    maxHp: this.config.soldierHP,
                    damage: this.config.soldierDamage,
                    armor: this.config.armor || 0,
                    target: null,
                    attackCooldown: 0,
                    blockedEnemy: null
                });
            }
        }
    }

    findTarget(enemies) {
        const candidates = enemies.filter(e => 
            !e.dead && this.isInRange(e) && !(this.type === 'arrow' && e.flying === false)
        );
        
        if (this.type === 'arrow') {
            const flying = candidates.filter(e => e.flying);
            if (flying.length > 0) {
                return flying[0];
            }
        }
        
        return candidates.sort((a, b) => b.distanceTraveled - a.distanceTraveled)[0] || null;
    }

    isInRange(enemy) {
        return Utils.pointInCircle(enemy.x, enemy.y, this.x, this.y, this.config.range);
    }

    attack(enemy, projectiles, effects) {
        let damage = Utils.randomInt(this.config.damage.min, this.config.damage.max);
        
        if (this.config.critChance && Math.random() < this.config.critChance) {
            damage *= 2;
            effects.push({
                type: 'crit',
                x: enemy.x,
                y: enemy.y - 20,
                duration: 0.5,
                maxDuration: 0.5
            });
        }

        projectiles.push({
            x: this.x,
            y: this.y,
            targetX: enemy.x,
            targetY: enemy.y,
            target: enemy,
            damage: damage,
            speed: this.type === 'magic' ? 300 : this.type === 'cannon' ? 200 : 400,
            type: this.type,
            tower: this,
            splashRadius: this.config.splashRadius || 0,
            ignoreArmor: this.config.ignoreArmor || false,
            chainLightning: this.config.chainLightning || 0,
            burnDamage: this.config.burnDamage || 0
        });
    }

    useSkill(enemies, projectiles, effects) {
        if (this.skillCooldown > 0) return false;
        
        switch (this.config.skill) {
            case 'piercing':
                const targetLine = Utils.findEnemiesInRange(enemies, this.x, this.y, this.config.range);
                for (const enemy of targetLine.slice(0, 5)) {
                    const damage = Utils.randomInt(this.config.damage.min, this.config.damage.max) * 1.5;
                    projectiles.push({
                        x: this.x,
                        y: this.y,
                        targetX: enemy.x,
                        targetY: enemy.y,
                        target: enemy,
                        damage: damage,
                        speed: 500,
                        type: 'arrow',
                        tower: this,
                        ignoreArmor: true
                    });
                }
                break;
            case 'shieldWall':
                for (const soldier of this.soldiers) {
                    soldier.hp = Math.min(soldier.hp + 50, soldier.maxHp);
                    soldier.armor = (this.config.armor || 0) + 20;
                }
                effects.push({
                    type: 'shieldWall',
                    x: this.x,
                    y: this.y,
                    duration: 1,
                    maxDuration: 1
                });
                break;
            case 'teleport':
                const nearestEnemy = Utils.findClosestEnemy(enemies, this.x, this.y, this.config.range);
                if (nearestEnemy) {
                    nearestEnemy.distanceTraveled = Math.max(0, nearestEnemy.distanceTraveled - 200);
                    const pos = Utils.getPointOnPath(pathSystem.getPath(), nearestEnemy.distanceTraveled);
                    nearestEnemy.x = pos.x;
                    nearestEnemy.y = pos.y;
                }
                break;
            case 'orbital':
                const allEnemies = enemies.filter(e => !e.dead);
                for (const enemy of allEnemies) {
                    const damage = Utils.randomInt(this.config.damage.min, this.config.damage.max);
                    enemy.takeDamage(Utils.calculateDamage(damage, enemy.armor));
                    this.totalDamage += damage;
                }
                effects.push({
                    type: 'orbital',
                    x: this.canvasWidth / 2,
                    y: this.canvasHeight / 2,
                    duration: 1,
                    maxDuration: 1
                });
                break;
        }
        
        this.skillCooldown = 30;
        return true;
    }

    getSoldiers() {
        return this.soldiers;
    }
}
