class Game {
    constructor() {
        this.state = GAME_STATE.MENU;
        this.currentLevel = 1;
        this.selectedHelicopter = 'small';
        this.score = 0;
        this.timeRemaining = 0;
        this.rescuedCount = 0;
        this.totalTargets = 0;
        
        this.physics = new PhysicsEngine();
        this.inputManager = new InputManager();
        this.helicopter = null;
        this.targets = [];
        this.obstacles = [];
        this.level = null;
        this.safeZoneRadius = CONFIG.GAME.safeZoneRadius;
        
        this.lastTime = 0;
        this.gameTime = 0;
        this.autoSaveInterval = null;
    }

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.uiManager = new UIManager(this);
        
        const savedData = storageManager.load();
        this.uiManager.updateLevelSelect(savedData.unlockedLevels, savedData.completedLevels);
        this.uiManager.updateHelicopterSelect(savedData.unlockedHelicopters);
        this.uiManager.showMainMenu(storageManager.hasSavedGame());
    }

    startGame() {
        this.resetGame();
        this.loadLevel(this.currentLevel);
        this.state = GAME_STATE.PLAYING;
        this.uiManager.showGameUI();
        this.startGameLoop();
        this.startAutoSave();
    }

    continueGame() {
        const savedData = storageManager.load();
        if (savedData.currentGame) {
            this.restoreGameState(savedData.currentGame);
            this.state = GAME_STATE.PLAYING;
            this.uiManager.showGameUI();
            this.startGameLoop();
            this.startAutoSave();
        }
    }

    pauseGame() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this.stopGameLoop();
            this.stopAutoSave();
            this.saveGameState();
            this.uiManager.showPauseMenu();
        }
    }

    resumeGame() {
        if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            this.uiManager.hidePauseMenu();
            this.startGameLoop();
            this.startAutoSave();
        }
    }

    restartGame() {
        this.uiManager.hidePauseMenu();
        this.uiManager.hideGameOver();
        this.startGame();
    }

    quitToMenu() {
        this.stopGameLoop();
        this.stopAutoSave();
        this.saveGameState();
        this.state = GAME_STATE.MENU;
        
        const savedData = storageManager.load();
        this.uiManager.updateLevelSelect(savedData.unlockedLevels, savedData.completedLevels);
        this.uiManager.updateHelicopterSelect(savedData.unlockedHelicopters);
        this.uiManager.showMainMenu(storageManager.hasSavedGame());
    }

    nextLevel() {
        if (this.currentLevel < 5) {
            this.currentLevel++;
            this.uiManager.hideGameOver();
            this.startGame();
        }
    }

    resetGame() {
        this.score = 0;
        this.rescuedCount = 0;
        this.inputManager.reset();
    }

    loadLevel(levelNum) {
        this.level = LevelManager.getLevel(levelNum);
        this.timeRemaining = this.level.timeLimit;
        
        const heliConfig = CONFIG.HELICOPTER_TYPES[this.selectedHelicopter];
        this.helicopter = new Helicopter(
            this.selectedHelicopter,
            this.level.helicopter.x,
            this.level.helicopter.y
        );
        
        this.targets = LevelManager.createTargets(levelNum);
        this.totalTargets = this.targets.length;
        
        this.obstacles = LevelManager.createObstacles(levelNum);
        
        this.gameTime = 0;
    }

    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    gameLoop() {
        if (this.state !== GAME_STATE.PLAYING) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        this.timeRemaining -= deltaTime;
        
        if (this.timeRemaining <= 0) {
            this.gameOver(false);
            return;
        }

        const input = this.inputManager.getInput();
        const activeRescue = this.targets.filter(t => 
            t.state === 'climbing' || t.state === 'onboard'
        );
        const hasActiveRescue = activeRescue.length > 0;
        this.helicopter.update(this.physics, input, deltaTime, hasActiveRescue);

        this.physics.clampToBounds(this.helicopter, this.canvas.width, this.canvas.height, this.level.ground);

        for (const obstacle of this.obstacles) {
            obstacle.update(deltaTime);
            
            if (obstacle.checkCollision(this.helicopter)) {
                if (obstacle.lethal) {
                    this.helicopter.crash();
                    this.gameOver(false);
                    return;
                } else {
                    obstacle.applyEffect(this.helicopter);
                }
            }
        }

        const activeRescue = this.targets.filter(t => 
            t.state === 'climbing' || t.state === 'onboard'
        );
        const hasActiveRescue = activeRescue.length > 0;
        
        for (const target of this.targets) {
            if (target.state === 'waiting' && target.checkRopeContact(this.helicopter)) {
                if (!hasActiveRescue) {
                    target.startClimbing(this.helicopter);
                }
            }
            
            if (target.state === 'waiting' && target.checkDirectContact(this.helicopter)) {
                target.startClimbing(this.helicopter);
            }
            
            target.update(this.helicopter, deltaTime);
            
            if (target.state === 'onboard' && !this.helicopter.passengers.includes(target)) {
                this.helicopter.addPassenger(target);
            }
        }

        if (this.helicopter.isInSafeZone(this.level.safeZone, this.safeZoneRadius)) {
            const passengers = this.helicopter.removePassengers();
            for (const passenger of passengers) {
                if (!passenger.rescued) {
                    const points = passenger.rescue();
                    this.score += points;
                    this.rescuedCount++;
                }
            }
            if (passengers.length > 0) {
                this.helicopter.ropeLength = 0;
                this.helicopter.ropeState = 'idle';
            }
        }

        const waitingTargets = this.targets.filter(t => t.state === 'waiting' && !t.rescued);
        const deadTargets = this.targets.filter(t => t.state === 'dead');
        
        if (deadTargets.length > 0) {
            this.gameOver(false);
            return;
        }

        if (this.rescuedCount >= this.totalTargets) {
            this.victory();
            return;
        }

        this.updateHUD();
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground(this.level, this.gameTime);
        this.renderer.drawGround(this.level.ground);
        this.renderer.drawSafeZone(this.level.safeZone, this.safeZoneRadius);
        
        for (const obstacle of this.obstacles) {
            this.renderer.drawObstacle(obstacle);
        }
        
        for (const target of this.targets) {
            this.renderer.drawRescueTarget(target);
        }
        
        this.renderer.drawHelicopter(this.helicopter);
    }

    updateHUD() {
        const stats = {
            level: this.currentLevel,
            score: this.score,
            time: Math.ceil(this.timeRemaining),
            fuel: (this.helicopter.fuel / this.helicopter.maxFuel) * 100,
            rescued: this.rescuedCount,
            total: this.totalTargets
        };
        this.uiManager.updateHUD(stats);
    }

    gameOver(isVictory) {
        this.state = GAME_STATE.GAME_OVER;
        this.stopGameLoop();
        this.stopAutoSave();
        
        if (isVictory) {
            storageManager.completeLevel(this.currentLevel, this.score);
        }

        const stats = {
            level: this.currentLevel,
            score: this.score,
            rescued: this.rescuedCount,
            total: this.totalTargets,
            timeRemaining: Math.max(0, Math.ceil(this.timeRemaining)),
            fuelRemaining: (this.helicopter.fuel / this.helicopter.maxFuel) * 100
        };

        this.renderer.drawGameOver(isVictory, this.score);
        this.uiManager.showGameOver(isVictory, stats);
        
        storageManager.clearGameState();
    }

    victory() {
        const timeBonus = Math.ceil(this.timeRemaining) * 10;
        const fuelBonus = Math.ceil((this.helicopter.fuel / this.helicopter.maxFuel) * 100) * 5;
        this.score += timeBonus + fuelBonus;
        this.gameOver(true);
    }

    saveGameState() {
        const gameState = {
            state: this.state,
            currentLevel: this.currentLevel,
            selectedHelicopter: this.selectedHelicopter,
            score: this.score,
            timeRemaining: this.timeRemaining,
            rescuedCount: this.rescuedCount,
            totalTargets: this.totalTargets,
            helicopter: this.helicopter.getState(),
            targets: this.targets.map(t => t.getState()),
            obstacles: this.obstacles.map(o => o.getState()),
            gameTime: this.gameTime
        };
        storageManager.saveGameState(gameState);
    }

    restoreGameState(savedState) {
        this.state = savedState.state;
        this.currentLevel = savedState.currentLevel;
        this.selectedHelicopter = savedState.selectedHelicopter;
        this.score = savedState.score;
        this.timeRemaining = savedState.timeRemaining;
        this.rescuedCount = savedState.rescuedCount;
        this.totalTargets = savedState.totalTargets;
        this.gameTime = savedState.gameTime;

        this.level = LevelManager.getLevel(this.currentLevel);
        
        this.helicopter = new Helicopter(
            this.selectedHelicopter,
            this.level.helicopter.x,
            this.level.helicopter.y
        );
        this.helicopter.restoreState(savedState.helicopter, this.targets);

        this.targets = LevelManager.createTargets(this.currentLevel);
        savedState.targets.forEach((savedTarget, index) => {
            if (this.targets[index]) {
                this.targets[index].restoreState(savedTarget);
            }
        });

        this.obstacles = LevelManager.createObstacles(this.currentLevel);
        savedState.obstacles.forEach((savedObstacle, index) => {
            if (this.obstacles[index]) {
                this.obstacles[index].restoreState(savedObstacle);
            }
        });

        this.helicopter.passengers = this.targets.filter(t => 
            savedState.helicopter.passengers.includes(t.id)
        );
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.state === GAME_STATE.PLAYING) {
                this.saveGameState();
            }
        }, 5000);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
}