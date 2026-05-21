const UI = {
    elements: {},

    init() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            scoreDisplay: document.getElementById('score-display'),
            pauseBtn: document.getElementById('pause-btn'),
            startBtn: document.getElementById('start-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            retryBtn: document.getElementById('retry-btn'),
            homeBtn: document.getElementById('home-btn'),
            currentScore: document.getElementById('current-score'),
            currentHeight: document.getElementById('current-height'),
            bestScore: document.getElementById('best-score'),
            finalScore: document.getElementById('final-score'),
            finalHeight: document.getElementById('final-height'),
            finalBest: document.getElementById('final-best'),
            powerIndicator: document.getElementById('power-indicator'),
            powerFill: document.getElementById('power-fill'),
            timerDisplay: document.getElementById('timer-display'),
            timerValue: document.getElementById('timer-value'),
            modeButtons: document.querySelectorAll('.mode-btn')
        };
    },

    showStartScreen() {
        this.elements.startScreen.classList.remove('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameoverScreen.classList.add('hidden');
        this.elements.scoreDisplay.classList.add('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.powerIndicator.classList.add('hidden');
        this.elements.timerDisplay.classList.add('hidden');
    },

    showGameUI(mode) {
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameoverScreen.classList.add('hidden');
        this.elements.scoreDisplay.classList.remove('hidden');
        this.elements.pauseBtn.classList.remove('hidden');
        
        if (mode === CONSTANTS.GAME.MODES.TIMED) {
            this.elements.timerDisplay.classList.remove('hidden');
        } else {
            this.elements.timerDisplay.classList.add('hidden');
        }
    },

    showPauseScreen() {
        this.elements.pauseScreen.classList.remove('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.powerIndicator.classList.add('hidden');
    },

    hidePauseScreen() {
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.pauseBtn.classList.remove('hidden');
    },

    showGameoverScreen(score, height, best) {
        this.elements.gameoverScreen.classList.remove('hidden');
        this.elements.scoreDisplay.classList.add('hidden');
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.powerIndicator.classList.add('hidden');
        this.elements.timerDisplay.classList.add('hidden');
        
        this.elements.finalScore.textContent = score;
        this.elements.finalHeight.textContent = Utils.formatHeight(height) + 'm';
        this.elements.finalBest.textContent = best;
    },

    updateScore(score, height, best) {
        this.elements.currentScore.textContent = Utils.formatScore(score);
        this.elements.currentHeight.textContent = Utils.formatHeight(height);
        this.elements.bestScore.textContent = Utils.formatScore(best);
    },

    updateTimer(time) {
        this.elements.timerValue.textContent = Math.ceil(time);
        
        if (time <= 10) {
            this.elements.timerDisplay.style.color = '#FF4444';
        } else {
            this.elements.timerDisplay.style.color = '#FF6B6B';
        }
    },

    updatePower(power) {
        const percent = Math.min(100, power * 100);
        this.elements.powerFill.style.width = percent + '%';
    },

    showPowerIndicator() {
        this.elements.powerIndicator.classList.remove('hidden');
    },

    hidePowerIndicator() {
        this.elements.powerIndicator.classList.add('hidden');
    },

    setSelectedMode(mode) {
        this.elements.modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    getSelectedMode() {
        const activeBtn = document.querySelector('.mode-btn.active');
        return activeBtn ? activeBtn.dataset.mode : CONSTANTS.GAME.MODES.ENDLESS;
    }
};