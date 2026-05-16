class StorageManager {
    constructor() {
        this.key = CONFIG.STORAGE_KEY;
    }

    saveGameState(gameState) {
        try {
            const state = {
                playerChar: gameState.playerChar,
                enemyChar: gameState.enemyChar,
                playerHealth: gameState.player.health,
                enemyHealth: gameState.enemy.health,
                playerX: gameState.player.x,
                playerY: gameState.player.y,
                enemyX: gameState.enemy.x,
                enemyY: gameState.enemy.y,
                playerFacing: gameState.player.facing,
                round: gameState.round,
                timestamp: Date.now()
            };
            localStorage.setItem(this.key, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem(this.key);
            if (saved) {
                const state = JSON.parse(saved);
                const now = Date.now();
                if (now - state.timestamp < 24 * 60 * 60 * 1000) {
                    return state;
                }
            }
        } catch (e) {
            console.error('加载游戏状态失败:', e);
        }
        return null;
    }

    clearGameState() {
        localStorage.removeItem(this.key);
    }

    hasSavedState() {
        return this.loadGameState() !== null;
    }
}

const storage = new StorageManager();