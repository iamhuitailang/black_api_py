const Storage = (function() {
    const STORAGE_KEY = 'shejian03_game_state';
    
    function getDefaultState() {
        return {
            highScore: 0,
            lastGame: null,
            settings: {
                soundEnabled: true,
                musicEnabled: true
            }
        };
    }
    
    function load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                return Object.assign(getDefaultState(), parsed);
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
        return getDefaultState();
    }
    
    function save(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    }
    
    function updateHighScore(score) {
        const state = load();
        if (score > state.highScore) {
            state.highScore = score;
            save(state);
            return true;
        }
        return false;
    }
    
    function saveGameSession(gameData) {
        const state = load();
        state.lastGame = gameData;
        save(state);
    }
    
    function clearSavedGame() {
        const state = load();
        state.lastGame = null;
        save(state);
    }
    
    function hasSavedGame() {
        const state = load();
        return state.lastGame !== null;
    }
    
    return {
        load,
        save,
        updateHighScore,
        saveGameSession,
        clearSavedGame,
        hasSavedGame,
        getDefaultState
    };
})();

window.Storage = Storage;