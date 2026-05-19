const Game = {
  canvas: null,
  lastTime: 0,
  animationId: null,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    Renderer.init(this.canvas);
    GameState.init();
    UI.init();

    this.bindEvents();
    this.gameLoop();

    window.addEventListener('beforeunload', () => {
      GameState.save();
    });

    setInterval(() => {
      if (GameState.state.isGameStarted && !GameState.state.isPaused) {
        GameState.save();
      }
    }, 5000);
  },

  bindEvents() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      Renderer.handleClick(x, y);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      Renderer.handleMouseMove(x, y);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (GameState.state.showShop) {
          GameState.toggleShop();
        } else if (GameState.state.isGameStarted) {
          GameState.togglePause();
        }
      }
      if (e.key === '1') GameState.setTool('hand');
      if (e.key === '2') GameState.setTool('water');
      if (e.key === '3') GameState.setTool('fertilizer');
      if (e.key === '4') GameState.setTool('ripening');
      if (e.key === '5') GameState.setTool('shovel');
    });
  },

  gameLoop(currentTime = 0) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (GameState.state.isGameStarted && !GameState.state.isPaused) {
      Farm.update(deltaTime);
    }

    Renderer.render();

    if (!GameState.state.isGameStarted) {
      Renderer.drawStartScreen();
    } else if (GameState.state.isPaused && GameState.state.showMenu) {
      Renderer.drawPauseMenu();
    }

    this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});

window.Game = Game;
