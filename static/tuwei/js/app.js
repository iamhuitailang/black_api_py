const App = {
    game: null,

    init() {
        const canvas = document.getElementById('gameCanvas');
        this.game = new Game(canvas);
        
        UI.init();
        
        const hasSave = Storage.hasSave();
        UI.showStartScreen(hasSave);
        
        this.bindMenuEvents();
        
        window.addEventListener('beforeunload', () => {
            if (this.game.getState().status === 'playing') {
                this.game.saveGame();
            }
        });
    },

    bindMenuEvents() {
        UI.elements.startBtn.addEventListener('click', () => {
            const playerClass = UI.getSelectedClass();
            this.game.startNewGame(playerClass);
        });

        UI.elements.continueBtn.addEventListener('click', () => {
            const saveData = Storage.load();
            if (saveData) {
                this.game.loadGame(saveData);
            } else {
                const playerClass = UI.getSelectedClass();
                this.game.startNewGame(playerClass);
            }
        });

        UI.elements.resumeBtn.addEventListener('click', () => {
            this.game.resume();
        });

        UI.elements.restartBtn.addEventListener('click', () => {
            const playerClass = UI.getSelectedClass();
            Storage.clear();
            this.game.startNewGame(playerClass);
        });

        UI.elements.quitBtn.addEventListener('click', () => {
            this.game.quitToMenu();
        });

        UI.elements.retryBtn.addEventListener('click', () => {
            const playerClass = UI.getSelectedClass();
            this.game.startNewGame(playerClass);
        });

        UI.elements.backToMenuBtn.addEventListener('click', () => {
            this.game.quitToMenu();
        });
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
