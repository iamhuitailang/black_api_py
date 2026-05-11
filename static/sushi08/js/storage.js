
window.StorageManager = (function() {
    const STORAGE_KEY = 'sushi_game_data_v1';
    
    const DEFAULT_STATE = {
        totalScore: 0,
        highScore: 0,
        currentScore: 0,
        combo: 0,
        maxCombo: 0,
        ordersCompleted: 0,
        totalOrders: 0,
        lives: 3,
        level: 1,
        selectedIngredients: [],
        currentOrder: null,
        orderStartTime: 0,
        gameActive: false
    };

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    return {
        saveGame: function(state) {
            try {
                const dataToSave = {
                    totalScore: state.totalScore || 0,
                    highScore: state.highScore || 0,
                    currentScore: state.currentScore || 0,
                    combo: state.combo || 0,
                    maxCombo: state.maxCombo || 0,
                    ordersCompleted: state.ordersCompleted || 0,
                    totalOrders: state.totalOrders || 0,
                    lives: state.lives || 3,
                    level: state.level || 1,
                    selectedIngredients: state.selectedIngredients || [],
                    currentOrder: state.currentOrder || null,
                    orderStartTime: state.orderStartTime || 0,
                    gameActive: state.gameActive || false,
                    lastSaved: Date.now()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
                return true;
            } catch (e) {
                console.error('Failed to save game:', e);
                return false;
            }
        },

        loadGame: function() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    return { ...deepClone(DEFAULT_STATE), ...parsed };
                }
            } catch (e) {
                console.error('Failed to load game:', e);
            }
            return deepClone(DEFAULT_STATE);
        },

        resetGame: function() {
            try {
                localStorage.removeItem(STORAGE_KEY);
                return true;
            } catch (e) {
                console.error('Failed to reset game:', e);
                return false;
            }
        },

        hasSavedGame: function() {
            try {
                return localStorage.getItem(STORAGE_KEY) !== null;
            } catch (e) {
                return false;
            }
        }
    };
})();
