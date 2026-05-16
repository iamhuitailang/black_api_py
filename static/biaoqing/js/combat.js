class CombatSystem {
    constructor() {
        this.hitEffects = [];
    }

    checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }

    processAttack(attacker, defender) {
        if (!attacker.hitActive || !attacker.currentAttack) return null;
        
        const attackConfig = CONFIG.ATTACKS[attacker.currentAttack] || 
                            CONFIG.SPECIALS[attacker.currentAttack];
        
        if (!attackConfig) return null;
        
        const hitbox = attacker.getHitbox();
        const defenderBox = defender.getBodybox();
        
        if (this.checkCollision(hitbox, defenderBox)) {
            const damage = Math.floor(attackConfig.damage * attacker.attackBonus);
            defender.takeDamage(damage);
            attacker.hitActive = false;
            
            this.addHitEffect(
                defender.x + defender.width / 2,
                defender.y + defender.height / 2,
                damage
            );
            
            return {
                damage,
                attacker: attacker.name,
                defender: defender.name
            };
        }
        
        return null;
    }

    processProjectiles(shooter, target) {
        const hits = [];
        
        shooter.projectiles = shooter.projectiles.filter(projectile => {
            const projBox = {
                x: projectile.x - 20,
                y: projectile.y - 20,
                width: 40,
                height: 40
            };
            
            const targetBox = target.getBodybox();
            
            if (this.checkCollision(projBox, targetBox)) {
                target.takeDamage(projectile.damage);
                hits.push({
                    damage: projectile.damage,
                    x: projectile.x,
                    y: projectile.y
                });
                
                this.addHitEffect(projectile.x, projectile.y, projectile.damage);
                return false;
            }
            
            return true;
        });
        
        return hits;
    }

    addHitEffect(x, y, damage) {
        this.hitEffects.push({
            x,
            y,
            damage,
            timer: 500,
            scale: 1
        });
    }

    updateEffects(deltaTime) {
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.timer -= deltaTime;
            effect.y -= 1;
            effect.scale = 1 + (500 - effect.timer) / 500 * 0.5;
            return effect.timer > 0;
        });
    }

    checkWinner(player, enemy) {
        if (!player.isAlive()) return 'enemy';
        if (!enemy.isAlive()) return 'player';
        return null;
    }

    getHitEffects() {
        return this.hitEffects;
    }
}

const combat = new CombatSystem();