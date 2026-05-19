const Storage = {
    STORAGE_KEY: 'kungfu_game_state',

    save(gameState) {
        try {
            const data = JSON.stringify(gameState);
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
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },

    hasSavedGame() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
};
