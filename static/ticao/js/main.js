window.addEventListener('DOMContentLoaded', () => {
    Game.init();
    
    if (Storage.hasSavedGame()) {
        if (confirm('检测到未完成的游戏进度，是否继续？')) {
            Game.handleContinueGame();
        }
    }
    
    window.addEventListener('beforeunload', () => {
        if (Storage.hasSavedGame()) {
            Game.saveProgress();
        }
    });
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (Game.isRunning && !Game.isPaused) {
                Game.handlePause();
            } else if (Game.isPaused) {
                Game.handleResume();
            }
        }
    });
    
    window.addEventListener('resize', () => {
        Renderer.resize();
    });
    
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });
});
