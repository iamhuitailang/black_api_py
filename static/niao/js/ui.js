class UIManager {
    constructor() {
        this.startScreen = document.getElementById('start-screen');
        this.gameUI = document.getElementById('game-ui');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        
        this.currentScoreEl = document.querySelector('.current-score');
        this.menuHighScoreEl = document.getElementById('menu-high-score');
        this.finalScoreEl = document.getElementById('final-score');
        this.bestScoreEl = document.getElementById('best-score');
        this.newRecordEl = document.getElementById('new-record');
        
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.quitBtn = document.getElementById('quit-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.backMenuBtn = document.getElementById('back-menu-btn');
        
        this.characterItems = document.querySelectorAll('.character-item');
        this.themeItems = document.querySelectorAll('.theme-item');
        
        this.selectedCharacter = Storage.getSelectedCharacter();
        this.selectedTheme = Storage.getSelectedTheme();
        
        this.initSelectionUI();
    }
    
    initSelectionUI() {
        this.characterItems.forEach(item => {
            if (item.dataset.character === this.selectedCharacter) {
                item.classList.add('selected');
            }
            
            item.addEventListener('click', () => {
                this.characterItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedCharacter = item.dataset.character;
                Storage.setSelectedCharacter(this.selectedCharacter);
            });
        });
        
        this.themeItems.forEach(item => {
            if (item.dataset.theme === this.selectedTheme) {
                item.classList.add('selected');
            }
            
            item.addEventListener('click', () => {
                this.themeItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedTheme = item.dataset.theme;
                Storage.setSelectedTheme(this.selectedTheme);
            });
        });
        
        this.updateMenuHighScore();
    }
    
    updateMenuHighScore() {
        const highScore = Storage.getHighScore();
        if (this.menuHighScoreEl) {
            this.menuHighScoreEl.textContent = highScore;
        }
    }
    
    showStartScreen() {
        this.hideAllScreens();
        this.startScreen.classList.remove('hidden');
        this.updateMenuHighScore();
    }
    
    showGameUI() {
        this.hideAllScreens();
        this.gameUI.classList.remove('hidden');
    }
    
    showPauseScreen() {
        this.pauseScreen.classList.remove('hidden');
    }
    
    hidePauseScreen() {
        this.pauseScreen.classList.add('hidden');
    }
    
    showGameOverScreen(score, isNewRecord) {
        this.gameUI.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        this.finalScoreEl.textContent = score;
        this.bestScoreEl.textContent = Storage.getHighScore();
        
        if (isNewRecord) {
            this.newRecordEl.classList.remove('hidden');
        } else {
            this.newRecordEl.classList.add('hidden');
        }
    }
    
    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.gameUI.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    updateScore(score) {
        if (this.currentScoreEl) {
            this.currentScoreEl.textContent = score;
        }
    }
    
    getSelectedCharacter() {
        return this.selectedCharacter;
    }
    
    getSelectedTheme() {
        return this.selectedTheme;
    }
    
    onStart(callback) {
        this.startBtn.addEventListener('click', callback);
    }
    
    onPause(callback) {
        this.pauseBtn.addEventListener('click', callback);
    }
    
    onResume(callback) {
        this.resumeBtn.addEventListener('click', callback);
    }
    
    onRestart(callback) {
        this.restartBtn.addEventListener('click', callback);
        this.playAgainBtn.addEventListener('click', callback);
    }
    
    onQuit(callback) {
        this.quitBtn.addEventListener('click', callback);
        this.backMenuBtn.addEventListener('click', callback);
    }
}
