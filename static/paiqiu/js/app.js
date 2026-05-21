const App = {
    init() {
        Storage.init();
        Renderer.init();
        Input.init();
        UI.init();
        GameEngine.init();
        
        this.bindEvents();
        
        if (!GameEngine.loadSavedGame()) {
            UI.showMainMenu();
        }
    },

    bindEvents() {
        UI.on('startGame', (data) => {
            GameEngine.startGame(data.mode, data.opponent);
        });
        
        UI.on('pause', () => {
            GameEngine.pause();
        });
        
        UI.on('resume', () => {
            GameEngine.resume();
        });
        
        UI.on('restart', () => {
            GameEngine.restart();
        });
        
        UI.on('quit', () => {
            GameEngine.quit();
        });
        
        UI.on('rematch', () => {
            GameEngine.restart();
        });
        
        UI.on('backToMenu', () => {
            GameEngine.quit();
        });
        
        Input.on('receive', () => {
            if (GameEngine.isRunning && !GameEngine.isPaused) {
                GameEngine.playerReceive();
            }
        });
        
        Input.on('spike', () => {
            if (GameEngine.isRunning && !GameEngine.isPaused) {
                GameEngine.playerSpike();
            }
        });
        
        Input.on('block', () => {
            if (GameEngine.isRunning && !GameEngine.isPaused) {
                GameEngine.playerBlock();
            }
        });
        
        Input.on('pause', () => {
            if (GameEngine.isRunning) {
                if (GameEngine.isPaused) {
                    UI.resumeGame();
                } else {
                    UI.pauseGame();
                }
            }
        });
        
        window.addEventListener('beforeunload', () => {
            if (GameEngine.isRunning) {
                const saveState = GameEngine.serialize();
                Storage.saveCurrentGame(saveState);
            }
        });
        
        window.addEventListener('resize', () => {
            setTimeout(() => {
                const joystickArea = document.getElementById('joystick-area');
                if (joystickArea) {
                    const rect = joystickArea.getBoundingClientRect();
                    Input.touch.joystick.centerX = rect.left + rect.width / 2;
                    Input.touch.joystick.centerY = rect.top + rect.height / 2;
                }
            }, 100);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
