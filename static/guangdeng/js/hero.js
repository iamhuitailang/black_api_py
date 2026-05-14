class Hero {
    constructor(type, x, y) {
        const config = CONFIG.HEROES[type];
        this.type = type;
        this.config = config;
        this.name = config.name;
        
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        
        this.hp = config.hp;
        this.maxHp = config.maxHp;
        this.damage = config.damage;
        this.attackSpeed = config.attackSpeed;
        this.speed = config.speed;
        this.range = config.range;
        this.color = config.color;
        
        this.attackCooldown = 0;
        this.skillCooldown = 0;
        this.maxSkillCooldown = config.skill.cooldown;
        this.target = null;
        
        this.isMoving = false;
        this.isUsingSkill = false;
        this.skillEffect = null;
        
        this.level = 1;
        this.exp = 0;
        this.kills = 0;
    }

    update(dt, enemies, towers, effects, projectiles) {
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this.skillCooldown = Math.max(0, this.skillCooldown - dt);

        const distToTarget = Utils.distance(this.x, this.y, this.targetX, this.targetY);
        if (distToTarget > 5) {
            this.isMoving = true;
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.x += (dx / dist) * this.speed * dt * 30;
            this.y += (dy / dist) * this.speed * dt * 30;
        } else {
            this.isMoving = false;
        }

        if (!this.target || this.target.dead || !this.isInRange(this.target)) {
            this.target = Utils.findClosestEnemy(enemies, this.x, this.y, this.range);
        }

        if (this.target && this.attackCooldown <= 0) {
            this.attack(this.target, effects, projectiles);
            this.attackCooldown = 1 / this.attackSpeed;
        }
    }

    isInRange(enemy) {
        return Utils.pointInCircle(enemy.x, enemy.y, this.x, this.y, this.range);
    }

    attack(enemy, effects, projectiles) {
        const damage = Utils.randomInt(this.damage.min, this.damage.max);
        const finalDamage = Utils.calculateDamage(damage, enemy.armor);
        
        if (this.config.type === 'ranger' || this.config.type === 'mage') {
            projectiles.push({
                x: this.x,
                y: this.y,
                targetX: enemy.x,
                targetY: enemy.y,
                target: enemy,
                damage: finalDamage,
                speed: this.config.type === 'mage' ? 300 : 400,
                type: this.config.type === 'mage' ? 'magic' : 'arrow',
                ignoreArmor: this.config.type === 'mage'
            });
        } else {
            enemy.takeDamage(finalDamage);
            effects.push({
                type: 'hit',
                x: enemy.x,
                y: enemy.y,
                duration: 0.2,
                maxDuration: 0.2
            });
        }
    }

    useSkill(enemies, effects, projectiles) {
        if (this.skillCooldown > 0) return false;
        
        const skill = this.config.skill;
        this.isUsingSkill = true;
        this.skillCooldown = this.maxSkillCooldown;

        switch (this.type) {
            case 'gerard':
                const chargeTarget = Utils.findClosestEnemy(enemies, this.x, this.y, 200);
                if (chargeTarget) {
                    const damage = skill.damage;
                    chargeTarget.takeDamage(Utils.calculateDamage(damage, chargeTarget.armor));
                    chargeTarget.applyStun(1);
                    
                    const dx = chargeTarget.x - this.x;
                    const dy = chargeTarget.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    this.x = chargeTarget.x - (dx / dist) * 30;
                    this.y = chargeTarget.y - (dy / dist) * 30;
                }
                effects.push({
                    type: 'charge',
                    x: this.x,
                    y: this.y,
                    duration: 0.5,
                    maxDuration: 0.5
                });
                break;

            case 'alleria':
                const targets = Utils.findEnemiesInRange(enemies, this.x, this.y, skill.radius || 100);
                for (const enemy of targets) {
                    enemy.takeDamage(skill.damage);
                }
                
                const rainPoints = [];
                for (let i = 0; i < 15; i++) {
                    rainPoints.push({
                        r: (skill.radius || 100) * (0.3 + Math.random() * 0.7)
                    });
                }
                
                effects.push({
                    type: 'rain',
                    x: this.x,
                    y: this.y,
                    duration: 0.8,
                    maxDuration: 0.8,
                    radius: skill.radius || 100,
                    rainPoints: rainPoints
                });
                break;

            case 'magnus':
                const fireballTarget = Utils.findClosestEnemy(enemies, this.x, this.y, 300);
                if (fireballTarget) {
                    const fireEnemies = Utils.findEnemiesInRange(
                        enemies, fireballTarget.x, fireballTarget.y, skill.radius || 60
                    );
                    for (const enemy of fireEnemies) {
                        enemy.takeDamage(skill.damage);
                        enemy.applyBurn(5, 3);
                    }
                    effects.push({
                        type: 'fireball',
                        x: fireballTarget.x,
                        y: fireballTarget.y,
                        duration: 0.6,
                        maxDuration: 0.6,
                        radius: skill.radius || 60
                    });
                }
                break;

            case 'ingvar':
                const whirlEnemies = Utils.findEnemiesInRange(enemies, this.x, this.y, skill.radius || 60);
                for (const enemy of whirlEnemies) {
                    enemy.takeDamage(skill.damagePerTick);
                }
                effects.push({
                    type: 'whirlwind',
                    x: this.x,
                    y: this.y,
                    duration: skill.duration || 3,
                    maxDuration: skill.duration || 3,
                    radius: skill.radius || 60,
                    damage: skill.damagePerTick
                });
                break;

            case 'orlok':
                for (let i = 0; i < skill.skeletonCount; i++) {
                    const skeleton = {
                        x: this.x + Utils.random(-30, 30),
                        y: this.y + Utils.random(-30, 30),
                        hp: skill.skeletonHP,
                        maxHp: skill.skeletonHP,
                        damage: skill.skeletonDamage,
                        speed: 1.5,
                        target: null,
                        attackCooldown: 0
                    };
                    if (!this.summons) this.summons = [];
                    this.summons.push(skeleton);
                }
                effects.push({
                    type: 'summon',
                    x: this.x,
                    y: this.y,
                    duration: 0.5,
                    maxDuration: 0.5
                });
                break;
        }

        setTimeout(() => {
            this.isUsingSkill = false;
        }, 500);
        
        return true;
    }

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    takeDamage(damage) {
        this.hp -= damage;
        return this.hp <= 0;
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    getSkillReadyPercent() {
        if (this.maxSkillCooldown === 0) return 100;
        return ((this.maxSkillCooldown - this.skillCooldown) / this.maxSkillCooldown) * 100;
    }

    addKill() {
        this.kills++;
        this.exp += 10;
        
        const expNeeded = this.level * 100;
        if (this.exp >= expNeeded) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.exp = 0;
        this.maxHp += 20;
        this.hp = this.maxHp;
        this.damage.min += 3;
        this.damage.max += 5;
    }
}
