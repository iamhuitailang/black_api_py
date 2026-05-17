const Storage = {
    getHighScore() {
        try {
            const score = localStorage.getItem(GameConfig.STORAGE_KEYS.HIGH_SCORE);
            return score ? parseInt(score, 10) : 0;
        } catch (e) {
            console.error('Failed to get high score:', e);
            return 0;
        }
    },
    
    setHighScore(streak) {
        try {
            const currentHigh = this.getHighScore();
            if (streak > currentHigh) {
                localStorage.setItem(GameConfig.STORAGE_KEYS.HIGH_SCORE, streak.toString());
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to set high score:', e);
            return false;
        }
    },
    
    saveGameState(state) {
        try {
            const stateToSave = {
                round: state.round,
                winStreak: state.winStreak,
                player: state.player ? state.player.serialize() : null,
                opponent: state.opponent ? state.opponent.serialize() : null,
                gameState: state.gameState,
                timestamp: Date.now()
            };
            localStorage.setItem(GameConfig.STORAGE_KEYS.SAVE_STATE, JSON.stringify(stateToSave));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    },
    
    loadGameState() {
        try {
            const saved = localStorage.getItem(GameConfig.STORAGE_KEYS.SAVE_STATE);
            if (!saved) return null;
            const state = JSON.parse(saved);
            const maxAge = 24 * 60 * 60 * 1000;
            if (Date.now() - state.timestamp > maxAge) {
                this.clearGameState();
                return null;
            }
            return state;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    },
    
    clearGameState() {
        try {
            localStorage.removeItem(GameConfig.STORAGE_KEYS.SAVE_STATE);
            return true;
        } catch (e) {
            console.error('Failed to clear game state:', e);
            return false;
        }
    },
    
    hasSavedGame() {
        return this.loadGameState() !== null;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
