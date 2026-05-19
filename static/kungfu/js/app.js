window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

window.addEventListener('beforeunload', (e) => {
    if (Game && (Game.state === 'playing' || Game.state === 'paused')) {
        Game.saveGame();
    }
});

window.addEventListener('pagehide', () => {
    if (Game && (Game.state === 'playing' || Game.state === 'paused')) {
        Game.saveGame();
    }
});
