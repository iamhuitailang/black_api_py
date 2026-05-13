const Enemy = (() => {
    let enemies = [];
    let boss = null;
    
    const create = (type, x, y) => {
        const config = Config.ENEMY_TYPES[type];
        return {
            type,
            x: x || Math.random() * (Config.CANVAS_WIDTH - config.width),
            y: y || -config.height,
            width: config.width,
            height: config.height,
            hp: config.hp,
            maxHp: config.hp,
            speed: config.speed,
            score: config.score,
            color: config.color,
            pattern: config.pattern,
            shootInterval: config.shootInterval || 0,
            lastShootTime: 0,
            zigzagOffset: 0,
            zigzagDirection: 1,
            hasEscort: config.hasEscort || false
        };
    };
    
    const createBoss = (levelConfig) => {
        boss = {
            x: Config.CANVAS_WIDTH / 2 - Config.BOSS.WIDTH / 2,
            y: -Config.BOSS.HEIGHT,
            width: Config.BOSS.WIDTH,
            height: Config.BOSS.HEIGHT,
            hp: levelConfig.bossHP,
            maxHp: levelConfig.bossHP,
            speed: Config.BOSS.SPEED,
            score: Config.BOSS.SCORE,
            color: Config.BOSS.COLOR,
            lastShootTime: 0,
            targetY: 80,
            direction: 1
        };
        return boss;
    };
    
    const add = (enemy) => {
        enemies.push(enemy);
    };
    
    const update = (playerX, playerY, currentTime) => {
        enemies = enemies.filter(enemy => {
            switch (enemy.pattern) {
                case 'straight':
                    enemy.y += enemy.speed;
                    break;
                    
                case 'zigzag':
                    enemy.y += enemy.speed;
                    enemy.zigzagOffset += 0.05;
                    enemy.x += Math.sin(enemy.zigzagOffset) * 2;
                    break;
                    
                case 'shooter':
                    enemy.y += enemy.speed;
                    if (currentTime - enemy.lastShootTime > enemy.shootInterval) {
                        enemy.lastShootTime = currentTime;
                        const bullet = Bullet.createEnemyBullet(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height,
                            playerX,
                            playerY
                        );
                        Bullet.addEnemyBullet(bullet);
                    }
                    break;
                    
                case 'heavy':
                    enemy.y += enemy.speed;
                    break;
                    
                case 'chase':
                    const angle = Math.atan2(playerY - enemy.y, playerX - enemy.x);
                    enemy.x += Math.cos(angle) * enemy.speed;
                    enemy.y += Math.sin(angle) * enemy.speed;
                    break;
            }
            
            return enemy.y < Config.CANVAS_HEIGHT + enemy.height &&
                   enemy.x > -enemy.width * 2 &&
                   enemy.x < Config.CANVAS_WIDTH + enemy.width * 2;
        });
        
        if (boss) {
            if (boss.y < boss.targetY) {
                boss.y += boss.speed;
            } else {
                boss.x += boss.direction * boss.speed * 2;
                if (boss.x <= 0 || boss.x >= Config.CANVAS_WIDTH - boss.width) {
                    boss.direction *= -1;
                }
            }
            
            if (currentTime - boss.lastShootTime > Config.BOSS.SHOOT_INTERVAL) {
                boss.lastShootTime = currentTime;
                for (let i = -2; i <= 2; i++) {
                    const bullet = Bullet.createEnemyBullet(
                        boss.x + boss.width / 2,
                        boss.y + boss.height,
                        boss.x + boss.width / 2 + i * 50,
                        boss.y + boss.height + 100,
                        4
                    );
                    Bullet.addEnemyBullet(bullet);
                }
            }
        }
    };
    
    const draw = (ctx) => {
        enemies.forEach(enemy => {
            ctx.save();
            ctx.fillStyle = enemy.color;
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = 10;
            
            switch (enemy.pattern) {
                case 'straight':
                case 'shooter':
                    ctx.beginPath();
                    ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
                    ctx.lineTo(enemy.x, enemy.y);
                    ctx.lineTo(enemy.x + enemy.width, enemy.y);
                    ctx.closePath();
                    ctx.fill();
                    break;
                    
                case 'zigzag':
                    ctx.beginPath();
                    ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
                    ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.3);
                    ctx.lineTo(enemy.x + enemy.width * 0.2, enemy.y);
                    ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y);
                    ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.3);
                    ctx.closePath();
                    ctx.fill();
                    break;
                    
                case 'heavy':
                    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    ctx.fillStyle = '#6600aa';
                    ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);
                    break;
                    
                case 'chase':
                    ctx.beginPath();
                    ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 
                            enemy.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ff8800';
                    ctx.beginPath();
                    ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 
                            enemy.width / 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            
            if (enemy.hp < enemy.maxHp) {
                ctx.fillStyle = '#333';
                ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * (enemy.hp / enemy.maxHp), 4);
            }
            
            ctx.restore();
        });
        
        if (boss) {
            ctx.save();
            ctx.fillStyle = boss.color;
            ctx.shadowColor = boss.color;
            ctx.shadowBlur = 20;
            
            ctx.beginPath();
            ctx.moveTo(boss.x + boss.width / 2, boss.y + boss.height);
            ctx.lineTo(boss.x, boss.y + boss.height * 0.7);
            ctx.lineTo(boss.x + boss.width * 0.1, boss.y + boss.height * 0.3);
            ctx.lineTo(boss.x + boss.width * 0.3, boss.y);
            ctx.lineTo(boss.x + boss.width * 0.7, boss.y);
            ctx.lineTo(boss.x + boss.width * 0.9, boss.y + boss.height * 0.3);
            ctx.lineTo(boss.x + boss.width, boss.y + boss.height * 0.7);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#aa00aa';
            ctx.beginPath();
            ctx.arc(boss.x + boss.width / 2, boss.y + boss.height * 0.5, 20, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#333';
            ctx.fillRect(boss.x, boss.y - 20, boss.width, 10);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(boss.x, boss.y - 20, boss.width * (boss.hp / boss.maxHp), 10);
            
            ctx.restore();
        }
    };
    
    const clear = () => {
        enemies = [];
        boss = null;
    };
    
    const getEnemies = () => enemies;
    const getBoss = () => boss;
    
    const remove = (index) => {
        enemies.splice(index, 1);
    };
    
    const defeatBoss = () => {
        const score = boss.score;
        boss = null;
        return score;
    };
    
    const getState = () => ({
        enemies: JSON.parse(JSON.stringify(enemies)),
        boss: boss ? JSON.parse(JSON.stringify(boss)) : null
    });
    
    const restoreState = (state) => {
        enemies = state.enemies;
        boss = state.boss;
    };
    
    return {
        create,
        createBoss,
        add,
        update,
        draw,
        clear,
        getEnemies,
        getBoss,
        remove,
        defeatBoss,
        getState,
        restoreState
    };
})();
