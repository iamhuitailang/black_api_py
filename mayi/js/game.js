const Game = {
    canvas: null,
    lastTime: 0,
    animationId: null,
    saveTimer: 0,

    init() {
        this.canvas = document.getElementById('game-canvas');
        RenderSystem.init(this.canvas);
        UISystem.init();
        UISystem.showStartScreen();
    },

    startNewGame() {
        GameState.init();
        GameState.colony = new Colony(CONFIG.COLONY.X, CONFIG.COLONY.Y);
        GameState.colony.maxHp = GameState.getMaxHp();
        GameState.colony.hp = GameState.colony.maxHp;
        
        this.generateResourcePoints();
        this.spawnInitialUnits();
        
        GameState.isRunning = true;
        GameState.waveTimer = 3000;
        
        UISystem.hideStartScreen();
        UISystem.hideGameOverScreen();
        UISystem.hidePauseScreen();
        UISystem.updateSpeedButton();
        
        this.lastTime = performance.now();
        this.gameLoop();
    },

    continueGame() {
        const savedData = Storage.load();
        if (!savedData) {
            this.startNewGame();
            return;
        }
        
        GameState.deserialize(savedData);
        GameState.isRunning = true;
        GameState.isPaused = false;
        
        UISystem.hideStartScreen();
        UISystem.hideGameOverScreen();
        UISystem.hidePauseScreen();
        
        this.lastTime = performance.now();
        this.gameLoop();
    },

    generateResourcePoints() {
        GameState.resourcePoints = [];
        const count = CONFIG.RESOURCE_POINTS.COUNT;
        const minDistance = CONFIG.RESOURCE_POINTS.MIN_DISTANCE_FROM_COLONY;
        
        for (let i = 0; i < count; i++) {
            let x, y, attempts = 0;
            do {
                x = 100 + Math.random() * (CONFIG.CANVAS_WIDTH - 200);
                y = 100 + Math.random() * (CONFIG.CANVAS_HEIGHT - 300);
                attempts++;
            } while (
                Math.sqrt(Math.pow(x - CONFIG.COLONY.X, 2) + Math.pow(y - CONFIG.COLONY.Y, 2)) < minDistance &&
                attempts < 50
            );
            
            GameState.resourcePoints.push(new ResourcePoint(x, y));
        }
    },

    spawnInitialUnits() {
        for (let i = 0; i < 3; i++) {
            const offsetX = (i - 1) * 30;
            const unit = new Unit('worker', CONFIG.COLONY.X + offsetX, CONFIG.COLONY.Y - 20);
            GameState.units.push(unit);
        }
        
        const soldier = new Unit('soldier', CONFIG.COLONY.X, CONFIG.COLONY.Y - 40);
        GameState.units.push(soldier);
    },

    gameLoop() {
        if (!GameState.isRunning) return;
        
        if (GameState.isPaused) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        const currentTime = performance.now();
        let deltaTime = currentTime - this.lastTime;
        deltaTime = Math.min(deltaTime, 100) * GameState.speedMultiplier;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        RenderSystem.render();
        UISystem.update();
        
        this.saveTimer += deltaTime;
        if (this.saveTimer >= 5000) {
            this.saveGame();
            this.saveTimer = 0;
        }
        
        if (GameState.isGameOver) {
            this.onGameOver();
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },

    update(deltaTime) {
        this.updateHatching(deltaTime);
        AISystem.update(deltaTime);
        CombatSystem.update(deltaTime);
        WaveSystem.update(deltaTime);
    },

    updateHatching(deltaTime) {
        if (GameState.hatchQueue.length === 0) {
            GameState.currentHatchTime = 0;
            GameState.totalHatchTime = 0;
            return;
        }
        
        if (GameState.currentHatchTime <= 0) {
            const unitType = GameState.hatchQueue[0];
            const baseTime = CONFIG.COLONY.HATCH_TIME;
            const multiplier = GameState.getHatchTimeMultiplier();
            GameState.totalHatchTime = baseTime * multiplier;
            GameState.currentHatchTime = GameState.totalHatchTime;
        }
        
        GameState.currentHatchTime -= deltaTime;
        
        if (GameState.currentHatchTime <= 0) {
            const unitType = GameState.hatchQueue.shift();
            this.hatchUnit(unitType);
            GameState.currentHatchTime = 0;
            GameState.totalHatchTime = 0;
        }
    },

    hatchUnit(unitType) {
        const colony = GameState.colony;
        if (!colony) return;
        
        const offsetX = (Math.random() - 0.5) * 60;
        const unit = new Unit(unitType, colony.x + offsetX, colony.y - 20);
        GameState.units.push(unit);
    },

    togglePause() {
        if (!GameState.isRunning) return;
        
        GameState.isPaused = !GameState.isPaused;
        if (GameState.isPaused) {
            UISystem.showPauseScreen();
        } else {
            UISystem.hidePauseScreen();
            this.lastTime = performance.now();
        }
    },

    resume() {
        GameState.isPaused = false;
        UISystem.hidePauseScreen();
        this.lastTime = performance.now();
    },

    restart() {
        UISystem.hidePauseScreen();
        this.saveGame();
        this.startNewGame();
    },

    quitToMenu() {
        GameState.isRunning = false;
        GameState.isPaused = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        UISystem.hidePauseScreen();
        UISystem.hideGameOverScreen();
        UISystem.showStartScreen();
    },

    onGameOver() {
        GameState.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        Storage.saveHighestWave(GameState.currentWave);
        UISystem.showGameOver(false);
    },

    saveGame() {
        if (!GameState.isRunning || GameState.isGameOver) return;
        const data = GameState.serialize();
        Storage.save(data);
    }
};
