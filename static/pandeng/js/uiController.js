import { CONFIG, GAME_STATE } from './config.js';
import { formatAltitude } from './utils.js';
import { Storage } from './storage.js';

export class UIController {
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.updateBestScore();
    }

    initElements() {
        this.hud = document.getElementById('hud');
        this.startScreen = document.getElementById('startScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.victoryScreen = document.getElementById('victoryScreen');
        
        this.altitudeValue = document.getElementById('altitudeValue');
        this.bestAltitudeValue = document.getElementById('bestAltitudeValue');
        this.staminaFill = document.getElementById('staminaFill');
        
        this.bestScore = document.getElementById('bestScore');
        this.finalScore = document.getElementById('finalScore');
        this.finalBestScore = document.getElementById('finalBestScore');
        this.newRecord = document.getElementById('newRecord');
        this.victoryScore = document.getElementById('victoryScore');
        
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.quitBtn = document.getElementById('quitBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.backToMenuBtn = document.getElementById('backToMenuBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.victoryBackBtn = document.getElementById('victoryBackBtn');
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.onStartGame());
        this.pauseBtn.addEventListener('click', () => this.onPause());
        this.resumeBtn.addEventListener('click', () => this.onResume());
        this.restartBtn.addEventListener('click', () => this.onRestart());
        this.quitBtn.addEventListener('click', () => this.onQuit());
        this.retryBtn.addEventListener('click', () => this.onRestart());
        this.backToMenuBtn.addEventListener('click', () => this.onBackToMenu());
        this.playAgainBtn.addEventListener('click', () => this.onRestart());
        this.victoryBackBtn.addEventListener('click', () => this.onBackToMenu());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.onEscape();
            }
        });
    }

    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }

    onStartGame() {
        if (this.callbacks && this.callbacks.onStartGame) {
            this.callbacks.onStartGame();
        }
    }

    onPause() {
        if (this.callbacks && this.callbacks.onPause) {
            this.callbacks.onPause();
        }
    }

    onResume() {
        if (this.callbacks && this.callbacks.onResume) {
            this.callbacks.onResume();
        }
    }

    onRestart() {
        if (this.callbacks && this.callbacks.onRestart) {
            this.callbacks.onRestart();
        }
    }

    onQuit() {
        if (this.callbacks && this.callbacks.onQuit) {
            this.callbacks.onQuit();
        }
    }

    onBackToMenu() {
        if (this.callbacks && this.callbacks.onBackToMenu) {
            this.callbacks.onBackToMenu();
        }
    }

    onEscape() {
        if (this.callbacks && this.callbacks.onEscape) {
            this.callbacks.onEscape();
        }
    }

    updateBestScore() {
        const best = Storage.getBestScore();
        this.bestScore.textContent = formatAltitude(best);
    }

    updateHUD(altitude, bestAltitude, stamina, maxStamina) {
        this.altitudeValue.textContent = formatAltitude(altitude);
        this.bestAltitudeValue.textContent = formatAltitude(bestAltitude);
        
        const staminaPercent = (stamina / maxStamina) * 100;
        this.staminaFill.style.width = `${staminaPercent}%`;
        
        this.staminaFill.classList.remove('low', 'critical');
        if (staminaPercent < 20) {
            this.staminaFill.classList.add('critical');
        } else if (staminaPercent < 50) {
            this.staminaFill.classList.add('low');
        }
    }

    showScreen(gameState) {
        this.hideAllScreens();
        
        switch (gameState) {
            case GAME_STATE.MENU:
                this.startScreen.classList.remove('hidden');
                this.hud.classList.add('hidden');
                this.updateBestScore();
                break;
            case GAME_STATE.PLAYING:
                this.hud.classList.remove('hidden');
                break;
            case GAME_STATE.PAUSED:
                this.pauseScreen.classList.remove('hidden');
                break;
            case GAME_STATE.GAME_OVER:
                this.gameOverScreen.classList.remove('hidden');
                this.hud.classList.add('hidden');
                break;
            case GAME_STATE.VICTORY:
                this.victoryScreen.classList.remove('hidden');
                this.hud.classList.add('hidden');
                break;
        }
    }

    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.victoryScreen.classList.add('hidden');
    }

    showGameOver(altitude, isNewRecord) {
        const best = Storage.getBestScore();
        this.finalScore.textContent = formatAltitude(altitude);
        this.finalBestScore.textContent = formatAltitude(best);
        
        if (isNewRecord) {
            this.newRecord.classList.remove('hidden');
        } else {
            this.newRecord.classList.add('hidden');
        }
    }

    showVictory() {
        this.victoryScore.textContent = formatAltitude(CONFIG.GAME.SUMMIT_ALTITUDE);
    }
}
