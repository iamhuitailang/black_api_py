const UI = {
    elements: {},
    
    init() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            levelupScreen: document.getElementById('levelup-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            gameUI: document.getElementById('game-ui'),
            
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            exitBtn: document.getElementById('exit-btn'),
            retryBtn: document.getElementById('retry-btn'),
            gameoverExitBtn: document.getElementById('gameover-exit-btn'),
            nextLevelBtn: document.getElementById('next-level-btn'),
            victoryRestartBtn: document.getElementById('victory-restart-btn'),
            victoryExitBtn: document.getElementById('victory-exit-btn'),
            
            levelDisplay: document.getElementById('level-display'),
            livesDisplay: document.getElementById('lives-display'),
            timeDisplay: document.getElementById('time-display'),
            gameoverReason: document.getElementById('gameover-reason'),
            levelupText: document.getElementById('levelup-text')
        };
        
        this.bindEvents();
    },
    
    bindEvents() {
        const { startBtn, pauseBtn, resumeBtn, restartBtn, exitBtn, retryBtn, 
                gameoverExitBtn, nextLevelBtn, victoryRestartBtn, victoryExitBtn } = this.elements;
        
        startBtn.addEventListener('click', () => Game.start());
        pauseBtn.addEventListener('click', () => Game.pause());
        resumeBtn.addEventListener('click', () => Game.resume());
        restartBtn.addEventListener('click', () => Game.restart());
        exitBtn.addEventListener('click', () => Game.exit());
        retryBtn.addEventListener('click', () => Game.restart());
        gameoverExitBtn.addEventListener('click', () => Game.exit());
        nextLevelBtn.addEventListener('click', () => Game.nextLevel());
        victoryRestartBtn.addEventListener('click', () => Game.restart());
        victoryExitBtn.addEventListener('click', () => Game.exit());
    },
    
    showScreen(screenName) {
        const screens = ['startScreen', 'pauseScreen', 'gameoverScreen', 'levelupScreen', 'victoryScreen'];
        screens.forEach(name => {
            if (this.elements[name]) {
                this.elements[name].classList.add('hidden');
            }
        });
        
        if (screenName && this.elements[screenName]) {
            this.elements[screenName].classList.remove('hidden');
        }
    },
    
    showGameUI(show) {
        if (show) {
            this.elements.gameUI.classList.remove('hidden');
        } else {
            this.elements.gameUI.classList.add('hidden');
        }
    },
    
    updateLevel(currentLevel, totalLevels = 3) {
        this.elements.levelDisplay.textContent = `${currentLevel} / ${totalLevels}`;
    },
    
    updateLives(lives) {
        this.elements.livesDisplay.textContent = '❤️'.repeat(Math.max(0, lives));
    },
    
    updateTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        this.elements.timeDisplay.textContent = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    showGameOver(reason) {
        this.elements.gameoverReason.textContent = reason;
        this.showScreen('gameoverScreen');
        this.showGameUI(false);
    },
    
    showLevelUp(levelNum, nextLevelName) {
        this.elements.levelupText.textContent = `第 ${levelNum} 关完成！\n准备进入：${nextLevelName}`;
        this.showScreen('levelupScreen');
        this.showGameUI(false);
    },
    
    showVictory() {
        this.showScreen('victoryScreen');
        this.showGameUI(false);
    },
    
    showPause() {
        this.showScreen('pauseScreen');
    },
    
    hidePause() {
        this.showScreen(null);
        this.showGameUI(true);
    },
    
    showStart() {
        this.showScreen('startScreen');
        this.showGameUI(false);
    }
};
