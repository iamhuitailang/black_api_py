const Storage = {
    saveGameState: function(game) {
        try {
            const state = {
                gameState: game.gameState,
                score: game.score,
                combo: game.combo,
                maxCombo: game.maxCombo,
                timeLeft: game.timeLeft,
                energy: game.energy,
                lastSave: Date.now()
            };

            localStorage.setItem(CONSTANTS.STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
            
            if (game.ball) {
                localStorage.setItem(CONSTANTS.STORAGE_KEYS.BALL_STATE, JSON.stringify(game.ball.getState()));
            }
            
            if (game.player) {
                localStorage.setItem(CONSTANTS.STORAGE_KEYS.PLAYER_STATE, JSON.stringify(game.player.getState()));
            }
            
            if (game.defender) {
                localStorage.setItem(CONSTANTS.STORAGE_KEYS.DEFENDER_STATE, JSON.stringify(game.defender.getState()));
            }
            
            if (game.effects && game.effects.length > 0) {
                localStorage.setItem(CONSTANTS.STORAGE_KEYS.EFFECTS, JSON.stringify(game.effects));
            }
            
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    loadGameState: function() {
        try {
            const stateStr = localStorage.getItem(CONSTANTS.STORAGE_KEYS.GAME_STATE);
            if (!stateStr) return null;
            
            const state = JSON.parse(stateStr);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000;
            
            if (state.lastSave && (now - state.lastSave) > maxAge) {
                this.clearGameState();
                return null;
            }
            
            return state;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },

    loadBallState: function() {
        try {
            const ballStr = localStorage.getItem(CONSTANTS.STORAGE_KEYS.BALL_STATE);
            return ballStr ? JSON.parse(ballStr) : null;
        } catch (e) {
            return null;
        }
    },

    loadPlayerState: function() {
        try {
            const playerStr = localStorage.getItem(CONSTANTS.STORAGE_KEYS.PLAYER_STATE);
            return playerStr ? JSON.parse(playerStr) : null;
        } catch (e) {
            return null;
        }
    },

    loadDefenderState: function() {
        try {
            const defenderStr = localStorage.getItem(CONSTANTS.STORAGE_KEYS.DEFENDER_STATE);
            return defenderStr ? JSON.parse(defenderStr) : null;
        } catch (e) {
            return null;
        }
    },

    loadEffects: function() {
        try {
            const effectsStr = localStorage.getItem(CONSTANTS.STORAGE_KEYS.EFFECTS);
            return effectsStr ? JSON.parse(effectsStr) : [];
        } catch (e) {
            return [];
        }
    },

    clearGameState: function() {
        try {
            Object.values(CONSTANTS.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },

    hasSavedGame: function() {
        const state = this.loadGameState();
        return state !== null && 
               (state.gameState === CONSTANTS.GAME_STATES.PLAYING || 
                state.gameState === CONSTANTS.GAME_STATES.PAUSED);
    },

    saveValue: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },

    loadValue: function(key, defaultValue = null) {
        try {
            const valueStr = localStorage.getItem(key);
            return valueStr ? JSON.parse(valueStr) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
