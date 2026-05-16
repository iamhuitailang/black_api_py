class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.input = new InputManager();
        this.ui = new UIManager();
        
        this.cat = new Cat();
        this.furnitureManager = new FurnitureManager();
        this.owner = new Owner();
        
        this.gameState = 'menu';
        this.timeLeft = CONFIG.GAME_DURATION;
        this.lastTime = 0;
        this.saveInterval = null;
        
        this.setupEventListeners();
        this.setupPageUnloadSave();
        this.tryLoadGame();
    }
    
    setupPageUnloadSave() {
        window.addEventListener('beforeunload', () => {
            if (this.gameState === 'playing') {
                this.saveGame();
            }
        });
    }
    
    setupEventListeners() {
        this.ui.onStart(() => this.startGame());
        this.ui.onResume(() => this.resumeGame());
        this.ui.onRestart(() => this.restartGame());
        this.ui.onQuit(() => this.quitGame());
        this.ui.onPause(() => this.togglePause());
    }
    
    tryLoadGame() {
        const saved = Storage.load();
        if (saved && saved.gameState === 'playing') {
            this.loadState(saved);
            this.startGameLoop();
            this.ui.showHUD();
            this.gameState = 'playing';
            this.startAutoSave();
        }
    }
    
    startGame() {
        this.reset();
        this.gameState = 'playing';
        this.ui.showHUD();
        this.startGameLoop();
        this.startAutoSave();
        this.saveGame();
    }
    
    reset() {
        this.cat.reset();
        this.furnitureManager.reset();
        this.owner.reset();
        this.timeLeft = CONFIG.GAME_DURATION;
        this.input.reset();
    }
    
    restartGame() {
        this.ui.hidePauseScreen();
        this.ui.hideEndScreen();
        this.reset();
        this.gameState = 'playing';
        this.ui.showHUD();
        this.startAutoSave();
    }
    
    resumeGame() {
        this.ui.hidePauseScreen();
        this.gameState = 'playing';
        this.lastTime = performance.now();
        this.startAutoSave();
    }
    
    quitGame() {
        this.stopGameLoop();
        this.stopAutoSave();
        Storage.clear();
        this.gameState = 'menu';
        this.ui.showStartScreen();
        this.ui.hidePauseScreen();
        this.ui.hideEndScreen();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.saveGame();
            this.stopAutoSave();
            this.ui.showPauseScreen();
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }
    
    startGameLoop() {
        this.stopGameLoop();
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        this.timeLeft -= deltaTime;
        
        if (this.timeLeft <= 0) {
            this.endGame(this.cat.score >= CONFIG.WIN_SCORE);
            return;
        }
        
        this.cat.update(this.input.keys, deltaTime * 1000);
        
        const attacks = this.input.getPendingAttacks();
        attacks.forEach(attackType => {
            const attackResult = this.cat.attack(attackType);
            if (attackResult) {
                const collision = this.furnitureManager.checkCollision(
                    this.cat.getHitbox(),
                    attackResult
                );
                
                if (collision.hit) {
                    this.cat.score += collision.score || 0;
                    this.saveGame();
                    if (collision.destroyed) {
                        this.ui.showActionHint(`💥 拆毁${collision.furniture.name}！+${collision.score}分`);
                    } else {
                        this.ui.showActionHint('⚔️ 攻击成功！');
                    }
                }
            }
        });
        
        this.furnitureManager.update();
        this.owner.update(deltaTime * 1000, this.cat);
        
        if (this.owner.checkCatch(this.cat)) {
            const dead = this.cat.takeDamage();
            this.saveGame();
            this.ui.showActionHint('😾 被主人抓到了！-1生命');
            
            if (dead) {
                this.endGame(false);
                return;
            }
        }
        
        this.ui.updateHUD(this.timeLeft, this.cat.score, this.cat.lives);
    }
    
    render() {
        this.renderer.render(this);
    }
    
    endGame(win) {
        this.gameState = 'ended';
        this.stopAutoSave();
        Storage.clear();
        this.ui.showEndScreen(win, this.cat.score);
    }
    
    startAutoSave() {
        this.stopAutoSave();
        this.saveInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.saveGame();
            }
        }, 5000);
    }
    
    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }
    
    getState() {
        return {
            gameState: this.gameState,
            timeLeft: this.timeLeft,
            cat: this.cat.getState(),
            furniture: this.furnitureManager.getState(),
            owner: this.owner.getState()
        };
    }
    
    loadState(state) {
        this.gameState = state.gameState;
        this.timeLeft = state.timeLeft;
        this.cat.loadState(state.cat);
        this.furnitureManager.loadState(state.furniture);
        this.owner.loadState(state.owner);
    }
    
    saveGame() {
        const state = this.getState();
        Storage.save(state);
    }
}