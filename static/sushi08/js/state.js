
window.GameState = (function() {
    let state = null;
    let listeners = [];

    const ORDER_TIME_LIMIT = 30000;

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function notify() {
        listeners.forEach(listener => listener(state));
    }

    return {
        init: function(loadedState) {
            state = deepClone(loadedState);
            if (!state.gameActive) {
                this.resetCurrentGame();
            }
            return state;
        },

        getState: function() {
            return deepClone(state);
        },

        subscribe: function(listener) {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(l => l !== listener);
            };
        },

        update: function(changes) {
            state = { ...state, ...changes };
            notify();
            StorageManager.saveGame(state);
            return state;
        },

        resetCurrentGame: function() {
            state.currentScore = 0;
            state.combo = 0;
            state.lives = 3;
            state.selectedIngredients = [];
            state.currentOrder = null;
            state.orderStartTime = 0;
            state.gameActive = false;
            state.totalOrders = 0;
            state.ordersCompleted = 0;
            notify();
            StorageManager.saveGame(state);
        },

        startGame: function() {
            this.resetCurrentGame();
            state.gameActive = true;
            notify();
            StorageManager.saveGame(state);
        },

        addScore: function(points) {
            const previousTotal = state.totalScore;
            state.currentScore += points;
            state.totalScore += points;
            state.highScore = Math.max(state.highScore, state.totalScore);
            
            const unlocks = SushiData.getUnlocks(previousTotal, state.totalScore);
            
            notify();
            StorageManager.saveGame(state);
            return unlocks;
        },

        addCombo: function() {
            state.combo++;
            state.maxCombo = Math.max(state.maxCombo, state.combo);
            notify();
            StorageManager.saveGame(state);
            return state.combo;
        },

        resetCombo: function() {
            state.combo = 0;
            notify();
            StorageManager.saveGame(state);
        },

        loseLife: function() {
            state.lives = Math.max(0, state.lives - 1);
            notify();
            StorageManager.saveGame(state);
            return state.lives;
        },

        completeOrder: function() {
            state.ordersCompleted++;
            state.totalOrders++;
            notify();
            StorageManager.saveGame(state);
        },

        addSelectedIngredient: function(ingredient) {
            if (!state.selectedIngredients.find(i => i.id === ingredient.id)) {
                state.selectedIngredients.push(ingredient);
                notify();
                StorageManager.saveGame(state);
            }
        },

        removeSelectedIngredient: function(ingredientId) {
            state.selectedIngredients = state.selectedIngredients.filter(i => i.id !== ingredientId);
            notify();
            StorageManager.saveGame(state);
        },

        clearSelectedIngredients: function() {
            state.selectedIngredients = [];
            notify();
            StorageManager.saveGame(state);
        },

        setCurrentOrder: function(order) {
            state.currentOrder = order;
            state.orderStartTime = Date.now();
            notify();
            StorageManager.saveGame(state);
        },

        clearCurrentOrder: function() {
            state.currentOrder = null;
            state.orderStartTime = 0;
            notify();
            StorageManager.saveGame(state);
        },

        getOrderTimeRemaining: function() {
            if (!state.orderStartTime) return ORDER_TIME_LIMIT;
            const elapsed = Date.now() - state.orderStartTime;
            return Math.max(0, ORDER_TIME_LIMIT - elapsed);
        },

        getOrderTimeLimit: function() {
            return ORDER_TIME_LIMIT;
        },

        isGameOver: function() {
            return state.lives <= 0;
        }
    };
})();
