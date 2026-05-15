const Storage = {
    STORAGE_KEY: 'hema_game_state',

    save(state) {
        try {
            const data = JSON.stringify(state);
            localStorage.setItem(this.STORAGE_KEY, data);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    saveHighScore(score) {
        try {
            const highScore = this.getHighScore();
            if (score > highScore) {
                localStorage.setItem('hema_high_score', score.toString());
                return true;
            }
            return false;
        } catch (e) {
            console.error('保存最高分失败:', e);
            return false;
        }
    },

    getHighScore() {
        try {
            const score = localStorage.getItem('hema_high_score');
            return score ? parseInt(score) : 0;
        } catch (e) {
            return 0;
        }
    }
};