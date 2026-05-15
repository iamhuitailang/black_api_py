const Storage = (() => {
    const STORAGE_KEY = 'feather_fall_game';
    
    const defaultState = {
        currentLevel: 1,
        maxUnlockedLevel: 1,
        selectedFeather: 'white',
        unlockedFeathers: ['white'],
        levelScores: {},
        gameInProgress: false,
        savedGameState: null
    };

    const getState = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return { ...defaultState, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
        return { ...defaultState };
    };

    const saveState = (state) => {
        try {
            const currentState = getState();
            const newState = { ...currentState, ...state };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    };

    const saveGameProgress = (gameState) => {
        return saveState({
            gameInProgress: true,
            savedGameState: gameState
        });
    };

    const clearGameProgress = () => {
        return saveState({
            gameInProgress: false,
            savedGameState: null
        });
    };

    const unlockLevel = (level) => {
        const state = getState();
        if (level > state.maxUnlockedLevel) {
            return saveState({ maxUnlockedLevel: level });
        }
        return false;
    };

    const saveLevelScore = (level, score, stars) => {
        const state = getState();
        const levelScores = { ...state.levelScores };
        levelScores[level] = { score, stars };
        return saveState({ levelScores });
    };

    const unlockFeather = (featherId) => {
        const state = getState();
        if (!state.unlockedFeathers.includes(featherId)) {
            const unlockedFeathers = [...state.unlockedFeathers, featherId];
            return saveState({ unlockedFeathers });
        }
        return false;
    };

    const selectFeather = (featherId) => {
        return saveState({ selectedFeather: featherId });
    };

    const setCurrentLevel = (level) => {
        return saveState({ currentLevel: level });
    };

    return {
        getState,
        saveState,
        saveGameProgress,
        clearGameProgress,
        unlockLevel,
        saveLevelScore,
        unlockFeather,
        selectFeather,
        setCurrentLevel
    };
})();