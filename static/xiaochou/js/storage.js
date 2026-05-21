const Storage = {
    saveGameState(state) {
        try {
            const data = {
                timestamp: Date.now(),
                ...state
            };
            localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    loadGameState() {
        try {
            const data = localStorage.getItem(CONSTANTS.STORAGE_KEY);
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000;
            
            if (now - parsed.timestamp > maxAge) {
                this.clearGameState();
                return null;
            }
            
            return parsed;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },

    clearGameState() {
        try {
            localStorage.removeItem(CONSTANTS.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },

    saveHighScore(mode, score, height) {
        try {
            const key = `${CONSTANTS.STORAGE_KEY}_highscore_${mode}`;
            const current = this.getHighScore(mode);
            
            if (score > current.score) {
                localStorage.setItem(key, JSON.stringify({
                    score,
                    height,
                    date: new Date().toISOString()
                }));
                return true;
            }
            return false;
        } catch (e) {
            console.error('保存最高分失败:', e);
            return false;
        }
    },

    getHighScore(mode) {
        try {
            const key = `${CONSTANTS.STORAGE_KEY}_highscore_${mode}`;
            const data = localStorage.getItem(key);
            if (!data) return { score: 0, height: 0 };
            return JSON.parse(data);
        } catch (e) {
            console.error('获取最高分失败:', e);
            return { score: 0, height: 0 };
        }
    },

    getAllHighScores() {
        return {
            endless: this.getHighScore('endless'),
            timed: this.getHighScore('timed'),
            obstacle: this.getHighScore('obstacle')
        };
    }
};