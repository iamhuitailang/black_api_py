import { STORAGE_KEY } from './config.js';

export class StorageManager {
    constructor() {
        this.gameState = null;
    }

    save(state) {
        try {
            const serializedState = JSON.stringify(state);
            localStorage.setItem(STORAGE_KEY, serializedState);
            return true;
        } catch (error) {
            console.error('Failed to save game state:', error);
            return false;
        }
    }

    load() {
        try {
            const serializedState = localStorage.getItem(STORAGE_KEY);
            if (serializedState === null) {
                return null;
            }
            return JSON.parse(serializedState);
        } catch (error) {
            console.error('Failed to load game state:', error);
            return null;
        }
    }

    clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to clear game state:', error);
            return false;
        }
    }

    hasSavedState() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }

    createInitialState() {
        return {
            score: 0,
            level: 1,
            stackHeight: 0,
            boxes: [],
            currentBox: null,
            nextBoxType: 'WOOD',
            gameState: 'menu',
            towerAngle: 0,
            towerSwayVelocity: 0,
            totalOffset: 0,
            moveDirection: 1,
            movePhase: 0,
            fallingBoxes: [],
            falling: false,
            highScore: 0,
            maxHeight: 0
        };
    }

    saveGame(game) {
        const state = {
            score: game.score,
            level: game.level,
            stackHeight: game.stackHeight,
            boxes: game.boxes.map(box => box.serialize()),
            currentBox: game.currentBox ? game.currentBox.serialize() : null,
            nextBoxType: game.nextBoxType,
            gameState: game.gameState,
            towerAngle: game.towerAngle,
            towerSwayVelocity: game.towerSwayVelocity,
            totalOffset: game.totalOffset,
            moveDirection: game.moveDirection,
            movePhase: game.movePhase,
            fallingBoxes: game.fallingBoxes.map(box => box.serialize()),
            falling: game.falling,
            highScore: game.highScore,
            maxHeight: game.maxHeight,
            timestamp: Date.now()
        };
        return this.save(state);
    }

    loadGame(game) {
        const state = this.load();
        if (!state) {
            return false;
        }

        game.score = state.score || 0;
        game.level = state.level || 1;
        game.stackHeight = state.stackHeight || 0;
        game.towerAngle = state.towerAngle || 0;
        game.towerSwayVelocity = state.towerSwayVelocity || 0;
        game.totalOffset = state.totalOffset || 0;
        game.moveDirection = state.moveDirection || 1;
        game.movePhase = state.movePhase || 0;
        game.falling = state.falling || false;
        game.highScore = state.highScore || 0;
        game.maxHeight = state.maxHeight || 0;
        game.nextBoxType = state.nextBoxType || 'WOOD';
        game.gameState = state.gameState || 'menu';

        return true;
    }
}

export const storageManager = new StorageManager();