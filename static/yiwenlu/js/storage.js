const STORAGE_KEY = 'shanhai_yishoulu_save';

export const Storage = {
    save(gameState) {
        try {
            const saveData = {
                playerCharacter: gameState.playerCharacter,
                enemyCharacter: gameState.enemyCharacter,
                playerHp: gameState.player.hp,
                enemyHp: gameState.enemy.hp,
                playerEnergy: gameState.player.energy,
                enemyEnergy: gameState.enemy.energy,
                playerX: gameState.player.x,
                playerY: gameState.player.y,
                enemyX: gameState.enemy.x,
                enemyY: gameState.enemy.y,
                playerFacing: gameState.player.facing,
                enemyFacing: gameState.enemy.facing,
                round: gameState.round,
                playerWins: gameState.playerWins,
                enemyWins: gameState.enemyWins,
                timestamp: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return null;
            const saveData = JSON.parse(data);
            if (!saveData || Date.now() - saveData.timestamp > 24 * 60 * 60 * 1000) {
                this.clear();
                return null;
            }
            return saveData;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear save:', e);
            return false;
        }
    },

    hasSave() {
        return this.load() !== null;
    },
};
