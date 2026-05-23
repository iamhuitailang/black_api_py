var Storage = (function() {
    var STORAGE_KEY = 'shensuo_game_data';

    var defaultData = {
        highestLevel: 1,
        bestTimes: {},
        currentLevel: 1,
        selectedCharacter: 'explorer',
        gameState: null,
        lastSaveTime: null
    };

    function loadData() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                var parsed = JSON.parse(data);
                if (!parsed.bestTimes) {
                    parsed.bestTimes = {};
                }
                return parsed;
            }
        } catch (e) {
            console.error('Failed to load game data:', e);
        }
        return JSON.parse(JSON.stringify(defaultData));
    }

    function saveData(data) {
        try {
            data.lastSaveTime = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game data:', e);
            return false;
        }
    }

    function getHighestLevel() {
        var data = loadData();
        return data.highestLevel || 1;
    }

    function setHighestLevel(level) {
        var data = loadData();
        if (level > data.highestLevel) {
            data.highestLevel = level;
            saveData(data);
        }
    }

    function getBestTime(level) {
        var data = loadData();
        if (level && data.bestTimes) {
            return data.bestTimes[level];
        }
        return null;
    }

    function setBestTime(level, time) {
        var data = loadData();
        if (!data.bestTimes) {
            data.bestTimes = {};
        }
        if (!data.bestTimes[level] || time < data.bestTimes[level]) {
            data.bestTimes[level] = time;
            saveData(data);
        }
    }

    function getCurrentLevel() {
        var data = loadData();
        return data.currentLevel || 1;
    }

    function setCurrentLevel(level) {
        var data = loadData();
        data.currentLevel = level;
        saveData(data);
    }

    function getSelectedCharacter() {
        var data = loadData();
        return data.selectedCharacter || 'explorer';
    }

    function setSelectedCharacter(character) {
        var data = loadData();
        data.selectedCharacter = character;
        saveData(data);
    }

    function saveGameState(state) {
        var data = loadData();
        data.gameState = state;
        saveData(data);
    }

    function loadGameState() {
        var data = loadData();
        return data.gameState;
    }

    function clearGameState() {
        var data = loadData();
        data.gameState = null;
        saveData(data);
    }

    function resetAll() {
        saveData(JSON.parse(JSON.stringify(defaultData)));
    }

    function formatTime(seconds) {
        if (!seconds && seconds !== 0) return '--';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    return {
        loadData: loadData,
        saveData: saveData,
        getHighestLevel: getHighestLevel,
        setHighestLevel: setHighestLevel,
        getBestTime: getBestTime,
        setBestTime: setBestTime,
        getCurrentLevel: getCurrentLevel,
        setCurrentLevel: setCurrentLevel,
        getSelectedCharacter: getSelectedCharacter,
        setSelectedCharacter: setSelectedCharacter,
        saveGameState: saveGameState,
        loadGameState: loadGameState,
        clearGameState: clearGameState,
        resetAll: resetAll,
        formatTime: formatTime
    };
})();
