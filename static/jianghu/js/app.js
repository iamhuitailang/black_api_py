document.addEventListener('DOMContentLoaded', () => {
  InputManager.init();
  UIManager.init();

  window.addEventListener('beforeunload', () => {
    if (Game.isRunning) {
      Game.saveState();
    }
  });

  window.addEventListener('unload', () => {
    Game.stop();
  });
});
