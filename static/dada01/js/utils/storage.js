var Storage = (function() {
    var key = GameConfig.STORAGE_KEY;
    
    function getDefaultData() {
        return {
            highScore: 0,
            gamesPlayed: 0,
            totalScore: 0,
            totalDucksHit: 0,
            totalDucksMissed: 0,
            currentGame: null
        };
    }
    
    function load() {
        try {
            var data = localStorage.getItem(key);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Error loading game data:', e);
        }
        return getDefaultData();
    }
    
    function save(data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving game data:', e);
        }
    }
    
    function saveCurrentGame(gameState) {
        var data = load();
        data.currentGame = gameState;
        save(data);
    }
    
    function clearCurrentGame() {
        var data = load();
        data.currentGame = null;
        save(data);
    }
    
    function getHighScore() {
        var data = load();
        return data.highScore || 0;
    }
    
    function updateHighScore(score) {
        var data = load();
        if (score > data.highScore) {
            data.highScore = score;
            save(data);
            return true;
        }
        return false;
    }
    
    function updateStats(stats) {
        var data = load();
        data.gamesPlayed = (data.gamesPlayed || 0) + 1;
        data.totalScore = (data.totalScore || 0) + (stats.score || 0);
        data.totalDucksHit = (data.totalDucksHit || 0) + (stats.hit || 0);
        data.totalDucksMissed = (data.totalDucksMissed || 0) + (stats.missed || 0);
        save(data);
    }
    
    function getCurrentGame() {
        var data = load();
        return data.currentGame;
    }
    
    return {
        load: load,
        save: save,
        saveCurrentGame: saveCurrentGame,
        clearCurrentGame: clearCurrentGame,
        getHighScore: getHighScore,
        updateHighScore: updateHighScore,
        updateStats: updateStats,
        getCurrentGame: getCurrentGame,
        getDefaultData: getDefaultData
    };
})();
