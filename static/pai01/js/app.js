class App {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.game = null;
        this.animationId = null;
        this.autoSaveInterval = null;
        
        this.init();
    }
    
    init() {
        AudioManager.init();
        this.setupEventListeners();
        this.checkSavedGame();
        this.loadConfig();
    }
    
    setupEventListeners() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const timeLimitOption = document.getElementById('time-limit-option');
                if (btn.dataset.mode === 'double') {
                    timeLimitOption.style.display = 'none';
                } else {
                    timeLimitOption.style.display = 'block';
                }
            });
        });
        
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        document.querySelectorAll('.special-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.special-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.continueGame();
        });
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showMenu();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('sound-btn').addEventListener('click', () => {
            this.toggleSound();
        });
        
        document.getElementById('help-btn').addEventListener('click', () => {
            this.showHelp();
        });
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal('help-modal');
        });
        
        document.getElementById('cancel-peek').addEventListener('click', () => {
            this.cancelPeek();
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        window.addEventListener('beforeunload', () => {
            if (this.game && this.game.state === CONSTANTS.GAME_STATE.PLAYING) {
                this.game.save();
            }
        });
    }
    
    checkSavedGame() {
        const continueBtn = document.getElementById('continue-btn');
        if (Storage.hasSavedGame()) {
            continueBtn.style.display = 'block';
        } else {
            continueBtn.style.display = 'none';
        }
    }
    
    loadConfig() {
        const savedConfig = Storage.loadConfig();
        if (savedConfig) {
            if (savedConfig.gridSize) {
                document.querySelectorAll('.difficulty-btn').forEach(btn => {
                    btn.classList.toggle('active', parseInt(btn.dataset.size) === savedConfig.gridSize);
                });
            }
            if (savedConfig.gameMode) {
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.mode === savedConfig.gameMode);
                    if (savedConfig.gameMode === 'double') {
                        document.getElementById('time-limit-option').style.display = 'none';
                    }
                });
            }
            if (savedConfig.timeLimit !== undefined) {
                document.querySelectorAll('.time-btn').forEach(btn => {
                    btn.classList.toggle('active', parseInt(btn.dataset.time) === savedConfig.timeLimit);
                });
            }
            if (savedConfig.enableSpecialCards !== undefined) {
                document.querySelectorAll('.special-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.special === String(savedConfig.enableSpecialCards));
                });
            }
        }
    }
    
    getSelectedConfig() {
        const gridSize = parseInt(document.querySelector('.difficulty-btn.active').dataset.size);
        const gameMode = document.querySelector('.mode-btn.active').dataset.mode;
        const timeLimit = parseInt(document.querySelector('.time-btn.active').dataset.time);
        const enableSpecialCards = document.querySelector('.special-btn.active').dataset.special === 'true';
        
        const config = {
            gridSize,
            gameMode,
            timeLimit,
            enableSpecialCards
        };
        
        Storage.saveConfig(config);
        return config;
    }
    
    startNewGame() {
        const config = this.getSelectedConfig();
        
        this.game = new Game();
        this.game.init(config);
        
        this.renderer.resize(config.gridSize);
        
        this.hideMenu();
        this.showGame();
        
        this.startGameLoop();
    }
    
    continueGame() {
        const savedGame = Game.load();
        if (savedGame) {
            this.game = savedGame;
            this.renderer.resize(this.game.gridSize);
            
            if (this.game.state === CONSTANTS.GAME_STATE.PLAYING || 
                this.game.state === CONSTANTS.GAME_STATE.PEEKING) {
                this.game.startTimer();
            }
            
            this.hideMenu();
            this.showGame();
            this.startGameLoop();
            this.startAutoSave();
        }
    }
    
    showMenu() {
        if (this.game) {
            this.game.stopTimer();
            this.stopGameLoop();
            this.stopAutoSave();
        }
        
        document.getElementById('game-menu').style.display = 'block';
        document.getElementById('game-canvas-container').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('pause-btn').style.display = 'none';
        
        this.checkSavedGame();
    }
    
    hideMenu() {
        document.getElementById('game-menu').style.display = 'none';
    }
    
    showGame() {
        document.getElementById('game-canvas-container').style.display = 'flex';
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('pause-btn').style.display = 'inline-block';
    }
    
    showGameOver() {
        document.getElementById('game-canvas-container').style.display = 'none';
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('pause-btn').style.display = 'none';
        
        let winnerText = '游戏结束!';
        
        if (this.game.winner === -2) {
            winnerText = '⏰ 时间耗尽!';
        } else if (this.game.isDoubleMode()) {
            if (this.game.winner === -1) {
                winnerText = '🤝 平局!';
            } else {
                winnerText = `🎉 玩家${this.game.winner + 1} 获胜!`;
            }
        } else {
            winnerText = '🎉 恭喜通关!';
        }
        
        document.getElementById('winner-text').textContent = winnerText;
        document.getElementById('final-moves').textContent = this.game.moves;
        document.getElementById('final-time').textContent = Utils.formatTime(this.game.elapsedSeconds);
        
        this.stopGameLoop();
        this.stopAutoSave();
    }
    
    startGameLoop() {
        this.stopGameLoop();
        
        const loop = () => {
            this.update();
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        
        loop();
    }
    
    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
            if (this.game && 
                (this.game.state === CONSTANTS.GAME_STATE.PLAYING || 
                 this.game.state === CONSTANTS.GAME_STATE.PEEKING)) {
                this.game.save();
            }
        }, 5000);
    }
    
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    
    update() {
        if (!this.game) return;
        
        if (this.game.state === CONSTANTS.GAME_STATE.PLAYING && !this.autoSaveInterval) {
            this.startAutoSave();
        }
        
        this.updateUI();
        
        if (this.game.state === CONSTANTS.GAME_STATE.GAME_OVER) {
            this.showGameOver();
        }
    }
    
    updateUI() {
        if (this.game.state === CONSTANTS.GAME_STATE.PREVIEW) {
            document.getElementById('moves').textContent = '记忆中...';
            document.getElementById('timer').textContent = `${this.game.previewCountdown}秒`;
            
            document.getElementById('current-player').textContent = '预览阶段';
            document.getElementById('player1-score').textContent = '?';
            document.getElementById('player2-score').textContent = '?';
            document.getElementById('player1-pairs').textContent = '预览';
            document.getElementById('player2-pairs').textContent = '预览';
            
            const timeLimitContainer = document.getElementById('time-limit-container');
            timeLimitContainer.style.display = 'none';
            
            return;
        }
        
        document.getElementById('moves').textContent = this.game.moves;
        document.getElementById('timer').textContent = Utils.formatTime(this.game.elapsedSeconds);
        
        document.getElementById('player1-score').textContent = this.game.players[0].score;
        document.getElementById('player1-pairs').textContent = `${this.game.players[0].pairs}对`;
        
        document.getElementById('player2-score').textContent = this.game.players[1].score;
        document.getElementById('player2-pairs').textContent = `${this.game.players[1].pairs}对`;
        
        document.getElementById('current-player').textContent = 
            this.game.isDoubleMode() ? `玩家${this.game.currentPlayer + 1}` : '单人';
        
        const timeLimitContainer = document.getElementById('time-limit-container');
        if (this.game.hasTimeLimit()) {
            timeLimitContainer.style.display = 'block';
            document.getElementById('time-left').textContent = 
                Utils.formatTimeLimit(Math.ceil(this.game.timeLeft));
        } else {
            timeLimitContainer.style.display = 'none';
        }
    }
    
    render() {
        if (!this.game) return;
        this.renderer.render(this.game);
    }
    
    handleCanvasClick(e) {
        if (!this.game) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const position = this.renderer.getCardAtPosition(x, y, this.game.gridSize);
        
        if (!position) return;
        
        const card = this.game.getCardByPosition(position.row, position.col);
        
        if (!card) return;
        
        if (this.game.peekMode) {
            if (card.isFaceDown() && !card.isMatched()) {
                this.game.peekCard(card);
                AudioManager.playFlipSound();
                setTimeout(() => {
                    this.game.exitPeekMode();
                }, 2000);
            }
            return;
        }
        
        if (this.game.canFlipCard(card)) {
            this.game.flipCard(card);
        }
    }
    
    handleKeyPress(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePause();
        } else if (e.code === 'KeyR') {
            if (confirm('确定要重新开始吗？')) {
                this.showMenu();
            }
        }
    }
    
    togglePause() {
        if (!this.game) return;
        
        if (this.game.state === CONSTANTS.GAME_STATE.PLAYING) {
            this.game.pause();
            document.getElementById('pause-btn').textContent = '▶️ 继续';
        } else if (this.game.state === CONSTANTS.GAME_STATE.PAUSED) {
            this.game.resume();
            document.getElementById('pause-btn').textContent = '⏸️ 暂停';
        }
    }
    
    toggleSound() {
        const enabled = AudioManager.toggle();
        document.getElementById('sound-btn').textContent = enabled ? '🔊 音效' : '🔇 静音';
    }
    
    showHelp() {
        document.getElementById('help-modal').style.display = 'block';
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    cancelPeek() {
        if (this.game) {
            this.game.exitPeekMode();
        }
        this.closeModal('peek-modal');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
