const App = {
  game: null,
  selectedMode: Constants.GAME_MODE.SINGLE,
  selectedDifficulty: 'EASY',
  lastTime: 0,
  animationId: null,
  autoSaveInterval: null,
  
  init() {
    Renderer.init('gameCanvas');
    Input.init();
    this.game = new Game();
    
    const savedState = Storage.loadGameState();
    if (savedState && savedState.state !== Constants.GAME_STATE.MENU) {
      this.game.deserialize(savedState);
      if (this.game.state === Constants.GAME_STATE.PLAYING) {
        this.game.state = Constants.GAME_STATE.PAUSED;
      }
    }
    
    this.selectedMode = Constants.GAME_MODE.SINGLE;
    this.selectedDifficulty = 'EASY';
    
    this.bindEvents();
    this.startGameLoop();
    this.startAutoSave();
  },
  
  bindEvents() {
    Input.onKeyDown((code) => {
      if (this.game.state === Constants.GAME_STATE.MENU) {
        this.handleMenuInput(code);
      } else {
        this.handleGameInput(code);
      }
    });
    
    Renderer.canvas.addEventListener('click', () => {
      if (this.game.state === Constants.GAME_STATE.MENU) {
        this.startGame();
      }
    });
    
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });
  },
  
  handleMenuInput(code) {
    const modes = [Constants.GAME_MODE.SINGLE, Constants.GAME_MODE.VERSUS];
    const difficulties = ['EASY', 'MEDIUM', 'HARD', 'HELL'];
    
    let currentIndex = modes.indexOf(this.selectedMode);
    if (currentIndex === -1) {
      this.selectedMode = Constants.GAME_MODE.SINGLE;
      currentIndex = 0;
    }
    
    let diffIndex = difficulties.indexOf(this.selectedDifficulty);
    if (diffIndex === -1) {
      this.selectedDifficulty = 'EASY';
      diffIndex = 0;
    }
    
    if (code === 'ArrowUp' || code === 'ArrowDown') {
      const newIndex = code === 'ArrowUp' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(modes.length - 1, currentIndex + 1);
      this.selectedMode = modes[newIndex];
    } else if (code === 'ArrowLeft' || code === 'ArrowRight') {
      const newIndex = code === 'ArrowLeft'
        ? Math.max(0, diffIndex - 1)
        : Math.min(difficulties.length - 1, diffIndex + 1);
      this.selectedDifficulty = difficulties[newIndex];
    } else if (code === 'Space') {
      this.startGame();
    }
  },
  
  handleGameInput(code) {
    if (code === 'Escape') {
      if (this.game.state === Constants.GAME_STATE.PLAYING) {
        this.game.pause();
      } else if (this.game.state === Constants.GAME_STATE.PAUSED) {
        this.game.resume();
      }
      return;
    }
    
    if (this.game.state === Constants.GAME_STATE.PAUSED || this.game.state === Constants.GAME_STATE.FINISHED) {
      if (code === 'KeyR') {
        this.game.restart();
      } else if (code === 'KeyQ') {
        this.game.goToMenu();
        this.selectedMode = Constants.GAME_MODE.SINGLE;
        this.selectedDifficulty = 'EASY';
      }
      return;
    }
    
    this.game.handleKey(code);
  },
  
  startGame() {
    Storage.clearGameState();
    this.game.init(this.selectedMode, this.selectedDifficulty);
  },
  
  startGameLoop() {
    const loop = (timestamp) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;
      
      if (this.game.state !== Constants.GAME_STATE.MENU && 
          this.game.state !== Constants.GAME_STATE.PAUSED) {
        this.game.update(deltaTime);
      }
      
      Renderer.render(this.game, this.selectedMode, this.selectedDifficulty);
      
      this.animationId = requestAnimationFrame(loop);
    };
    
    this.animationId = requestAnimationFrame(loop);
  },
  
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.saveState();
    }, 1000);
  },
  
  saveState() {
    if (this.game.state !== Constants.GAME_STATE.MENU) {
      const state = this.game.serialize();
      Storage.saveGameState(state);
    }
  },
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveState();
    Input.clear();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
