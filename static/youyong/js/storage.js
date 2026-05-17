const Storage = (() => {
    const KEYS = {
        PLAYER_DATA: 'swimming_player_data',
        GAME_STATE: 'swimming_game_state',
        RECORDS: 'swimming_records',
        SETTINGS: 'swimming_settings'
    };

    const save = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    };

    const load = (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    };

    const remove = (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    };

    const savePlayerData = (data) => save(KEYS.PLAYER_DATA, data);
    const loadPlayerData = () => load(KEYS.PLAYER_DATA, null);

    const saveGameState = (state) => save(KEYS.GAME_STATE, state);
    const loadGameState = () => load(KEYS.GAME_STATE, null);
    const clearGameState = () => remove(KEYS.GAME_STATE);

    const saveRecords = (records) => save(KEYS.RECORDS, records);
    const loadRecords = () => load(KEYS.RECORDS, []);
    const addRecord = (record) => {
        const records = loadRecords();
        records.unshift({
            ...record,
            date: new Date().toISOString()
        });
        if (records.length > 50) {
            records.length = 50;
        }
        saveRecords(records);
        return records;
    };
    const clearRecords = () => remove(KEYS.RECORDS);

    const saveSettings = (settings) => save(KEYS.SETTINGS, settings);
    const loadSettings = () => load(KEYS.SETTINGS, null);

    return {
        KEYS,
        save,
        load,
        remove,
        savePlayerData,
        loadPlayerData,
        saveGameState,
        loadGameState,
        clearGameState,
        saveRecords,
        loadRecords,
        addRecord,
        clearRecords,
        saveSettings,
        loadSettings
    };
})();
