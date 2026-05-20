window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    
    Renderer.init(canvas);
    Game.init();
    UI.init(Game);
    
    UI.showMenu('start');
    
    Game.lastTime = performance.now();
    Game.gameLoop();
});
