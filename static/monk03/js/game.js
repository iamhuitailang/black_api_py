class Game {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.lastFrameTime = 0;
        this.startTime = 0;
        this.autoSaveTimer = 0;
        this.init();
    }

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        
        uiManager = new UIManager();
        
        uiManager.updateHighScore();
        
        uiManager.tryLoadSave();
        
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        if (gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver) {
            this.update(deltaTime);
        }

        this.renderer.render();
        uiManager.update();
        
        if (gameState.isPlaying && !gameState.isGameOver) {
            this.autoSaveTimer += deltaTime;
            if (this.autoSaveTimer >= 5000) {
                storageManager.saveGame(gameState);
                this.autoSaveTimer = 0;
            }
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        physics.updateClimb(deltaTime);
        physics.updateAnimations(deltaTime);
        physics.updateObstacles(deltaTime);
        physics.updateItems(deltaTime);
        physics.checkCollisions();
        animationManager.update(deltaTime);
        gameState.updatePowerups();
        
        if (this.startTime > 0) {
            gameState.time = Math.floor((Date.now() - this.startTime) / 1000);
        }
    }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
