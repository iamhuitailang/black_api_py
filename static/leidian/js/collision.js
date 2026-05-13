const Collision = (() => {
    const checkRect = (a, b) => {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    };
    
    const checkPlayerBullets = () => {
        const playerBullets = Bullet.getPlayerBullets();
        const enemies = Enemy.getEnemies();
        let scoreGain = 0;
        let drops = [];
        
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const bullet = playerBullets[i];
            
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (checkRect(bullet, enemy)) {
                    enemy.hp -= bullet.damage;
                    Bullet.removePlayerBullet(i);
                    
                    if (enemy.hp <= 0) {
                        Effects.createExplosion(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            enemy.color
                        );
                        scoreGain += enemy.score;
                        
                        if (Math.random() < Config.GAME.POWERUP_DROP_CHANCE) {
                            drops.push({
                                x: enemy.x + enemy.width / 2 - 12,
                                y: enemy.y + enemy.height / 2
                            });
                        }
                        
                        Enemy.remove(j);
                    }
                    break;
                }
            }
        }
        
        const boss = Enemy.getBoss();
        if (boss) {
            for (let i = playerBullets.length - 1; i >= 0; i--) {
                const bullet = playerBullets[i];
                if (checkRect(bullet, boss)) {
                    boss.hp -= bullet.damage;
                    Bullet.removePlayerBullet(i);
                    
                    if (boss.hp <= 0) {
                        Effects.createExplosion(
                            boss.x + boss.width / 2,
                            boss.y + boss.height / 2,
                            boss.color,
                            40
                        );
                        scoreGain += Enemy.defeatBoss();
                    }
                    break;
                }
            }
        }
        
        return { scoreGain, drops };
    };
    
    const checkEnemyBullets = (playerState) => {
        const enemyBullets = Bullet.getEnemyBullets();
        
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            if (checkRect(bullet, playerState)) {
                Bullet.removeEnemyBullet(i);
                return true;
            }
        }
        return false;
    };
    
    const checkEnemies = (playerState) => {
        const enemies = Enemy.getEnemies();
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (checkRect(enemy, playerState)) {
                Effects.createExplosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    enemy.color
                );
                Enemy.remove(i);
                return true;
            }
        }
        
        const boss = Enemy.getBoss();
        if (boss && checkRect(boss, playerState)) {
            return true;
        }
        
        return false;
    };
    
    const checkPowerUps = (playerState) => {
        const powerUps = PowerUp.getPowerUps();
        let scoreGain = 0;
        
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            if (checkRect(powerUp, playerState)) {
                switch (powerUp.effect) {
                    case 'health':
                        Player.addLife();
                        break;
                    case 'doubleShot':
                        Player.activateDoubleShot();
                        break;
                    case 'speed':
                        Player.activateSpeedBoost();
                        break;
                    case 'damage':
                        Player.activateDamageBoost();
                        break;
                    case 'score':
                        scoreGain += powerUp.value;
                        break;
                }
                PowerUp.remove(i);
            }
        }
        
        return scoreGain;
    };
    
    return {
        checkPlayerBullets,
        checkEnemyBullets,
        checkEnemies,
        checkPowerUps
    };
})();
