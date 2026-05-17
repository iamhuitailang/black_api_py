const Storage = {
    save(gameState) {
        try {
            const data = {
                playerScore: gameState.playerScore,
                aiScore: gameState.aiScore,
                gameStatus: gameState.status,
                ball: gameState.ball ? gameState.ball.serialize() : null,
                playerPaddle: gameState.playerPaddle ? gameState.playerPaddle.serialize() : null,
                aiPaddle: gameState.aiPaddle ? gameState.aiPaddle.serialize() : null,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear save:', e);
            return false;
        }
    },

    hasSave() {
        return localStorage.getItem(CONFIG.STORAGE_KEY) !== null;
    }
};
