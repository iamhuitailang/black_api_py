console.log('=== Pan Night Game Loading ===');

document.addEventListener('keydown', (e) => {
    console.log('GLOBAL KEY DOWN:', e.key);
});

document.addEventListener('keyup', (e) => {
    console.log('GLOBAL KEY UP:', e.key);
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    
    try {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }
        console.log('Canvas found:', canvas);
        
        Renderer.init(canvas);
        console.log('Renderer initialized');
        
        Game.init();
        console.log('Game initialized');
        
        const savedState = Storage.loadGameState();
        if (savedState) {
            console.log('Saved state found on startup:', savedState);
        } else {
            console.log('No saved state found on startup');
        }
    } catch (e) {
        console.error('Error during initialization:', e);
    }
});