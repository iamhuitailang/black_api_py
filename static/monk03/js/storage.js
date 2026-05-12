class StorageManager {
    constructor() {
        this.key = CONSTANTS.STORAGE_KEY;
    }

    saveGame(gameState) {
        try {
            const data = {
                height: gameState.height,
                score: gameState.score,
                time: gameState.time,
                monkeyY: gameState.monkeyY,
                monkeySide: gameState.monkeySide,
                monkeyTargetSide: gameState.monkeyTargetSide,
                obstacles: gameState.obstacles,
                items: gameState.items,
                powerups: gameState.powerups,
                mode: gameState.mode,
                highScore: gameState.highScore,
                isPlaying: gameState.isPlaying,
                isPaused: gameState.isPaused,
                savedAt: Date.now()
            };
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    }

    loadGame() {
        try {
            const data = localStorage.getItem(this.key);
            if (!data) return null;
            const parsed = JSON.parse(data);
            if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
                this.clearSave();
                return null;
            }
            return parsed;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    }

    clearSave() {
        localStorage.removeItem(this.key);
    }

    saveHighScore(score) {
        try {
            localStorage.setItem(this.key + '_highscore', score.toString());
        } catch (e) {
            console.error('保存最高分失败:', e);
        }
    }

    loadHighScore() {
        try {
            const score = localStorage.getItem(this.key + '_highscore');
            return score ? parseInt(score) : 0;
        } catch (e) {
            return 0;
        }
    }

    hasSave() {
        return localStorage.getItem(this.key) !== null;
    }
}

const storageManager = new StorageManager();
