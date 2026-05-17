class Storage {
    constructor() {
        this.key = 'jijia_game_state';
    }

    init() {
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE_KEY) {
            this.key = CONFIG.STORAGE_KEY;
        }
    }

    save(state) {
        try {
            this.init();
            const serialized = JSON.stringify(state);
            localStorage.setItem(this.key, serialized);
            console.log('Game state saved successfully');
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    }

    load() {
        try {
            this.init();
            const serialized = localStorage.getItem(this.key);
            if (!serialized) {
                console.log('No saved game state found');
                return null;
            }
            console.log('Game state loaded successfully');
            return JSON.parse(serialized);
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    }

    clear() {
        this.init();
        localStorage.removeItem(this.key);
        console.log('Game state cleared');
    }

    hasSavedState() {
        this.init();
        return localStorage.getItem(this.key) !== null;
    }
}

const gameStorage = new Storage();