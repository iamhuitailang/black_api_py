class UIManager {
    constructor() {
        this.startScreen = document.getElementById('start-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.endScreen = document.getElementById('end-screen');
        this.hud = document.getElementById('hud');
        this.actionHint = document.getElementById('action-hint');
        
        this.timerEl = document.getElementById('timer');
        this.scoreEl = document.getElementById('score');
        this.livesEl = document.getElementById('lives');
        this.endTitleEl = document.getElementById('endTitle');
        this.endMessageEl = document.getElementById('endMessage');
        this.finalScoreEl = document.getElementById('finalScore');
        
        this.startBtn = document.getElementById('startBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.restartBtnPause = document.getElementById('restartBtnPause');
        this.restartBtnEnd = document.getElementById('restartBtnEnd');
        this.quitBtn = document.getElementById('quitBtn');
        this.backToMenuBtn = document.getElementById('backToMenuBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
    }
    
    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.pauseScreen.classList.add('hidden');
        this.endScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.actionHint.classList.add('hidden');
    }
    
    showPauseScreen() {
        this.pauseScreen.classList.remove('hidden');
    }
    
    hidePauseScreen() {
        this.pauseScreen.classList.add('hidden');
    }
    
    showEndScreen(win, score) {
        this.endScreen.classList.remove('hidden');
        this.hud.classList.add('hidden');
        
        if (win) {
            this.endTitleEl.textContent = '🎉 恭喜获胜！';
            this.endMessageEl.textContent = '你成功拆家并躲过了主人！';
        } else {
            this.endTitleEl.textContent = '😿 游戏结束';
            this.endMessageEl.textContent = score >= CONFIG.WIN_SCORE ? '时间到！' : '生命耗尽！';
        }
        this.finalScoreEl.textContent = score;
    }
    
    hideEndScreen() {
        this.endScreen.classList.add('hidden');
    }
    
    showHUD() {
        this.hud.classList.remove('hidden');
        this.startScreen.classList.add('hidden');
    }
    
    updateHUD(timeLeft, score, lives) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = Math.floor(timeLeft % 60);
        this.timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.scoreEl.textContent = score;
        this.livesEl.textContent = lives;
    }
    
    showActionHint(text) {
        this.actionHint.textContent = text;
        this.actionHint.classList.remove('hidden');
        
        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            this.actionHint.classList.add('hidden');
        }, 1500);
    }
    
    onStart(callback) {
        this.startBtn.addEventListener('click', callback);
    }
    
    onResume(callback) {
        this.resumeBtn.addEventListener('click', callback);
    }
    
    onRestart(callback) {
        this.restartBtnPause.addEventListener('click', callback);
        this.restartBtnEnd.addEventListener('click', callback);
    }
    
    onQuit(callback) {
        this.quitBtn.addEventListener('click', callback);
        this.backToMenuBtn.addEventListener('click', callback);
    }
    
    onPause(callback) {
        this.pauseBtn.addEventListener('click', callback);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                callback();
            }
        });
    }
}