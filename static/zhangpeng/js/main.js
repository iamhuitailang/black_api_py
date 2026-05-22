window.addEventListener('load', () => {
  const game = new Game();
  game.init();
  window.__game = game;
});
