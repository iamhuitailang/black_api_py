import { Game } from './game.js';

var game = null;

window.addEventListener('load', function() {
    var canvas = document.getElementById('game-canvas');
    game = new Game(canvas);

    window.addEventListener('keydown', function(e) {
        if (e.code === 'Escape' && game && game.isRunning) {
            game.togglePause();
        }
    });

    window.addEventListener('beforeunload', function() {
        if (game && game.isRunning) {
            game.saveGame();
        }
    });
});
