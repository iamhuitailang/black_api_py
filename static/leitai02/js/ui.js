const UI = {
    screens: {},
    elements: {},
    
    init(game) {
        this.game = game;
        this.cacheElements();
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.checkSavedGame();
    },
    
    cacheElements() {
        this.screens = {
            start: document.getElementById('start-screen'),
            pause: document.getElementById('pause-screen'),
            gameover: document.getElementById('gameover-screen'),
            victory: document.getElementById('victory-screen'),
            records: document.getElementById('records-screen'),
            roundTransition: document.getElementById('round-transition')
        };
        
        this.elements = {
            startBtn: document.getElementById('start-btn'),
            continueBtn: document.getElementById('continue-btn'),
            recordsBtn: document.getElementById('records-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            retryBtn: document.getElementById('retry-btn'),
            backBtn: document.getElementById('back-btn'),
            victoryRetryBtn: document.getElementById('victory-retry-btn'),
            victoryBackBtn: document.getElementById('victory-back-btn'),
            recordsBackBtn: document.getElementById('records-back-btn'),
            gameoverTitle: document.getElementById('gameover-title'),
            gameoverMessage: document.getElementById('gameover-message'),
            currentWinStreak: document.getElementById('current-win-streak'),
            bestWinStreak: document.getElementById('best-win-streak'),
            victoryRound: document.getElementById('victory-round'),
            victoryBest: document.getElementById('victory-best'),
            recordStreak: document.getElementById('record-streak'),
            roundTitle: document.getElementById('round-title'),
            roundOpponent: document.getElementById('round-opponent')
        };
    },
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.game.startNewGame());
        this.elements.continueBtn.addEventListener('click', () => this.game.continueGame());
        this.elements.recordsBtn.addEventListener('click', () => this.showScreen('records'));
        this.elements.resumeBtn.addEventListener('click', () => this.game.resumeGame());
        this.elements.restartBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.quitBtn.addEventListener('click', () => this.game.quitGame());
        this.elements.retryBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.backBtn.addEventListener('click', () => this.showScreen('start'));
        this.elements.victoryRetryBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.victoryBackBtn.addEventListener('click', () => this.showScreen('start'));
        this.elements.recordsBackBtn.addEventListener('click', () => this.showScreen('start'));
    },
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.add('hidden');
            }
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
    },
    
    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.add('hidden');
            }
        });
    },
    
    showPauseScreen() {
        this.showScreen('pause');
    },
    
    showGameOver(winStreak, isWin = false) {
        const highScore = Storage.getHighScore();
        
        if (isWin) {
            this.elements.gameoverTitle.textContent = '胜利！';
            this.elements.gameoverMessage.textContent = '你击败了这个对手！';
        } else {
            this.elements.gameoverTitle.textContent = '游戏结束';
            this.elements.gameoverMessage.textContent = '你被击败了，再接再厉！';
        }
        
        this.elements.currentWinStreak.textContent = winStreak;
        this.elements.bestWinStreak.textContent = highScore;
        
        this.showScreen('gameover');
    },
    
    showVictory(round, winStreak) {
        const highScore = Storage.getHighScore();
        
        this.elements.victoryRound.textContent = round;
        this.elements.victoryBest.textContent = highScore;
        
        this.showScreen('victory');
    },
    
    showRoundTransition(round, opponentName) {
        this.elements.roundTitle.textContent = `第 ${round} 回合`;
        this.elements.roundOpponent.textContent = `对手：${opponentName}`;
        
        this.showScreen('roundTransition');
        
        setTimeout(() => {
            this.hideAllScreens();
        }, 2000);
    },
    
    updateHighScoreDisplay() {
        const highScore = Storage.getHighScore();
        this.elements.recordStreak.textContent = highScore;
    },
    
    checkSavedGame() {
        if (Storage.hasSavedGame()) {
            this.elements.continueBtn.style.display = 'block';
        } else {
            this.elements.continueBtn.style.display = 'none';
        }
    },
    
    showComboEffect(comboName) {
        const container = document.getElementById('game-container');
        const existing = document.getElementById('combo-display');
        if (existing) existing.remove();
        
        const comboEl = document.createElement('div');
        comboEl.id = 'combo-display';
        comboEl.innerHTML = `<div class="combo-text">${comboName}!</div>`;
        container.appendChild(comboEl);
        
        setTimeout(() => {
            comboEl.remove();
        }, 1500);
    },
    
    showDamageNumber(x, y, damage, isHeal = false) {
        const container = document.getElementById('game-container');
        const dmgEl = document.createElement('div');
        dmgEl.className = `damage-number${isHeal ? ' heal' : ''}`;
        dmgEl.textContent = isHeal ? `+${damage}` : `-${damage}`;
        dmgEl.style.left = `${x}px`;
        dmgEl.style.top = `${y}px`;
        container.appendChild(dmgEl);
        
        setTimeout(() => {
            dmgEl.remove();
        }, 1000);
    },
    
    createScreenFlash() {
        const container = document.getElementById('game-container');
        const existing = container.querySelector('.screen-flash');
        if (existing) existing.remove();
        
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        container.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 100);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
