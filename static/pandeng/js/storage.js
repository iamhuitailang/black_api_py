import { CONFIG } from './config.js';

export class Storage {
    static saveGameState(state) {
        try {
            const serialized = JSON.stringify(state);
            localStorage.setItem(CONFIG.GAME.STORAGE_KEY, serialized);
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    }

    static loadGameState() {
        try {
            const serialized = localStorage.getItem(CONFIG.GAME.STORAGE_KEY);
            if (!serialized) return null;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    }

    static clearGameState() {
        localStorage.removeItem(CONFIG.GAME.STORAGE_KEY);
    }

    static saveBestScore(score) {
        try {
            const currentBest = this.getBestScore();
            if (score > currentBest) {
                localStorage.setItem(CONFIG.GAME.BEST_SCORE_KEY, String(score));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to save best score:', e);
            return false;
        }
    }

    static getBestScore() {
        try {
            const score = localStorage.getItem(CONFIG.GAME.BEST_SCORE_KEY);
            return score ? parseFloat(score) : 0;
        } catch (e) {
            console.error('Failed to get best score:', e);
            return 0;
        }
    }

    static hasSavedGame() {
        return localStorage.getItem(CONFIG.GAME.STORAGE_KEY) !== null;
    }
}
