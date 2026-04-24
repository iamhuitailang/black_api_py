const Storage = {
    STORAGE_KEY: 'xueren_game_save',
    
    defaultSave: {
        level: 1,
        room: 1,
        lives: 3,
        score: 0,
        hasSave: false
    },
    
    saveFullState: function(game) {
        const saveData = {
            level: game.level,
            room: game.room,
            lives: game.lives,
            score: game.score,
            
            player: {
                x: game.player.x,
                y: game.player.y,
                velocityX: game.player.velocityX,
                velocityY: game.player.velocityY,
                facingRight: game.player.facingRight,
                isInvincible: game.player.isInvincible,
                invincibleEndTime: game.player.invincibleEndTime,
                hasBigShot: game.player.hasBigShot,
                speedMultiplier: game.player.speedMultiplier
            },
            
            enemies: game.enemies.filter(e => e.active).map(enemy => ({
                x: enemy.x,
                y: enemy.y,
                type: enemy.type,
                hp: enemy.hp,
                velocityX: enemy.velocityX,
                velocityY: enemy.velocityY,
                facingRight: enemy.facingRight,
                baseY: enemy.baseY,
                flyOffset: enemy.flyOffset,
                jumpTimer: enemy.jumpTimer
            })),
            
            snowballs: game.snowballs.filter(s => s.active).map(snowball => ({
                x: snowball.x,
                y: snowball.y,
                enemyType: snowball.enemy.type,
                enemyMaxHp: snowball.enemy.maxHp,
                isRolling: snowball.isRolling,
                velocityX: snowball.velocityX,
                velocityY: snowball.velocityY,
                createdAt: snowball.createdAt,
                destroyedEnemies: snowball.destroyedEnemies
            })),
            
            powerups: game.powerupManager.powerups.filter(p => p.active).map(powerup => ({
                x: powerup.x,
                y: powerup.y,
                type: powerup.type,
                velocityY: powerup.velocityY
            })),
            
            powerupEffects: {},
            
            hasSave: true,
            savedAt: Date.now()
        };
        
        Object.keys(game.powerupManager.activeEffects).forEach(key => {
            const effect = game.powerupManager.activeEffects[key];
            if (effect && effect.active) {
                saveData.powerupEffects[key] = {
                    endTime: effect.endTime,
                    duration: effect.duration
                };
            }
        });
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    },
    
    loadFullState: function(game, platforms) {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return false;
            
            const saveData = JSON.parse(data);
            if (!saveData.hasSave) return false;
            
            game.level = saveData.level;
            game.room = saveData.room;
            game.lives = saveData.lives;
            game.score = saveData.score;
            
            game.currentLevel = new Level(game.level, game.room);
            game.platforms = game.currentLevel.platforms;
            
            if (saveData.player) {
                game.player = new Player(saveData.player.x, saveData.player.y);
                game.player.velocityX = saveData.player.velocityX || 0;
                game.player.velocityY = saveData.player.velocityY || 0;
                game.player.facingRight = saveData.player.facingRight !== undefined ? saveData.player.facingRight : true;
                game.player.isInvincible = saveData.player.isInvincible || false;
                game.player.invincibleEndTime = saveData.player.invincibleEndTime || 0;
                game.player.hasBigShot = saveData.player.hasBigShot || false;
                game.player.speedMultiplier = saveData.player.speedMultiplier || 1;
            } else {
                const startPos = game.currentLevel.getPlayerStartPosition();
                game.player = new Player(startPos.x, startPos.y);
            }
            
            game.enemies = [];
            if (saveData.enemies && saveData.enemies.length > 0) {
                saveData.enemies.forEach(enemyData => {
                    const enemy = new Enemy(enemyData.x, enemyData.y, enemyData.type);
                    enemy.hp = enemyData.hp || enemy.maxHp;
                    enemy.velocityX = enemyData.velocityX || 0;
                    enemy.velocityY = enemyData.velocityY || 0;
                    enemy.facingRight = enemyData.facingRight !== undefined ? enemyData.facingRight : true;
                    enemy.baseY = enemyData.baseY || enemyData.y;
                    enemy.flyOffset = enemyData.flyOffset || 0;
                    enemy.jumpTimer = enemyData.jumpTimer || 0;
                    game.enemies.push(enemy);
                });
            } else {
                game.enemies = [...game.currentLevel.enemies];
            }
            
            game.snowballs = [];
            if (saveData.snowballs) {
                saveData.snowballs.forEach(sbData => {
                    const fakeEnemy = {
                        x: sbData.x,
                        y: sbData.y,
                        type: sbData.enemyType,
                        config: CONFIG.ENEMY[sbData.enemyType] || CONFIG.ENEMY.GREEN_MONSTER,
                        maxHp: sbData.enemyMaxHp || 1,
                        width: 36,
                        height: 36
                    };
                    
                    const snowball = new Snowball(fakeEnemy);
                    snowball.x = sbData.x;
                    snowball.y = sbData.y;
                    snowball.isRolling = sbData.isRolling || false;
                    snowball.velocityX = sbData.velocityX || 0;
                    snowball.velocityY = sbData.velocityY || 0;
                    snowball.createdAt = sbData.createdAt || Date.now();
                    snowball.destroyedEnemies = sbData.destroyedEnemies || 0;
                    
                    game.snowballs.push(snowball);
                });
            }
            
            game.powerupManager.clear();
            if (saveData.powerups) {
                saveData.powerups.forEach(puData => {
                    const powerup = new Powerup(puData.x, puData.y, puData.type);
                    powerup.velocityY = puData.velocityY || 0;
                    game.powerupManager.powerups.push(powerup);
                });
            }
            
            if (saveData.powerupEffects) {
                Object.keys(saveData.powerupEffects).forEach(key => {
                    const effectData = saveData.powerupEffects[key];
                    if (effectData && effectData.endTime > Date.now()) {
                        game.powerupManager.activeEffects[key] = {
                            active: true,
                            endTime: effectData.endTime,
                            duration: effectData.duration
                        };
                        
                        if (key === 'bigShot') {
                            game.player.hasBigShot = true;
                        } else if (key === 'speed') {
                            game.player.speedMultiplier = CONFIG.PLAYER.SPEED_BOOST;
                        } else if (key === 'invincible') {
                            game.player.isInvincible = true;
                            game.player.invincibleEndTime = effectData.endTime;
                        }
                    }
                });
            }
            
            game.projectiles = [];
            game.particleSystem.clear();
            
            game.updateUI();
            
            return true;
        } catch (e) {
            console.error('读取完整存档失败:', e);
            return false;
        }
    },
    
    save: function(gameState) {
        return this.saveFullState(gameState);
    },
    
    load: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('读取存档失败:', e);
        }
        return this.defaultSave;
    },
    
    hasSave: function() {
        const data = this.load();
        return data && data.hasSave === true;
    },
    
    clear: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },
    
    createNewGame: function() {
        return {
            level: 1,
            room: 1,
            lives: 3,
            score: 0
        };
    }
};
