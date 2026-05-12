window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    if (Storage.hasSavedGame()) {
        game.startGame(true);
    } else {
        game.ui.showStartScreen();
    }
});
