const UIManager = {
  elements: {},

  init() {
    this.cacheElements();
    this.bindEvents();
    this.showStartScreen();
  },

  cacheElements() {
    this.elements = {
      startScreen: document.getElementById('startScreen'),
      gameScreen: document.getElementById('gameScreen'),
      pauseScreen: document.getElementById('pauseScreen'),
      gameOverScreen: document.getElementById('gameOverScreen'),
      characterSelect: document.getElementById('characterSelect'),
      aiSelect: document.getElementById('aiSelect'),
      startBtn: document.getElementById('startBtn'),
      continueBtn: document.getElementById('continueBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      resumeBtn: document.getElementById('resumeBtn'),
      restartBtn: document.getElementById('restartBtn'),
      quitBtn: document.getElementById('quitBtn'),
      nextRoundBtn: document.getElementById('nextRoundBtn'),
      gameOverRestartBtn: document.getElementById('gameOverRestartBtn'),
      gameOverQuitBtn: document.getElementById('gameOverQuitBtn'),
      winnerText: document.getElementById('winnerText'),
      canvas: document.getElementById('gameCanvas'),
      controlsHelp: document.getElementById('controlsHelp'),
      toggleControlsBtn: document.getElementById('toggleControlsBtn')
    };
  },

  bindEvents() {
    this.elements.startBtn.addEventListener('click', () => this.onStartGame());
    this.elements.continueBtn.addEventListener('click', () => this.onContinueGame());
    this.elements.pauseBtn.addEventListener('click', () => this.onPause());
    this.elements.resumeBtn.addEventListener('click', () => this.onResume());
    this.elements.restartBtn.addEventListener('click', () => this.onRestart());
    this.elements.quitBtn.addEventListener('click', () => this.onQuit());
    this.elements.nextRoundBtn.addEventListener('click', () => this.onNextRound());
    this.elements.gameOverRestartBtn.addEventListener('click', () => this.onRestart());
    this.elements.gameOverQuitBtn.addEventListener('click', () => this.onQuit());
    this.elements.toggleControlsBtn.addEventListener('click', () => this.toggleControls());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && Game.isRunning && !Game.isGameOver) {
        if (Game.isPaused) {
          this.onResume();
        } else {
          this.onPause();
        }
      }
    });

    this.populateCharacterSelect();
  },

  populateCharacterSelect() {
    const characters = CONFIG.CHARACTERS;

    Object.values(characters).forEach(char => {
      const option = document.createElement('option');
      option.value = char.id;
      option.textContent = `${char.name} - ${char.type}`;
      this.elements.characterSelect.appendChild(option.cloneNode(true));
      this.elements.aiSelect.appendChild(option);
    });

    if (StorageManager.hasSavedState()) {
      const saved = StorageManager.load();
      if (saved) {
        this.elements.characterSelect.value = saved.selectedCharacter || 'jinyiwei';
        this.elements.aiSelect.value = saved.selectedAI || 'langzi';
        this.elements.continueBtn.style.display = 'inline-block';
      }
    }
  },

  showStartScreen() {
    this.elements.startScreen.style.display = 'flex';
    this.elements.gameScreen.style.display = 'none';
    this.elements.pauseScreen.style.display = 'none';
    this.elements.gameOverScreen.style.display = 'none';
  },

  showGameScreen() {
    this.elements.startScreen.style.display = 'none';
    this.elements.gameScreen.style.display = 'block';
    this.elements.pauseScreen.style.display = 'none';
    this.elements.gameOverScreen.style.display = 'none';
  },

  showPauseScreen() {
    this.elements.pauseScreen.style.display = 'flex';
  },

  hidePauseScreen() {
    this.elements.pauseScreen.style.display = 'none';
  },

  showGameOverScreen(winner) {
    this.elements.winnerText.textContent = winner === 'player' ? '恭喜获胜！' : '遗憾落败...';
    this.elements.gameOverScreen.style.display = 'flex';
  },

  hideGameOverScreen() {
    this.elements.gameOverScreen.style.display = 'none';
  },

  onStartGame() {
    const playerChar = this.elements.characterSelect.value;
    const aiChar = this.elements.aiSelect.value;

    this.resetGameOverFlag();
    Game.init(this.elements.canvas);
    Game.startNewGame(playerChar, aiChar);
    this.showGameScreen();
  },

  onContinueGame() {
    this.resetGameOverFlag();
    Game.init(this.elements.canvas);
    Game.continueGame();
    this.showGameScreen();
  },

  onPause() {
    Game.pause();
    this.showPauseScreen();
  },

  onResume() {
    Game.resume();
    this.hidePauseScreen();
  },

  onRestart() {
    this.hidePauseScreen();
    this.hideGameOverScreen();
    this.resetGameOverFlag();
    Game.restartGame();
  },

  onQuit() {
    Game.stop();
    this.hidePauseScreen();
    this.hideGameOverScreen();
    this.showStartScreen();

    if (StorageManager.hasSavedState()) {
      this.elements.continueBtn.style.display = 'inline-block';
    }
  },

  onNextRound() {
    this.hideGameOverScreen();
    this.resetGameOverFlag();
    Game.resetRound();
  },

  toggleControls() {
    const help = this.elements.controlsHelp;
    help.style.display = help.style.display === 'none' ? 'block' : 'none';
  },

  gameOverShown: false,

  updateGameState() {
    if (Game.isGameOver && Game.winner && !this.gameOverShown) {
      this.gameOverShown = true;
      setTimeout(() => {
        this.showGameOverScreen(Game.winner);
      }, 1000);
    }
  },

  resetGameOverFlag() {
    this.gameOverShown = false;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
