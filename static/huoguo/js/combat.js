const Combat = (function() {
    let projectiles = [];
    let attacks = [];

    const attackTypes = {
        smallIngredient: {
            damage: 6,
            cooldown: 400,
            speed: 12,
            size: 25,
            type: 'projectile'
        },
        bigIngredient: {
            damage: 12,
            cooldown: 700,
            speed: 8,
            size: 40,
            type: 'projectile'
        },
        melee: {
            damage: 8,
            cooldown: 500,
            range: 120,
            type: 'melee'
        },
        roll: {
            damage: 10,
            cooldown: 800,
            speed: 15,
            range: 150,
            type: 'rush'
        },
        ultimate: {
            damage: 0,
            cooldown: 1500,
            type: 'ultimate'
        }
    };

    function smallIngredientAttack(character) {
        if (character.attackCooldown > 0) return false;
        
        character.isAttacking = true;
        character.attackFrame = 0;
        character.attackType = 'smallIngredient';
        character.attackCooldown = attackTypes.smallIngredient.cooldown;

        const ingredient = character.ingredients[Math.floor(Math.random() * character.ingredients.length)];
        
        projectiles.push({
            x: character.x + character.width / 2,
            y: character.y + 30,
            velocityX: character.facing * attackTypes.smallIngredient.speed,
            velocityY: -2,
            size: attackTypes.smallIngredient.size,
            damage: attackTypes.smallIngredient.damage + Math.floor(character.attack / 3),
            owner: character.isPlayer ? 'player' : 'enemy',
            emoji: ingredient,
            rotation: 0
        });

        return true;
    }

    function bigIngredientAttack(character) {
        if (character.attackCooldown > 0) return false;
        
        character.isAttacking = true;
        character.attackFrame = 0;
        character.attackType = 'bigIngredient';
        character.attackCooldown = attackTypes.bigIngredient.cooldown;

        const ingredient = character.ingredients[Math.floor(Math.random() * character.ingredients.length)];
        
        projectiles.push({
            x: character.x + character.width / 2,
            y: character.y + 20,
            velocityX: character.facing * attackTypes.bigIngredient.speed,
            velocityY: -3,
            size: attackTypes.bigIngredient.size,
            damage: attackTypes.bigIngredient.damage + Math.floor(character.attack / 2),
            owner: character.isPlayer ? 'player' : 'enemy',
            emoji: ingredient,
            rotation: 0
        });

        return true;
    }

    function meleeAttack(character, target) {
        if (character.attackCooldown > 0) return null;
        
        character.isAttacking = true;
        character.attackFrame = 0;
        character.attackType = 'melee';
        character.attackCooldown = attackTypes.melee.cooldown;

        const distance = Math.abs(character.x - target.x);
        if (distance < attackTypes.melee.range) {
            const sameDirection = (character.facing === 1 && character.x < target.x) ||
                                  (character.facing === -1 && character.x > target.x);
            
            if (sameDirection) {
                const damage = attackTypes.melee.damage + Math.floor(character.attack / 2);
                const actualDamage = Characters.takeDamage(target, damage);
                if (actualDamage > 0) {
                    Physics.applyKnockback(target, character.facing, 5);
                    Characters.addEnergy(character, 10);
                    Renderer.createParticles(target.x + target.width / 2, target.y + 30, '#ff6600', 15);
                    Renderer.createDamageNumber(target.x + target.width / 2, target.y + 30, actualDamage);
                    return {
                        x: target.x + target.width / 2,
                        y: target.y + 30,
                        damage: actualDamage
                    };
                }
            }
        }
        return null;
    }

    function rollAttack(character) {
        if (character.attackCooldown > 0) return false;
        
        character.isAttacking = true;
        character.attackFrame = 0;
        character.attackType = 'roll';
        character.attackCooldown = attackTypes.roll.cooldown;
        character.velocityX = character.facing * attackTypes.roll.speed;
        character.isInvincible = true;
        character.invincibleFrame = 0;

        attacks.push({
            type: 'roll',
            character: character,
            owner: character.isPlayer ? 'player' : 'enemy',
            damage: attackTypes.roll.damage + Math.floor(character.attack / 2),
            frame: 0,
            maxFrame: 20,
            hasHit: false
        });

        return true;
    }

    function ultimateAttack(character) {
        if (!Characters.canUseUltimate(character)) return false;
        if (character.attackCooldown > 0) return false;
        
        character.energy = 0;
        character.isAttacking = true;
        character.attackFrame = 0;
        character.attackType = 'ultimate';
        character.attackCooldown = attackTypes.ultimate.cooldown;

        if (character.type === 'spicy') {
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    projectiles.push({
                        x: character.x + character.width / 2 + (Math.random() - 0.5) * 200,
                        y: -50,
                        velocityX: (Math.random() - 0.5) * 3,
                        velocityY: 8,
                        size: 35,
                        damage: 5,
                        owner: character.isPlayer ? 'player' : 'enemy',
                        emoji: '🌶️',
                        rotation: 0,
                        isUltimate: true
                    });
                }, i * 100);
            }
        } else if (character.type === 'clear') {
            for (let i = 0; i < 5; i++) {
                projectiles.push({
                    x: character.x + character.width / 2,
                    y: character.y + 20,
                    velocityX: character.facing * (6 + i * 2),
                    velocityY: (i - 2) * 2,
                    size: 30,
                    damage: 6,
                    owner: character.isPlayer ? 'player' : 'enemy',
                    emoji: '🍡',
                    rotation: 0,
                    isUltimate: true
                });
            }
        } else if (character.type === 'tomato') {
            projectiles.push({
                x: character.x + character.width / 2,
                y: character.y + 20,
                velocityX: character.facing * 10,
                velocityY: 0,
                size: 60,
                damage: character.ultimateDamage,
                owner: character.isPlayer ? 'player' : 'enemy',
                emoji: '🍅',
                rotation: 0,
                isUltimate: true
            });
        }

        return true;
    }

    function updateProjectiles(canvasWidth, groundY) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.x += p.velocityX;
            p.y += p.velocityY;
            p.velocityY += 0.3;
            p.rotation += 0.2;

            if (p.x < -50 || p.x > canvasWidth + 50 || p.y > groundY + 50) {
                projectiles.splice(i, 1);
            }
        }
    }

    function updateAttacks() {
        for (let i = attacks.length - 1; i >= 0; i--) {
            attacks[i].frame++;
            if (attacks[i].frame >= attacks[i].maxFrame) {
                attacks.splice(i, 1);
            }
        }
    }

    function checkProjectileHits(player, enemy) {
        const hits = [];
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            let hitTarget = null;

            if (p.owner === 'player' && Physics.checkProjectileCollision(p, enemy)) {
                hitTarget = enemy;
            } else if (p.owner === 'enemy' && Physics.checkProjectileCollision(p, player)) {
                hitTarget = player;
            }

            if (hitTarget) {
                const damage = Characters.takeDamage(hitTarget, p.damage);
                if (damage > 0) {
                    Physics.applyKnockback(hitTarget, p.velocityX > 0 ? 1 : -1, 5);
                    Characters.addEnergy(p.owner === 'player' ? player : enemy, 8);
                    hits.push({
                        x: p.x,
                        y: p.y,
                        damage: damage
                    });
                }
                projectiles.splice(i, 1);
            }
        }

        return hits;
    }

    function checkAttackHits(player, enemy) {
        const hits = [];

        for (let i = attacks.length - 1; i >= 0; i--) {
            const attack = attacks[i];
            
            if (attack.type === 'roll' && !attack.hasHit) {
                const attacker = attack.character;
                const target = attacker.isPlayer ? enemy : player;
                
                if (Physics.checkCollision(attacker, target)) {
                    const damage = Characters.takeDamage(target, attack.damage);
                    if (damage > 0) {
                        Physics.applyKnockback(target, attacker.facing, 8);
                        Characters.addEnergy(attacker, 15);
                        attack.hasHit = true;
                        hits.push({
                            x: target.x + target.width / 2,
                            y: target.y + 30,
                            damage: damage
                        });
                    }
                }
            }
        }

        return hits;
    }

    function getProjectiles() {
        return projectiles;
    }

    function getAttacks() {
        return attacks;
    }

    function clearAll() {
        projectiles = [];
        attacks = [];
    }

    return {
        smallIngredientAttack,
        bigIngredientAttack,
        meleeAttack,
        rollAttack,
        ultimateAttack,
        updateProjectiles,
        updateAttacks,
        checkProjectileHits,
        checkAttackHits,
        getProjectiles,
        getAttacks,
        clearAll
    };
})();
