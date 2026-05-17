document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const game = new Game(canvas);

    UI.setMenuButtonHandlers({
        onStart: () => {
            UI.showScreen('character');
        },
        onContinue: () => {
            game.continueGame();
        },
        onStartGame: () => {
            game.startNewGame();
        },
        onResume: () => {
            game.resume();
        },
        onRestart: () => {
            game.restartLevel();
        },
        onQuit: () => {
            game.quitToMenu();
        },
        onRetry: () => {
            game.restart();
        },
        onNextLevel: () => {
            game.nextLevel();
        },
        onPause: () => {
            game.pause();
        }
    });

    UI.onCharacterSelect = (character) => {
        game.selectedCharacter = character;
    };

    UI.onModeSelect = (mode) => {
        game.mode = mode;
    };

    UI.onDifficultySelect = (difficulty) => {
        game.difficulty = difficulty;
    };

    UI.onLevelSelect = (levelId) => {
        game.currentLevel = levelId;
        game.createPlayers();
        game.loadLevel(levelId);
        game.state = 'playing';
        game.subState = null;
        UI.hideAllScreens();
        UI.showHUD();
        Audio.playStart();
    };

    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }
        
        if (e.key === 'Enter' && game.state === 'menu' && UI.currentScreen === 'menu') {
            UI.showScreen('character');
            Audio.playMenuSelect();
        }
        
        if (e.key === 'Escape') {
            if (UI.currentScreen === 'howto' || UI.currentScreen === 'character' || UI.currentScreen === 'level') {
                UI.showScreen('menu');
                Audio.playMenuSelect();
            }
        }
        
        if (e.key === 'Backspace') {
            if (UI.currentScreen === 'howto' || UI.currentScreen === 'character' || UI.currentScreen === 'level') {
                UI.showScreen('menu');
                Audio.playMenuSelect();
                e.preventDefault();
            }
        }
    });

    window.addEventListener('blur', () => {
        if (game.state === 'playing') {
            game.pause();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (game.state === 'playing' || game.state === 'paused') {
            game.saveGame();
        }
    });

    game.start();
});
