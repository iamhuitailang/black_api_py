class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.ui = new UIManager(this);
        
        this.player = new Player(100, GameConfig.GROUND_Y - GameConfig.PLAYER.HEIGHT);
        this.enemies = [];
        this.items = [];
        this.floatingTexts = [];
        this.boss = null;
        
        this.score = 0;
        this.currentAreaIndex = 0;
        this.currentLevelIndex = 0;
        this.currentLevel = null;
        this.currentAreaConfig = null;
        
        this.gameState = 'menu';
        this.lastTime = 0;
        this.deltaTime = 0;
        this.scoreSubmitted = false;
        this.pendingBuff = false;
        
        this.saveKey = 'cyber_ninja_save';
        this.autoSaveTimer = 0;
        
        this.setupGameLoop();
        
        this._initSaveCheck();
    }
    
    _initSaveCheck() {
        setTimeout(() => {
            try {
                const saveData = localStorage.getItem(this.saveKey);
                if (saveData) {
                    const data = JSON.parse(saveData);
                    if (data && data.score > 0) {
                        this.ui.showContinueDialog(data);
                        return;
                    }
                }
            } catch (e) {
                console.warn('读取存档失败:', e);
            }
        }, 100);
    }
    
    saveGame() {
        if (this.gameState !== 'playing' && this.gameState !== 'paused' && this.gameState !== 'buff_selection' && this.gameState !== 'transition') {
            return;
        }
        
        try {
            const enemiesData = this.enemies.map(enemy => {
                let type = 'spider';
                if (enemy instanceof Drone) type = 'drone';
                else if (enemy instanceof Mech) type = 'mech';
                
                const base = {
                    type: type,
                    x: enemy.x,
                    y: enemy.y,
                    health: enemy.health,
                    isDead: enemy.isDead,
                    deathTimer: enemy.deathTimer,
                    facingRight: enemy.facingRight
                };
                
                if (type === 'drone') {
                    base.patrolDirection = enemy.patrolDirection;
                    base.patrolStartX = enemy.patrolStartX;
                    base.shootCooldown = enemy.shootCooldown;
                    base.hoverOffset = enemy.hoverOffset;
                    base.bullets = enemy.bullets || [];
                } else if (type === 'mech') {
                    base.attackCooldown = enemy.attackCooldown;
                    base.isAttacking = enemy.isAttacking;
                    base.attackTimer = enemy.attackTimer;
                } else if (type === 'spider') {
                    base.isExploding = enemy.isExploding;
                    base.explodeWarningTimer = enemy.explodeWarningTimer;
                    base.hasExploded = enemy.hasExploded;
                }
                
                return base;
            });
            
            const itemsData = this.items.map(item => ({
                type: item.type,
                x: item.x,
                y: item.y,
                active: item.active
            }));
            
            let bossData = null;
            if (this.boss) {
                bossData = {
                    x: this.boss.x,
                    y: this.boss.y,
                    health: this.boss.health,
                    isDead: this.boss.isDead,
                    deathTimer: this.boss.deathTimer,
                    facingRight: this.boss.facingRight,
                    currentAttack: this.boss.currentAttack,
                    attackTimer: this.boss.attackTimer,
                    cooldownTimer: this.boss.cooldownTimer
                };
            }
            
            const data = {
                score: this.score,
                currentAreaIndex: this.currentAreaIndex,
                currentLevelIndex: this.currentLevelIndex,
                playerHealth: this.player.health,
                playerMaxHealth: this.player.maxHealth,
                playerX: this.player.x,
                playerY: this.player.y,
                playerBuffs: {
                    attackSpeed: { active: this.player.buffs.attackSpeed.active, timer: this.player.buffs.attackSpeed.timer },
                    moveSpeed: { active: this.player.buffs.moveSpeed.active, timer: this.player.buffs.moveSpeed.timer },
                    invincible: { active: this.player.buffs.invincible.active, timer: this.player.buffs.invincible.timer }
                },
                enemies: enemiesData,
                items: itemsData,
                boss: bossData,
                levelTotalEnemies: this.currentLevel ? this.currentLevel.totalEnemyCount : 0,
                levelCompleted: this.currentLevel ? this.currentLevel.completed : false,
                savedAt: Date.now()
            };
            localStorage.setItem(this.saveKey, JSON.stringify(data));
        } catch (e) {
            console.warn('保存游戏失败:', e);
        }
    }
    
    loadGame(data) {
        this.score = data.score || 0;
        this.currentAreaIndex = data.currentAreaIndex || 0;
        this.currentLevelIndex = data.currentLevelIndex || 0;
        this.currentAreaConfig = GameConfig.AREAS[this.currentAreaIndex];
        
        this.player.reset();
        this.player.health = Math.min(data.playerHealth || this.player.maxHealth, this.player.maxHealth);
        this.player.maxHealth = data.playerMaxHealth || GameConfig.PLAYER.MAX_HEALTH;
        if (data.playerX !== undefined) {
            this.player.x = data.playerX;
        }
        if (data.playerY !== undefined) {
            this.player.y = data.playerY;
        }
        
        if (data.playerBuffs) {
            for (const key in data.playerBuffs) {
                if (this.player.buffs[key]) {
                    this.player.buffs[key].active = data.playerBuffs[key].active || false;
                    this.player.buffs[key].timer = data.playerBuffs[key].timer || 0;
                }
            }
            if (this.player.buffs.invincible.active) {
                this.player.isInvincible = true;
            }
        }
        
        if (typeof particleSystem !== 'undefined') {
            particleSystem.clear();
        }
        
        this.floatingTexts = [];
        this.scoreSubmitted = false;
        this.pendingBuff = false;
        this.autoSaveTimer = 0;
        
        this.currentLevel = new Level(this.currentAreaIndex, this.currentLevelIndex % 3);
        this.currentLevel.enemiesSpawned = true;
        if (data.levelCompleted !== undefined) {
            this.currentLevel.completed = data.levelCompleted;
        }
        if (data.levelTotalEnemies !== undefined && data.levelTotalEnemies > 0) {
            this.currentLevel.totalEnemyCount = data.levelTotalEnemies;
        }
        
        this.enemies = [];
        if (data.enemies && data.enemies.length > 0) {
            data.enemies.forEach(enemyData => {
                if (enemyData.isDead && enemyData.deathTimer <= 0) return;
                
                let enemy = null;
                switch (enemyData.type) {
                    case 'drone':
                        enemy = new Drone(enemyData.x, enemyData.y);
                        enemy.patrolDirection = enemyData.patrolDirection || 1;
                        enemy.patrolStartX = enemyData.patrolStartX || enemyData.x;
                        enemy.shootCooldown = enemyData.shootCooldown || 0;
                        enemy.hoverOffset = enemyData.hoverOffset || 0;
                        if (enemyData.bullets) {
                            enemy.bullets = enemyData.bullets;
                        }
                        break;
                    case 'mech':
                        enemy = new Mech(enemyData.x, enemyData.y);
                        enemy.attackCooldown = enemyData.attackCooldown || 0;
                        enemy.isAttacking = enemyData.isAttacking || false;
                        enemy.attackTimer = enemyData.attackTimer || 0;
                        break;
                    case 'spider':
                    default:
                        enemy = new Spider(enemyData.x, enemyData.y);
                        enemy.isExploding = enemyData.isExploding || false;
                        enemy.explodeWarningTimer = enemyData.explodeWarningTimer || 0;
                        enemy.hasExploded = enemyData.hasExploded || false;
                        break;
                }
                
                if (enemy) {
                    enemy.health = enemyData.health || enemy.maxHealth;
                    enemy.isDead = enemyData.isDead || false;
                    enemy.deathTimer = enemyData.deathTimer || 0;
                    enemy.facingRight = enemyData.facingRight !== undefined ? enemyData.facingRight : true;
                    this.enemies.push(enemy);
                }
            });
        }
        
        this.items = [];
        if (data.items && data.items.length > 0) {
            data.items.forEach(itemData => {
                if (!itemData.active) return;
                const item = new Item(itemData.x, itemData.y, itemData.type);
                this.items.push(item);
            });
        }
        
        this.boss = null;
        if (data.boss && this.currentLevel.isBossLevel) {
            this.boss = new Boss(data.boss.x, data.boss.y);
            this.boss.health = data.boss.health || this.boss.maxHealth;
            this.boss.isDead = data.boss.isDead || false;
            this.boss.deathTimer = data.boss.deathTimer || 0;
            this.boss.facingRight = data.boss.facingRight !== undefined ? data.boss.facingRight : false;
            if (data.boss.currentAttack !== undefined) {
                this.boss.currentAttack = data.boss.currentAttack;
            }
            if (data.boss.attackTimer !== undefined) {
                this.boss.attackTimer = data.boss.attackTimer;
            }
            if (data.boss.cooldownTimer !== undefined) {
                this.boss.cooldownTimer = data.boss.cooldownTimer;
            }
        } else if (this.currentLevel.isBossLevel && !data.boss) {
            this.boss = this.currentLevel.spawnBoss();
        }
        
        this.gameState = 'playing';
        this.ui.hideAllMenus();
        this.ui.hideBuffSelection();
        this.ui.showHUD();
        this.ui.updateHUD(this);
    }
    
    clearSave() {
        try {
            localStorage.removeItem(this.saveKey);
        } catch (e) {
            console.warn('清除存档失败:', e);
        }
    }

    setupGameLoop() {
        const loop = (timestamp) => {
            if (!this.lastTime) this.lastTime = timestamp;
            this.deltaTime = Math.min(timestamp - this.lastTime, 50);
            this.lastTime = timestamp;
            
            if (this.gameState === 'playing') {
                this.update(this.deltaTime);
            }
            
            this.renderer.render(this);
            inputManager.update();
            
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
    }

    startGame() {
        this.clearSave();
        this.resetGame();
        this.gameState = 'playing';
        this.ui.hideAllMenus();
        this.ui.showHUD();
        this.loadLevel();
        
        audioManager.playLevelComplete();
    }

    continueGame() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (saveData) {
                const data = JSON.parse(saveData);
                if (data && data.score > 0) {
                    this.loadGame(data);
                    return;
                }
            }
        } catch (e) {
            console.warn('读取存档失败:', e);
        }
        this.startGame();
    }

    resetGame() {
        this.score = 0;
        this.currentAreaIndex = 0;
        this.currentLevelIndex = 0;
        this.scoreSubmitted = false;
        this.pendingBuff = false;
        this.autoSaveTimer = 0;
        
        this.player.reset();
        this.enemies = [];
        this.items = [];
        this.floatingTexts = [];
        this.boss = null;
        if (typeof particleSystem !== 'undefined') {
            particleSystem.clear();
        }
        
        this.currentAreaConfig = GameConfig.AREAS[0];
        this.ui.hideBuffSelection();
        
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.classList.add('hidden');
        }
    }

    loadLevel() {
        this.currentLevel = new Level(this.currentAreaIndex, this.currentLevelIndex % 3);
        this.currentAreaConfig = GameConfig.AREAS[this.currentAreaIndex];
        
        this.enemies = [];
        this.items = [];
        this.floatingTexts = [];
        this.boss = null;
        particleSystem.clear();
        
        this.player.x = 100;
        this.player.y = GameConfig.GROUND_Y - this.player.height;
        this.player.vx = 0;
        this.player.vy = 0;
        
        if (this.currentLevel.isBossLevel) {
            this.boss = this.currentLevel.spawnBoss();
            this.ui.showLevelTransition(`⚠️ BOSS战!`, this.currentAreaConfig.name);
        } else {
            const newEnemies = this.currentLevel.spawnEnemies();
            this.enemies = newEnemies;
            this.ui.showLevelTransition(`第 ${this.currentLevelIndex + 1} 关`, this.currentAreaConfig.name);
        }
        
        this.ui.updateHUD(this);
    }

    update(deltaTime) {
        if (inputManager.isPause()) {
            this.pauseGame();
            return;
        }
        
        this.player.update(deltaTime, this);
        this.currentLevel.update(deltaTime, this);
        
        this.enemies.forEach(enemy => {
            if (!enemy.isDead || enemy.deathTimer > 0) {
                enemy.update(deltaTime, this);
            }
        });
        
        this.enemies = this.enemies.filter(e => !e.isDead || e.deathTimer > 0);
        
        if (this.boss) {
            this.boss.update(deltaTime, this);
        }
        
        this.items.forEach(item => item.update(deltaTime, this));
        this.items = this.items.filter(item => item.active);
        
        this.floatingTexts.forEach(text => text.update(deltaTime));
        this.floatingTexts = this.floatingTexts.filter(text => text.active);
        
        particleSystem.update(deltaTime);
        
        this.checkEnemyCollisions();
        
        this.autoSaveTimer += deltaTime;
        if (this.autoSaveTimer >= 2000) {
            this.autoSaveTimer = 0;
            this.saveGame();
        }
        
        if (this.player.isDead && this.player.deathTimer <= 0) {
            this.gameOver(false);
            return;
        }
        
        if (this.currentLevel.isComplete(this)) {
            this.nextLevel();
        }
        
        this.ui.updateHUD(this);
    }

    checkEnemyCollisions() {
        const playerBox = this.player.getBounds();
        
        this.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const enemyBox = enemy.getBounds();
            if (this.boxIntersects(playerBox, enemyBox)) {
                if (enemy instanceof Mech && !enemy.isAttacking) {
                    const pushBack = this.player.x < enemy.x ? -3 : 3;
                    this.player.x += pushBack;
                }
            }
        });
    }

    boxIntersects(a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    spawnItem(x, y) {
        const rand = Math.random();
        let type;
        if (rand < 0.5) {
            type = 'data_shard';
        } else if (rand < 0.8) {
            type = 'energy_core';
        } else {
            type = 'golden_module';
        }
        
        const item = new Item(x, y, type);
        this.items.push(item);
    }

    showFloatingText(x, y, text, color) {
        this.floatingTexts.push(new FloatingText(x, y, text, color));
    }

    showBuffSelection() {
        this.pendingBuff = true;
        this.gameState = 'buff_selection';
        this.ui.showBuffSelection();
    }

    selectBuff(buffType) {
        this.player.applyBuff(buffType);
        this.pendingBuff = false;
        this.gameState = 'playing';
        this.ui.hideBuffSelection();
    }

    nextLevel() {
        this.gameState = 'transition';
        
        if (this.currentLevel.isBossLevel) {
            this.score += 500;
            audioManager.playVictory();
            
            if (this.currentAreaIndex >= GameConfig.AREAS.length - 1) {
                setTimeout(() => {
                    this.gameOver(true);
                }, 1500);
                return;
            }
            
            this.currentAreaIndex++;
            this.currentLevelIndex = 0;
        } else {
            this.currentLevelIndex++;
            audioManager.playLevelComplete();
        }
        
        setTimeout(() => {
            this.loadLevel();
            this.gameState = 'playing';
        }, 2000);
    }

    onBossDefeated() {
        this.score += 200;
    }

    pauseGame() {
        this.gameState = 'paused';
        this.ui.showPauseMenu();
    }

    resumeGame() {
        this.gameState = 'playing';
        this.ui.hideAllMenus();
        this.lastTime = performance.now();
    }

    restartGame() {
        this.scoreSubmitted = false;
        this.startGame();
    }

    async quitToMenu() {
        this.gameState = 'menu';
        this.ui.hideHUD();
        this.ui.showMenu('start-menu');
        
        if (!this.scoreSubmitted && this.score > 0) {
            const playerName = this.ui.getPlayerName();
            await api.submitScore(playerName, this.score, this.currentLevelIndex + 1);
            this.scoreSubmitted = true;
        }
        
        this._initSaveCheck();
    }

    async gameOver(isVictory) {
        this.gameState = 'game_over';
        this.clearSave();
        
        if (!this.scoreSubmitted) {
            const playerName = this.ui.getPlayerName();
            await api.submitScore(playerName, this.score, this.currentLevelIndex + 1);
            this.scoreSubmitted = true;
        }
        
        if (isVictory) {
            audioManager.playVictory();
        } else {
            audioManager.playDefeat();
        }
        
        this.ui.hideHUD();
        this.ui.hideBuffSelection();
        this.ui.showGameOver(isVictory, this.score, this.currentLevelIndex + 1);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.game = game;
});
