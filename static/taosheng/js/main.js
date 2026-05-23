let input = null;
let menuManager = null;
let gameEngine = null;

function init() {
    const canvas = document.getElementById('game-canvas');
    
    input = new InputManager();
    menuManager = new MenuManager();
    gameEngine = new GameEngine(canvas);
    
    updateContinueButton();
    setupMenuButtons();
    setupKeyboardShortcuts();
    
    menuManager.showStartMenu();
}

function updateContinueButton() {
    const btnContinue = document.getElementById('btn-continue');
    if (Storage.hasSavedGame()) {
        btnContinue.style.display = 'block';
    } else {
        btnContinue.style.display = 'none';
    }
}

function setupMenuButtons() {
    document.getElementById('btn-start').addEventListener('click', () => {
        const sceneIndex = menuManager.getSelectedScene();
        gameEngine.startNewGame(sceneIndex);
        menuManager.hideAllMenus();
    });
    
    document.getElementById('btn-continue').addEventListener('click', () => {
        if (gameEngine.continueGame()) {
            menuManager.hideAllMenus();
        }
    });
    
    document.getElementById('btn-records').addEventListener('click', () => {
        menuManager.showRecordsMenu();
    });
    
    document.getElementById('btn-help').addEventListener('click', () => {
        menuManager.showHelpMenu();
    });
    
    document.getElementById('btn-back-from-records').addEventListener('click', () => {
        menuManager.showStartMenu();
        updateContinueButton();
    });
    
    document.getElementById('btn-back-from-help').addEventListener('click', () => {
        menuManager.showStartMenu();
    });
    
    document.getElementById('btn-resume').addEventListener('click', () => {
        gameEngine.resumeGame();
        menuManager.hideAllMenus();
    });
    
    document.getElementById('btn-save').addEventListener('click', () => {
        gameEngine.saveGameState();
        const btnSave = document.getElementById('btn-save');
        const originalText = btnSave.textContent;
        btnSave.textContent = '已保存！';
        setTimeout(() => {
            btnSave.textContent = originalText;
        }, 1500);
    });
    
    document.getElementById('btn-quit').addEventListener('click', () => {
        gameEngine.quitGame();
        menuManager.showStartMenu();
        updateContinueButton();
    });
    
    document.getElementById('btn-retry').addEventListener('click', () => {
        const sceneIndex = menuManager.getSelectedScene();
        gameEngine.startNewGame(sceneIndex);
        menuManager.hideAllMenus();
    });
    
    document.getElementById('btn-menu').addEventListener('click', () => {
        menuManager.showStartMenu();
        updateContinueButton();
    });
    
    document.getElementById('btn-next').addEventListener('click', () => {
        const sceneIndex = menuManager.getSelectedScene();
        gameEngine.startNewGame(sceneIndex);
        menuManager.hideAllMenus();
    });
    
    document.getElementById('btn-menu-v').addEventListener('click', () => {
        menuManager.showStartMenu();
        updateContinueButton();
    });
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (gameEngine.state === 'playing') {
                gameEngine.pauseGame();
                menuManager.showPauseMenu();
            } else if (gameEngine.state === 'paused') {
                gameEngine.resumeGame();
                menuManager.hideAllMenus();
            }
        }
    });
}

window.addEventListener('load', init);

window.addEventListener('beforeunload', () => {
    if (gameEngine && gameEngine.state === 'playing') {
        gameEngine.saveGameState();
    }
});
