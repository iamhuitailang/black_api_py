class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = StateManager.createInitialState();
        this.lastTime = 0;
        this.timerInterval = null;
        this.isRunning = false;
        
        this.init();
    }
    
    init() {
        Renderer.init(this.canvas);
        InputManager.init(this.canvas, this);
        
        this.initTargetPosition();
        this.loadSavedState();
        this.bindUIEvents();
        this.updateUI();
        
        window.addEventListener('resize', () => {
            Renderer.resize();
            this.initTargetPosition();
            this.render();
        });
        
        this.start();
    }
    
    initTargetPosition() {
        this.state.target.x = this.canvas.width * 0.75;
        this.state.target.y = this.canvas.height * 0.5;
        this.state.target.radius = Math.min(this.canvas.width, this.canvas.height) * 0.25;
    }
    
    loadSavedState() {
        const savedState = StorageManager.loadGameState();
        if (savedState) {
            try {
                this.state = StateManager.deserialize(savedState);
                if (this.state.state === GameConfig.GameState.PAUSED) {
                    this.showPauseMenu();
                }
            } catch (e) {
                console.error('Failed to load saved state:', e);
                StorageManager.clearGameState();
            }
        }
        
        this.state.highScore = StorageManager.loadHighScore();
    }
    
    saveState() {
        const serialized = StateManager.serialize(this.state);
        StorageManager.saveGameState(serialized);
    }
    
    bindUIEvents() {
        document.getElementById('start-standard-btn').addEventListener('click', () => {
            this.startGame(GameConfig.GameMode.STANDARD);
        });
        
        document.getElementById('start-timed-btn').addEventListener('click', () => {
            this.startGame(GameConfig.GameMode.TIMED);
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitGame();
        });
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.showMainMenu();
        });
    }
    
    start() {
        this.isRunning = true;
        this.gameLoop(0);
    }
    
    stop() {
        this.isRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    update(deltaTime) {
        if (this.state.state !== GameConfig.GameState.PLAYING) return;
        
        EffectsManager.updateEffects(this.state);
        
        if (this.state.dartState === GameConfig.GameState.DART_FLYING) {
            const hasLanded = Physics.updateDart(
                this.state.dart,
                this.state.target,
                this.canvas.height
            );
            
            if (hasLanded) {
                this.handleDartLanded();
            }
        }
    }
    
    handleDartLanded() {
        this.state.dartState = GameConfig.GameState.DART_LANDED;
        
        const score = this.state.dart.landedScore;
        let hitResult;
        
        if (score > 0) {
            const dx = this.state.dart.landedX - this.state.target.x;
            const dy = this.state.dart.landedY - this.state.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const normalizedDistance = distance / this.state.target.radius;
            
            let ring = null;
            for (let i = 0; i < GameConfig.TargetRings.length; i++) {
                if (normalizedDistance <= GameConfig.TargetRings[i].radius) {
                    ring = GameConfig.TargetRings[i];
                    break;
                }
            }
            
            hitResult = {
                score: score,
                ring: ring
            };
        } else {
            hitResult = {
                score: 0,
                ring: null
            };
        }
        
        EffectsManager.createHitEffect(
            this.state,
            hitResult,
            this.state.dart.landedX,
            this.state.dart.landedY
        );
        
        const isNewRecord = StateManager.addScore(this.state, score);
        if (isNewRecord) {
            EffectsManager.createNewRecordEffect(this.state);
        }
        
        this.state.landedDarts.push({
            x: this.state.dart.landedX,
            y: this.state.dart.landedY,
            angle: this.state.dart.angle,
            score: score
        });
        
        this.saveState();
        this.updateUI();
        
        setTimeout(() => {
            if (this.state.state === GameConfig.GameState.PLAYING) {
                this.nextDart();
            }
        }, 1500);
    }
    
    nextDart() {
        const canContinue = StateManager.nextRound(this.state);
        
        if (!canContinue || StateManager.isGameOver(this.state)) {
            this.endGame();
            return;
        }
        
        this.state.dartState = GameConfig.GameState.DART_READY;
        this.state.pullDistance = 0;
        this.state.power = GameConfig.Dart.baseSpeed;
        
        this.saveState();
        this.updateUI();
    }
    
    render() {
        Renderer.render(this.state);
    }
    
    startGame(mode) {
        this.state = StateManager.resetGame(this.state, mode);
        this.state.state = GameConfig.GameState.PLAYING;
        this.state.dartState = GameConfig.GameState.DART_READY;
        
        if (!this.isRunning) {
            this.start();
        }
        
        this.initTargetPosition();
        this.hideAllMenus();
        this.updateUI();
        this.saveState();
        
        if (mode === GameConfig.GameMode.TIMED) {
            this.startTimer();
        }
    }
    
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.state.timeLeft = GameConfig.GameRules.TIMED_DURATION;
        this.updateUI();
        
        this.timerInterval = setInterval(() => {
            if (this.state.state === GameConfig.GameState.PLAYING) {
                this.state.timeLeft--;
                this.saveState();
                this.updateUI();
                
                if (this.state.timeLeft <= 0) {
                    clearInterval(this.timerInterval);
                    this.endGame();
                }
            }
        }, 1000);
    }
    
    pauseGame() {
        if (this.state.state !== GameConfig.GameState.PLAYING) return;
        
        this.state.state = GameConfig.GameState.PAUSED;
        this.showPauseMenu();
        this.saveState();
    }
    
    resumeGame() {
        if (this.state.state !== GameConfig.GameState.PAUSED) return;
        
        this.state.state = GameConfig.GameState.PLAYING;
        this.hideAllMenus();
        this.saveState();
        
        if (this.state.mode === GameConfig.GameMode.TIMED && this.state.timeLeft > 0) {
            this.startTimer();
        }
    }
    
    restartGame() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.startGame(this.state.mode);
    }
    
    quitGame() {
        this.stop();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        StorageManager.clearGameState();
        this.showMainMenu();
    }
    
    endGame() {
        this.stop();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.state.state = GameConfig.GameState.GAME_OVER;
        this.showGameOverMenu();
        
        StorageManager.clearGameState();
    }
    
    showMainMenu() {
        this.state.state = GameConfig.GameState.MENU;
        this.hideAllMenus();
        document.getElementById('start-menu').style.display = 'block';
        document.getElementById('control-buttons').style.display = 'none';
    }
    
    showPauseMenu() {
        this.hideAllMenus();
        document.getElementById('pause-menu').style.display = 'block';
    }
    
    showGameOverMenu() {
        this.hideAllMenus();
        document.getElementById('game-over-menu').style.display = 'block';
        document.getElementById('control-buttons').style.display = 'none';
        
        document.getElementById('final-score').textContent = this.state.score;
        
        if (this.state.isNewRecord || this.state.score >= this.state.highScore) {
            document.getElementById('new-record').style.display = 'block';
        } else {
            document.getElementById('new-record').style.display = 'none';
        }
    }
    
    hideAllMenus() {
        document.getElementById('start-menu').style.display = 'none';
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('game-over-menu').style.display = 'none';
        
        if (this.state.state !== GameConfig.GameState.MENU && 
            this.state.state !== GameConfig.GameState.GAME_OVER) {
            document.getElementById('control-buttons').style.display = 'block';
        } else {
            document.getElementById('control-buttons').style.display = 'none';
        }
    }
    
    updateUI() {
        document.getElementById('current-score').textContent = this.state.score;
        document.getElementById('high-score').textContent = this.state.highScore;
        document.getElementById('current-round').textContent = this.state.currentRound;
        
        if (this.state.mode === GameConfig.GameMode.STANDARD) {
            document.getElementById('mode-text').textContent = '标准模式';
            document.getElementById('round-display').style.display = 'block';
            document.getElementById('timer-display').style.display = 'none';
        } else {
            document.getElementById('mode-text').textContent = '限时模式';
            document.getElementById('round-display').style.display = 'none';
            document.getElementById('timer-display').style.display = 'block';
            document.getElementById('time-left').textContent = this.state.timeLeft;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
