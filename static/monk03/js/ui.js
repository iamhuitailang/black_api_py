class UIManager {
    constructor() {
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.heightDisplay = document.getElementById('height-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.timeDisplay = document.getElementById('time-display');
        this.pauseBtn = document.getElementById('pause-btn');
        this.startScreen = document.getElementById('start-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameOverScreen = document.getElementById('gameover-screen');
        this.chargeBar = document.getElementById('charge-bar');
        this.chargeFill = this.chargeBar.querySelector('.charge-fill');
        this.floatingTextsContainer = document.getElementById('floating-texts');
        this.highScoreDisplay = document.getElementById('high-score');
        this.finalHeight = document.getElementById('final-height');
        this.finalScore = document.getElementById('final-score');
        this.newRecord = document.getElementById('new-record');
    }

    initEventListeners() {
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        document.getElementById('retry-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('home-btn').addEventListener('click', () => this.goHome());
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMode(e.target));
        });
    }

    selectMode(btn) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const target = btn.closest('.mode-btn') || btn;
        target.classList.add('active');
        gameState.mode = target.dataset.mode;
    }

    startGame() {
        audioManager.init();
        audioManager.resume();
        
        gameState.reset();
        gameState.isPlaying = true;
        gameState.isGameOver = false;
        
        obstacleGenerator.reset();
        itemGenerator.reset();
        
        for (let i = 0; i < 8; i++) {
            const height = 200 + i * 120;
            const side = i % 2 === 0 ? 1 : -1;
            gameState.obstacles.push({
                type: CONSTANTS.OBSTACLE_TYPES.BRANCH,
                height: height,
                side: side,
                offset: 0,
                growth: 1
            });
        }
        
        for (let i = 0; i < 12; i++) {
            const height = 100 + i * 100;
            gameState.items.push({
                type: CONSTANTS.ITEM_TYPES.BANANA,
                height: height,
                side: Math.random() > 0.5 ? 1 : -1
            });
        }
        
        this.startScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        
        this.updateHighScore();
        game.startTime = Date.now();
        
        storageManager.saveGame(gameState);
    }

    togglePause() {
        if (!gameState.isPlaying) return;
        
        gameState.isPaused = !gameState.isPaused;
        
        if (gameState.isPaused) {
            this.pauseScreen.classList.add('active');
            storageManager.saveGame(gameState);
        } else {
            this.pauseScreen.classList.remove('active');
        }
    }

    resumeGame() {
        gameState.isPaused = false;
        this.pauseScreen.classList.remove('active');
    }

    restartGame() {
        this.pauseScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        this.startGame();
    }

    quitGame() {
        this.pauseScreen.classList.remove('active');
        gameState.reset();
        this.startScreen.classList.add('active');
        storageManager.clearSave();
    }

    goHome() {
        this.gameOverScreen.classList.remove('active');
        gameState.reset();
        this.startScreen.classList.add('active');
    }

    showGameOver() {
        this.finalHeight.textContent = Math.floor(gameState.height) + 'm';
        this.finalScore.textContent = gameState.score;
        
        if (gameState.score >= gameState.highScore && gameState.score > 0) {
            this.newRecord.classList.remove('hidden');
        } else {
            this.newRecord.classList.add('hidden');
        }
        
        this.gameOverScreen.classList.add('active');
    }

    showChargeBar() {
        this.chargeBar.classList.remove('hidden');
    }

    hideChargeBar() {
        this.chargeBar.classList.add('hidden');
        this.chargeFill.style.width = '0%';
    }

    updateChargeBar(progress) {
        this.chargeFill.style.width = Math.min(progress * 100, 100) + '%';
    }

    showFloatingText(text, height, xOffset = 0) {
        const element = document.createElement('div');
        element.className = 'floating-text';
        element.textContent = text;
        
        const canvasRect = document.getElementById('game-canvas').getBoundingClientRect();
        const relativeY = (CONSTANTS.CANVAS_HEIGHT / 2 - (height - gameState.height)) / CONSTANTS.CANVAS_HEIGHT;
        const screenY = canvasRect.top + relativeY * canvasRect.height;
        const screenX = canvasRect.left + canvasRect.width / 2 + xOffset * (canvasRect.width / CONSTANTS.CANVAS_WIDTH);
        
        element.style.left = screenX + 'px';
        element.style.top = screenY + 'px';
        
        this.floatingTextsContainer.appendChild(element);
        
        setTimeout(() => {
            element.remove();
        }, 1000);
    }

    shakeScreen() {
        const container = document.getElementById('game-container');
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);
    }

    update() {
        this.heightDisplay.textContent = Math.floor(gameState.height) + 'm';
        this.scoreDisplay.textContent = gameState.score;
        
        if (game && game.startTime > 0) {
            const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timeDisplay.textContent = 
                String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        }
        
        if (gameState.isCharging) {
            const chargeTime = Math.min(Date.now() - gameState.chargeStartTime, CONSTANTS.CHARGE_MAX_TIME);
            this.updateChargeBar(chargeTime / CONSTANTS.CHARGE_MAX_TIME);
        }
    }

    updateHighScore() {
        this.highScoreDisplay.textContent = gameState.highScore;
    }

    tryLoadSave() {
        try {
            const saveData = storageManager.loadGame();
            if (saveData && saveData.isPlaying && saveData.height > 0) {
                if (confirm('发现未完成的游戏，是否继续？')) {
                    gameState.loadFromSave(saveData);
                    gameState.isPlaying = true;
                    gameState.isGameOver = false;
                    audioManager.init();
                    this.startScreen.classList.remove('active');
                    this.pauseScreen.classList.remove('active');
                    this.gameOverScreen.classList.remove('active');
                    game.startTime = Date.now() - (saveData.time || 0) * 1000;
                    return true;
                } else {
                    storageManager.clearSave();
                }
            }
        } catch (e) {
            console.error('加载存档失败:', e);
            storageManager.clearSave();
        }
        return false;
    }
}

let uiManager;
