const Storage = (function() {
    const STORAGE_KEY = 'huaxue_game_data';
    
    const defaultData = {
        highScore: 0,
        highDistance: 0,
        totalGames: 0,
        gameState: null
    };
    
    function getData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : { ...defaultData };
        } catch (e) {
            console.error('读取存储失败:', e);
            return { ...defaultData };
        }
    }
    
    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存存储失败:', e);
            return false;
        }
    }
    
    function getHighScore() {
        return getData().highScore || 0;
    }
    
    function getHighDistance() {
        return getData().highDistance || 0;
    }
    
    function updateHighScore(score, distance) {
        const data = getData();
        let updated = false;
        
        if (score > data.highScore) {
            data.highScore = score;
            updated = true;
        }
        
        if (distance > data.highDistance) {
            data.highDistance = distance;
            updated = true;
        }
        
        if (updated) {
            saveData(data);
        }
        
        return updated;
    }
    
    function saveGameState(state) {
        const data = getData();
        data.gameState = state;
        data.gameState.savedAt = Date.now();
        return saveData(data);
    }
    
    function loadGameState() {
        const data = getData();
        return data.gameState;
    }
    
    function clearGameState() {
        const data = getData();
        data.gameState = null;
        return saveData(data);
    }
    
    function incrementTotalGames() {
        const data = getData();
        data.totalGames = (data.totalGames || 0) + 1;
        return saveData(data);
    }
    
    function resetAll() {
        return saveData({ ...defaultData });
    }
    
    return {
        getData,
        saveData,
        getHighScore,
        getHighDistance,
        updateHighScore,
        saveGameState,
        loadGameState,
        clearGameState,
        incrementTotalGames,
        resetAll
    };
})();
