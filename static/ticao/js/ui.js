const UI = {
    screens: {},
    selectedMode: null,
    selectedEvent: null,
    selectedOpponent: null,
    isPaused: false,
    
    onStartGame: null,
    onContinueGame: null,
    onResetSave: null,
    onModeSelect: null,
    onEventSelect: null,
    onOpponentSelect: null,
    onPause: null,
    onResume: null,
    onRestart: null,
    onQuit: null,
    onNextEvent: null,
    onResultBack: null,

    init() {
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            modeSelect: document.getElementById('mode-select'),
            eventSelect: document.getElementById('event-select'),
            opponentSelect: document.getElementById('opponent-select'),
            pauseMenu: document.getElementById('pause-menu'),
            resultScreen: document.getElementById('result-screen'),
            hud: document.getElementById('hud'),
            comboDisplay: document.getElementById('combo-display'),
            scorePopup: document.getElementById('score-popup')
        };
        
        this.bindMainMenu();
        this.bindModeSelect();
        this.bindEventSelect();
        this.bindOpponentSelect();
        this.bindPauseMenu();
        this.bindResultScreen();
    },

    bindMainMenu() {
        document.getElementById('btn-start').addEventListener('click', () => {
            if (this.onStartGame) this.onStartGame();
        });
        
        document.getElementById('btn-continue').addEventListener('click', () => {
            if (this.onContinueGame) this.onContinueGame();
        });
        
        document.getElementById('btn-reset').addEventListener('click', () => {
            if (this.onResetSave) this.onResetSave();
        });
        
        this.updateContinueButton();
    },

    updateContinueButton() {
        const btn = document.getElementById('btn-continue');
        if (Storage.hasSavedGame()) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    },

    bindModeSelect() {
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => {
            const handleSelect = () => {
                const mode = card.dataset.mode;
                this.selectedMode = mode;
                
                modeCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                setTimeout(() => {
                    if (this.onModeSelect) this.onModeSelect(mode);
                }, 300);
            };
            
            card.addEventListener('click', handleSelect);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect();
                }
            });
        });
        
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
    },

    bindEventSelect() {
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            const handleSelect = () => {
                const event = card.dataset.event;
                this.selectedEvent = event;
                
                eventCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                setTimeout(() => {
                    if (this.onEventSelect) this.onEventSelect(event);
                }, 300);
            };
            
            card.addEventListener('click', handleSelect);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect();
                }
            });
        });
        
        document.getElementById('btn-back-mode').addEventListener('click', () => {
            this.showScreen('modeSelect');
        });
    },

    bindOpponentSelect() {
        const opponentCards = document.querySelectorAll('.opponent-card');
        opponentCards.forEach(card => {
            const handleSelect = () => {
                const opponent = card.dataset.opponent;
                this.selectedOpponent = opponent;
                
                opponentCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                setTimeout(() => {
                    if (this.onOpponentSelect) this.onOpponentSelect(opponent);
                }, 300);
            };
            
            card.addEventListener('click', handleSelect);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect();
                }
            });
        });
        
        document.getElementById('btn-back-event').addEventListener('click', () => {
            this.showScreen('eventSelect');
        });
    },

    bindPauseMenu() {
        document.getElementById('btn-pause').addEventListener('click', () => {
            if (this.onPause) this.onPause();
        });
        
        document.getElementById('btn-resume').addEventListener('click', () => {
            if (this.onResume) this.onResume();
        });
        
        document.getElementById('btn-restart').addEventListener('click', () => {
            if (this.onRestart) this.onRestart();
        });
        
        document.getElementById('btn-quit').addEventListener('click', () => {
            if (this.onQuit) this.onQuit();
        });
    },

    bindResultScreen() {
        document.getElementById('btn-next').addEventListener('click', () => {
            if (this.onNextEvent) this.onNextEvent();
        });
        
        document.getElementById('btn-result-back').addEventListener('click', () => {
            if (this.onResultBack) this.onResultBack();
        });
    },

    showScreen(screenName) {
        for (const key in this.screens) {
            if (key === 'comboDisplay' || key === 'scorePopup') continue;
            this.screens[key].classList.add('hidden');
        }
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
        }
    },

    showHUD() {
        this.screens.hud.classList.remove('hidden');
    },

    hideHUD() {
        this.screens.hud.classList.add('hidden');
    },

    showPauseMenu() {
        this.screens.pauseMenu.classList.remove('hidden');
        this.isPaused = true;
    },

    hidePauseMenu() {
        this.screens.pauseMenu.classList.add('hidden');
        this.isPaused = false;
    },

    updateHUD(eventName, actionName, scores) {
        document.getElementById('hud-event').textContent = eventName || '--';
        document.getElementById('hud-action').textContent = actionName || '--';
        
        if (scores) {
            document.getElementById('hud-difficulty').textContent = scores.difficulty.toFixed(1);
            document.getElementById('hud-execution').textContent = scores.execution.toFixed(1);
            document.getElementById('hud-landing').textContent = scores.landing.toFixed(1);
        }
    },

    showCombo(count) {
        if (count < 2) {
            this.hideCombo();
            return;
        }
        
        const display = this.screens.comboDisplay;
        display.classList.remove('hidden');
        document.getElementById('combo-count').textContent = count;
        
        display.style.animation = 'none';
        display.offsetHeight;
        display.style.animation = '';
    },

    hideCombo() {
        this.screens.comboDisplay.classList.add('hidden');
    },

    showScorePopup(text, x, y) {
        const popup = this.screens.scorePopup;
        document.getElementById('score-popup-text').textContent = text;
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        popup.classList.remove('hidden');
        
        popup.style.animation = 'none';
        popup.offsetHeight;
        popup.style.animation = '';
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 1000);
    },

    showResult(resultData) {
        const { difficulty, execution, landing, total, rank, opponentScore, comparison } = resultData;
        
        document.getElementById('difficulty-score').textContent = difficulty.toFixed(1);
        document.getElementById('execution-score').textContent = execution.toFixed(1);
        document.getElementById('landing-score').textContent = landing.toFixed(1);
        document.getElementById('total-score').textContent = total.toFixed(1);
        
        const rankData = GameData.getRating(total);
        document.getElementById('rank-icon').textContent = rankData.icon;
        document.getElementById('rank-title').textContent = rankData.rank;
        document.getElementById('rank-title').style.color = rankData.color;
        
        const opponentEl = document.getElementById('result-opponent');
        if (opponentScore !== undefined && comparison) {
            opponentEl.textContent = `对手得分: ${opponentScore.toFixed(1)} - ${comparison}`;
            opponentEl.style.display = 'block';
        } else {
            opponentEl.style.display = 'none';
        }
        
        const nextBtn = document.getElementById('btn-next');
        if (resultData.hasNext) {
            nextBtn.style.display = 'block';
            nextBtn.textContent = '下一项';
        } else if (resultData.isFinalResult) {
            nextBtn.style.display = 'block';
            nextBtn.textContent = '查看总成绩';
        } else {
            nextBtn.style.display = 'none';
        }
        
        this.showScreen('resultScreen');
    },

    showEventSelectForAllAround() {
        this.showScreen('eventSelect');
        document.querySelectorAll('.event-card').forEach(card => {
            card.style.display = 'none';
        });
    },

    reset() {
        this.selectedMode = null;
        this.selectedEvent = null;
        this.selectedOpponent = null;
        this.isPaused = false;
        
        document.querySelectorAll('.mode-card, .event-card, .opponent-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
};
