class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        this.state = GAME_STATE.TITLE;
        this.gameMode = null;
        this.currentLevelId = null;

        this.player = null;
        this.level = null;
        this.saveData = storage.load();

        this.ui = new UIManager(this);
        this.ui.updateContinueButton();

        this.lastSaveTime = 0;
        this.autoSaveInterval = 5000;

        this.animationFrameId = null;
        this.lastTime = 0;
        
        this.speedLines = [];
        this.initSpeedLines();
        
        this.frameCount = 0;
    }

    initSpeedLines() {
        this.speedLines = [];
        for (let i = 0; i < 8; i++) {
            this.speedLines.push({
                y: 100 + i * 70,
                length: 80 + i * 10,
                offset: i * 160,
                speed: 12 + i * 2
            });
        }
    }

    startNewGame() {
        storage.reset();
        this.saveData = storage.load();
        this.stopGameLoop();
        this.state = GAME_STATE.TITLE;
        this.ui.showScreen('mode-select');
    }

    continueGame() {
        const savedData = storage.currentData;
        if (savedData && savedData.inGameState) {
            this.stopGameLoop();
            
            this.gameMode = savedData.gameMode || 'story';
            this.currentLevelId = savedData.inGameState.level.id;
            
            const levelData = this.getLevelData(this.currentLevelId);
            this.level = new Level(levelData);
            
            this.player = new Player(
                savedData.inGameState.player.x,
                savedData.inGameState.player.y
            );
            
            this.player.rings = savedData.inGameState.player.rings;
            this.player.lives = savedData.inGameState.player.lives;
            this.player.score = savedData.inGameState.player.score;
            this.player.vx = savedData.inGameState.player.vx;
            this.player.vy = savedData.inGameState.player.vy;
            this.player.isSuper = savedData.inGameState.player.isSuper || false;
            this.player.hasShield = savedData.inGameState.player.hasShield || false;
            this.player.shieldType = savedData.inGameState.player.shieldType || null;
            this.player.invincible = savedData.inGameState.player.invincible || false;
            this.player.invincibleTimer = savedData.inGameState.player.invincibleTimer || 0;
            this.player.grounded = savedData.inGameState.player.grounded || false;
            this.player.facingRight = savedData.inGameState.player.facingRight !== false;

            this.level.time = savedData.inGameState.level.time;
            this.level.cameraX = savedData.inGameState.level.cameraX;
            this.level.collectedRings = savedData.inGameState.level.collectedRings || 0;
            this.level.defeatedEnemies = savedData.inGameState.level.defeatedEnemies || 0;

            if (savedData.inGameState.level.ringsState) {
                savedData.inGameState.level.ringsState.forEach((state, index) => {
                    if (this.level.rings[index]) {
                        this.level.rings[index].collected = state.collected;
                    }
                });
            }
            
            if (savedData.inGameState.level.enemiesState) {
                savedData.inGameState.level.enemiesState.forEach((state, index) => {
                    if (this.level.enemies[index]) {
                        this.level.enemies[index].defeated = state.defeated;
                        if (state.x !== undefined) this.level.enemies[index].x = state.x;
                        if (state.y !== undefined) this.level.enemies[index].y = state.y;
                    }
                });
            }
            
            if (savedData.inGameState.level.powerUpsState) {
                savedData.inGameState.level.powerUpsState.forEach((state, index) => {
                    if (this.level.powerUps[index]) {
                        this.level.powerUps[index].collected = state.collected;
                    }
                });
            }

            this.initSpeedLines();
            this.state = GAME_STATE.PLAYING;
            this.ui.hideAllPopups();
            this.ui.showScreen('hud');
            this.ui.showHUD();
            this.hideTitleElements();
            this.startGameLoop();
        } else {
            this.ui.showScreen('mode-select');
        }
    }

    selectGameMode(mode) {
        this.gameMode = mode;
        this.ui.showLevelSelect();
    }

    getLevelData(levelId) {
        if (levelId === 'hidden') {
            return CONFIG.HIDDEN_LEVEL;
        }
        return CONFIG.LEVELS.find(l => l.id === levelId);
    }

    startLevel(levelId) {
        this.stopGameLoop();
        this.currentLevelId = levelId;
        const levelData = this.getLevelData(levelId);
        
        this.player = new Player(100, 450);
        this.level = new Level(levelData);
        this.initSpeedLines();

        this.state = GAME_STATE.PLAYING;
        this.ui.hideAllPopups();
        this.ui.showHUD();
        this.hideTitleElements();
        this.startGameLoop();
    }

    hideTitleElements() {
        document.querySelectorAll('.screen:not(.popup)').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    pauseGame() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this.ui.showPauseMenu();
            this.saveGameState();
        }
    }

    resumeGame() {
        if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            this.ui.hidePauseMenu();
            this.lastTime = performance.now();
            this.startGameLoop();
        }
    }

    restartLevel() {
        this.stopGameLoop();
        this.ui.hideAllPopups();
        this.startLevel(this.currentLevelId);
    }

    quitToMenu() {
        this.saveGameState();
        this.stopGameLoop();
        this.state = GAME_STATE.TITLE;
        this.ui.hideAllPopups();
        this.ui.hideHUD();
        this.ui.showScreen('title-screen');
        this.ui.updateContinueButton();
    }

    nextLevel() {
        const currentIndex = CONFIG.LEVELS.findIndex(l => l.id === this.currentLevelId);
        if (currentIndex < CONFIG.LEVELS.length - 1) {
            const nextLevelId = CONFIG.LEVELS[currentIndex + 1].id;
            this.saveData.unlockedLevels.push(nextLevelId);
            storage.save(this.saveData);
            this.startLevel(nextLevelId);
        } else {
            this.finishGame();
        }
    }

    finishGame() {
        this.stopGameLoop();
        storage.clearInGameState();
        this.state = GAME_STATE.ENDING;
        this.ui.showEnding(this.saveData.totalScore, this.saveData.totalTime);
    }

    handleLevelComplete() {
        this.stopGameLoop();
        this.state = GAME_STATE.LEVEL_COMPLETE;
        
        const levelScore = this.level.getScore();
        this.player.score += levelScore;
        this.saveData.totalScore += levelScore;
        this.saveData.totalTime += this.level.time;
        
        const currentIndex = CONFIG.LEVELS.findIndex(l => l.id === this.currentLevelId);
        if (currentIndex < CONFIG.LEVELS.length - 1) {
            const nextLevelId = CONFIG.LEVELS[currentIndex + 1].id;
            if (!this.saveData.unlockedLevels.includes(nextLevelId)) {
                this.saveData.unlockedLevels.push(nextLevelId);
            }
        }

        storage.save(this.saveData);
        this.ui.showLevelComplete(this.level, this.player);
    }

    handleDeath() {
        this.stopGameLoop();
        this.state = GAME_STATE.GAME_OVER;
        storage.clearInGameState();
        this.ui.showGameOver(this.player);
    }

    saveGameState() {
        if (this.player && this.level) {
            const ringsState = this.level.rings.map(ring => ({
                collected: ring.collected
            }));
            
            const enemiesState = this.level.enemies.map(enemy => ({
                defeated: enemy.defeated,
                x: enemy.x,
                y: enemy.y
            }));
            
            const powerUpsState = this.level.powerUps.map(powerUp => ({
                collected: powerUp.collected
            }));

            const gameState = {
                player: {
                    x: this.player.x,
                    y: this.player.y,
                    vx: this.player.vx,
                    vy: this.player.vy,
                    rings: this.player.rings,
                    lives: this.player.lives,
                    score: this.player.score,
                    isSuper: this.player.isSuper,
                    hasShield: this.player.hasShield,
                    shieldType: this.player.shieldType,
                    invincible: this.player.invincible,
                    invincibleTimer: this.player.invincibleTimer,
                    grounded: this.player.grounded,
                    facingRight: this.player.facingRight
                },
                level: {
                    id: this.level.id,
                    time: this.level.time,
                    cameraX: this.level.cameraX,
                    collectedRings: this.level.collectedRings,
                    defeatedEnemies: this.level.defeatedEnemies,
                    ringsState: ringsState,
                    enemiesState: enemiesState,
                    powerUpsState: powerUpsState
                },
                gameMode: this.gameMode
            };
            storage.saveGameState(gameState);
        }
    }

    startGameLoop() {
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.gameLoop();
    }

    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    gameLoop() {
        if (this.state !== GAME_STATE.PLAYING) {
            return;
        }

        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 32);
        this.lastTime = currentTime;
        this.frameCount++;

        try {
            this.update(deltaTime);
            this.render();

            if (currentTime - this.lastSaveTime > this.autoSaveInterval) {
                this.saveGameState();
                this.lastSaveTime = currentTime;
            }
        } catch (error) {
            console.error('Game loop error:', error);
        }

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (input.pause) {
            this.pauseGame();
            return;
        }

        this.player.update(input, this.level);
        
        const result = this.level.update(this.player, input);
        
        if (result === 'complete') {
            this.handleLevelComplete();
            return;
        } else if (result === 'death') {
            if (this.player.lives <= 0) {
                this.handleDeath();
                return;
            }
        }

        this.ui.updateHUD(this.player, this.level);
        input.update();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.level.draw(this.ctx, this.player);
        this.player.draw(this.ctx, this.level.cameraX);

        if (Math.abs(this.player.vx) > 10 || this.player.isSuper) {
            this.drawSpeedEffects(this.ctx);
        }
    }

    drawSpeedEffects(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.speedLines.length; i++) {
            const line = this.speedLines[i];
            line.offset -= line.speed;
            if (line.offset < -line.length) {
                line.offset = 1280 + 50;
            }
            
            ctx.beginPath();
            ctx.moveTo(line.offset, line.y);
            ctx.lineTo(line.offset - line.length, line.y);
            ctx.stroke();
        }
    }
}
