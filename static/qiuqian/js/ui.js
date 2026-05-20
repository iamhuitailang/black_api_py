const UI = {
    elements: {},
    game: null,
    
    init(game) {
        this.game = game;
        this.cacheElements();
        this.bindEvents();
        this.updateContinueButton();
    },
    
    cacheElements() {
        this.elements = {
            startMenu: document.getElementById('start-menu'),
            pauseMenu: document.getElementById('pause-menu'),
            gameoverMenu: document.getElementById('gameover-menu'),
            victoryMenu: document.getElementById('victory-menu'),
            gameHud: document.getElementById('game-hud'),
            
            startBtn: document.getElementById('start-btn'),
            continueBtn: document.getElementById('continue-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            retryBtn: document.getElementById('retry-btn'),
            backMenuBtn: document.getElementById('back-menu-btn'),
            nextLevelBtn: document.getElementById('next-level-btn'),
            victoryMenuBtn: document.getElementById('victory-menu-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            
            levelDisplay: document.getElementById('level-display'),
            scoreDisplay: document.getElementById('score-display'),
            timeDisplay: document.getElementById('time-display'),
            chargeBar: document.getElementById('charge-bar'),
            chargeLabel: document.getElementById('charge-label'),
            missCount: document.getElementById('miss-count'),
            
            gameoverTitle: document.getElementById('gameover-title'),
            gameoverMessage: document.getElementById('gameover-message'),
            finalScore: document.getElementById('final-score'),
            finalTime: document.getElementById('final-time'),
            victoryScore: document.getElementById('victory-score'),
            victoryTime: document.getElementById('victory-time'),
            victoryRating: document.getElementById('victory-rating')
        };
    },
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.game.startNewGame());
        this.elements.continueBtn.addEventListener('click', () => this.game.continueGame());
        this.elements.resumeBtn.addEventListener('click', () => this.game.resume());
        this.elements.restartBtn.addEventListener('click', () => this.game.restartLevel());
        this.elements.quitBtn.addEventListener('click', () => this.game.quitToMenu());
        this.elements.retryBtn.addEventListener('click', () => this.game.restartLevel());
        this.elements.backMenuBtn.addEventListener('click', () => this.game.quitToMenu());
        this.elements.nextLevelBtn.addEventListener('click', () => this.game.nextLevel());
        this.elements.victoryMenuBtn.addEventListener('click', () => this.game.quitToMenu());
        this.elements.pauseBtn.addEventListener('click', () => this.game.pause());
    },
    
    updateContinueButton() {
        if (Storage.hasSave()) {
            this.elements.continueBtn.style.display = 'block';
        } else {
            this.elements.continueBtn.style.display = 'none';
        }
    },
    
    showMenu(menuName) {
        this.hideAllMenus();
        
        switch (menuName) {
            case 'start':
                this.elements.startMenu.style.display = 'flex';
                this.elements.gameHud.style.display = 'none';
                this.updateContinueButton();
                break;
            case 'pause':
                this.elements.pauseMenu.style.display = 'flex';
                break;
            case 'gameover':
                this.elements.gameoverMenu.style.display = 'flex';
                this.elements.gameHud.style.display = 'none';
                break;
            case 'victory':
                this.elements.victoryMenu.style.display = 'flex';
                this.elements.gameHud.style.display = 'none';
                break;
            case 'playing':
                this.elements.gameHud.style.display = 'block';
                break;
        }
    },
    
    hideAllMenus() {
        this.elements.startMenu.style.display = 'none';
        this.elements.pauseMenu.style.display = 'none';
        this.elements.gameoverMenu.style.display = 'none';
        this.elements.victoryMenu.style.display = 'none';
    },
    
    updateHUD(game) {
        this.elements.levelDisplay.textContent = game.currentLevel;
        this.elements.scoreDisplay.textContent = game.score;
        this.elements.timeDisplay.textContent = Math.floor(game.elapsedTime);
        this.elements.missCount.textContent = game.missCount;
        
        if (game.player.state === PLAYER_STATE.CHARGING) {
            const chargePercent = (game.chargeLevel / CONFIG.CHARGE.MAX_CHARGE) * 100;
            this.elements.chargeBar.style.width = chargePercent + '%';
            
            let chargeName = '蓄力';
            if (game.chargeLevel >= CONFIG.CHARGE.LEVELS.FULL.threshold) {
                chargeName = '满蓄力';
            } else if (game.chargeLevel >= CONFIG.CHARGE.LEVELS.MEDIUM.threshold) {
                chargeName = '中蓄力';
            } else if (game.chargeLevel >= CONFIG.CHARGE.LEVELS.LIGHT.threshold) {
                chargeName = '轻蓄力';
            }
            this.elements.chargeLabel.textContent = chargeName;
        } else {
            this.elements.chargeBar.style.width = '0%';
            this.elements.chargeLabel.textContent = '蓄力';
        }
    },
    
    showGameOver(reason, score, time) {
        this.elements.gameoverTitle.textContent = '闯关失败';
        this.elements.gameoverMessage.textContent = reason;
        this.elements.finalScore.textContent = score;
        this.elements.finalTime.textContent = Math.floor(time);
        this.showMenu('gameover');
    },
    
    showVictory(score, time, rating) {
        this.elements.victoryScore.textContent = score;
        this.elements.victoryTime.textContent = Math.floor(time);
        this.elements.victoryRating.textContent = rating;
        this.showMenu('victory');
    }
};
