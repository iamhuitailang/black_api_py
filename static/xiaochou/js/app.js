const App = {
    game: null,
    animationId: null,
    lastTime: 0,

    init() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        UI.init();
        this.game = new Game(canvas);
        
        const container = document.getElementById('game-container');
        if (container) {
            this.game.bindGameEvents(container);
        }
        
        this.setupUIListeners();
        this.checkSavedState();
        this.startGameLoop();

        window.addEventListener('beforeunload', () => {
            if (this.game && this.game.state === CONSTANTS.GAME.STATES.PLAYING) {
                this.game.saveState();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.game && this.game.state === CONSTANTS.GAME.STATES.PLAYING) {
                this.game.saveState();
            }
        });
    },

    setupUIListeners() {
        UI.elements.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                UI.setSelectedMode(mode);
            });
        });

        UI.elements.startBtn.addEventListener('click', () => {
            const mode = UI.getSelectedMode();
            this.game.startGame(mode);
        });

        UI.elements.pauseBtn.addEventListener('click', () => {
            this.game.pauseGame();
        });

        UI.elements.resumeBtn.addEventListener('click', () => {
            this.game.resumeGame();
        });

        UI.elements.restartBtn.addEventListener('click', () => {
            this.game.restartGame();
        });

        UI.elements.quitBtn.addEventListener('click', () => {
            this.game.quitToMenu();
        });

        UI.elements.retryBtn.addEventListener('click', () => {
            this.game.restartGame();
        });

        UI.elements.homeBtn.addEventListener('click', () => {
            this.game.quitToMenu();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.game.state === CONSTANTS.GAME.STATES.PLAYING) {
                    this.game.pauseGame();
                } else if (this.game.state === CONSTANTS.GAME.STATES.PAUSED) {
                    this.game.resumeGame();
                }
            }

            if (this.game.state === CONSTANTS.GAME.STATES.PLAYING) {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    this.game.clown.adjustAngle(-CONSTANTS.LAUNCH.ANGLE_SPEED);
                }
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    this.game.clown.adjustAngle(CONSTANTS.LAUNCH.ANGLE_SPEED);
                }
                if (e.key === ' ') {
                    e.preventDefault();
                    if (!this.game.isPointerDown) {
                        this.game.clown.startCharge();
                        UI.showPowerIndicator();
                    }
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === ' ' && this.game.state === CONSTANTS.GAME.STATES.PLAYING) {
                e.preventDefault();
                if (this.game.clown.isCharging) {
                    const balloon = this.game.clown.launchBalloon();
                    this.game.balloons.push(balloon);
                    this.game.effects.spawnSparkles(balloon.x, balloon.y, 8, balloon.color);
                    UI.hidePowerIndicator();
                }
            }
        });
    },

    checkSavedState() {
        if (this.game.hasSavedState()) {
            const restored = this.game.loadState();
            if (restored) {
                if (this.game.state === CONSTANTS.GAME.STATES.PLAYING) {
                    UI.showGameUI(this.game.mode);
                    UI.updateScore(this.game.score, this.game.towerHeight, this.game.bestScore);
                    if (this.game.mode === CONSTANTS.GAME.MODES.TIMED) {
                        UI.updateTimer(this.game.timeRemaining);
                    }
                } else if (this.game.state === CONSTANTS.GAME.STATES.PAUSED) {
                    UI.showGameUI(this.game.mode);
                    UI.showPauseScreen();
                    UI.updateScore(this.game.score, this.game.towerHeight, this.game.bestScore);
                }
            }
        }
    },

    startGameLoop() {
        const loop = (timestamp) => {
            if (!this.lastTime) this.lastTime = timestamp;
            const deltaTime = Math.min((timestamp - this.lastTime) / 16.67, 3);
            this.lastTime = timestamp;

            this.game.update(deltaTime);
            this.game.draw();

            this.animationId = requestAnimationFrame(loop);
        };

        this.animationId = requestAnimationFrame(loop);
    },

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});