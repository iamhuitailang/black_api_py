import { GAME_STATES } from './config.js';
import { Character } from './character.js';
import { InputManager } from './input.js';
import { Renderer } from './renderer.js';
import { UIManager } from './ui.js';
import { GameStorage } from './storage.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.input = new InputManager();
        this.ui = new UIManager(this);
        
        this.gameState = GAME_STATES.MENU;
        this.selectedCharType = 'yellow';
        this.player1 = null;
        this.player2 = null;
        
        this.lastTime = 0;
        this.animationId = null;
        this.saveTimer = 0;
        
        this.init();
    }

    init() {
        this.ui.showMainMenu();
        this.tryLoadGame();
    }

    tryLoadGame() {
        const savedState = GameStorage.load();
        if (savedState) {
            console.log('发现存档，可继续游戏');
        }
    }

    startGame(charType) {
        console.log('🚀 开始游戏，选择角色:', charType);
        this.selectedCharType = charType;
        this.player1 = new Character(charType, 300, true);
        this.player2 = new Character('black', 900, false);
        
        this.gameState = GAME_STATES.PLAYING;
        this.ui.hideAll();
        this.ui.showHud();
        
        this.saveGame();
        this.startGameLoop();
        console.log('✅ 游戏已启动！');
    }

    pauseGame() {
        if (this.gameState !== GAME_STATES.PLAYING) return;
        
        this.gameState = GAME_STATES.PAUSED;
        this.ui.showPauseMenu();
        this.stopGameLoop();
    }

    resumeGame() {
        if (this.gameState !== GAME_STATES.PAUSED) return;
        
        this.gameState = GAME_STATES.PLAYING;
        this.ui.hidePauseMenu();
        this.startGameLoop();
    }

    restartGame() {
        this.stopGameLoop();
        GameStorage.clear();
        this.startGame(this.selectedCharType);
    }

    quitToMenu() {
        this.stopGameLoop();
        GameStorage.clear();
        this.gameState = GAME_STATES.MENU;
        this.ui.showMainMenu();
    }

    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.player1.update(deltaTime, this.input, this.player2);
        this.player2.update(deltaTime, this.input, this.player1);
        
        this.checkHitEffects();
        
        this.ui.updateHealthBars(this.player1, this.player2);
        
        this.saveTimer += deltaTime;
        if (this.saveTimer >= 2000) {
            this.saveTimer = 0;
            this.saveGame();
        }
        
        this.checkGameOver();
    }

    checkHitEffects() {
        if (this.player1.isHurt && this.player1.hitFlashTimer > 280) {
            this.renderer.addHitEffect(this.player1.x, this.player1.y - this.player1.height / 2);
        }
        if (this.player2.isHurt && this.player2.hitFlashTimer > 280) {
            this.renderer.addHitEffect(this.player2.x, this.player2.y - this.player2.height / 2);
        }
    }

    checkGameOver() {
        if (this.player1.health <= 0) {
            this.endGame(false);
        } else if (this.player2.health <= 0) {
            this.endGame(true);
        }
    }

    endGame(playerWon) {
        this.stopGameLoop();
        GameStorage.clear();
        this.gameState = GAME_STATES.GAME_OVER;
        this.ui.showResult(playerWon);
    }

    render() {
        this.renderer.render(this.player1, this.player2);
    }

    saveGame() {
        if (!this.player1 || !this.player2) return;
        
        const gameState = {
            selectedCharType: this.selectedCharType,
            player1: this.player1.getState(),
            player2: this.player2.getState()
        };
        
        GameStorage.save(gameState);
    }

    loadGame() {
        const savedState = GameStorage.load();
        if (!savedState) return false;
        
        this.selectedCharType = savedState.selectedCharType;
        this.player1 = new Character(savedState.player1.charType, 300, true);
        this.player1.loadState(savedState.player1);
        
        this.player2 = new Character(savedState.player2.charType, 900, false);
        this.player2.loadState(savedState.player2);
        
        return true;
    }
}