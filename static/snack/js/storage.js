const Storage = {
    STORAGE_KEY: 'snake_game_state',
    HIGH_SCORE_KEY: 'snake_high_score',
    
    saveGameState: function(gameState) {
        try {
            const stateToSave = {
                timestamp: Date.now(),
                gameState: gameState
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    },
    
    loadGameState: function() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const maxAge = 24 * 60 * 60 * 1000;
                if (Date.now() - parsed.timestamp < maxAge) {
                    return parsed.gameState;
                }
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
        return null;
    },
    
    clearGameState: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear game state:', e);
        }
    },
    
    saveHighScore: function(score) {
        try {
            const currentHigh = this.getHighScore();
            if (score > currentHigh) {
                localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
                return true;
            }
        } catch (e) {
            console.error('Failed to save high score:', e);
        }
        return false;
    },
    
    getHighScore: function() {
        try {
            const saved = localStorage.getItem(this.HIGH_SCORE_KEY);
            if (saved) {
                return parseInt(saved, 10);
            }
        } catch (e) {
            console.error('Failed to get high score:', e);
        }
        return 0;
    },
    
    getStateForSerialization: function(game) {
        return {
            gridWidth: game.gridWidth,
            gridHeight: game.gridHeight,
            score: game.score,
            gameStatus: game.gameStatus,
            playerSnake: game.playerSnake ? game.playerSnake.toJSON() : null,
            aiSnakes: game.aiSnakes.map(snake => snake.toJSON()),
            food: game.food,
            foodCount: game.foodCount
        };
    },
    
    restoreStateFromSerialization: function(serializedState, game) {
        if (!serializedState) return false;
        
        try {
            game.gridWidth = serializedState.gridWidth;
            game.gridHeight = serializedState.gridHeight;
            game.score = serializedState.score;
            game.gameStatus = serializedState.gameStatus;
            game.food = serializedState.food;
            game.foodCount = serializedState.foodCount;
            
            if (serializedState.playerSnake) {
                game.playerSnake = Snake.fromJSON(serializedState.playerSnake, false);
            }
            
            game.aiSnakes = serializedState.aiSnakes.map(snakeData => 
                Snake.fromJSON(snakeData, true)
            );
            
            return true;
        } catch (e) {
            console.error('Failed to restore state:', e);
            return false;
        }
    }
};
