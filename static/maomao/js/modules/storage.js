const STORAGE_KEY = 'maomao_game_state';

export const Storage = {
    save(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    },

    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
};
