let game = null;

window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    
    document.getElementById('start-btn').addEventListener('click', () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        game.resize();
        game.start(false);
    });
    
    document.getElementById('continue-btn').addEventListener('click', () => {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        game.resize();
        game.start(true);
    });
    
    game.updateContinueButton();
});

window.addEventListener('beforeunload', () => {
    if (game && game.isRunning) {
        game.saveGame();
        game.stop();
    }
});
