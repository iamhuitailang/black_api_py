import { GAME_STATE } from './constants.js';
import { getLevel, LEVELS } from './levels.js';
import { Physics } from './physics.js';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { UIManager } from './ui.js';
import { StorageManager } from './storage.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.physics = new Physics();
        this.renderer = new Renderer(this.canvas);
        this.input = new InputManager();
        this.ui = new UIManager();
        this.storage = new StorageManager();

        this.currentLevel = 1;
        this.gameState = GAME_STATE.MENU;
        this.elapsedTime = 0;
        this.lastTime = 0;
        this.unlockedLevels = 1;

        this.init();
    }

    init() {
        const levelData = getLevel(this.currentLevel);
        this.physics.initLevel(levelData);

        this.ui.bindButtonEvents({
            onStart: () => this.startGame(),
            onSelectLevel: () => this.showLevelSelect(),
            onResume: () => this.resumeGame(),
            onRestart: () => this.restartLevel(),
            onExit: () => this.exitToMenu(),
            onBack: () => this.showStartMenu(),
            onNextLevel: () => this.nextLevel(),
            onReplay: () => this.restartLevel(),
            onPlayAgain: () => this.exitToMenu(),
            onPause: () => this.pauseGame(),
            onLevelSelect: (levelId) => this.selectLevel(levelId),
        });
        
        this.loadProgress();
        this.ui.showMenu('start');
        this.gameLoop(0);
    }

    loadProgress() {
        try {
            const progress = this.storage.loadProgress() || {};
            this.unlockedLevels = Math.max(1, Object.keys(progress).length + 1);
            this.ui.populateLevelSelect(progress, this.unlockedLevels);

            const savedGame = this.storage.loadGame();
            if (savedGame && savedGame.gameState === GAME_STATE.PAUSED && savedGame.physicsState) {
                this.currentLevel = savedGame.currentLevel || 1;
                this.elapsedTime = savedGame.elapsedTime || 0;
                const levelData = getLevel(this.currentLevel);
                if (levelData) {
                    this.physics.initLevel(levelData);
                    this.physics.restoreState(savedGame.physicsState);
                    this.gameState = GAME_STATE.PAUSED;
                    this.ui.showMenu('pause');
                }
            }
        } catch (e) {
            console.error('Error loading progress:', e);
            this.storage.clearGame();
        }
    }

    startGame() {
        this.currentLevel = 1;
        this.elapsedTime = 0;
        this.initLevel();
        this.gameState = GAME_STATE.PLAYING;
        this.ui.showMenu(null);
    }

    showLevelSelect() {
        const progress = this.storage.loadProgress() || {};
        this.ui.populateLevelSelect(progress, this.unlockedLevels);
        this.ui.showMenu('levelSelect');
    }

    showStartMenu() {
        this.ui.showMenu('start');
    }

    selectLevel(levelId) {
        this.currentLevel = levelId;
        this.elapsedTime = 0;
        this.initLevel();
        this.gameState = GAME_STATE.PLAYING;
        this.ui.showMenu(null);
    }

    initLevel() {
        const levelData = getLevel(this.currentLevel);
        this.physics.initLevel(levelData);
        this.input.reset();
    }

    pauseGame() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            this.ui.showMenu('pause');
            this.saveGameState();
        }
    }

    resumeGame() {
        this.gameState = GAME_STATE.PLAYING;
        this.ui.showMenu(null);
    }

    restartLevel() {
        this.elapsedTime = 0;
        this.initLevel();
        this.gameState = GAME_STATE.PLAYING;
        this.ui.showMenu(null);
    }

    exitToMenu() {
        this.gameState = GAME_STATE.MENU;
        this.storage.clearGame();
        this.ui.showMenu('start');
    }

    nextLevel() {
        if (this.currentLevel < LEVELS.length) {
            this.currentLevel++;
            this.elapsedTime = 0;
            this.initLevel();
            this.gameState = GAME_STATE.PLAYING;
            this.ui.showMenu(null);
        } else {
            this.gameState = GAME_STATE.COMPLETE;
            this.ui.showMenu('complete');
        }
    }

    handleWin(starsCollected) {
        this.gameState = GAME_STATE.WIN;
        this.storage.saveProgress(this.currentLevel, starsCollected, this.elapsedTime);
        
        if (this.currentLevel >= this.unlockedLevels && this.currentLevel < LEVELS.length) {
            this.unlockedLevels = this.currentLevel + 1;
        }

        this.ui.updateWinScreen(starsCollected, this.elapsedTime);
        this.ui.showMenu('win');
        this.storage.clearGame();
    }

    handleTrap() {
        this.initLevel();
    }

    saveGameState() {
        const gameState = {
            currentLevel: this.currentLevel,
            elapsedTime: this.elapsedTime,
            gameState: this.gameState,
            physicsState: this.physics.getState(),
        };
        this.storage.saveGame(gameState);
    }

    update(deltaTime) {
        if (this.gameState !== GAME_STATE.PLAYING) return;

        this.elapsedTime += deltaTime / 1000;

        const tilt = this.input.update();
        this.physics.setTilt(tilt.x, tilt.y);
        
        const result = this.physics.update();

        const levelData = getLevel(this.currentLevel);
        this.ui.updateHUD(
            this.currentLevel,
            result.stars || 0,
            levelData.stars.length,
            this.elapsedTime
        );

        if (result.type === 'win') {
            this.handleWin(result.stars);
        } else if (result.type === 'trap') {
            this.handleTrap();
        }
    }

    render() {
        const levelData = getLevel(this.currentLevel);
        this.renderer.render(this.physics, levelData);
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

window.addEventListener('load', () => {
    console.log('Page fully loaded, initializing game...');
    new Game();
    console.log('Game initialized!');
});
