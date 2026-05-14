const Storage = {
    STORAGE_KEY: 'tiegou_game_state',

    saveState(state) {
        try {
            const serialized = JSON.stringify(state);
            localStorage.setItem(this.STORAGE_KEY, serialized);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    loadState() {
        try {
            const serialized = localStorage.getItem(this.STORAGE_KEY);
            if (serialized === null) {
                return null;
            }
            return JSON.parse(serialized);
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },

    clearState() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },

    hasSavedState() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },

    createInitialState() {
        return {
            gameState: 'menu',
            health: 3,
            kills: 0,
            timeRemaining: 30,
            enemies: [],
            captain: {
                x: 100,
                y: 300,
                isAttacking: false,
                attackFrame: 0
            },
            score: 0,
            isPaused: false
        };
    },

    saveGame(game) {
        const state = {
            gameState: game.gameState,
            health: game.health,
            kills: game.kills,
            timeRemaining: game.timeRemaining,
            enemies: game.enemies.map(e => ({
                x: e.x,
                y: e.y,
                type: e.type,
                speed: e.speed,
                width: e.width,
                height: e.height
            })),
            captain: {
                x: game.captain.x,
                y: game.captain.y,
                isAttacking: game.captain.isAttacking,
                attackFrame: game.captain.attackFrame
            },
            score: game.score,
            isPaused: game.isPaused
        };
        return this.saveState(state);
    },

    restoreGame(game, state) {
        if (!state) return false;
        
        game.gameState = state.gameState || 'playing';
        game.health = state.health;
        game.kills = state.kills;
        game.timeRemaining = state.timeRemaining;
        game.score = state.score || 0;
        game.isPaused = state.isPaused || false;

        if (state.captain) {
            game.captain.x = state.captain.x;
            game.captain.y = state.captain.y;
            game.captain.isAttacking = state.captain.isAttacking;
            game.captain.attackFrame = state.captain.attackFrame;
        }

        if (state.enemies && Array.isArray(state.enemies)) {
            game.enemies = state.enemies.map(eData => {
                const enemy = new Enemy(eData.x, eData.y, eData.type);
                enemy.speed = eData.speed;
                enemy.width = eData.width;
                enemy.height = eData.height;
                return enemy;
            });
        }

        return true;
    }
};