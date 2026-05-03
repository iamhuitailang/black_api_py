var Storage = (function() {
    'use strict';

    var STORAGE_KEYS = {
        GAME_STATE: '2048_game_state',
        BEST_SCORE: '2048_best_score',
        THEME: '2048_theme'
    };

    function isAvailable() {
        try {
            var test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    function get(key, defaultValue) {
        if (!isAvailable()) {
            return defaultValue;
        }
        try {
            var item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (e) {
            console.warn('Storage get error:', e);
            return defaultValue;
        }
    }

    function set(key, value) {
        if (!isAvailable()) {
            return false;
        }
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage set error:', e);
            return false;
        }
    }

    function remove(key) {
        if (!isAvailable()) {
            return false;
        }
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Storage remove error:', e);
            return false;
        }
    }

    function saveGameState(gameState) {
        return set(STORAGE_KEYS.GAME_STATE, gameState);
    }

    function loadGameState() {
        return get(STORAGE_KEYS.GAME_STATE, null);
    }

    function clearGameState() {
        return remove(STORAGE_KEYS.GAME_STATE);
    }

    function getBestScore() {
        return get(STORAGE_KEYS.BEST_SCORE, 0);
    }

    function setBestScore(score) {
        var current = getBestScore();
        if (score > current) {
            return set(STORAGE_KEYS.BEST_SCORE, score);
        }
        return false;
    }

    function getTheme() {
        return get(STORAGE_KEYS.THEME, 'light');
    }

    function setTheme(theme) {
        return set(STORAGE_KEYS.THEME, theme);
    }

    function createGameState(grid, score, bestScore, isWin, gameOver, isPaused, history) {
        return {
            grid: grid ? Utils.clone(grid) : null,
            score: score || 0,
            bestScore: bestScore || getBestScore(),
            isWin: isWin || false,
            gameOver: gameOver || false,
            isPaused: isPaused || false,
            history: history || [],
            timestamp: Utils.now()
        };
    }

    function createEmptyGrid(size) {
        size = size || 4;
        var grid = [];
        for (var i = 0; i < size; i++) {
            grid[i] = [];
            for (var j = 0; j < size; j++) {
                grid[i][j] = 0;
            }
        }
        return grid;
    }

    function isGridEmpty(grid) {
        if (!grid) return true;
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[i].length; j++) {
                if (grid[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    function getEmptyCells(grid) {
        var empty = [];
        if (!grid) return empty;
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[i].length; j++) {
                if (grid[i][j] === 0) {
                    empty.push({ row: i, col: j });
                }
            }
        }
        return empty;
    }

    return {
        isAvailable: isAvailable,
        get: get,
        set: set,
        remove: remove,
        saveGameState: saveGameState,
        loadGameState: loadGameState,
        clearGameState: clearGameState,
        getBestScore: getBestScore,
        setBestScore: setBestScore,
        getTheme: getTheme,
        setTheme: setTheme,
        createGameState: createGameState,
        createEmptyGrid: createEmptyGrid,
        isGridEmpty: isGridEmpty,
        getEmptyCells: getEmptyCells
    };
})();
