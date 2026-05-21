const Storage = (function() {
    const STORAGE_KEY = 'magic_escape_game';
    
    const defaultData = {
        bestRecords: {},
        unlockedLevels: [1],
        currentLevel: 1,
        savedGame: null
    };
    
    function load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return { ...defaultData, ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('Failed to load game data:', e);
        }
        return { ...defaultData };
    }
    
    function save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game data:', e);
            return false;
        }
    }
    
    function getBestRecord(level) {
        const data = load();
        return data.bestRecords[level] || null;
    }
    
    function setBestRecord(level, time) {
        const data = load();
        const current = data.bestRecords[level];
        if (!current || time < current) {
            data.bestRecords[level] = time;
            save(data);
            return true;
        }
        return false;
    }
    
    function unlockLevel(level) {
        const data = load();
        if (!data.unlockedLevels.includes(level)) {
            data.unlockedLevels.push(level);
            save(data);
        }
    }
    
    function isLevelUnlocked(level) {
        const data = load();
        return data.unlockedLevels.includes(level);
    }
    
    function saveGame(gameState) {
        const data = load();
        data.savedGame = gameState;
        save(data);
    }
    
    function loadGame() {
        const data = load();
        return data.savedGame;
    }
    
    function clearSavedGame() {
        const data = load();
        data.savedGame = null;
        save(data);
    }
    
    function hasSavedGame() {
        const data = load();
        return data.savedGame !== null;
    }
    
    return {
        load,
        save,
        getBestRecord,
        setBestRecord,
        unlockLevel,
        isLevelUnlocked,
        saveGame,
        loadGame,
        clearSavedGame,
        hasSavedGame
    };
})();
