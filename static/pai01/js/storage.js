const Storage = {
    saveGame(gameState) {
        try {
            const data = {
                timestamp: Date.now(),
                gameState: Utils.deepClone(gameState)
            };
            localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    },
    
    loadGame() {
        try {
            const data = localStorage.getItem(CONSTANTS.STORAGE_KEY);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            return parsed.gameState;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    },
    
    hasSavedGame() {
        return this.loadGame() !== null;
    },
    
    clearGame() {
        try {
            localStorage.removeItem(CONSTANTS.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear game:', e);
            return false;
        }
    },
    
    saveConfig(config) {
        try {
            localStorage.setItem('memory_game_config', JSON.stringify(config));
            return true;
        } catch (e) {
            console.error('Failed to save config:', e);
            return false;
        }
    },
    
    loadConfig() {
        try {
            const data = localStorage.getItem('memory_game_config');
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to load config:', e);
            return null;
        }
    }
};
