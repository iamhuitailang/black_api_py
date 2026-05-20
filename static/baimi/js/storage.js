const Storage = (() => {
    const STORAGE_KEY = 'baimi_sprint_game_data';

    const defaultData = {
        bestRecord: null,
        totalRaces: 0,
        totalWins: 0,
        raceHistory: [],
        currentMode: 'solo',
        gameState: null,
        lastPlayed: null
    };

    const save = (data) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save data:', e);
            return false;
        }
    };

    const load = () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                return { ...defaultData, ...parsed };
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        return { ...defaultData };
    };

    const updateBestRecord = (time) => {
        const data = load();
        if (!data.bestRecord || time < data.bestRecord) {
            data.bestRecord = time;
            save(data);
            return true;
        }
        return false;
    };

    const addRaceResult = (result) => {
        const data = load();
        data.totalRaces++;
        if (result.rank === 1) {
            data.totalWins++;
        }
        data.raceHistory.unshift({
            ...result,
            date: new Date().toISOString()
        });
        if (data.raceHistory.length > 50) {
            data.raceHistory = data.raceHistory.slice(0, 50);
        }
        data.lastPlayed = new Date().toISOString();
        save(data);
    };

    const saveGameState = (state) => {
        const data = load();
        data.gameState = state;
        save(data);
    };

    const loadGameState = () => {
        const data = load();
        return data.gameState;
    };

    const clearGameState = () => {
        const data = load();
        data.gameState = null;
        save(data);
    };

    const setCurrentMode = (mode) => {
        const data = load();
        data.currentMode = mode;
        save(data);
    };

    const getCurrentMode = () => {
        const data = load();
        return data.currentMode;
    };

    const getBestRecord = () => {
        const data = load();
        return data.bestRecord;
    };

    const getStats = () => {
        const data = load();
        return {
            bestRecord: data.bestRecord,
            totalRaces: data.totalRaces,
            totalWins: data.totalWins,
            winRate: data.totalRaces > 0 ? ((data.totalWins / data.totalRaces) * 100).toFixed(1) : 0
        };
    };

    const resetAll = () => {
        save({ ...defaultData });
    };

    return {
        save,
        load,
        updateBestRecord,
        addRaceResult,
        saveGameState,
        loadGameState,
        clearGameState,
        setCurrentMode,
        getCurrentMode,
        getBestRecord,
        getStats,
        resetAll
    };
})();
