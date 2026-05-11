const StorageManager = {
    saveGameState(state) {
        try {
            const stateString = JSON.stringify(state);
            localStorage.setItem(GameConfig.STORAGE_KEY, stateString);
            return true;
        } catch (error) {
            console.error('Failed to save game state:', error);
            return false;
        }
    },
    
    loadGameState() {
        try {
            const stateString = localStorage.getItem(GameConfig.STORAGE_KEY);
            if (stateString) {
                return JSON.parse(stateString);
            }
            return null;
        } catch (error) {
            console.error('Failed to load game state:', error);
            return null;
        }
    },
    
    clearGameState() {
        try {
            localStorage.removeItem(GameConfig.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to clear game state:', error);
            return false;
        }
    },
    
    saveHighScore(score) {
        try {
            localStorage.setItem(GameConfig.HIGH_SCORE_KEY, score.toString());
            return true;
        } catch (error) {
            console.error('Failed to save high score:', error);
            return false;
        }
    },
    
    loadHighScore() {
        try {
            const scoreString = localStorage.getItem(GameConfig.HIGH_SCORE_KEY);
            return scoreString ? parseInt(scoreString) : 0;
        } catch (error) {
            console.error('Failed to load high score:', error);
            return 0;
        }
    },
    
    updateHighScore(currentScore) {
        const currentHigh = this.loadHighScore();
        if (currentScore > currentHigh) {
            this.saveHighScore(currentScore);
            return true;
        }
        return false;
    }
};

if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}
