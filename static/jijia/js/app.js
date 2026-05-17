const game = new Game();

document.addEventListener('DOMContentLoaded', () => {
    game.init();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'playing') {
        game.saveState();
    }
});

window.addEventListener('beforeunload', () => {
    if (game.state === 'playing') {
        game.saveState();
    }
});

window.addEventListener('pagehide', () => {
    if (game.state === 'playing') {
        game.saveState();
    }
});