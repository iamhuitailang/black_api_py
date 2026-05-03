var Storage = (function() {
    'use strict';

    var PREFIX = GameConfig.get('STORAGE.KEY_PREFIX') || 'mao_game_';

    function getFullKey(key) {
        return PREFIX + key;
    }

    function save(key, data) {
        try {
            var jsonData = JSON.stringify(data);
            localStorage.setItem(getFullKey(key), jsonData);
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    }

    function load(key, defaultValue) {
        try {
            var jsonData = localStorage.getItem(getFullKey(key));
            if (jsonData === null || jsonData === undefined) {
                return defaultValue;
            }
            return JSON.parse(jsonData);
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    }

    function remove(key) {
        try {
            localStorage.removeItem(getFullKey(key));
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    function clearAll() {
        try {
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.indexOf(PREFIX) === 0) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(function(key) {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('Storage clearAll error:', e);
            return false;
        }
    }

    function saveGameState(state) {
        return save(GameConfig.get('STORAGE.GAME_STATE'), state);
    }

    function loadGameState() {
        return load(GameConfig.get('STORAGE.GAME_STATE'), null);
    }

    function removeGameState() {
        return remove(GameConfig.get('STORAGE.GAME_STATE'));
    }

    function getDefaultStats() {
        return {
            highScore: 0,
            longestSurvival: 0,
            totalCheeses: 0,
            totalGames: 0
        };
    }

    function loadStats() {
        return load(GameConfig.get('STORAGE.STATS'), getDefaultStats());
    }

    function saveStats(stats) {
        return save(GameConfig.get('STORAGE.STATS'), stats);
    }

    function updateStats(score, survivalTime, cheesesCollected) {
        var stats = loadStats();
        
        if (score > stats.highScore) {
            stats.highScore = score;
        }
        if (survivalTime > stats.longestSurvival) {
            stats.longestSurvival = survivalTime;
        }
        stats.totalCheeses += cheesesCollected;
        stats.totalGames += 1;

        saveStats(stats);
        return stats;
    }

    function resetStats() {
        saveStats(getDefaultStats());
    }

    return {
        save: save,
        load: load,
        remove: remove,
        clearAll: clearAll,
        saveGameState: saveGameState,
        loadGameState: loadGameState,
        removeGameState: removeGameState,
        getDefaultStats: getDefaultStats,
        loadStats: loadStats,
        saveStats: saveStats,
        updateStats: updateStats,
        resetStats: resetStats
    };
})();
