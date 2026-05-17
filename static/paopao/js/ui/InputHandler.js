class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this.isCharging = false;
        this.chargeStartTime = 0;
        
        this.init();
    }
    
    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        if (this.game.gameState.currentState !== CONSTANTS.GAME_STATES.PLAYING) {
            if (e.key === 'Escape' && this.game.gameState.currentState === CONSTANTS.GAME_STATES.PAUSED) {
                this.game.resumeGame();
            }
            return;
        }
        
        this.keys.add(e.key);
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.game.gameState.launcher.resetAim();
                break;
            case ' ':
                e.preventDefault();
                if (!this.isCharging) {
                    this.game.fireBubble(false);
                }
                break;
            case 'z':
            case 'Z':
                e.preventDefault();
                this.game.fireBubble(true);
                break;
            case 'x':
            case 'X':
                e.preventDefault();
                if (!this.isCharging) {
                    this.isCharging = true;
                    this.game.gameState.launcher.startCharge();
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.game.pauseGame();
                break;
        }
    }
    
    handleKeyUp(e) {
        this.keys.delete(e.key);
        
        switch (e.key) {
            case 'x':
            case 'X':
                if (this.isCharging) {
                    this.isCharging = false;
                    this.game.fireBubble(false);
                }
                break;
        }
    }
    
    update() {
        if (this.game.gameState.currentState !== CONSTANTS.GAME_STATES.PLAYING) return;
        
        if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
            this.game.gameState.launcher.aimLeft();
        }
        if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
            this.game.gameState.launcher.aimRight();
        }
    }
    
    isKeyPressed(key) {
        return this.keys.has(key);
    }
}
