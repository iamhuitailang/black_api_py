const AIManager = {
    update(enemy, player, deltaTime) {
        if (enemy.isDead || enemy.isHurt) return;
        
        const distance = Math.abs(enemy.x - player.x);
        const direction = player.x > enemy.x ? 1 : -1;
        
        enemy.facing = direction;
        
        if (!enemy.isAttacking) {
            this.decideAction(enemy, player, distance, direction);
        }
    },
    
    decideAction(enemy, player, distance, direction) {
        const random = Math.random();
        const inCloseRange = distance < 80;
        const inMidRange = distance < 150;
        const inFarRange = distance >= 150;
        
        if (enemy.isAttacking) return;
        
        if (player.isAttacking && inCloseRange && random < 0.3) {
            enemy.block();
            return;
        }
        
        if (enemy.energy >= enemy.maxEnergy && inMidRange && random < 0.4) {
            this.useUltimate(enemy);
            return;
        }
        
        if (inCloseRange) {
            if (random < 0.3) {
                enemy.attack('LIGHT_PALM');
            } else if (random < 0.5) {
                enemy.attack('HEAVY_PALM');
            } else if (random < 0.7) {
                enemy.attack('LIGHT_KICK');
            } else if (random < 0.85) {
                enemy.attack('HEAVY_KICK');
            } else {
                enemy.move(-direction);
            }
        } else if (inMidRange) {
            if (random < 0.2) {
                enemy.move(direction);
            } else if (random < 0.35) {
                enemy.move(-direction);
            } else if (random < 0.5) {
                enemy.jump();
            } else if (random < 0.65) {
                enemy.attack('LIGHT_KICK');
            } else if (random < 0.8) {
                enemy.attack('HEAVY_KICK');
            } else {
                enemy.stop();
            }
        } else {
            if (random < 0.7) {
                enemy.move(direction);
            } else if (random < 0.85) {
                enemy.jump();
            } else {
                enemy.stop();
            }
        }
    },
    
    useUltimate(enemy) {
        const ultimates = ['RED_FACE_ROAR', 'CHAIN_PALM', 'BLACK_FACE_SHOCK', 'HEAVY_SHOCK', 'PINK_FACE_STRIKE'];
        const availableUltimates = ultimates.filter(u => GameConfig.ULTIMATES[u]);
        
        if (availableUltimates.length > 0) {
            const ultimate = availableUltimates[Math.floor(Math.random() * availableUltimates.length)];
            enemy.ultimate(ultimate);
        }
    }
};
