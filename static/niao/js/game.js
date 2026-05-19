class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.state = CONFIG.GAME_STATE.MENU;
        this.score = 0;
        this.highScore = Storage.getHighScore();
        this.isNewRecord = false;
        
        this.particleSystem = new ParticleSystem();
        this.background = null;
        this.bird = null;
        this.pipeManager = null;
        this.inputManager = new InputManager(canvas);
        this.uiManager = new UIManager();
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.bindUIActions();
        this.tryRestoreGameState();
    }
    
    resizeCanvas() {
        const container = document.getElementById('game-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        CONFIG.GAME.WIDTH = width;
        CONFIG.GAME.HEIGHT = height;
    }
    
    bindUIActions() {
        this.uiManager.onStart(() => this.startGame());
        this.uiManager.onPause(() => this.pauseGame());
        this.uiManager.onResume(() => this.resumeGame());
        this.uiManager.onRestart(() => this.restartGame());
        this.uiManager.onQuit(() => this.quitToMenu());
        
        this.inputManager.init(
            () => this.handleJump(),
            () => this.handlePauseToggle()
        );
    }
    
    handleJump() {
        if (this.state === CONFIG.GAME_STATE.PLAYING && this.bird) {
            this.bird.jump();
        }
    }
    
    handlePauseToggle() {
        if (this.state === CONFIG.GAME_STATE.PLAYING) {
            this.pauseGame();
        } else if (this.state === CONFIG.GAME_STATE.PAUSED) {
            this.resumeGame();
        }
    }
    
    startGame() {
        const characterKey = this.uiManager.getSelectedCharacter();
        const themeKey = this.uiManager.getSelectedTheme();
        
        this.background = new Background(this.canvas, themeKey);
        this.bird = new Bird(this.canvas, characterKey, this.particleSystem);
        this.pipeManager = new PipeManager(this.canvas, this.background.theme);
        
        this.score = 0;
        this.isNewRecord = false;
        this.particleSystem.clear();
        
        this.bird.vy = -2;
        
        this.state = CONFIG.GAME_STATE.PLAYING;
        this.uiManager.showGameUI();
        this.uiManager.updateScore(this.score);
        
        this.lastTime = performance.now();
        this.pipeManager.lastSpawnTime = performance.now() + 1500;
        this.gameLoop();
    }
    
    pauseGame() {
        if (this.state !== CONFIG.GAME_STATE.PLAYING) return;
        
        this.state = CONFIG.GAME_STATE.PAUSED;
        this.uiManager.showPauseScreen();
        this.saveGameState();
    }
    
    resumeGame() {
        if (this.state !== CONFIG.GAME_STATE.PAUSED) return;
        
        this.state = CONFIG.GAME_STATE.PLAYING;
        this.uiManager.hidePauseScreen();
        this.lastTime = performance.now();
        this.pipeManager.lastSpawnTime = performance.now();
        this.gameLoop();
    }
    
    restartGame() {
        this.stopGameLoop();
        Storage.clearGameState();
        this.startGame();
    }
    
    quitToMenu() {
        this.stopGameLoop();
        this.state = CONFIG.GAME_STATE.MENU;
        this.uiManager.showStartScreen();
        Storage.clearGameState();
        this.particleSystem.clear();
    }
    
    gameOver() {
        this.state = CONFIG.GAME_STATE.GAME_OVER;
        this.stopGameLoop();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            Storage.setHighScore(this.highScore);
            this.isNewRecord = true;
        }
        
        this.uiManager.showGameOverScreen(this.score, this.isNewRecord);
        Storage.clearGameState();
    }
    
    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameLoop() {
        if (this.state !== CONFIG.GAME_STATE.PLAYING) return;
        
        const currentTime = performance.now();
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        deltaTime = Math.min(deltaTime, 50);
        
        this.update(currentTime, deltaTime);
        this.draw();
        
        this.saveGameState();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(currentTime, deltaTime) {
        if (!this.bird || !this.pipeManager || !this.background) return;
        
        this.background.update();
        this.bird.update(deltaTime);
        this.pipeManager.update(currentTime, this.bird.x);
        this.particleSystem.update();
        
        const newScore = this.pipeManager.getScore();
        if (newScore !== this.score) {
            this.score = newScore;
            this.uiManager.updateScore(this.score);
        }
        
        if (this.pipeManager.checkCollision(this.bird)) {
            this.gameOver();
            return;
        }
        
        if (this.bird.checkBoundaryCollision()) {
            this.gameOver();
            return;
        }
    }
    
    draw() {
        if (!this.background || !this.bird || !this.pipeManager) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.background.draw();
        this.pipeManager.draw();
        this.bird.draw();
        this.particleSystem.draw(this.ctx);
    }
    
    saveGameState() {
        if (this.state !== CONFIG.GAME_STATE.PLAYING && this.state !== CONFIG.GAME_STATE.PAUSED) return;
        
        const state = {
            state: this.state,
            score: this.score,
            character: this.bird ? this.bird.characterKey : 'yellow',
            theme: this.background ? this.background.themeKey : 'sky',
            bird: {
                x: this.bird.x,
                y: this.bird.y,
                vy: this.bird.vy,
                rotation: this.bird.rotation
            },
            pipes: this.pipeManager ? this.pipeManager.pipes.map(p => ({
                x: p.x,
                gapY: p.gapY,
                gapHeight: p.gapHeight,
                isPassed: p.isPassed
            })) : [],
            pipeScore: this.pipeManager ? this.pipeManager.score : 0,
            lastSpawnTime: this.pipeManager ? this.pipeManager.lastSpawnTime : 0
        };
        
        Storage.saveGameState(state);
    }
    
    tryRestoreGameState() {
        const savedState = Storage.getGameState();
        if (!savedState) {
            this.uiManager.showStartScreen();
            return;
        }
        
        if (savedState.state === CONFIG.GAME_STATE.PAUSED || 
            savedState.state === CONFIG.GAME_STATE.PLAYING) {
            this.restoreFromState(savedState);
        } else {
            Storage.clearGameState();
            this.uiManager.showStartScreen();
        }
    }
    
    restoreFromState(savedState) {
        this.background = new Background(this.canvas, savedState.theme);
        this.bird = new Bird(this.canvas, savedState.character, this.particleSystem);
        this.pipeManager = new PipeManager(this.canvas, this.background.theme);
        
        this.bird.x = savedState.bird.x;
        this.bird.y = savedState.bird.y;
        this.bird.vy = savedState.bird.vy;
        this.bird.rotation = savedState.bird.rotation;
        
        this.pipeManager.pipes = savedState.pipes.map(p => {
            const pipe = new Pipe(this.canvas, p.x, p.gapHeight, this.background.theme);
            pipe.gapY = p.gapY;
            pipe.isPassed = p.isPassed;
            return pipe;
        });
        this.pipeManager.score = savedState.pipeScore;
        this.pipeManager.lastSpawnTime = savedState.lastSpawnTime;
        
        this.score = savedState.score;
        this.uiManager.updateScore(this.score);
        
        this.state = CONFIG.GAME_STATE.PAUSED;
        this.uiManager.showGameUI();
        this.uiManager.showPauseScreen();
        
        this.draw();
    }
}
