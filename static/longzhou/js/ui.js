const UI = {
    game: null,
    selectedBoat: 'green',

    init(game) {
        this.game = game;
        this.selectedBoat = Storage.getSelectedBoat();
        this.setupEventListeners();
        this.updateMainMenuStats();
        this.highlightSelectedBoat();
    },

    setupEventListeners() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.game.resume());
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.game.restart());
        }

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => this.game.quit());
        }

        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.game.pause());
        }

        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.game.restart());
        }

        const backMenuBtn = document.getElementById('back-menu-btn');
        if (backMenuBtn) {
            backMenuBtn.addEventListener('click', () => {
                this.game.quit();
                this.updateMainMenuStats();
            });
        }

        const resetSaveBtn = document.getElementById('reset-save-btn');
        if (resetSaveBtn) {
            resetSaveBtn.addEventListener('click', () => {
                if (confirm('确定要清除所有游戏存档吗？这将删除最高纪录和积分。')) {
                    localStorage.removeItem(GameConfig.STORAGE_KEY);
                    this.updateMainMenuStats();
                    alert('存档已清除！');
                }
            });
        }

        const boatOptions = document.querySelectorAll('.boat-option');
        boatOptions.forEach(option => {
            option.addEventListener('click', () => {
                const boatType = option.dataset.boat;
                this.selectBoat(boatType);
            });
        });
    },

    selectBoat(boatType) {
        this.selectedBoat = boatType;
        Storage.setSelectedBoat(boatType);
        this.highlightSelectedBoat();
    },

    highlightSelectedBoat() {
        const boatOptions = document.querySelectorAll('.boat-option');
        boatOptions.forEach(option => {
            if (option.dataset.boat === this.selectedBoat) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    },

    updateMainMenuStats() {
        const bestTimeEl = document.getElementById('best-time');
        const totalScoreEl = document.getElementById('total-score');

        if (bestTimeEl) {
            bestTimeEl.textContent = Storage.formatTime(Storage.getBestTime());
        }
        if (totalScoreEl) {
            totalScoreEl.textContent = Storage.getTotalScore().toString();
        }
    },

    startGame() {
        this.hideMainMenu();
        this.showHUD();
        this.game.init(this.selectedBoat);
        this.game.animationId = requestAnimationFrame((t) => this.game.gameLoop(t));
    },

    showMainMenu() {
        const menu = document.getElementById('main-menu');
        if (menu) menu.classList.remove('hidden');
    },

    hideMainMenu() {
        const menu = document.getElementById('main-menu');
        if (menu) menu.classList.add('hidden');
    },

    showPauseMenu() {
        const menu = document.getElementById('pause-menu');
        if (menu) menu.classList.remove('hidden');
    },

    hidePauseMenu() {
        const menu = document.getElementById('pause-menu');
        if (menu) menu.classList.add('hidden');
    },

    showGameOver(data) {
        const menu = document.getElementById('game-over');
        const resultTitle = document.getElementById('result-title');
        const resultRank = document.getElementById('result-rank');
        const resultTime = document.getElementById('result-time');
        const resultScore = document.getElementById('result-score');
        const resultBest = document.getElementById('result-best');

        if (resultTitle) {
            if (data.rank === 1) {
                resultTitle.textContent = '冠军! 🏆';
            } else if (data.rank === 2) {
                resultTitle.textContent = '亚军! 🥈';
            } else if (data.rank === 3) {
                resultTitle.textContent = '季军! 🥉';
            } else {
                resultTitle.textContent = '再接再厉! 💪';
            }
        }

        if (resultRank) {
            const rankNames = ['', '第一名', '第二名', '第三名', '第四名'];
            resultRank.textContent = rankNames[data.rank] || data.rank;
        }
        if (resultTime) {
            resultTime.textContent = Storage.formatTime(data.time);
        }
        if (resultScore) {
            resultScore.textContent = '+' + data.score;
        }
        if (resultBest) {
            resultBest.textContent = Storage.formatTime(data.bestTime);
        }

        if (menu) menu.classList.remove('hidden');
    },

    hideGameOver() {
        const menu = document.getElementById('game-over');
        if (menu) menu.classList.add('hidden');
    },

    showHUD() {
        const hud = document.getElementById('game-hud');
        if (hud) hud.classList.remove('hidden');
    },

    hideHUD() {
        const hud = document.getElementById('game-hud');
        if (hud) hud.classList.add('hidden');
    }
};
