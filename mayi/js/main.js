document.addEventListener('DOMContentLoaded', () => {
    Game.init();
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (GameState.isRunning && !GameState.isGameOver) {
                Game.togglePause();
            }
        }
        if (e.key === ' ' && GameState.isRunning && !GameState.isPaused && !GameState.isGameOver) {
            e.preventDefault();
            UISystem.toggleSpeed();
        }
    });
    
    window.addEventListener('beforeunload', () => {
        if (GameState.isRunning && !GameState.isGameOver) {
            Game.saveGame();
        }
    });
    
    setInterval(() => {
        if (GameState.isRunning && !GameState.isPaused && !GameState.isGameOver) {
            Game.saveGame();
        }
    }, 10000);
});
