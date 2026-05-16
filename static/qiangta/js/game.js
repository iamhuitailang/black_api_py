const Game = {
    gameState: null,
    lastTime: 0,
    animationId: null,
    saveInterval: null,
    isInitialized: false,

    init() {
        const canvas = document.getElementById('game-canvas');

        this.gameState = {
            canvas: canvas,
            player: {
                gold: GameData.GAME.INITIAL_GOLD,
                baseHp: GameData.BASE.MAX_HP
            },
            enemy: {
                gold: GameData.GAME.INITIAL_GOLD,
                baseHp: GameData.BASE.MAX_HP
            },
            tower: {
                owner: null,
                hp: GameData.TOWER.MAX_HP
            },
            units: [],
            gameTime: 0,
            isPaused: false,
            isGameOver: false,
            winner: null
        };

        GameUI.init(this);
        this.isInitialized = true;
    },

    startGame() {
        this.stopGameLoop();
        this.stopAutoSave();
        this.resetGameState();
        
        GameUI.forceClearOverlays();
        GameUI.forceEnableButtons();
        GameUI.updateUI();
        GameUI.showScreen('game');
        
        setTimeout(() => {
            GameRenderer.init(this.gameState.canvas);
            this.startGameLoop();
            this.startAutoSave();
            GameUI.updateUI();
        }, 100);
    },

    resumeGame() {
        this.stopGameLoop();
        this.stopAutoSave();
        
        const savedState = GameStorage.loadState();
        if (savedState) {
            this.gameState.player.gold = savedState.playerGold;
            this.gameState.player.baseHp = savedState.playerHp;
            this.gameState.enemy.gold = savedState.enemyGold;
            this.gameState.enemy.baseHp = savedState.enemyHp;
            this.gameState.tower.owner = savedState.towerOwner;
            this.gameState.tower.hp = savedState.towerHp;
            this.gameState.units = GameStorage.deserializeUnits(savedState.units || []);
            this.gameState.gameTime = savedState.gameTime || 0;
            this.gameState.isPaused = false;
            this.gameState.isGameOver = savedState.isGameOver || false;
            this.gameState.winner = savedState.winner || null;
        } else {
            this.resetGameState();
        }

        GameUI.forceClearOverlays();
        GameUI.forceEnableButtons();
        GameUI.updateUI();
        GameUI.showScreen('game');
        
        setTimeout(() => {
            GameRenderer.init(this.gameState.canvas);
            GameAI.reset();
            this.startGameLoop();
            this.startAutoSave();
            GameUI.updateUI();
        }, 100);
    },

    pauseGame() {
        this.gameState.isPaused = true;
        GameUI.showPauseScreen();
    },

    resumeFromPause() {
        this.gameState.isPaused = false;
        GameUI.hidePauseScreen();
        GameUI.updateUI();
    },

    restartGame() {
        this.startGame();
    },

    quitGame() {
        this.stopGameLoop();
        this.stopAutoSave();
        GameStorage.clearState();
        GameUI.hidePauseScreen();
        GameUI.hideEndScreen();
        GameUI.showScreen('start');
        GameUI.updateResumeButton();
    },

    resetGameState() {
        this.gameState.player.gold = GameData.GAME.INITIAL_GOLD;
        this.gameState.player.baseHp = GameData.BASE.MAX_HP;
        this.gameState.enemy.gold = GameData.GAME.INITIAL_GOLD;
        this.gameState.enemy.baseHp = GameData.BASE.MAX_HP;
        this.gameState.tower.owner = null;
        this.gameState.tower.hp = GameData.TOWER.MAX_HP;
        this.gameState.units = [];
        this.gameState.gameTime = 0;
        this.gameState.isPaused = false;
        this.gameState.isGameOver = false;
        this.gameState.winner = null;
        GameAI.reset();
    },

    startGameLoop() {
        this.stopGameLoop();
        this.lastTime = performance.now();
        this.gameLoop();
    },

    stopGameLoop() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    startAutoSave() {
        this.stopAutoSave();
        this.saveInterval = setInterval(() => {
            if (!this.gameState.isGameOver) {
                GameStorage.saveState(this.gameState);
            }
        }, 5000);
    },

    stopAutoSave() {
        if (this.saveInterval !== null) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    },

    gameLoop(currentTime = performance.now()) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!this.gameState.isPaused && !this.gameState.isGameOver) {
            this.update(deltaTime);
        }

        GameRenderer.render(this.gameState);

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    },

    update(deltaTime) {
        this.gameState.gameTime += deltaTime;

        this.gameState.player.gold += GameData.GAME.GOLD_PER_SECOND * deltaTime;
        this.gameState.enemy.gold += GameData.GAME.GOLD_PER_SECOND * deltaTime;

        if (this.gameState.tower.owner === 'player') {
            this.gameState.player.gold += GameData.TOWER.GOLD_PER_SECOND * deltaTime;
        } else if (this.gameState.tower.owner === 'enemy') {
            this.gameState.enemy.gold += GameData.TOWER.GOLD_PER_SECOND * deltaTime;
        }

        GameAI.update(this.gameState, deltaTime);

        for (const unit of this.gameState.units) {
            unit.update(deltaTime, this.gameState);
        }

        this.gameState.units = this.gameState.units.filter(unit => !unit.isDead());

        this.updateTowerControl();

        if (this.gameState.player.baseHp <= 0) {
            this.endGame(false);
        } else if (this.gameState.enemy.baseHp <= 0) {
            this.endGame(true);
        }

        GameUI.updateUI();
    },

    updateTowerControl() {
        const canvasWidth = this.gameState.canvas.width || 800;
        const towerX = canvasWidth / 2;
        
        let playerUnitsNearTower = 0;
        let enemyUnitsNearTower = 0;

        for (const unit of this.gameState.units) {
            const distance = Math.abs(unit.x - towerX);
            if (distance < 100) {
                if (unit.team === 'player') {
                    playerUnitsNearTower++;
                } else {
                    enemyUnitsNearTower++;
                }
            }
        }

        const currentOwner = this.gameState.tower.owner;
        const threshold = 2;

        if (playerUnitsNearTower > enemyUnitsNearTower + threshold) {
            if (currentOwner !== 'player') {
                this.gameState.tower.hp -= (playerUnitsNearTower - enemyUnitsNearTower) * 0.5;
                if (this.gameState.tower.hp <= 0) {
                    this.gameState.tower.owner = 'player';
                    this.gameState.tower.hp = GameData.TOWER.MAX_HP;
                }
            }
        } else if (enemyUnitsNearTower > playerUnitsNearTower + threshold) {
            if (currentOwner !== 'enemy') {
                this.gameState.tower.hp -= (enemyUnitsNearTower - playerUnitsNearTower) * 0.5;
                if (this.gameState.tower.hp <= 0) {
                    this.gameState.tower.owner = 'enemy';
                    this.gameState.tower.hp = GameData.TOWER.MAX_HP;
                }
            }
        }
    },

    endGame(victory) {
        this.gameState.isGameOver = true;
        this.gameState.winner = victory ? 'player' : 'enemy';
        this.stopAutoSave();
        GameStorage.clearState();
        GameUI.showEndScreen(victory, this.gameState.gameTime);
    }
};