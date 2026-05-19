(() => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    const game = new Game(canvas);
    
    window.addEventListener('beforeunload', (e) => {
        if (game.state === CONFIG.GAME_STATE.PLAYING || game.state === CONFIG.GAME_STATE.PAUSED) {
            game.saveGameState();
        }
    });
    
    window.addEventListener('pagehide', (e) => {
        if (game.state === CONFIG.GAME_STATE.PLAYING || game.state === CONFIG.GAME_STATE.PAUSED) {
            game.saveGameState();
        }
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.state === CONFIG.GAME_STATE.PLAYING) {
            game.pauseGame();
        }
    });
    
    window.game = game;
})();
