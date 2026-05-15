document.addEventListener('DOMContentLoaded', () => {
    Input.init();
    Renderer.init();
    
    window.game = new Game();
    window.game.init();
    
    document.getElementById('start-btn').addEventListener('click', () => {
        window.game.startGame();
    });
    
    document.getElementById('continue-btn').addEventListener('click', () => {
        window.game.continueGame();
    });
    
    document.getElementById('char-select-btn').addEventListener('click', () => {
        window.game.showScreen('character-select');
    });
    
    document.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('click', () => {
            window.game.selectCharacter(card.dataset.char);
        });
    });
    
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        window.game.showScreen('main-menu');
    });
    
    document.getElementById('pause-btn').addEventListener('click', () => {
        window.game.pause();
    });
    
    document.getElementById('resume-btn').addEventListener('click', () => {
        window.game.resume();
    });
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        window.game.restart();
    });
    
    document.getElementById('quit-btn').addEventListener('click', () => {
        window.game.quitToMenu();
    });
    
    document.getElementById('replay-btn').addEventListener('click', () => {
        window.game.restart();
    });
    
    document.getElementById('menu-btn').addEventListener('click', () => {
        window.game.quitToMenu();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (window.game.state === GAME_STATE.PLAYING) {
                window.game.pause();
            } else if (window.game.state === GAME_STATE.PAUSED) {
                window.game.resume();
            }
        }
    });
});
