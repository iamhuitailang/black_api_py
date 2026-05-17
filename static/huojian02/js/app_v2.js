import { Game } from './game_v2.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const uiContainer = document.getElementById('ui-container');
    const game = new Game(canvas, uiContainer);
    game.init();
});
