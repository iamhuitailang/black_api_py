(() => {
    let animationId;
    
    const init = () => {
        const canvas = document.getElementById('game-canvas');
        
        Renderer.init(canvas);
        Input.init();
        UI.init();
        Game.init();
        
        setupEventListeners();
        startMainLoop();
        
        const hasSavedGame = Storage.hasSavedGame();
        UI.showMainMenu(hasSavedGame);
    };
    
    const setupEventListeners = () => {
        UI.onStartClick(() => {
            const characterType = UI.getSelectedCharacter();
            Game.startNewGame(characterType);
            UI.showGameHUD();
        });
        
        UI.onResumeClick(() => {
            if (Game.loadSavedGame()) {
                UI.showGameHUD();
            }
        });
        
        UI.onPauseClick(() => {
            Game.togglePause();
        });
        
        UI.onContinueClick(() => {
            Game.resume();
        });
        
        UI.onRestartClick(() => {
            const characterType = UI.getSelectedCharacter();
            Game.startNewGame(characterType);
            UI.showGameHUD();
        });
        
        UI.onQuitClick(() => {
            Game.saveGame();
            UI.showMainMenu(Storage.hasSavedGame());
        });
        
        UI.onRetryClick(() => {
            const characterType = UI.getSelectedCharacter();
            Game.startNewGame(characterType);
            UI.showGameHUD();
        });
        
        UI.onBackMenuClick(() => {
            UI.showMainMenu(Storage.hasSavedGame());
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && Game.getIsRunning()) {
                Game.togglePause();
            }
        });
        
        window.addEventListener('resize', () => {
            Renderer.resize();
        });
        
        window.addEventListener('beforeunload', () => {
            if (Game.getIsRunning()) {
                Game.saveGame();
            }
        });
    };
    
    const startMainLoop = () => {
        const loop = (timestamp) => {
            Game.gameLoop(timestamp);
            animationId = requestAnimationFrame(loop);
        };
        animationId = requestAnimationFrame(loop);
    };
    
    document.addEventListener('DOMContentLoaded', init);
})();