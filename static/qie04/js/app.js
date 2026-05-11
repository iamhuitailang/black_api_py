import { GameEngine } from './core/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    const game = new GameEngine(canvas);
    
    window.addEventListener('beforeunload', () => {
        if (game.isPlaying && game.storage) {
            game.storage.saveGameState(game);
            game.storage.stopAutoSave();
        }
    });
    
    window.addEventListener('resize', () => {
    });
    
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
        }
    });
});
