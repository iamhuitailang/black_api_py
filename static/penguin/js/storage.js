const STORAGE_KEY = 'penguin_game_state';

export class GameStorage {
    static saveState(state) {
        try {
            const serialized = JSON.stringify({
                ...state,
                timestamp: Date.now()
            });
            localStorage.setItem(STORAGE_KEY, serialized);
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    }

    static loadState() {
        try {
            const serialized = localStorage.getItem(STORAGE_KEY);
            if (!serialized) return null;
            
            const state = JSON.parse(serialized);
            const age = Date.now() - state.timestamp;
            if (age > 3600000) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            
            return state;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    }

    static clearState() {
        localStorage.removeItem(STORAGE_KEY);
    }

    static saveSettings(settings) {
        try {
            localStorage.setItem('penguin_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    static loadSettings() {
        try {
            const serialized = localStorage.getItem('penguin_settings');
            return serialized ? JSON.parse(serialized) : { selectedChar: 'emperor' };
        } catch (e) {
            console.error('Failed to load settings:', e);
            return { selectedChar: 'emperor' };
        }
    }
}