const STORAGE_KEY = 'huarongdao_game_state';
const RECORDS_KEY = 'huarongdao_records';

export const Storage = {
    saveGameState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    },

    loadGameState() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    },

    clearGameState() {
        localStorage.removeItem(STORAGE_KEY);
    },

    saveRecord(layoutId, record) {
        try {
            const records = this.getAllRecords();
            if (!records[layoutId] || record.steps < records[layoutId].steps) {
                records[layoutId] = record;
                localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to save record:', e);
            return false;
        }
    },

    getRecord(layoutId) {
        const records = this.getAllRecords();
        return records[layoutId] || null;
    },

    getAllRecords() {
        try {
            const data = localStorage.getItem(RECORDS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to get records:', e);
            return {};
        }
    },

    clearRecords() {
        localStorage.removeItem(RECORDS_KEY);
    }
};
