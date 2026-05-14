class ProjectileSystem {
    constructor() {
        this.projectiles = [];
        this.maxProjectiles = 50;
    }

    add(projectile) {
        this.projectiles.push(projectile);
        if (this.projectiles.length > this.maxProjectiles) {
            this.projectiles.shift();
        }
    }

    update(dt, enemies, effects) {
        const toRemove = [];

        for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) {
                this.hitTarget(p, enemies, effects);
                toRemove.push(i);
            } else {
                p.x += (dx / dist) * p.speed * dt;
                p.y += (dy / dist) * p.speed * dt;
            }
        }

        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.projectiles.splice(toRemove[i], 1);
        }
    }

    hitTarget(p, enemies, effects) {
        if (p.target && !p.target.dead) {
            const finalDamage = Utils.calculateDamage(p.damage, p.target.armor, p.ignoreArmor);
            p.target.takeDamage(finalDamage);
            
            if (p.tower) {
                p.tower.totalDamage += finalDamage;
                if (p.target.dead) {
                    p.tower.kills++;
                }
            }
        }

        if (p.splashRadius > 0) {
            const splashTargets = Utils.findEnemiesInRange(
                enemies, p.targetX, p.targetY, p.splashRadius
            );
            for (const enemy of splashTargets) {
                if (enemy !== p.target && !enemy.dead) {
                    const splashDamage = p.damage * 0.5;
                    enemy.takeDamage(Utils.calculateDamage(splashDamage, enemy.armor));
                }
            }
            effects.push({
                type: 'explosion',
                x: p.targetX,
                y: p.targetY,
                radius: p.splashRadius,
                duration: 0.3,
                maxDuration: 0.3
            });
        }

        if (p.chainLightning > 0) {
            let chainTargets = Utils.findEnemiesInRange(
                enemies, p.targetX, p.targetY, 100
            ).filter(e => e !== p.target && !e.dead).slice(0, p.chainLightning);
            
            let chainDamage = p.damage * 0.8;
            let lastX = p.targetX;
            let lastY = p.targetY;
            
            for (const enemy of chainTargets) {
                enemy.takeDamage(Utils.calculateDamage(chainDamage, enemy.armor, true));
                
                const lightningPoints = [];
                const steps = 5;
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    const x = lastX + (enemy.x - lastX) * t + (Math.random() - 0.5) * 20;
                    const y = lastY + (enemy.y - lastY) * t + (Math.random() - 0.5) * 20;
                    lightningPoints.push({ x, y });
                }
                
                effects.push({
                    type: 'lightning',
                    x1: lastX,
                    y1: lastY,
                    x2: enemy.x,
                    y2: enemy.y,
                    points: lightningPoints,
                    duration: 0.2,
                    maxDuration: 0.2
                });
                lastX = enemy.x;
                lastY = enemy.y;
                chainDamage *= 0.8;
            }
        }

        if (p.burnDamage > 0) {
            if (p.target && !p.target.dead) {
                p.target.applyBurn(p.burnDamage, 3);
            }
        }

        effects.push({
            type: 'hit',
            x: p.targetX,
            y: p.targetY,
            duration: 0.15,
            maxDuration: 0.15
        });
    }

    getAll() {
        return this.projectiles;
    }

    clear() {
        this.projectiles = [];
    }
}
