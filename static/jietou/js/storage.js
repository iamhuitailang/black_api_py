class StorageManager {
    constructor() {
        this.storageKey = 'street_fighter_game_state';
    }

    saveGameState(gameState) {
        try {
            const stateToSave = {
                timestamp: Date.now(),
                ...gameState
            };
            localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
            return true;
        } catch (error) {
            console.error('Failed to save game state:', error);
            return false;
        }
    }

    loadGameState() {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                const timeSinceSave = Date.now() - parsedState.timestamp;
                if (timeSinceSave < 3600000) {
                    return parsedState;
                }
            }
            return null;
        } catch (error) {
            console.error('Failed to load game state:', error);
            return null;
        }
    }

    clearGameState() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear game state:', error);
            return false;
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem('street_fighter_settings', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    loadSettings() {
        try {
            const settings = localStorage.getItem('street_fighter_settings');
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    }
}