class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        
        this.player = null;
        this.enemy = null;
        this.ai = null;
        
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        
        this.playerChar = null;
        this.enemyChar = null;
        this.round = 1;
        
        this.onWin = null;
        this.onLose = null;
    }

    init(playerCharType, enemyCharType = null) {
        if (!enemyCharType) {
            const types = Object.keys(CONFIG.CHARACTER_TYPES);
            const available = types.filter(t => t !== playerCharType);
            enemyCharType = available[Math.floor(Math.random() * available.length)];
        }
        
        this.playerChar = playerCharType;
        this.enemyChar = enemyCharType;
        
        this.player = new Character(playerCharType, 150, CONFIG.GROUND_Y - 100, true);
        this.enemy = new Character(enemyCharType, CONFIG.CANVAS_WIDTH - 230, CONFIG.GROUND_Y - 100, false);
        
        this.ai = new AIController(this.enemy, this.player);
    }

    loadSavedState(state) {
        this.init(state.playerChar, state.enemyChar);
        
        this.player.x = state.playerX;
        this.player.y = state.playerY;
        this.player.health = state.playerHealth;
        this.player.facing = state.playerFacing || 1;
        
        this.enemy.x = state.enemyX;
        this.enemy.y = state.enemyY;
        this.enemy.health = state.enemyHealth;
        
        this.round = state.round || 1;
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.handleInput();
        this.player.update(deltaTime);
        this.ai.update(deltaTime);
        this.enemy.update(deltaTime);
        
        if (this.player.checkCollision(this.enemy)) {
            this.player.resolveCollision(this.enemy);
        }
        
        this.checkBoundaries(this.player);
        this.checkBoundaries(this.enemy);
        
        combat.processAttack(this.player, this.enemy);
        combat.processAttack(this.enemy, this.player);
        
        combat.processProjectiles(this.player, this.enemy);
        combat.processProjectiles(this.enemy, this.player);
        
        combat.updateEffects(deltaTime);
        
        const winner = combat.checkWinner(this.player, this.enemy);
        if (winner) {
            this.stop();
            if (winner === 'player' && this.onWin) {
                this.onWin();
            } else if (winner === 'enemy' && this.onLose) {
                this.onLose();
            }
        }
        
        if (Math.random() < 0.02) {
            storage.saveGameState(this);
        }
    }

    handleInput() {
        if (input.getLeft()) {
            this.player.moveLeft();
        } else if (input.getRight()) {
            this.player.moveRight();
        } else {
            this.player.stopMove();
        }
        
        if (input.getUp()) {
            this.player.jump();
        }
        
        if (input.getDown()) {
            this.player.crouch();
        } else {
            this.player.standUp();
        }
        
        if (input.getLightPunch()) {
            this.player.attack('lightPunch');
        } else if (input.getHeavyPunch()) {
            this.player.attack('heavyPunch');
        }
        
        if (input.getLightKick()) {
            this.player.attack('lightKick');
        } else if (input.getHeavyKick()) {
            this.player.attack('heavyKick');
        }
        
        if (input.checkSpecialMove(CONFIG.INPUT_COMMANDS.laughWave)) {
            this.player.specialMove('laughWave');
        }
        if (input.checkSpecialMove(CONFIG.INPUT_COMMANDS.headSpin)) {
            this.player.specialMove('headSpin');
        }
        if (input.checkSpecialMove(CONFIG.INPUT_COMMANDS.funnySpin)) {
            this.player.specialMove('funnySpin');
        }
    }

    render() {
        this.renderer.render(this.player, this.enemy, combat.getHitEffects());
    }

    restart() {
        this.init(this.playerChar, this.enemyChar);
        this.round++;
        this.start();
    }

    getPlayerHealthPercent() {
        return (this.player.health / this.player.maxHealth) * 100;
    }

    getEnemyHealthPercent() {
        return (this.enemy.health / this.enemy.maxHealth) * 100;
    }

    checkBoundaries(character) {
        if (character.x < 0) {
            character.x = 0;
            character.vx = 0;
        }
        if (character.x > CONFIG.CANVAS_WIDTH - character.width) {
            character.x = CONFIG.CANVAS_WIDTH - character.width;
            character.vx = 0;
        }
    }
}