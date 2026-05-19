const CombatManager = {
    projectiles: [],
    
    init() {
        this.projectiles = [];
    },
    
    update(deltaTime, player, enemy, particleSystem) {
        this.updateProjectiles(deltaTime, player, enemy, particleSystem);
        this.checkCollisions(player, enemy, particleSystem);
        this.checkCollisions(enemy, player, particleSystem);
    },
    
    checkCollisions(attacker, defender, particleSystem) {
        const attackHitbox = attacker.getAttackHitbox();
        if (!attackHitbox) return;
        
        const defenderHitbox = defender.getHitbox();
        
        if (this.checkHitboxOverlap(attackHitbox, defenderHitbox)) {
            if (attacker.attackPhase === 'active') {
                this.applyDamage(attacker, defender, particleSystem);
                attacker.attackPhase = 'recovery';
                attacker.attackTimer = attacker.currentAttack.recovery;
            }
        }
    },
    
    checkHitboxOverlap(hitbox1, hitbox2) {
        return hitbox1.x < hitbox2.x + hitbox2.width &&
               hitbox1.x + hitbox1.width > hitbox2.x &&
               hitbox1.y < hitbox2.y + hitbox2.height &&
               hitbox1.y + hitbox1.height > hitbox2.y;
    },
    
    applyDamage(attacker, defender, particleSystem) {
        const attack = attacker.currentAttack;
        let damage = attack.damage + attacker.attack;
        
        const actualDamage = defender.takeDamage(damage, attacker);
        
        if (particleSystem) {
            const hitX = defender.x + defender.width / 2;
            const hitY = defender.y + defender.height / 2;
            particleSystem.createHitEffect(hitX, hitY, attacker.getCurrentFaceColor());
            
            if (actualDamage > 10) {
                particleSystem.createScreenShake();
            }
        }
        
        attacker.addEnergy(attack.energyGain || 10);
        
        if (defender.isDead) {
            if (particleSystem) {
                particleSystem.createDefeatEffect(defender.x + defender.width / 2, defender.y + defender.height / 2);
            }
        }
    },
    
    createProjectile(attacker, particleSystem) {
        const projectile = {
            x: attacker.x + (attacker.facing === 1 ? attacker.width : 0),
            y: attacker.y + attacker.height / 2,
            vx: attacker.facing * 12,
            width: 40,
            height: 40,
            damage: attacker.ultimateDamage,
            owner: attacker,
            color: attacker.getCurrentFaceColor(),
            lifetime: 2000,
            active: true
        };
        
        this.projectiles.push(projectile);
        
        if (particleSystem) {
            particleSystem.createProjectileTrail(projectile.x, projectile.y, projectile.color);
        }
    },
    
    updateProjectiles(deltaTime, player, enemy, particleSystem) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            proj.x += proj.vx;
            proj.lifetime -= deltaTime;
            
            if (particleSystem) {
                particleSystem.createProjectileTrail(proj.x, proj.y, proj.color);
            }
            
            const target = proj.owner === player ? enemy : player;
            const targetHitbox = target.getHitbox();
            
            if (this.checkHitboxOverlap(proj, targetHitbox)) {
                target.takeDamage(proj.damage, proj.owner);
                if (particleSystem) {
                    particleSystem.createHitEffect(proj.x, proj.y, proj.color);
                    particleSystem.createExplosion(proj.x, proj.y, proj.color);
                }
                proj.active = false;
            }
            
            if (proj.x < 0 || proj.x > GameConfig.CANVAS_WIDTH || proj.lifetime <= 0 || !proj.active) {
                this.projectiles.splice(i, 1);
            }
        }
    },
    
    render(ctx) {
        for (const proj of this.projectiles) {
            ctx.save();
            ctx.fillStyle = proj.color;
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 20;
            
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.width / 2);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, proj.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.restore();
        }
    },
    
    reset() {
        this.projectiles = [];
    }
};
