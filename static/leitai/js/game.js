const Game = {
    state: null,
    lastTime: 0,
    isPaused: false,
    animationId: null,
    saveTimer: 0,

    init() {
        Renderer.init();
        Input.init();

        const savedState = StorageManager.loadGameState();
        if (savedState) {
            this.state = GameState.fromSaved(savedState);
            if (this.state.gameState === GAME_STATE.PLAYING || this.state.gameState === GAME_STATE.PAUSED) {
                this.showResumeOption();
            }
        } else {
            this.state = GameState.createInitial();
        }

        Renderer.highlightSelectedChar(this.state.selectedCharIndex);
        this.setupEventListeners();
    },

    showResumeOption() {
        const startBtn = document.getElementById('start-btn');
        startBtn.textContent = '继续游戏';
    },

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('select-char-btn').addEventListener('click', () => this.showCharSelect());
        document.getElementById('back-to-start-btn').addEventListener('click', () => Renderer.showScreen('start-screen'));
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('back-menu-btn').addEventListener('click', () => this.quitToMenu());

        document.querySelectorAll('.char-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.state.selectedCharIndex = index;
                this.state.enemyCharIndex = Math.floor(Math.random() * 3);
                StorageManager.saveSelectedChar(index);
                Renderer.highlightSelectedChar(index);
                const startBtn = document.getElementById('start-btn');
                startBtn.textContent = '开始游戏';
            });
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.state.gameState === GAME_STATE.PLAYING) {
                this.togglePause();
            }
        });
    },

    showCharSelect() {
        Renderer.highlightSelectedChar(this.state.selectedCharIndex);
        Renderer.showScreen('char-select-screen');
    },

    startGame() {
        const startBtn = document.getElementById('start-btn');
        const isResuming = startBtn.textContent === '继续游戏' && this.state.player && this.state.enemy;
        
        if (!isResuming) {
            GameState.initGame(this.state);
        }
        
        this.state.gameState = GAME_STATE.PLAYING;
        AI.reset();
        this.isPaused = false;
        Renderer.hideScreens();
        Renderer.hidePauseMenu();
        this.lastTime = performance.now();
        this.gameLoop();
        
        startBtn.textContent = '开始游戏';
    },

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    },

    pauseGame() {
        this.isPaused = true;
        this.state.gameState = GAME_STATE.PAUSED;
        Renderer.showPauseMenu();
        cancelAnimationFrame(this.animationId);
    },

    resumeGame() {
        this.isPaused = false;
        this.state.gameState = GAME_STATE.PLAYING;
        Renderer.hidePauseMenu();
        this.lastTime = performance.now();
        this.gameLoop();
    },

    restartGame() {
        StorageManager.clearGameState();
        this.startGame();
    },

    quitToMenu() {
        StorageManager.clearGameState();
        cancelAnimationFrame(this.animationId);
        this.state.gameState = GAME_STATE.MENU;
        Renderer.hidePauseMenu();
        Renderer.showScreen('start-screen');
    },

    gameLoop(currentTime = 0) {
        if (this.isPaused) return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.saveTimer += deltaTime;
        if (this.saveTimer >= 2) {
            StorageManager.saveGameState(this.state);
            this.saveTimer = 0;
        }

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    },

    update(deltaTime) {
        this.state.timer -= deltaTime;

        Input.handlePlayerInput(this.state.player);

        AI.reactToPlayerAttack(this.state.enemy, this.state.player);

        AI.update(this.state.enemy, this.state.player, this.state, deltaTime);

        Combat.updateAttack(this.state.player, deltaTime, this.state);
        Combat.updateAttack(this.state.enemy, deltaTime, this.state);

        Physics.updateCharacter(this.state.player, deltaTime);
        Physics.updateCharacter(this.state.enemy, deltaTime);

        Physics.resolveCollision(this.state.player, this.state.enemy);

        const minX = 80;
        const maxX = CANVAS_WIDTH - this.state.player.width - 80;
        this.state.player.x = Math.max(minX, Math.min(maxX, this.state.player.x));
        this.state.enemy.x = Math.max(minX, Math.min(maxX, this.state.enemy.x));

        Physics.updateEffects(this.state.effects, deltaTime);
        Physics.updateParticles(this.state.particles, deltaTime);
        Physics.updateScreenShake(this.state.screenShake, deltaTime);

        Input.update();

        const result = Combat.checkGameOver(this.state);
        if (result.gameOver) {
            this.endGame(result.playerWon, result.message);
        }
    },

    render() {
        Renderer.clear();

        Renderer.applyScreenShake(this.state.screenShake);

        Renderer.drawBackground();

        Renderer.drawCharacter(this.state.enemy);
        Renderer.drawCharacter(this.state.player);

        Renderer.drawEffects(this.state.effects);
        Renderer.drawParticles(this.state.particles);

        Renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);

        Renderer.updateUI(this.state);
    },

    endGame(playerWon, message) {
        cancelAnimationFrame(this.animationId);
        StorageManager.clearGameState();
        this.state.gameState = GAME_STATE.GAME_OVER;
        Renderer.showResult(playerWon, message);
    }
};