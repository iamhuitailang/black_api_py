import { STORAGE_KEY, MAX_HEALTH, MAX_ENERGY } from './constants.js';

export class StorageManager {
    constructor() {
        this.saveData = this.load();
    }

    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load save data:', e);
        }
        return this.getDefaultData();
    }

    save(data) {
        this.saveData = { ...this.saveData, ...data };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saveData));
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }

    getDefaultData() {
        return {
            currentLevel: 1,
            maxUnlockedLevel: 1,
            selectedCharacter: 'normal',
            totalWins: 0,
            playerState: null,
            enemyState: null,
            gamePaused: false
        };
    }

    getCurrentLevel() {
        return this.saveData.currentLevel || 1;
    }

    getMaxUnlockedLevel() {
        return this.saveData.maxUnlockedLevel || 1;
    }

    getSelectedCharacter() {
        return this.saveData.selectedCharacter || 'normal';
    }

    hasSavedGame() {
        return this.saveData.playerState !== null;
    }

    saveGameState(gameState) {
        this.save({
            currentLevel: gameState.currentLevel,
            maxUnlockedLevel: gameState.maxUnlockedLevel,
            selectedCharacter: gameState.selectedCharacter,
            playerState: gameState.playerState,
            enemyState: gameState.enemyState
        });
    }

    getSavedGameState() {
        return {
            currentLevel: this.saveData.currentLevel,
            maxUnlockedLevel: this.saveData.maxUnlockedLevel,
            selectedCharacter: this.saveData.selectedCharacter,
            playerState: this.saveData.playerState,
            enemyState: this.saveData.enemyState
        };
    }

    clearSavedGame() {
        this.save({
            playerState: null,
            enemyState: null
        });
    }

    levelComplete(level) {
        const newMax = Math.max(this.saveData.maxUnlockedLevel, level + 1);
        this.save({
            maxUnlockedLevel: newMax,
            totalWins: (this.saveData.totalWins || 0) + 1
        });
        return newMax;
    }

    selectCharacter(characterId) {
        this.save({ selectedCharacter: characterId });
    }

    setCurrentLevel(level) {
        this.save({ currentLevel: level });
    }
}
