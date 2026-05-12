class App {
    constructor() {
        this.game = new Game();
        this.setupUI();
        this.start();
    }

    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('levelSelectBtn').addEventListener('click', () => {
            this.showLevelSelect();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseGame();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartLevel();
        });

        document.getElementById('quitBtn').addEventListener('click', () => {
            this.quitToMenu();
        });

        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.nextLevel();
        });

        document.getElementById('retryBtn').addEventListener('click', () => {
            this.restartLevel();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            this.quitToMenu();
        });

        document.getElementById('retryBtn2').addEventListener('click', () => {
            this.restartLevel();
        });

        document.getElementById('menuBtn2').addEventListener('click', () => {
            this.quitToMenu();
        });
    }

    start() {
        this.game.start();
        
        const savedState = storage.loadGameState();
        if (savedState && savedState.levelId) {
            this.hideAllMenus();
            document.getElementById('hud').classList.remove('hidden');
            this.game.loadSavedState();
        }

        this.gameLoop();
    }

    gameLoop() {
        this.updateHUD();
        this.checkGameState();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    updateHUD() {
        document.getElementById('level-display').textContent = levelManager.currentLevel;
        document.getElementById('score-display').textContent = this.game.score;
        document.getElementById('birds-display').textContent = 
            this.game.birdQueue.length - this.game.currentBirdIndex + (this.game.canShoot ? 0 : 0);
    }

    checkGameState() {
        if (this.game.isLevelComplete) {
            this.showLevelComplete();
        } else if (this.game.isGameOver) {
            this.showGameOver();
        }
    }

    startGame() {
        this.hideAllMenus();
        document.getElementById('hud').classList.remove('hidden');
        
        if (!this.game.loadSavedState()) {
            this.game.loadLevel(1);
        }
    }

    showLevelSelect() {
        this.hideAllMenus();
        document.getElementById('level-menu').classList.remove('hidden');
        this.populateLevelGrid();
    }

    populateLevelGrid() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';

        const savedData = storage.load();
        const unlockedLevels = savedData.unlockedLevels || 1;

        for (let i = 1; i <= levelManager.getTotalLevels(); i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;

            if (i <= unlockedLevels) {
                const stars = savedData.levelStars && savedData.levelStars[i] ? savedData.levelStars[i] : 0;
                if (stars > 0) {
                    btn.textContent = `${i} ${'⭐'.repeat(stars)}`;
                }
                btn.addEventListener('click', () => {
                    this.selectLevel(i);
                });
            } else {
                btn.classList.add('locked');
                btn.textContent = '🔒';
            }

            grid.appendChild(btn);
        }
    }

    selectLevel(levelId) {
        levelManager.currentLevel = levelId;
        this.hideAllMenus();
        document.getElementById('hud').classList.remove('hidden');
        this.game.loadLevel(levelId);
    }

    showMainMenu() {
        this.hideAllMenus();
        document.getElementById('main-menu').classList.remove('hidden');
    }

    pauseGame() {
        this.game.pause();
        document.getElementById('pause-menu').classList.remove('hidden');
    }

    resumeGame() {
        this.game.resume();
        document.getElementById('pause-menu').classList.add('hidden');
    }

    restartLevel() {
        this.hideAllMenus();
        document.getElementById('hud').classList.remove('hidden');
        this.game.loadLevel(levelManager.currentLevel);
    }

    quitToMenu() {
        this.hideAllMenus();
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        this.game.reset();
        storage.clearGameState();
    }

    nextLevel() {
        if (levelManager.nextLevel()) {
            this.hideAllMenus();
            document.getElementById('hud').classList.remove('hidden');
            this.game.loadLevel(levelManager.currentLevel);
        } else {
            this.quitToMenu();
        }
    }

    showLevelComplete() {
        this.hideAllMenus();
        document.getElementById('level-complete').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('final-score').textContent = this.game.score;

        const stars = this.game.getStars();
        const starsDisplay = document.getElementById('stars-display');
        starsDisplay.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            if (i < stars) {
                star.classList.add('filled');
                star.textContent = '⭐';
            } else {
                star.classList.add('empty');
                star.textContent = '☆';
            }
            starsDisplay.appendChild(star);
        }

        this.game.isLevelComplete = false;
    }

    showGameOver() {
        this.hideAllMenus();
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        this.game.isGameOver = false;
    }

    hideAllMenus() {
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});
