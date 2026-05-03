const STORAGE_KEYS = {
    GAME_STATE: 'pintu_game_state',
    BEST_RECORDS: 'pintu_best_records',
    IMAGE_CACHE: 'pintu_image_cache'
};

const DIFFICULTY_KEYS = {
    3: 'easy',
    4: 'medium',
    5: 'hard'
};

class Storage {
    constructor() {
        this.defaultBestRecords = {
            easy: { moves: Infinity, time: Infinity },
            medium: { moves: Infinity, time: Infinity },
            hard: { moves: Infinity, time: Infinity }
        };
    }

    saveGameState(gameState) {
        try {
            const state = {
                ...gameState,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    }

    loadGameState() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
            if (!data) return null;
            const state = JSON.parse(data);
            if (state && state.timestamp) {
                return state;
            }
            return null;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    }

    clearGameState() {
        localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    }

    saveBestRecords(records) {
        try {
            localStorage.setItem(STORAGE_KEYS.BEST_RECORDS, JSON.stringify(records));
            return true;
        } catch (e) {
            console.error('Failed to save best records:', e);
            return false;
        }
    }

    loadBestRecords() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.BEST_RECORDS);
            if (!data) {
                return { ...this.defaultBestRecords };
            }
            const records = JSON.parse(data);
            return {
                ...this.defaultBestRecords,
                ...records
            };
        } catch (e) {
            console.error('Failed to load best records:', e);
            return { ...this.defaultBestRecords };
        }
    }

    updateBestRecord(size, moves, time) {
        const difficulty = DIFFICULTY_KEYS[size];
        if (!difficulty) return false;

        const records = this.loadBestRecords();
        let isNewRecord = false;

        if (moves < records[difficulty].moves) {
            records[difficulty].moves = moves;
            isNewRecord = true;
        }

        if (time < records[difficulty].time) {
            records[difficulty].time = time;
            isNewRecord = true;
        }

        if (isNewRecord) {
            this.saveBestRecords(records);
        }

        return isNewRecord;
    }

    getBestRecord(size) {
        const difficulty = DIFFICULTY_KEYS[size];
        if (!difficulty) return null;

        const records = this.loadBestRecords();
        return records[difficulty];
    }

    saveImageCache(key, imageData) {
        try {
            const cache = this.loadImageCache();
            cache[key] = {
                data: imageData,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEYS.IMAGE_CACHE, JSON.stringify(cache));
            return true;
        } catch (e) {
            console.error('Failed to save image cache:', e);
            return false;
        }
    }

    loadImageCache() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.IMAGE_CACHE);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to load image cache:', e);
            return {};
        }
    }

    getImageFromCache(key) {
        const cache = this.loadImageCache();
        return cache[key] ? cache[key].data : null;
    }

    clearImageCache() {
        localStorage.removeItem(STORAGE_KEYS.IMAGE_CACHE);
    }

    clearAll() {
        localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
        localStorage.removeItem(STORAGE_KEYS.BEST_RECORDS);
        localStorage.removeItem(STORAGE_KEYS.IMAGE_CACHE);
    }
}

export const storage = new Storage();
export default storage;
