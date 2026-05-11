const Storage = (function() {
    function getDefaultPlayerData() {
        return {
            gold: 200,
            wood: 50,
            highScore: 0,
            streak: 0,
            equippedAxe: 'stone',
            equippedTree: 'oak',
            ownedAxes: ['stone'],
            ownedTrees: ['oak'],
            powerups: {
                double: 2,
                shield: 1,
                auto: 1
            }
        };
    }
    
    function getDefaultGameState() {
        return {
            state: GAME_STATE.MENU,
            score: 0,
            woodGained: 0,
            difficulty: 'beginner',
            segments: [],
            cutCount: 0,
            timeLimit: 0,
            activePowerups: {},
            shieldUsed: false,
            lastCutSide: null
        };
    }
    
    function loadPlayerData() {
        try {
            const data = localStorage.getItem(CONSTANTS.STORAGE_KEYS.PLAYER_DATA);
            if (data) {
                return { ...getDefaultPlayerData(), ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('Failed to load player data:', e);
        }
        return getDefaultPlayerData();
    }
    
    function savePlayerData(data) {
        try {
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.PLAYER_DATA, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save player data:', e);
            return false;
        }
    }
    
    function loadGameState() {
        try {
            const data = localStorage.getItem(CONSTANTS.STORAGE_KEYS.GAME_STATE);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.state === GAME_STATE.PLAYING || parsed.state === GAME_STATE.PAUSED) {
                    return { ...getDefaultGameState(), ...parsed };
                }
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
        return getDefaultGameState();
    }
    
    function saveGameState(state) {
        try {
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    }
    
    function clearGameState() {
        try {
            localStorage.removeItem(CONSTANTS.STORAGE_KEYS.GAME_STATE);
            return true;
        } catch (e) {
            console.error('Failed to clear game state:', e);
            return false;
        }
    }
    
    return {
        getDefaultPlayerData,
        getDefaultGameState,
        loadPlayerData,
        savePlayerData,
        loadGameState,
        saveGameState,
        clearGameState
    };
})();