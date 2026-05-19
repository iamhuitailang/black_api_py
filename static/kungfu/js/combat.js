const Combat = {
    checkCollision(hitbox1, hitbox2) {
        return hitbox1.x < hitbox2.x + hitbox2.width &&
               hitbox1.x + hitbox1.width > hitbox2.x &&
               hitbox1.y < hitbox2.y + hitbox2.height &&
               hitbox1.y + hitbox1.height > hitbox2.y;
    },

    resolveAttacks(attacker, defender) {
        const attackHitbox = attacker.getAttackHitbox();
        if (!attackHitbox || attacker.attackHit) return;

        const defenderHitbox = defender.getBodyHitbox();

        if (this.checkCollision(attackHitbox, defenderHitbox)) {
            attacker.attackHit = true;

            let damage = GameData.attacks[attacker.attackType].damage;

            if (attacker.attackType === 'ultimate') {
                damage = attacker.ultDamage;
            }

            damage += attacker.attack;

            const actualDamage = defender.takeDamage(damage, attacker);

            if (actualDamage > 0) {
                attacker.addEnergy(GameData.gameConfig.energyOnHit);
            }

            return {
                damage: actualDamage,
                attacker: attacker.name,
                defender: defender.name,
                attackType: attacker.attackType
            };
        }

        return null;
    },

    updateAI(ai, player, deltaTime, gameState) {
        if (ai.state === GameData.states.DEAD) return;
        if (gameState !== 'playing') return;

        if (ai.blockTimer !== undefined && ai.blockTimer > 0) {
            ai.blockTimer -= deltaTime;
            if (ai.blockTimer <= 0) {
                ai.block(false);
                ai.blockTimer = 0;
            }
            return;
        }

        const distance = Math.abs(ai.x - player.x);
        const playerOnRight = player.x > ai.x;

        if (ai.state === GameData.states.IDLE || ai.state === GameData.states.WALKING) {
            if (distance > 150) {
                ai.move(playerOnRight ? 1 : -1);
            } else if (distance < 80) {
                ai.move(playerOnRight ? -1 : 1);
            } else {
                ai.stopMove();
                const random = Math.random();
                if (random < 0.03) {
                    ai.attack('lightPunch');
                } else if (random < 0.05) {
                    ai.attack('heavyPunch');
                } else if (random < 0.07) {
                    ai.attack('lightKick');
                } else if (random < 0.09) {
                    ai.attack('heavyKick');
                } else if (random < 0.1 && ai.energy >= 100) {
                    ai.attack('ultimate');
                } else if (random < 0.12 && player.state === GameData.states.ATTACKING) {
                    ai.block(true);
                    ai.blockTimer = 500;
                } else if (random < 0.14) {
                    ai.jump();
                }
            }
        }
    }
};
