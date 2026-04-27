class App {
    constructor() {
        this.game = null;
        this.init();
    }
    
    init() {
        this.game = new Game();
        this.setupUIListeners();
        this.checkSavedState();
    }
    
    checkSavedState() {
        const restoreSection = document.getElementById('restore-section');
        const normalStartSection = document.getElementById('normal-start-section');
        const modeSelect = document.querySelector('.mode-select');
        
        if (this.game.hasSavedState()) {
            const savedState = this.game.loadGameState();
            if (savedState) {
                restoreSection.classList.remove('hidden');
                normalStartSection.classList.add('hidden');
                if (modeSelect) {
                    modeSelect.classList.add('hidden');
                }
            }
        } else {
            restoreSection.classList.add('hidden');
            normalStartSection.classList.remove('hidden');
            if (modeSelect) {
                modeSelect.classList.remove('hidden');
            }
        }
    }
    
    restoreGame() {
        const savedState = this.game.loadGameState();
        if (!savedState) return;
        
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        
        this.game.restoreGameState(savedState);
    }
    
    setupUIListeners() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = parseInt(btn.dataset.mode);
                this.game.setMode(mode);
                this.game.updateHighScoreDisplay();
            });
        });
        
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame(false);
            });
        }
        
        const endlessBtn = document.getElementById('endless-btn');
        if (endlessBtn) {
            endlessBtn.addEventListener('click', () => {
                this.startGame(true);
            });
        }
        
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.pauseGame();
            });
        }
        
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.resumeGame();
            });
        }
        
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.returnToMenu();
            });
        }
        
        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        const backMenuBtn = document.getElementById('back-menu-btn');
        if (backMenuBtn) {
            backMenuBtn.addEventListener('click', () => {
                this.returnToMenu();
            });
        }
        
        const restoreBtn = document.getElementById('restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                this.restoreGame();
            });
        }
        
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.game.clearSavedState();
                this.checkSavedState();
            });
        }
    }
    
    startGame(endless = false) {
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        
        this.game.startGame(endless);
    }
    
    pauseGame() {
        this.game.pauseGame();
        document.getElementById('pause-menu').classList.remove('hidden');
    }
    
    resumeGame() {
        document.getElementById('pause-menu').classList.add('hidden');
        this.game.resumeGame();
    }
    
    restartGame() {
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('gameover-menu').classList.add('hidden');
        
        this.game.startGame(this.game.isEndlessMode);
    }
    
    returnToMenu() {
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('gameover-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('start-menu').classList.remove('hidden');
        
        this.game.returnToMenu();
        this.checkSavedState();
    }
    
    showGameOver() {
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('gameover-menu').classList.remove('hidden');
    }
}

const originalGameOver = Game.prototype.gameOver;
Game.prototype.gameOver = function() {
    originalGameOver.call(this);
    
    const gameUI = document.getElementById('game-ui');
    const gameoverMenu = document.getElementById('gameover-menu');
    
    if (gameUI) {
        gameUI.classList.add('hidden');
    }
    if (gameoverMenu) {
        gameoverMenu.classList.remove('hidden');
    }
};

const originalPauseGame = Game.prototype.pauseGame;
Game.prototype.pauseGame = function() {
    originalPauseGame.call(this);
    
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.classList.remove('hidden');
    }
};

const originalResumeGame = Game.prototype.resumeGame;
Game.prototype.resumeGame = function() {
    originalResumeGame.call(this);
    
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.classList.add('hidden');
    }
};

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
