window.addEventListener('DOMContentLoaded', () => {
    try {
        Game.init();
    } catch (e) {
        console.error('Failed to init game:', e);
        alert('游戏初始化失败，请刷新页面重试');
    }
});

window.addEventListener('beforeunload', (e) => {
    try {
        if (Game && (Game.state === 'playing' || Game.state === 'paused')) {
            Game.saveGame();
        }
    } catch (err) {
        console.error('Failed to save game on unload:', err);
    }
});

window.addEventListener('pagehide', () => {
    try {
        if (Game && (Game.state === 'playing' || Game.state === 'paused')) {
            Game.saveGame();
        }
    } catch (err) {
        console.error('Failed to save game on pagehide:', err);
    }
});

document.addEventListener('visibilitychange', () => {
    try {
        if (document.hidden && Game && (Game.state === 'playing' || Game.state === 'paused')) {
            Game.saveGame();
        }
    } catch (err) {
        console.error('Failed to save game on visibility change:', err);
    }
});
