class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.ui = new UIManager();
        
        this.player = new Player();
        this.windSystem = new WindSystem();
        this.obstacleSystem = new ObstacleSystem();
        this.terrainSystem = new TerrainSystem();
        
        this.gameState = 'menu';
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false
        };
        
        this.lastTime = 0;
        this.lastSaveTime = 0;
        this.currentScore = 0;
        this.landingDistance = 0;
        this.isNewHighScore = false;
        this.currentLevel = 1;
        this.cameraMode = CONFIG.CAMERA.MODES.FOLLOW;
        this.cameraModes = [
            { id: CONFIG.CAMERA.MODES.FOLLOW, name: '跟随视角' },
            { id: CONFIG.CAMERA.MODES.FIXED, name: '固定视角' },
            { id: CONFIG.CAMERA.MODES.FIRST_PERSON, name: '第一人称' }
        ];
        
        this.init();
    }
    
    init() {
        this.renderer.resize();
        window.addEventListener('resize', () => this.renderer.resize());
        
        this.setupInput();
        this.setupUI();
        
        const savedState = Storage.getGameState();
        if (savedState) {
            this.loadState(savedState);
        } else {
            this.ui.showStartMenu();
        }
        
        this.gameLoop();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing' && this.player.canOpenParachute) {
                this.player.openParachute();
            }
        });
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing') {
            if (e.code === 'Escape' && this.gameState === 'paused') {
                this.resumeGame();
            }
            return;
        }
        
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                break;
            case 'Space':
                e.preventDefault();
                if (this.player.canOpenParachute) {
                    this.player.openParachute();
                }
                break;
            case 'Escape':
                this.pauseGame();
                break;
            case 'KeyV':
                this.switchCameraMode();
                break;
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
            case 'Digit9':
            case 'Digit0':
                const levelNum = parseInt(e.code.replace('Digit', ''));
                const actualLevel = levelNum === 0 ? 10 : levelNum;
                if (actualLevel <= Storage.getCurrentLevel()) {
                    this.startGame(actualLevel);
                }
                break;
        }
    }
    
    switchCameraMode() {
        const modes = Object.values(CONFIG.CAMERA.MODES);
        const currentIndex = modes.indexOf(this.cameraMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.cameraMode = modes[nextIndex];
    }
    
    handleKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'Space':
                this.keys.space = false;
                break;
        }
    }
    
    setupUI() {
        this.ui.elements.startBtn.addEventListener('click', () => this.startGame());
        this.ui.elements.tutorialBtn.addEventListener('click', () => this.ui.showTutorialMenu());
        this.ui.elements.closeTutorialBtn.addEventListener('click', () => this.ui.hideTutorialMenu());
        
        this.ui.elements.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.ui.elements.restartBtn.addEventListener('click', () => this.restartGame());
        this.ui.elements.quitBtn.addEventListener('click', () => this.quitToMenu());
        
        this.ui.elements.playAgainBtn.addEventListener('click', () => this.restartGame());
        this.ui.elements.backToMenuBtn.addEventListener('click', () => this.quitToMenu());
        
        this.ui.elements.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.ui.elements.cameraBtn.addEventListener('click', () => this.switchCameraMode());
    }
    
    startGame(level = null) {
        if (level) {
            this.currentLevel = level;
        } else {
            this.currentLevel = this.ui.getSelectedLevel();
        }
        
        const terrainType = this.ui.getSelectedTerrain();
        const levelConfig = CONFIG.LEVELS[this.currentLevel] || CONFIG.LEVELS[1];
        
        this.player.init();
        this.windSystem.init();
        this.obstacleSystem.init();
        this.terrainSystem.init(terrainType);
        
        this.terrainSystem.targetRadius = levelConfig.targetRadius;
        this.windSystem.strengthMultiplier = levelConfig.windStrength;
        this.obstacleSystem.densityMultiplier = levelConfig.obstacleDensity;
        
        this.currentScore = 0;
        this.landingDistance = 0;
        this.isNewHighScore = false;
        
        this.gameState = 'playing';
        this.ui.hideAllMenus();
        
        Storage.clearGameState();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.ui.showPauseMenu();
            this.saveState();
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.ui.hidePauseMenu();
            this.lastTime = performance.now();
        }
    }
    
    restartGame() {
        this.ui.hideAllMenus();
        this.startGame();
    }
    
    quitToMenu() {
        this.gameState = 'menu';
        this.ui.hideAllMenus();
        this.ui.selectedLevel = Storage.getCurrentLevel();
        this.ui.showStartMenu();
        Storage.clearGameState();
    }
    
    gameOver(isSuccess) {
        this.gameState = 'gameOver';
        
        if (isSuccess && this.player.landingSuccess) {
            this.landingDistance = this.terrainSystem.getDistanceToTarget(this.player.x);
            this.currentScore = Utils.calculateScore(
                this.landingDistance,
                this.terrainSystem.getScoreMultiplier(),
                this.player.hasMagnet
            );
            
            this.isNewHighScore = Storage.setHighScore(this.currentScore);
            
            const levelConfig = CONFIG.LEVELS[this.currentLevel] || CONFIG.LEVELS[1];
            if (this.currentScore >= levelConfig.requiredScore) {
                const currentStoredLevel = Storage.getCurrentLevel();
                if (this.currentLevel >= currentStoredLevel && this.currentLevel < 10) {
                    const newLevel = this.currentLevel + 1;
                    Storage.setCurrentLevel(newLevel);
                    Storage.checkTerrainUnlocks(newLevel);
                    this.ui.selectedLevel = newLevel;
                }
            }
        } else {
            this.currentScore = 0;
            this.landingDistance = 0;
            isSuccess = false;
        }
        
        Storage.clearGameState();
        
        setTimeout(() => {
            this.ui.showGameOverMenu(
                isSuccess,
                this.landingDistance,
                this.currentScore,
                Storage.getHighScore(),
                this.player.deathReason
            );
        }, 500);
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.player.setInput(this.keys);
        
        this.windSystem.update(this.player.altitude, deltaTime);
        const windSpeed = this.windSystem.getEffectiveSpeed();
        
        this.player.update(windSpeed, this.obstacleSystem, deltaTime);
        
        this.obstacleSystem.update(this.player, deltaTime);
        this.obstacleSystem.checkCollisions(this.player, this.windSystem);
        
        if (this.player.isDead) {
            this.gameOver(false);
            return;
        }
        
        if (this.player.altitude <= 0) {
            this.gameOver(true);
            return;
        }
        
        const now = Date.now();
        if (now - this.lastSaveTime > CONFIG.GAME.SAVE_INTERVAL) {
            this.saveState();
            this.lastSaveTime = now;
        }
    }
    
    render() {
        this.renderer.clear();
        
        if (this.gameState === 'menu') {
            this.renderMenuBackground();
            return;
        }
        
        if (this.gameState === 'gameOver') {
            this.renderer.drawBackground(0);
            this.renderer.drawGround(this.terrainSystem, this.player);
            return;
        }
        
        this.renderer.cameraMode = this.cameraMode;
        this.renderer.currentLevel = this.currentLevel;
        
        this.renderer.drawBackground(this.player.altitude);
        
        if (this.cameraMode !== CONFIG.CAMERA.MODES.FIRST_PERSON) {
            this.renderer.drawAltitudeMarkers(this.player.altitude);
        }
        
        const obstaclesInView = this.obstacleSystem.getObstaclesInView(this.player, this.renderer.height);
        this.renderer.drawObstacles(obstaclesInView, this.player);
        
        const rewardsInView = this.obstacleSystem.getRewardsInView(this.player, this.renderer.height);
        this.renderer.drawRewards(rewardsInView, this.player);
        
        this.renderer.drawGround(this.terrainSystem, this.player);
        
        if (this.cameraMode !== CONFIG.CAMERA.MODES.FIRST_PERSON) {
            this.renderer.drawPlayer(this.player);
        } else {
            this.renderer.drawFirstPersonView(this.player);
        }
        
        this.renderer.drawMinimap(this.player, this.terrainSystem);
        
        if (this.cameraMode === CONFIG.CAMERA.MODES.FIRST_PERSON) {
            this.renderer.drawFirstPersonOverlay(this.player);
        }
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.ui.updateHUD(this.player, this.windSystem, this.terrainSystem, this.currentScore, this.currentLevel, this.cameraMode);
        }
    }
    
    renderMenuBackground() {
        const gradient = this.renderer.ctx.createLinearGradient(0, 0, 0, this.renderer.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        
        this.renderer.ctx.fillStyle = gradient;
        this.renderer.ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
        
        const time = Date.now() / 1000;
        for (let i = 0; i < 50; i++) {
            const x = (i * 37 + time * 10) % this.renderer.width;
            const y = (i * 23 + Math.sin(time + i) * 20) % this.renderer.height;
            const size = 1 + Math.sin(time * 2 + i) * 0.5;
            
            this.renderer.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time + i) * 0.2})`;
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.renderer.ctx.fill();
        }
    }
    
    saveState() {
        if (this.gameState !== 'playing') return;
        
        const state = {
            gameState: this.gameState,
            player: this.player.serialize(),
            windSystem: this.windSystem.serialize(),
            obstacleSystem: this.obstacleSystem.serialize(),
            terrainSystem: this.terrainSystem.serialize(),
            currentScore: this.currentScore,
            currentLevel: this.currentLevel,
            cameraMode: this.cameraMode,
            timestamp: Date.now()
        };
        
        Storage.saveGameState(state);
    }
    
    loadState(state) {
        if (!state || state.gameState !== 'playing') {
            this.ui.showStartMenu();
            return;
        }
        
        const now = Date.now();
        if (now - state.timestamp > 3600000) {
            Storage.clearGameState();
            this.ui.showStartMenu();
            return;
        }
        
        this.player.deserialize(state.player);
        this.windSystem.deserialize(state.windSystem);
        this.obstacleSystem.deserialize(state.obstacleSystem);
        this.terrainSystem.deserialize(state.terrainSystem);
        this.currentScore = state.currentScore || 0;
        this.currentLevel = state.currentLevel || 1;
        this.cameraMode = state.cameraMode || CONFIG.CAMERA.MODES.FOLLOW;
        this.ui.selectedLevel = this.currentLevel;
        
        this.gameState = 'playing';
        this.ui.hideAllMenus();
        this.lastTime = performance.now();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
