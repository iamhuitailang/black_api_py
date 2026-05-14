document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    UI.init();

    const game = new Game(canvas);

    UI.setCallbacks({
        onStart: () => {
            game.start();
        },
        onResume: () => {
            game.resume();
        },
        onRestart: () => {
            game.restart();
        },
        onQuit: () => {
            game.quit();
        },
        onPause: () => {
            game.pause();
        }
    });

    const hasSavedState = Storage.hasSavedState();
    if (hasSavedState) {
        const savedState = Storage.loadState();
        if (savedState && savedState.gameState === 'playing') {
            if (confirm('检测到未完成的游戏进度，是否继续？')) {
                game.loadSavedState();
                UI.showScreen('playing');
                game.lastTime = performance.now();
                game.gameLoop();
            }
        }
    }

    window.addEventListener('beforeunload', (e) => {
        if (game.gameState === 'playing' && !game.isPaused) {
            Storage.saveGame(game);
            e.preventDefault();
            e.returnValue = '';
        }
    });

    console.log('🏴‍☠️ 铁钩船长游戏已加载完成！');
});
