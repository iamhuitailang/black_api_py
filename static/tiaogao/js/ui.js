const UISystem = {
    elements: {},
    
    init() {
        this.elements = {
            currentHeight: document.getElementById('currentHeight'),
            bestHeight: document.getElementById('bestHeight'),
            attemptCount: document.getElementById('attemptCount'),
            rank: document.getElementById('rank'),
            weather: document.getElementById('weather'),
            chargeBarContainer: document.getElementById('chargeBarContainer'),
            chargeBar: document.getElementById('chargeBar'),
            chargeText: document.getElementById('chargeText'),
            hintText: document.getElementById('hintText'),
            startScreen: document.getElementById('startScreen'),
            resultScreen: document.getElementById('resultScreen'),
            resultTitle: document.getElementById('resultTitle'),
            resultDetails: document.getElementById('resultDetails'),
            continueBtn: document.getElementById('continueBtn'),
            restartBtn: document.getElementById('restartBtn'),
            menuBtn: document.getElementById('menuBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            modeButtons: document.querySelectorAll('.mode-btn')
        };
    },
    
    updateInfo(data) {
        if (data.currentHeight !== undefined) {
            this.elements.currentHeight.textContent = data.currentHeight.toFixed(2) + 'm';
        }
        if (data.bestHeight !== undefined) {
            this.elements.bestHeight.textContent = data.bestHeight > 0 ? data.bestHeight.toFixed(2) + 'm' : '--';
        }
        if (data.successfulJumps !== undefined && data.totalJumps !== undefined) {
            this.elements.attemptCount.textContent = `${data.successfulJumps}/${data.totalJumps}`;
        }
        if (data.rank !== undefined) {
            this.elements.rank.textContent = data.rank ? `第${data.rank}名` : '--';
        }
        if (data.weather !== undefined) {
            this.elements.weather.textContent = data.weather;
        }
    },
    
    showChargeBar(show) {
        this.elements.chargeBarContainer.classList.toggle('hidden', !show);
    },
    
    updateChargeBar(percent) {
        this.elements.chargeBar.style.width = Math.min(100, Math.max(0, percent)) + '%';
    },
    
    updateChargeText(text) {
        this.elements.chargeText.textContent = text;
    },
    
    showHint(text, duration = 2000) {
        this.elements.hintText.textContent = text;
        this.elements.hintText.classList.add('show');
        
        if (duration > 0) {
            setTimeout(() => {
                this.elements.hintText.classList.remove('show');
            }, duration);
        }
    },
    
    hideHint() {
        this.elements.hintText.classList.remove('show');
    },
    
    showStartScreen(show) {
        this.elements.startScreen.classList.toggle('hidden', !show);
    },
    
    showResultScreen(data) {
        this.elements.resultScreen.classList.remove('hidden');
        this.elements.resultTitle.textContent = data.title || '比赛结束';
        
        let html = '';
        if (data.rows) {
            for (const row of data.rows) {
                html += `<div class="result-row">
                    <span class="label">${row.label}</span>
                    <span class="value">${row.value}</span>
                </div>`;
            }
        }
        this.elements.resultDetails.innerHTML = html;
    },
    
    hideResultScreen() {
        this.elements.resultScreen.classList.add('hidden');
    },
    
    showPauseButton(show) {
        this.elements.pauseBtn.classList.toggle('hidden', !show);
    },
    
    bindModeSelect(callback) {
        this.elements.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (callback) callback(mode);
            });
        });
    },
    
    bindContinue(callback) {
        this.elements.continueBtn.addEventListener('click', () => {
            if (callback) callback();
        });
    },
    
    bindRestart(callback) {
        this.elements.restartBtn.addEventListener('click', () => {
            if (callback) callback();
        });
    },
    
    bindMenu(callback) {
        this.elements.menuBtn.addEventListener('click', () => {
            if (callback) callback();
        });
    },
    
    bindPause(callback) {
        this.elements.pauseBtn.addEventListener('click', () => {
            if (callback) callback();
        });
    }
};
