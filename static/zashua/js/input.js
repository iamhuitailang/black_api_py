const InputManager = {
    keys: {},
    game: null,
    
    init(game) {
        this.game = game;
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    },
    
    handleKeyDown(e) {
        if (this.keys[e.code]) return;
        this.keys[e.code] = true;
        
        if (this.game && !this.game.isPaused && !this.game.isGameOver) {
            const player = this.game.getHumanPlayer();
            if (!player) return;
            
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.handleMoveLeft(player);
                    break;
                    
                case 'ArrowRight':
                case 'KeyD':
                    this.handleMoveRight(player);
                    break;
                    
                case 'Space':
                    e.preventDefault();
                    this.handleThrow(player, 'normal');
                    break;
                    
                case 'KeyZ':
                    this.handleThrow(player, 'fast');
                    break;
                    
                case 'KeyX':
                    this.handleSkill(player);
                    break;
                    
                case 'Escape':
                    this.game.togglePause();
                    break;
            }
        }
    },
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    },
    
    handleMoveLeft(player) {
        if (!this.game) return;
        const bounds = this.game.getPlayerBounds(player);
        player.moveLeft(bounds);
    },
    
    handleMoveRight(player) {
        if (!this.game) return;
        const bounds = this.game.getPlayerBounds(player);
        player.moveRight(bounds);
    },
    
    handleThrow(player, throwType) {
        if (!this.game || player.isStunned || player.isEliminated) return;
        
        const catchableItem = this.game.getCatchableItem(player);
        if (catchableItem) {
            this.game.handleCatch(player, catchableItem);
            return;
        }
        
        if (this.game.currentThrower !== player.id) return;
        
        const target = this.game.getNextTarget(player);
        if (target) {
            this.game.handleThrow(player, target, throwType);
        }
    },
    
    handleSkill(player) {
        if (!this.game) return;
        this.game.handleSkill(player);
    },
    
    update() {
        if (!this.game || this.game.isPaused || this.game.isGameOver) return;
        
        const player = this.game.getHumanPlayer();
        if (!player) return;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.handleMoveLeft(player);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.handleMoveRight(player);
        }
    },
    
    isKeyPressed(code) {
        return this.keys[code] || false;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}