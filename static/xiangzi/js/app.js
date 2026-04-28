class App {
    constructor() {
        this.game = null;
        this.renderer = null;
        this.canvas = null;
        this.animationId = null;
        this.elements = {};
        this.autoSaveInterval = null;
    }

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.game = new Game();
        
        this.cacheElements();
        this.bindEvents();
        this.loadSavedGame();
        this.startAnimationLoop();
        this.startAutoSave();
    }

    cacheElements() {
        this.elements = {
            levelDisplay: document.getElementById('level-display'),
            movesDisplay: document.getElementById('moves-display'),
            timerDisplay: document.getElementById('timer-display'),
            recordDisplay: document.getElementById('record-display'),
            
            startOverlay: document.getElementById('start-overlay'),
            pauseOverlay: document.getElementById('pause-overlay'),
            winOverlay: document.getElementById('win-overlay'),
            loseOverlay: document.getElementById('lose-overlay'),
            completeOverlay: document.getElementById('complete-overlay'),
            
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            restartFromPauseBtn: document.getElementById('restart-from-pause-btn'),
            levelSelectBtn: document.getElementById('level-select-btn'),
            
            levelSelectModal: document.getElementById('level-select-modal'),
            levelButtons: document.getElementById('level-buttons'),
            closeLevelSelectBtn: document.getElementById('close-level-select-btn'),
            
            nextLevelBtn: document.getElementById('next-level-btn'),
            replayBtn: document.getElementById('replay-btn'),
            retryBtn: document.getElementById('retry-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            
            winTime: document.getElementById('win-time'),
            winMoves: document.getElementById('win-moves'),
            newRecord: document.getElementById('new-record'),
            
            btnUp: document.getElementById('btn-up'),
            btnDown: document.getElementById('btn-down'),
            btnLeft: document.getElementById('btn-left'),
            btnRight: document.getElementById('btn-right')
        };
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.elements.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        this.elements.restartFromPauseBtn.addEventListener('click', () => this.restartGame());
        this.elements.levelSelectBtn.addEventListener('click', () => this.showLevelSelect());
        this.elements.closeLevelSelectBtn.addEventListener('click', () => this.hideLevelSelect());
        
        this.elements.nextLevelBtn.addEventListener('click', () => this.nextLevel());
        this.elements.replayBtn.addEventListener('click', () => this.restartGame());
        this.elements.retryBtn.addEventListener('click', () => this.restartGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.restartGame());
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        this.elements.btnUp.addEventListener('click', () => this.handleMove(0, -1));
        this.elements.btnDown.addEventListener('click', () => this.handleMove(0, 1));
        this.elements.btnLeft.addEventListener('click', () => this.handleMove(-1, 0));
        this.elements.btnRight.addEventListener('click', () => this.handleMove(1, 0));
        
        this.elements.btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMove(0, -1); });
        this.elements.btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMove(0, 1); });
        this.elements.btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMove(-1, 0); });
        this.elements.btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMove(1, 0); });
        
        window.addEventListener('beforeunload', () => this.saveGameState());
    }

    loadSavedGame() {
        console.log('=== loadSavedGame() called ===');
        
        const savedState = storageManager.loadGameState();
        console.log('savedState:', savedState);
        
        let levelIndex = savedState.levelIndex;
        if (levelIndex === undefined || levelIndex === null) {
            levelIndex = 0;
        }
        
        console.log('levelIndex:', levelIndex);
        
        if (!storageManager.isLevelUnlocked(levelIndex)) {
            console.log('Level not unlocked, using level 0');
            levelIndex = 0;
        }
        
        const hasSavedState = savedState.state && savedState.state.isPlaying === true;
        console.log('hasSavedState:', hasSavedState);
        
        if (hasSavedState) {
            const state = savedState.state;
            console.log('Restoring from saved state...');
            
            this.game.initLevel(levelIndex);
            
            if (state.map) {
                this.game.map = this.cloneGameMap(state.map);
                console.log('Map restored');
            }
            if (state.playerPos) {
                this.game.playerPos = { ...state.playerPos };
                console.log('PlayerPos restored:', this.game.playerPos);
            }
            if (state.boxes) {
                this.game.boxes = state.boxes.map(b => ({ ...b }));
                console.log('Boxes restored:', this.game.boxes);
            }
            if (state.moves !== undefined) {
                this.game.moves = state.moves;
            }
            if (state.timeLeft !== undefined) {
                this.game.timeLeft = state.timeLeft;
            }
            
            this.game.isPlaying = true;
            this.game.isPaused = false;
            this.game.moveHistory = [];
            
            this.renderer.resize(this.game.map.length, this.game.map[0].length);
            
            this.elements.startOverlay.style.display = 'none';
            this.game.startTimer();
            this.elements.pauseBtn.disabled = false;
            this.elements.restartBtn.disabled = false;
            
            this.updateUI();
            this.render();
            
            console.log('=== Game state restored successfully ===');
        } else {
            console.log('No saved state, initializing fresh level');
            this.initLevel(levelIndex);
        }
    }
    
    cloneGameMap(map) {
        if (!Array.isArray(map)) return [];
        return map.map(row => Array.isArray(row) ? [...row] : []);
    }

    initLevel(levelIndex) {
        this.game.initLevel(levelIndex);
        this.renderer.resize(this.game.map.length, this.game.map[0].length);
        this.updateUI();
        this.render();
    }

    startGame() {
        SoundManager.init();
        this.elements.startOverlay.style.display = 'none';
        this.game.isPlaying = true;
        this.game.isPaused = false;
        this.game.startTimer();
        this.elements.pauseBtn.disabled = false;
        this.elements.restartBtn.disabled = false;
    }

    pauseGame() {
        if (!this.game.isPlaying) return;
        
        this.game.isPaused = true;
        this.elements.pauseOverlay.style.display = 'flex';
    }

    resumeGame() {
        this.game.isPaused = false;
        this.elements.pauseOverlay.style.display = 'none';
    }

    restartGame() {
        this.hideAllOverlays();
        
        this.game.initLevel(this.game.currentLevel);
        this.game.isPlaying = true;
        this.game.isPaused = false;
        this.game.startTimer();
        
        this.elements.pauseBtn.disabled = false;
        this.elements.restartBtn.disabled = false;
        
        this.updateUI();
        this.render();
    }

    nextLevel() {
        const nextLevelIndex = this.game.currentLevel + 1;
        
        if (nextLevelIndex >= LEVELS.length) {
            this.hideAllOverlays();
            this.elements.completeOverlay.style.display = 'flex';
            return;
        }
        
        this.hideAllOverlays();
        this.initLevel(nextLevelIndex);
        
        this.game.isPlaying = true;
        this.game.isPaused = false;
        this.game.startTimer();
        
        this.updateUI();
        this.render();
    }

    showLevelSelect() {
        this.generateLevelButtons();
        this.elements.levelSelectModal.style.display = 'flex';
        
        if (this.game.isPlaying && !this.game.isPaused) {
            this.game.isPaused = true;
        }
    }

    hideLevelSelect() {
        this.elements.levelSelectModal.style.display = 'none';
        
        if (this.game.isPlaying && this.game.isPaused) {
            this.game.isPaused = false;
        }
    }

    generateLevelButtons() {
        this.elements.levelButtons.innerHTML = '';
        
        LEVELS.forEach((level, index) => {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            
            const isUnlocked = storageManager.isLevelUnlocked(index);
            const isCompleted = storageManager.isLevelCompleted(index);
            
            if (!isUnlocked) {
                btn.classList.add('locked');
                btn.innerHTML = `
                    <span class="level-number">${index + 1}</span>
                    <span class="level-stars">🔒</span>
                `;
            } else {
                btn.classList.add('unlocked');
                
                if (isCompleted) {
                    btn.classList.add('completed');
                }
                
                const bestTime = storageManager.getBestTime(index);
                const stars = bestTime ? this.getStars(bestTime, level.timeLimit) : 0;
                const starDisplay = '⭐'.repeat(stars) || (isCompleted ? '⭐' : '');
                
                btn.innerHTML = `
                    <span class="level-number">${index + 1}</span>
                    <span class="level-stars">${starDisplay}</span>
                `;
                
                btn.addEventListener('click', () => {
                    this.hideLevelSelect();
                    this.hideAllOverlays();
                    this.initLevel(index);
                    
                    storageManager.clearGameState();
                    
                    if (isCompleted) {
                        this.elements.startOverlay.style.display = 'none';
                        this.game.isPlaying = true;
                        this.game.isPaused = false;
                        this.game.startTimer();
                        this.elements.pauseBtn.disabled = false;
                        this.elements.restartBtn.disabled = false;
                    } else {
                        this.elements.startOverlay.style.display = 'flex';
                        this.game.isPlaying = false;
                        this.game.isPaused = false;
                        this.elements.pauseBtn.disabled = true;
                        this.elements.restartBtn.disabled = true;
                    }
                    
                    this.updateUI();
                });
            }
            
            this.elements.levelButtons.appendChild(btn);
        });
    }

    getStars(time, maxTime) {
        const ratio = time / maxTime;
        if (ratio <= 0.33) return 3;
        if (ratio <= 0.66) return 2;
        return 1;
    }

    handleKeyDown(e) {
        if (!this.game.isPlaying || this.game.isPaused) return;
        
        let dx = 0, dy = 0;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'Up':
            case 'w':
            case 'W':
                dy = -1;
                break;
            case 'ArrowDown':
            case 'Down':
            case 's':
            case 'S':
                dy = 1;
                break;
            case 'ArrowLeft':
            case 'Left':
            case 'a':
            case 'A':
                dx = -1;
                break;
            case 'ArrowRight':
            case 'Right':
            case 'd':
            case 'D':
                dx = 1;
                break;
            case 'z':
            case 'Z':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.undoMove();
                }
                return;
            case 'r':
            case 'R':
                this.restartGame();
                return;
            case 'Escape':
            case 'p':
            case 'P':
                this.pauseGame();
                return;
            default:
                return;
        }
        
        if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            this.handleMove(dx, dy);
        }
    }

    handleMove(dx, dy) {
        if (!this.game.isPlaying || this.game.isPaused) return;
        
        const moved = this.game.move(dx, dy);
        
        if (moved) {
            this.updateUI();
            this.render();
            
            if (this.game.checkWin()) {
                this.handleWin();
            }
        }
    }

    undoMove() {
        if (!this.game.isPlaying || this.game.isPaused) return;
        
        const undone = this.game.undo();
        
        if (undone) {
            this.updateUI();
            this.render();
        }
    }

    handleWin() {
        const level = LEVELS[this.game.currentLevel];
        const timeUsed = level.timeLimit - this.game.timeLeft;
        const moves = this.game.moves;
        
        const isNewRecord = storageManager.completeLevel(
            this.game.currentLevel,
            timeUsed,
            moves
        );
        
        this.game.stopTimer();
        this.game.isPlaying = false;
        
        this.elements.winTime.textContent = timeUsed;
        this.elements.winMoves.textContent = moves;
        this.elements.newRecord.style.display = isNewRecord ? 'block' : 'none';
        
        if (this.game.currentLevel >= LEVELS.length - 1) {
            this.elements.nextLevelBtn.style.display = 'none';
        } else {
            this.elements.nextLevelBtn.style.display = 'inline-block';
        }
        
        this.elements.winOverlay.style.display = 'flex';
        
        storageManager.clearGameState();
    }

    hideAllOverlays() {
        this.elements.startOverlay.style.display = 'none';
        this.elements.pauseOverlay.style.display = 'none';
        this.elements.winOverlay.style.display = 'none';
        this.elements.loseOverlay.style.display = 'none';
        this.elements.completeOverlay.style.display = 'none';
    }

    updateUI() {
        this.elements.levelDisplay.textContent = this.game.currentLevel + 1;
        this.elements.movesDisplay.textContent = this.game.moves;
        this.elements.timerDisplay.textContent = this.game.timeLeft;
        
        const bestTime = storageManager.getBestTime(this.game.currentLevel);
        if (bestTime !== undefined) {
            this.elements.recordDisplay.textContent = `${bestTime}秒`;
        } else {
            this.elements.recordDisplay.textContent = '--';
        }
        
        if (this.game.timeLeft <= 10) {
            this.elements.timerDisplay.style.color = '#ff6b6b';
        } else {
            this.elements.timerDisplay.style.color = '';
        }
    }

    render() {
        this.renderer.render(this.game.map);
    }

    startAnimationLoop() {
        const loop = () => {
            this.render();
            this.updateUI();
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    }

    stopAnimationLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    saveGameState() {
        if (!this.game.isPlaying) return;
        
        const gameState = {
            map: this.game.map,
            playerPos: this.game.playerPos,
            boxes: this.game.boxes,
            targets: this.game.targets,
            moves: this.game.moves,
            timeLeft: this.game.timeLeft,
            isPlaying: this.game.isPlaying,
            isPaused: this.game.isPaused
        };
        
        storageManager.saveGameState(this.game.currentLevel, gameState);
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveGameState();
        }, 5000);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

function onGameLose() {
    app.hideAllOverlays();
    app.elements.loseOverlay.style.display = 'flex';
    storageManager.clearGameState();
}

function onGameWin() {
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
