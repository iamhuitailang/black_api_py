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
        
        this.setupGameLoop();
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
        this.resetGame();
        this.gameState = 'playing';
        this.ui.hideAllMenus();
        this.ui.showHUD();
        this.loadLevel();
        
        audioManager.playLevelComplete();
    }

    resetGame() {
        this.score = 0;
        this.currentAreaIndex = 0;
        this.currentLevelIndex = 0;
        this.scoreSubmitted = false;
        this.pendingBuff = false;
        
        this.player.reset();
        this.enemies = [];
        this.items = [];
        this.floatingTexts = [];
        this.boss = null;
        particleSystem.clear();
        
        this.currentAreaConfig = GameConfig.AREAS[0];
        this.ui.hideBuffSelection();
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
    }

    async gameOver(isVictory) {
        this.gameState = 'game_over';
        
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
