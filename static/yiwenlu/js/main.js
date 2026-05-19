import { Game } from './game.js';
import { UIManager } from './ui.js';
import { Renderer } from './renderer.js';
import { Storage } from './storage.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const renderer = new Renderer(canvas);
    
    const game = new Game(canvas, null, renderer);
    const ui = new UIManager(game);
    game.ui = ui;
    
    game.init();
    
    window.addEventListener('beforeunload', () => {
        if (game.state === 'playing') {
            Storage.save(game);
        }
    });
});

