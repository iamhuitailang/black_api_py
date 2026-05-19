const Storage = (function() {
    const STORAGE_KEYS = {
        HIGH_SCORE: 'chaunsuo_high_score',
        HIGH_DISTANCE: 'chaunsuo_high_distance',
        GAME_STATE: 'chaunsuo_game_state'
    };

    function save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    }

    function load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    }

    function remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    function getHighScore() {
        return load(STORAGE_KEYS.HIGH_SCORE, 0);
    }

    function setHighScore(score) {
        const current = getHighScore();
        if (score > current) {
            save(STORAGE_KEYS.HIGH_SCORE, score);
            return true;
        }
        return false;
    }

    function getHighDistance() {
        return load(STORAGE_KEYS.HIGH_DISTANCE, 0);
    }

    function setHighDistance(distance) {
        const current = getHighDistance();
        if (distance > current) {
            save(STORAGE_KEYS.HIGH_DISTANCE, distance);
            return true;
        }
        return false;
    }

    function saveGameState(state) {
        return save(STORAGE_KEYS.GAME_STATE, state);
    }

    function loadGameState() {
        return load(STORAGE_KEYS.GAME_STATE, null);
    }

    function clearGameState() {
        return remove(STORAGE_KEYS.GAME_STATE);
    }

    return {
        getHighScore,
        setHighScore,
        getHighDistance,
        setHighDistance,
        saveGameState,
        loadGameState,
        clearGameState
    };
})();
