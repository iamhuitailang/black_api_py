const GameStatus = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    SERVING: 'serving'
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.status = GameStatus.MENU;
        this.playerScore = 0;
        this.aiScore = 0;
        this.combo = 0;
        this.lastHitTime = 0;
        this.serveTimer = 0;
        this.server = 'player';
        this.rallyCount = 0;
        this.ballCrossedNet = false;

        this.ball = new Ball();
        this.playerPaddle = new Paddle(
            (CONFIG.TABLE.LEFT + CONFIG.TABLE.RIGHT) / 2,
            CONFIG.TABLE.BOTTOM - 35,
            true
        );
        this.aiPaddle = new Paddle(
            (CONFIG.TABLE.LEFT + CONFIG.TABLE.RIGHT) / 2,
            CONFIG.TABLE.TOP + 35,
            false
        );
        this.ai = new AI(this.aiPaddle);
        this.particles = new ParticleSystem();

        this.lastTime = 0;
        this.animationId = null;
        this.saveInterval = null;
    }

    init() {
        Input.init();
        this.setupUI();
        this.tryLoadGame();
        this.startAutoSave();
    }

    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resume());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('quitBtn').addEventListener('click', () => this.quit());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restart());
        document.getElementById('exitBtn').addEventListener('click', () => this.quit());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
    }

    tryLoadGame() {
        const saved = Storage.load();
        if (saved && saved.gameStatus === GameStatus.PLAYING) {
            if (confirm('检测到未完成的游戏，是否继续？')) {
                this.loadGame(saved);
            }
        }
    }

    loadGame(saved) {
        this.playerScore = saved.playerScore || 0;
        this.aiScore = saved.aiScore || 0;
        
        if (saved.ball) {
            this.ball = Ball.deserialize(saved.ball);
        }
        if (saved.playerPaddle) {
            this.playerPaddle = Paddle.deserialize(saved.playerPaddle);
        }
        if (saved.aiPaddle) {
            this.aiPaddle = Paddle.deserialize(saved.aiPaddle);
            this.ai = new AI(this.aiPaddle);
        }
        
        this.updateScoreUI();
        this.showGameScreen();
        this.status = GameStatus.PLAYING;
        this.startGameLoop();
    }

    start() {
        this.reset();
        this.showGameScreen();
        this.status = GameStatus.SERVING;
        this.serveTimer = CONFIG.GAME.SERVE_INTERVAL;
        this.startGameLoop();
    }

    reset() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.combo = 0;
        this.rallyCount = 0;
        this.server = 'player';
        this.ballCrossedNet = false;
        this.ball.reset();
        this.playerPaddle.x = (CONFIG.TABLE.LEFT + CONFIG.TABLE.RIGHT) / 2;
        this.aiPaddle.x = (CONFIG.TABLE.LEFT + CONFIG.TABLE.RIGHT) / 2;
        this.particles.clear();
        this.updateScoreUI();
    }

    startGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop(currentTime = performance.now()) {
        const dt = Math.min(currentTime - this.lastTime, 32);
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        if (this.status === GameStatus.PAUSED || this.status === GameStatus.MENU) {
            return;
        }

        if (Input.getPause()) {
            this.togglePause();
            return;
        }

        if (this.status === GameStatus.SERVING) {
            this.updateServing(dt);
            return;
        }

        if (this.status === GameStatus.PLAYING) {
            this.updatePlaying(dt);
        }
    }

    updateServing(dt) {
        this.serveTimer -= dt;
        if (this.serveTimer <= 0) {
            this.doServe();
        }
    }

    doServe() {
        this.ballCrossedNet = false;
        if (this.server === 'player') {
            this.ball.serve(true);
        } else {
            const serve = this.ai.serve();
            this.ball.x = this.aiPaddle.x - 20;
            this.ball.y = this.aiPaddle.y;
            this.ball.hit(serve.angle, serve.speed, serve.spin, serve.spinStrength);
            this.ball.lastHitBy = 'ai';
        }
        this.status = GameStatus.PLAYING;
    }

    updatePlaying(dt) {
        this.ball.update(dt);
        this.playerPaddle.update(dt);
        this.ai.update(dt, this.ball);
        this.particles.update(dt);

        if (Math.random() < 0.15) {
            this.particles.emitBallTrail(this.ball);
        }

        const shotResult = this.playerPaddle.checkShot(this.ball);
        if (shotResult) {
            this.onPlayerHit(shotResult);
        }

        this.checkScore();
    }

    onPlayerHit(shotResult) {
        this.rallyCount++;
        this.combo++;
        this.lastHitTime = Date.now();
        this.ballCrossedNet = false;
        
        this.particles.emitHitEffect(shotResult.x, shotResult.y, true);
        
        if (this.combo >= 3) {
            this.showCombo(this.combo);
        }
    }

    showCombo(count) {
        const display = document.getElementById('comboDisplay');
        display.textContent = `${count} 连击!`;
        display.classList.remove('show');
        void display.offsetWidth;
        display.classList.add('show');
    }

    checkScore() {
        if (!this.ball.active) return;

        if (!this.ballCrossedNet && this.ball.crossedNet()) {
            this.ballCrossedNet = true;
        }

        if (this.ball.isOutOfBounds()) {
            this.handleOutOfBounds();
            return;
        }

        if (this.ball.lastHitBy === 'player' && this.ball.isOnAISide() && this.ball.x > CONFIG.TABLE.RIGHT + 20) {
            this.scorePoint('player');
            return;
        }

        if (this.ball.lastHitBy === 'ai' && this.ball.isOnPlayerSide() && this.ball.x < CONFIG.TABLE.LEFT - 20) {
            this.scorePoint('ai');
            return;
        }
    }

    handleOutOfBounds() {
        if (this.ball.x < CONFIG.TABLE.LEFT) {
            if (this.ball.lastHitBy === 'ai') {
                this.scorePoint('player');
            } else {
                this.scorePoint('ai');
            }
        } else {
            if (this.ball.lastHitBy === 'player') {
                this.scorePoint('player');
            } else {
                this.scorePoint('ai');
            }
        }
    }

    scorePoint(scorer) {
        if (scorer === 'player') {
            this.playerScore++;
            this.particles.emitScoreEffect(CONFIG.TABLE.LEFT + 100, (CONFIG.TABLE.TOP + CONFIG.TABLE.BOTTOM) / 2, true);
        } else {
            this.aiScore++;
            this.particles.emitScoreEffect(CONFIG.TABLE.RIGHT - 100, (CONFIG.TABLE.TOP + CONFIG.TABLE.BOTTOM) / 2, false);
        }

        this.combo = 0;
        this.rallyCount = 0;
        this.updateScoreUI();
        this.ball.reset();

        if (this.checkWin()) {
            return;
        }

        this.server = scorer;
        this.status = GameStatus.SERVING;
        this.serveTimer = CONFIG.GAME.SERVE_INTERVAL;
    }

    checkWin() {
        const winScore = CONFIG.GAME.WIN_SCORE;
        
        if (this.playerScore >= winScore || this.aiScore >= winScore) {
            const playerDiff = this.playerScore - this.aiScore;
            const aiDiff = this.aiScore - this.playerScore;
            
            if (playerDiff >= 2 || aiDiff >= 2) {
                this.endGame();
                return true;
            }
        }
        return false;
    }

    endGame() {
        this.status = GameStatus.GAME_OVER;
        Storage.clear();
        
        const isWin = this.playerScore > this.aiScore;
        document.getElementById('finalPlayerScore').textContent = this.playerScore;
        document.getElementById('finalAiScore').textContent = this.aiScore;
        
        const resultText = document.getElementById('resultText');
        resultText.textContent = isWin ? '🎉 恭喜获胜！' : '😔 再接再厉！';
        resultText.className = 'result-text ' + (isWin ? 'win' : 'lose');
        
        document.getElementById('gameOverTitle').textContent = isWin ? '胜利！' : '失败';
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    updateScoreUI() {
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('aiScore').textContent = this.aiScore;
    }

    render() {
        this.renderer.render(this);
    }

    togglePause() {
        if (this.status === GameStatus.PLAYING) {
            this.pause();
        } else if (this.status === GameStatus.PAUSED) {
            this.resume();
        }
    }

    pause() {
        if (this.status !== GameStatus.PLAYING) return;
        this.status = GameStatus.PAUSED;
        document.getElementById('pauseScreen').classList.remove('hidden');
        this.saveGame();
    }

    resume() {
        this.status = GameStatus.PLAYING;
        document.getElementById('pauseScreen').classList.add('hidden');
        this.lastTime = performance.now();
    }

    restart() {
        Storage.clear();
        this.hideAllScreens();
        this.start();
    }

    quit() {
        Storage.clear();
        this.stopGameLoop();
        this.hideAllScreens();
        document.getElementById('startScreen').classList.remove('hidden');
        this.status = GameStatus.MENU;
        this.reset();
        this.render();
    }

    showGameScreen() {
        this.hideAllScreens();
    }

    hideAllScreens() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    startAutoSave() {
        this.saveInterval = setInterval(() => {
            if (this.status === GameStatus.PLAYING) {
                this.saveGame();
            }
        }, 5000);
    }

    saveGame() {
        Storage.save(this);
    }

    get playerPaddle() { return this._playerPaddle; }
    set playerPaddle(p) { this._playerPaddle = p; }

    get aiPaddle() { return this._aiPaddle; }
    set aiPaddle(p) { this._aiPaddle = p; }
}
