const Storage = {
    STORAGE_KEY: CONFIG.STORAGE_KEY,

    save(data) {
        try {
            const jsonString = JSON.stringify(data);
            localStorage.setItem(this.STORAGE_KEY, jsonString);
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },

    load() {
        try {
            const jsonString = localStorage.getItem(this.STORAGE_KEY);
            if (!jsonString) return null;
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Storage load error:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    hasSavedGame() {
        const data = this.load();
        return data && data.gameState && data.gameState.isPlaying === true;
    }
};
