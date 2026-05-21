document.addEventListener('DOMContentLoaded', function() {
    Game.init();
    
    window.addEventListener('beforeunload', function() {
        const state = Game.getState();
        if (state.gameState === 'playing') {
        }
    });
});
