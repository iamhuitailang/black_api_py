class GameApp {
    constructor() {
        this.uiManager = null;
        this.gameEngine = null;
        this.saveInterval = null;
        this.isGameActive = false;
        
        this.init();
    }

    init() {
        this.uiManager = new UIManager();
        this.gameEngine = new GameEngine();
        
        this.bindEvents();
        
        const savedState = StorageManager.loadGameState();
        if (savedState) {
            this.autoResumeGame(savedState);
        } else {
            this.uiManager.showStartMenu(false);
        }
        
        this.gameLoop();
    }

    autoResumeGame(savedState) {
        this.gameEngine.loadGameState(savedState);
        this.gameEngine.start();
        
        this.uiManager.hideStartMenu();
        this.uiManager.hideGameOverMenu();
        this.uiManager.showGameScreen();
        
        this.isGameActive = true;
        this.startAutoSave();
    }

    bindEvents() {
        this.uiManager.onStartGame = () => this.startGame();
        this.uiManager.onResumeGame = () => this.resumeGame();
        this.uiManager.onPauseGame = () => this.pauseGame();
        this.uiManager.onResumeGameFromPause = () => this.resumeFromPause();
        this.uiManager.onRestartGame = () => this.restartGame();
        this.uiManager.onExitGame = () => this.exitGame();
        
        this.gameEngine.onGameOver = (winner, reason) => this.handleGameOver(winner, reason);
        
        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGameState();
            }
        });
    }

    startGame() {
        const selectedCharacter = this.uiManager.getSelectedCharacter();
        
        this.gameEngine.init(selectedCharacter);
        this.gameEngine.start();
        
        this.uiManager.hideStartMenu();
        this.uiManager.hideGameOverMenu();
        this.uiManager.showGameScreen();
        
        this.isGameActive = true;
        this.startAutoSave();
    }

    resumeGame() {
        const savedState = StorageManager.loadGameState();
        if (savedState) {
            this.gameEngine.loadGameState(savedState);
            this.gameEngine.start();
            
            this.uiManager.hideStartMenu();
            this.uiManager.hideGameOverMenu();
            this.uiManager.showGameScreen();
            
            this.isGameActive = true;
            this.startAutoSave();
        }
    }

    pauseGame() {
        if (!this.gameEngine.isRunning) return;
        
        this.gameEngine.pause();
        this.uiManager.showPauseMenu();
        
        this.saveGameState();
    }

    resumeFromPause() {
        this.gameEngine.resume();
        this.uiManager.hidePauseMenu();
    }

    restartGame() {
        this.stopAutoSave();
        StorageManager.clearSave();
        
        this.uiManager.hidePauseMenu();
        this.uiManager.hideGameOverMenu();
        
        const selectedCharacter = this.uiManager.getSelectedCharacter();
        this.gameEngine.init(selectedCharacter);
        this.gameEngine.start();
        
        this.uiManager.showGameScreen();
        this.startAutoSave();
    }

    exitGame() {
        this.stopAutoSave();
        this.saveGameState();
        
        this.gameEngine.stop();
        this.isGameActive = false;
        
        this.uiManager.hidePauseMenu();
        this.uiManager.hideGameOverMenu();
        this.uiManager.hideGameScreen();
        this.uiManager.showStartMenu(StorageManager.hasSavedGame());
    }

    handleGameOver(winner, reason) {
        this.stopAutoSave();
        StorageManager.clearSave();
        this.isGameActive = false;
        
        this.uiManager.showGameOverMenu(winner, reason);
    }

    saveGameState() {
        if (this.gameEngine && (this.gameEngine.isRunning || this.isGameActive)) {
            const state = this.gameEngine.getGameState();
            StorageManager.saveGameState(state);
        }
    }

    startAutoSave() {
        this.stopAutoSave();
        this.saveInterval = setInterval(() => {
            this.saveGameState();
        }, 5000);
    }

    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }

    gameLoop() {
        if (this.gameEngine && this.gameEngine.isRunning && !this.gameEngine.isPaused) {
            this.uiManager.updateTimer(this.gameEngine.gameTime);
            this.uiManager.updatePlayerInfo(this.gameEngine.player);
            this.uiManager.updateEnemyInfo(this.gameEngine.enemy);
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});