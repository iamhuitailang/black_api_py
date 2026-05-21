class App {
    constructor() {
        this.game = null;
        this.canvas = document.getElementById('gameCanvas');
        this.selectedTheme = 'countryside';
        
        this.screens = {
            start: document.getElementById('startScreen'),
            howToPlay: document.getElementById('howToPlayScreen'),
            game: document.getElementById('gameScreen'),
            result: document.getElementById('resultScreen')
        };
        
        this.uiElements = {
            timeValue: document.getElementById('timeValue'),
            speedValue: document.getElementById('speedValue'),
            rankValue: document.getElementById('rankValue'),
            progressFill: document.getElementById('progressFill'),
            itemIcon: document.getElementById('itemIcon'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            finalRank: document.getElementById('finalRank'),
            finalTime: document.getElementById('finalTime'),
            ranksList: document.getElementById('ranksList'),
            resultTitle: document.getElementById('resultTitle')
        };
        
        this.init();
    }

    init() {
        this.game = new Game(this.canvas);
        this.setupButtons();
        this.setupThemeSelector();
        this.setupEventListeners();
        this.checkSavedGame();
    }

    setupThemeSelector() {
        const themeBtns = document.querySelectorAll('.theme-btn');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTheme = btn.dataset.theme;
            });
        });
    }

    setupButtons() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('howToPlayBtn').addEventListener('click', () => this.showScreen('howToPlay'));
        document.getElementById('backBtn').addEventListener('click', () => this.showScreen('start'));
        
        document.getElementById('resumeGameBtn').addEventListener('click', () => this.game.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitToMenu());
        
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showScreen('start'));
    }

    setupEventListeners() {
        window.addEventListener('gameUIUpdate', (e) => this.updateUI(e.detail));
        window.addEventListener('gamePauseToggled', (e) => this.togglePauseOverlay(e.detail.paused));
        window.addEventListener('gameFinished', (e) => this.showResults(e.detail));
    }

    checkSavedGame() {
        const resumeBtn = document.getElementById('resumeBtn');
        if (Storage.hasSavedState()) {
            resumeBtn.style.display = 'block';
        } else {
            resumeBtn.style.display = 'none';
        }
    }

    showScreen(screenName) {
        for (const name in this.screens) {
            this.screens[name].classList.add('hidden');
        }
        this.screens[screenName].classList.remove('hidden');
        
        if (screenName === 'start') {
            this.checkSavedGame();
        }
    }

    startGame() {
        this.showScreen('game');
        this.game.setTheme(this.selectedTheme);
        this.game.start();
    }

    resumeGame() {
        this.showScreen('game');
        if (!this.game.resume()) {
            this.game.start();
        }
    }

    restartGame() {
        this.uiElements.pauseOverlay.classList.add('hidden');
        this.game.restart();
    }

    quitToMenu() {
        this.game.quit();
        this.showScreen('start');
    }

    updateUI(data) {
        this.uiElements.timeValue.textContent = Utils.formatTime(data.time);
        this.uiElements.speedValue.textContent = data.speed;
        this.uiElements.rankValue.textContent = `${data.rank}/${data.totalPlayers}`;
        this.uiElements.progressFill.style.width = `${Math.min(100, data.progress)}%`;
        
        this.updateItemSlot(data.item);
    }

    updateItemSlot(item) {
        const iconElement = this.uiElements.itemIcon;
        iconElement.classList.remove('boost', 'shield', 'bomb', 'trap', 'empty');
        
        if (item) {
            iconElement.classList.add(item);
            const icons = { boost: '⚡', shield: '🛡️', bomb: '💣', trap: '🕳️' };
            iconElement.textContent = icons[item] || '?';
        } else {
            iconElement.classList.add('empty');
            iconElement.textContent = '空';
        }
    }

    togglePauseOverlay(paused) {
        if (paused) {
            this.uiElements.pauseOverlay.classList.remove('hidden');
        } else {
            this.uiElements.pauseOverlay.classList.add('hidden');
        }
    }

    showResults(data) {
        this.uiElements.finalRank.textContent = data.playerRank;
        this.uiElements.finalTime.textContent = Utils.formatTime(data.playerTime);
        
        if (data.playerRank === 1) {
            this.uiElements.resultTitle.textContent = '🎉 恭喜夺冠！';
        } else {
            this.uiElements.resultTitle.textContent = `第 ${data.playerRank} 名，继续加油！`;
        }
        
        this.uiElements.ranksList.innerHTML = '';
        for (const ranking of data.rankings) {
            const item = document.createElement('div');
            item.className = 'rank-item';
            if (ranking.isPlayer) item.classList.add('player');
            if (ranking.rank === 1) item.classList.add('winner');
            
            item.innerHTML = `
                <span class="rank-pos">${ranking.rank}</span>
                <span class="rank-name">${ranking.name}</span>
                <span class="rank-time">${ranking.time ? Utils.formatTime(ranking.time) : '--:--.--'}</span>
            `;
            
            this.uiElements.ranksList.appendChild(item);
        }
        
        this.showScreen('result');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
