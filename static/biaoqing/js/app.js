class App {
    constructor() {
        this.game = new Game();
        this.selectedChar = null;
        this.hasSavedState = false;
        
        this.initElements();
        this.initEventListeners();
        this.checkSavedState();
    }

    initElements() {
        this.mainMenu = document.getElementById('main-menu');
        this.characterSelect = document.getElementById('character-select');
        this.pauseMenu = document.getElementById('pause-menu');
        this.victoryScreen = document.getElementById('victory-screen');
        this.defeatScreen = document.getElementById('defeat-screen');
        this.hud = document.getElementById('hud');
        this.controlsHint = document.getElementById('controls-hint');
        
        this.startBtn = document.getElementById('startBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.confirmCharBtn = document.getElementById('confirmCharBtn');
        this.backToMenuBtn = document.getElementById('backToMenuBtn');
        this.resumeGameBtn = document.getElementById('resumeGameBtn');
        this.restartGameBtn = document.getElementById('restartGameBtn');
        this.exitGameBtn = document.getElementById('exitGameBtn');
        this.nextRoundBtn = document.getElementById('nextRoundBtn');
        this.backToMenuFromVictory = document.getElementById('backToMenuFromVictory');
        this.retryBtn = document.getElementById('retryBtn');
        this.backToMenuFromDefeat = document.getElementById('backToMenuFromDefeat');
        this.pauseBtn = document.getElementById('pauseBtn');
        
        this.characterCards = document.querySelectorAll('.character-card');
        this.playerHealthBar = document.getElementById('playerHealth');
        this.enemyHealthBar = document.getElementById('enemyHealth');
        this.playerNameEl = document.getElementById('playerName');
        this.enemyNameEl = document.getElementById('enemyName');
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.showCharacterSelect());
        this.resumeBtn.addEventListener('click', () => this.resumeGame());
        
        this.characterCards.forEach(card => {
            card.addEventListener('click', () => this.selectCharacter(card));
        });
        
        this.confirmCharBtn.addEventListener('click', () => this.startGame());
        this.backToMenuBtn.addEventListener('click', () => this.showMainMenu());
        
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.resumeGameBtn.addEventListener('click', () => this.togglePause());
        this.restartGameBtn.addEventListener('click', () => this.restartGame());
        this.exitGameBtn.addEventListener('click', () => this.exitGame());
        
        this.nextRoundBtn.addEventListener('click', () => this.nextRound());
        this.backToMenuFromVictory.addEventListener('click', () => this.showMainMenu());
        
        this.retryBtn.addEventListener('click', () => this.nextRound());
        this.backToMenuFromDefeat.addEventListener('click', () => this.showMainMenu());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.game.isRunning) {
                this.togglePause();
            }
        });
        
        this.game.onWin = () => this.showVictory();
        this.game.onLose = () => this.showDefeat();
    }

    checkSavedState() {
        this.hasSavedState = storage.hasSavedState();
        this.resumeBtn.style.display = this.hasSavedState ? 'block' : 'none';
    }

    showMainMenu() {
        this.hideAllMenus();
        this.mainMenu.style.display = 'flex';
        this.hud.style.display = 'none';
        this.controlsHint.style.display = 'none';
        
        this.game.stop();
        storage.clearGameState();
        this.checkSavedState();
    }

    showCharacterSelect() {
        this.hideAllMenus();
        this.characterSelect.style.display = 'flex';
        this.selectedChar = null;
        this.confirmCharBtn.style.display = 'none';
        
        this.characterCards.forEach(card => {
            card.classList.remove('selected');
        });
    }

    selectCharacter(card) {
        this.characterCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedChar = card.dataset.char;
        this.confirmCharBtn.style.display = 'block';
    }

    startGame() {
        if (!this.selectedChar) return;
        
        this.hideAllMenus();
        this.hud.style.display = 'flex';
        this.controlsHint.style.display = 'flex';
        
        this.game.init(this.selectedChar);
        this.game.start();
        
        this.updateHealthBars();
        this.startHealthUpdateLoop();
        
        this.playerNameEl.textContent = this.game.player.name;
        this.enemyNameEl.textContent = this.game.enemy.name;
    }

    resumeGame() {
        const savedState = storage.loadGameState();
        if (!savedState) return;
        
        this.hideAllMenus();
        this.hud.style.display = 'flex';
        this.controlsHint.style.display = 'flex';
        
        this.game.loadSavedState(savedState);
        this.game.start();
        
        this.updateHealthBars();
        this.startHealthUpdateLoop();
        
        this.playerNameEl.textContent = this.game.player.name;
        this.enemyNameEl.textContent = this.game.enemy.name;
    }

    togglePause() {
        if (this.game.isPaused) {
            this.pauseMenu.style.display = 'none';
            this.game.resume();
        } else {
            this.game.pause();
            this.pauseMenu.style.display = 'flex';
        }
    }

    restartGame() {
        this.pauseMenu.style.display = 'none';
        this.game.restart();
        this.updateHealthBars();
    }

    exitGame() {
        storage.saveGameState(this.game);
        this.showMainMenu();
    }

    showVictory() {
        this.hideAllMenus();
        this.victoryScreen.style.display = 'flex';
        this.controlsHint.style.display = 'none';
        storage.clearGameState();
    }

    showDefeat() {
        this.hideAllMenus();
        this.defeatScreen.style.display = 'flex';
        this.controlsHint.style.display = 'none';
        storage.clearGameState();
    }

    nextRound() {
        this.hideAllMenus();
        this.hud.style.display = 'flex';
        this.controlsHint.style.display = 'flex';
        
        this.game.restart();
        this.updateHealthBars();
    }

    hideAllMenus() {
        this.mainMenu.style.display = 'none';
        this.characterSelect.style.display = 'none';
        this.pauseMenu.style.display = 'none';
        this.victoryScreen.style.display = 'none';
        this.defeatScreen.style.display = 'none';
    }

    startHealthUpdateLoop() {
        const updateLoop = () => {
            if (this.game.isRunning) {
                this.updateHealthBars();
                requestAnimationFrame(updateLoop);
            }
        };
        updateLoop();
    }

    updateHealthBars() {
        this.playerHealthBar.style.width = `${this.game.getPlayerHealthPercent()}%`;
        this.enemyHealthBar.style.width = `${this.game.getEnemyHealthPercent()}%`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});