class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.gameState = new GameState();
        this.uiManager = new UIManager(this);
        this.inputHandler = new InputHandler(this);
        
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationId = null;
        this.isRunning = false;
        
        this.autoSaveInterval = null;
        
        this.init();
    }
    
    init() {
        this.uiManager.showScreen('start');
        this.setupAutoSave();
    }
    
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.gameState.currentState === CONSTANTS.GAME_STATES.PLAYING) {
                this.gameState.save();
            }
        }, 5000);
    }
    
    startNewGame() {
        const launcherId = Storage.getSelectedLauncher();
        this.gameState = new GameState();
        this.gameState.currentState = CONSTANTS.GAME_STATES.PLAYING;
        this.gameState.init(launcherId);
        
        this.startGameLoop();
        this.uiManager.showHUD();
    }
    
    continueGame() {
        const savedState = GameState.load();
        if (savedState) {
            this.gameState = savedState;
            this.gameState.currentState = CONSTANTS.GAME_STATES.PLAYING;
            this.startGameLoop();
            this.uiManager.showHUD();
        } else {
            this.startNewGame();
        }
    }
    
    pauseGame() {
        if (this.gameState.currentState === CONSTANTS.GAME_STATES.PLAYING) {
            this.gameState.currentState = CONSTANTS.GAME_STATES.PAUSED;
            this.gameState.save();
            this.uiManager.showPause();
        }
    }
    
    resumeGame() {
        if (this.gameState.currentState === CONSTANTS.GAME_STATES.PAUSED) {
            this.gameState.currentState = CONSTANTS.GAME_STATES.PLAYING;
            this.uiManager.showHUD();
        }
    }
    
    restartLevel() {
        this.gameState.resetLevel();
        this.gameState.currentState = CONSTANTS.GAME_STATES.PLAYING;
        this.uiManager.showHUD();
    }
    
    nextLevel() {
        this.gameState.nextLevel();
        this.gameState.currentState = CONSTANTS.GAME_STATES.PLAYING;
        this.uiManager.showHUD();
    }
    
    quitToMenu() {
        this.stopGameLoop();
        this.gameState.save();
        this.gameState.currentState = CONSTANTS.GAME_STATES.MENU;
        this.uiManager.showScreen('start');
    }
    
    fireBubble(useSpecial = false) {
        if (this.gameState.currentState !== CONSTANTS.GAME_STATES.PLAYING) return;
        if (this.gameState.isProcessing) return;
        if (!this.gameState.launcher.canFire()) return;
        if (this.gameState.activeBubble) return;
        
        const bubble = this.gameState.launcher.fire(useSpecial);
        if (bubble) {
            this.gameState.activeBubble = bubble;
            this.gameState.addShotsFired();
        }
    }
    
    update(deltaTime) {
        if (this.gameState.currentState !== CONSTANTS.GAME_STATES.PLAYING) return;
        
        this.inputHandler.update();
        
        if (this.gameState.activeBubble) {
            Physics.updateActiveBubble(this.gameState, deltaTime);
        }
        
        this.gameState.update(deltaTime);
        
        if (this.gameState.currentState === CONSTANTS.GAME_STATES.LEVEL_COMPLETE) {
            this.stopGameLoop();
            this.uiManager.showLevelComplete(this.gameState);
        } else if (this.gameState.currentState === CONSTANTS.GAME_STATES.GAME_OVER) {
            this.stopGameLoop();
            this.uiManager.showGameOver(this.gameState);
        }
        
        this.uiManager.updateHUD(this.gameState);
    }
    
    render() {
        this.renderer.render(this.gameState);
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.deltaTime > 100) this.deltaTime = 16;
        
        this.update(this.deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    startGameLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    stopGameLoop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    destroy() {
        this.stopGameLoop();
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    window.game = new Game();
});

window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
});

window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.gameState.save();
    }
});
