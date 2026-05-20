const Storage = (function() {
    const STORAGE_KEY = 'skateboard_master_data';
    
    const defaultData = {
        highScores: {
            endless: 0,
            trick: 0,
            versus: 0
        },
        totalDistance: 0,
        perfectLanding: 0,
        unlockedCharacters: ['beginner'],
        selectedCharacter: 'beginner',
        currentLevel: 1,
        gameState: null
    };
    
    let data = loadData();
    
    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...defaultData, ...parsed };
            }
        } catch (e) {
            console.error('Failed to load save data:', e);
        }
        return { ...defaultData };
    }
    
    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }
    
    function get(key) {
        return data[key];
    }
    
    function set(key, value) {
        data[key] = value;
        saveData();
    }
    
    function getHighScore(mode) {
        return data.highScores[mode] || 0;
    }
    
    function setHighScore(mode, score) {
        if (score > data.highScores[mode]) {
            data.highScores[mode] = score;
            saveData();
            return true;
        }
        return false;
    }
    
    function addDistance(distance) {
        data.totalDistance += distance;
        saveData();
    }
    
    function addPerfectLanding() {
        data.perfectLanding++;
        checkUnlocks();
        saveData();
    }
    
    function checkUnlocks() {
        if (data.perfectLanding >= 10 && !data.unlockedCharacters.includes('balance')) {
            data.unlockedCharacters.push('balance');
        }
    }
    
    function unlockCharacter(charId) {
        if (!data.unlockedCharacters.includes(charId)) {
            data.unlockedCharacters.push(charId);
            saveData();
            return true;
        }
        return false;
    }
    
    function isCharacterUnlocked(charId) {
        return data.unlockedCharacters.includes(charId);
    }
    
    function setSelectedCharacter(charId) {
        if (isCharacterUnlocked(charId)) {
            data.selectedCharacter = charId;
            saveData();
            return true;
        }
        return false;
    }
    
    function getSelectedCharacter() {
        return data.selectedCharacter;
    }
    
    function saveGameState(state) {
        data.gameState = state;
        saveData();
    }
    
    function getGameState() {
        return data.gameState;
    }
    
    function clearGameState() {
        data.gameState = null;
        saveData();
    }
    
    function resetAll() {
        data = { ...defaultData };
        saveData();
    }
    
    function getAll() {
        return { ...data };
    }
    
    return {
        get,
        set,
        getHighScore,
        setHighScore,
        addDistance,
        addPerfectLanding,
        unlockCharacter,
        isCharacterUnlocked,
        setSelectedCharacter,
        getSelectedCharacter,
        saveGameState,
        getGameState,
        clearGameState,
        resetAll,
        getAll
    };
})();
