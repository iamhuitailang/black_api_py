const StorageManager = {
    STORAGE_KEY: 'feidao_game_state',

    save: function(gameState) {
        try {
            const stateToSave = {
                gameStatus: gameState.gameStatus,
                currentScene: gameState.currentScene,
                currentLevel: gameState.currentLevel,
                score: gameState.score,
                totalScore: gameState.totalScore,
                highScore: gameState.highScore,
                knivesLeft: gameState.knivesLeft,
                currentKnifeType: gameState.currentKnifeType,
                throwStrength: gameState.throwStrength,
                angle: gameState.angle,
                power: gameState.power,
                unlockedScenes: gameState.unlockedScenes,
                unlockedKnives: gameState.unlockedKnives,
                round: gameState.round,
                targetHits: gameState.targetHits,
                targets: gameState.targets.map(t => ({
                    x: t.x,
                    y: t.y,
                    radius: t.radius,
                    state: t.state,
                    angle: t.angle,
                    hits: t.hits
                })),
                obstacles: gameState.obstacles.map(o => ({
                    x: o.x,
                    y: o.y,
                    width: o.width,
                    height: o.height
                }))
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    load: function() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('加载游戏状态失败:', e);
        }
        return null;
    },

    clear: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },

    hasSavedGame: function() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    },

    saveHighScore: function(score) {
        try {
            localStorage.setItem('feidao_high_score', String(score));
        } catch (e) {
            console.error('保存最高分失败:', e);
        }
    },

    loadHighScore: function() {
        try {
            const saved = localStorage.getItem('feidao_high_score');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
