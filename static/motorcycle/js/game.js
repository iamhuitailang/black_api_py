class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        
        this.motorcycle = null;
        this.terrain = null;
        
        this.gameState = 'menu';
        this.level = 1;
        this.timeLimit = 60;
        this.currentTime = 0;
        this.lastTime = 0;
        
        this.isPaused = false;
        this.isGameOver = false;
        
        this.autoSaveInterval = null;
        
        this.setupUI();
        this.resize();
        this.loadSavedState();
    }

    setupUI() {
        document.getElementById('resumeBtn').addEventListener('click', () => this.resume());
        document.getElementById('restartBtn').addEventListener('click', () => {
            storage.clearGameState();
            this.restart();
        });
        document.getElementById('quitBtn').addEventListener('click', () => {
            storage.clearGameState();
            this.quit();
        });
        document.getElementById('retryBtn').addEventListener('click', () => {
            storage.clearGameState();
            this.restart();
        });
        document.getElementById('menuBtn').addEventListener('click', () => {
            storage.clearGameState();
            this.quit();
        });
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('beforeunload', () => {
            if (this.gameState === 'playing') {
                this.saveGameState();
            }
        });
    }

    resize() {
        const container = document.getElementById('game-container');
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.resize(width, height);
        
        if (this.terrain) {
            this.terrain.width = width;
            this.terrain.height = height;
        }
    }

    loadSavedState() {
        const savedData = storage.load();
        if (savedData) {
            this.level = savedData.currentLevel || 1;
            this.updateMenuStats();
        }
    }

    start(restoreState = false) {
        try {
            console.log('Starting game...');
            this.gameState = 'playing';
            this.isPaused = false;
            this.isGameOver = false;
            
            const levelConfig = CONFIG.LEVELS[this.level - 1] || CONFIG.LEVELS[0];
            this.timeLimit = levelConfig.timeLimit;
            
            if (restoreState) {
                console.log('Attempting to restore game state...');
                const restored = this.restoreGameState();
                if (restored) {
                    console.log('Game state restored successfully!');
                } else {
                    console.log('No saved state found, starting new game...');
                    this.startNewGame(levelConfig);
                }
            } else {
                this.startNewGame(levelConfig);
            }
            
            this.hideMenu('start-menu');
            this.hideMenu('game-over');
            this.showHUD();
            this.showMobileControlsIfNeeded();
            
            this.lastTime = performance.now();
            console.log('Starting game loop...');
            this.gameLoop();
            
            this.startAutoSave();
            console.log('Game started successfully!');
        } catch (error) {
            console.error('Failed to start game:', error);
            alert('游戏启动失败: ' + error.message);
        }
    }

    startNewGame(levelConfig) {
        this.currentTime = 0;
        
        const terrainHeight = this.canvas.height * 0.7;
        console.log('Terrain height:', terrainHeight);
        console.log('Creating motorcycle at y:', terrainHeight - 20);
        this.motorcycle = new Motorcycle(200, terrainHeight - 20, 'offroad');
        
        console.log('Front wheel:', this.motorcycle.frontWheel.x, this.motorcycle.frontWheel.y);
        console.log('Rear wheel:', this.motorcycle.rearWheel.x, this.motorcycle.rearWheel.y);
        
        console.log('Creating terrain...');
        this.terrain = new Terrain(
            this.canvas.width,
            this.canvas.height,
            levelConfig.terrainType
        );
        
        console.log('Terrain segments:', this.terrain.segments.length);
        console.log('First segment:', this.terrain.segments[0]);
        
        console.log('Resetting trick manager...');
        trickManager.reset();
    }

    pause() {
        if (this.gameState !== 'playing') return;
        
        this.isPaused = true;
        this.gameState = 'paused';
        this.showMenu('pause-menu');
        this.saveGameState();
    }

    resume() {
        this.isPaused = false;
        this.gameState = 'playing';
        this.hideMenu('pause-menu');
        this.lastTime = performance.now();
        this.gameLoop();
    }

    restart() {
        this.hideMenu('pause-menu');
        this.hideMenu('game-over');
        this.start();
    }

    quit() {
        this.gameState = 'menu';
        this.isPaused = false;
        this.isGameOver = false;
        
        this.hideMenu('pause-menu');
        this.hideMenu('game-over');
        this.hideHUD();
        this.hideMobileControls();
        this.showMenu('start-menu');
        
        this.saveGameState();
        this.stopAutoSave();
        
        this.updateMenuStats();
    }

    gameOver() {
        this.isGameOver = true;
        this.gameState = 'gameover';
        
        const finalScore = trickManager.getScore();
        storage.updateScore(finalScore);
        storage.updateStats(
            trickManager.getCompletedTricksCount(),
            trickManager.getMaxCombo()
        );
        
        storage.checkUnlocks(finalScore, this.level);
        
        document.getElementById('final-score').textContent = finalScore;
        document.getElementById('final-tricks').textContent = trickManager.getCompletedTricksCount();
        document.getElementById('final-combo').textContent = trickManager.getMaxCombo();
        
        this.hideHUD();
        this.hideMobileControls();
        this.showMenu('game-over');
        
        this.stopAutoSave();
        storage.clearGameState();
    }

    gameLoop() {
        if (this.isPaused || this.isGameOver) return;

        try {
            const currentTime = performance.now();
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
            this.lastTime = currentTime;

            this.update(deltaTime, currentTime);
            this.render();

            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('Game loop error:', error);
            this.gameOver();
        }
    }

    update(deltaTime, currentTime) {
        if (this.timeLimit > 0) {
            this.currentTime += deltaTime;
            if (this.currentTime >= this.timeLimit) {
                this.gameOver();
                return;
            }
        }

        if (input.isReset()) {
            this.resetMotorcycle();
        }

        this.motorcycle.update(input, this.terrain, deltaTime, 0, this.canvas.width);
        
        trickManager.update(this.motorcycle, input, currentTime);
        
        this.terrain.extendIfNeeded(this.renderer.cameraX);
        
        this.checkCrash();
        
        this.updateHUD();
        
        input.update();
    }

    render() {
        this.renderer.render(this.motorcycle, this.terrain, trickManager);
    }

    checkCrash() {
        const pos = this.motorcycle.getPosition();
        const rotation = this.motorcycle.getRotation();
        
        if (Math.abs(rotation) > Math.PI * 0.8) {
            this.gameOver();
        }
        
        if (pos.y > this.canvas.height + 200) {
            this.gameOver();
        }
    }

    resetMotorcycle() {
        const x = this.motorcycle.chassis.position.x - 50;
        const y = this.terrain.getHeightAt(x) - 50;
        this.motorcycle.reset(x, y);
    }

    updateHUD() {
        document.getElementById('score').textContent = trickManager.getScore();
        document.getElementById('combo').textContent = `x${trickManager.getCombo() || 1}`;
        
        if (this.timeLimit > 0) {
            const timeLeft = Math.max(0, this.timeLimit - this.currentTime);
            document.getElementById('time').textContent = Math.ceil(timeLeft);
        } else {
            document.getElementById('time').textContent = '∞';
        }
    }

    updateMenuStats() {
        const data = storage.load();
        document.getElementById('menu-highscore').textContent = data.highScore || 0;
        document.getElementById('menu-level').textContent = data.currentLevel || 1;
    }

    showMenu(menuId) {
        document.getElementById(menuId).classList.remove('hidden');
    }

    hideMenu(menuId) {
        document.getElementById(menuId).classList.add('hidden');
    }

    showHUD() {
        document.getElementById('hud').classList.remove('hidden');
    }

    hideHUD() {
        document.getElementById('hud').classList.add('hidden');
    }

    showMobileControlsIfNeeded() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            document.getElementById('mobile-controls').classList.remove('hidden');
        }
    }

    hideMobileControls() {
        document.getElementById('mobile-controls').classList.add('hidden');
    }

    saveGameState() {
        if (!this.motorcycle || this.isGameOver) return;
        
        const state = {
            level: this.level,
            currentTime: this.currentTime,
            motorcycle: this.motorcycle.getState(),
            terrain: this.terrain.getState(),
            tricks: trickManager.getState(),
            camera: {
                x: this.renderer.cameraX,
                y: this.renderer.cameraY
            }
        };
        
        storage.saveGameState(state);
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveGameState();
        }, 5000);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    restoreGameState() {
        const state = storage.loadGameState();
        if (!state) return false;
        
        try {
            this.level = state.level;
            this.currentTime = state.currentTime;
            
            this.motorcycle = new Motorcycle(200, 400, 'offroad');
            this.motorcycle.restoreState(state.motorcycle);
            
            this.terrain = new Terrain(this.canvas.width, this.canvas.height, 'easy');
            this.terrain.restoreState(state.terrain);
            
            trickManager.restoreState(state.tricks);
            
            if (state.camera) {
                this.renderer.cameraX = state.camera.x;
                this.renderer.cameraY = state.camera.y;
            }
            
            return true;
        } catch (e) {
            console.error('Failed to restore game state:', e);
            return false;
        }
    }
}