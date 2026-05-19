const Storage = {
    STORAGE_KEY: 'tuwei_game_save',

    save(gameState) {
        try {
            const saveData = {
                version: 1,
                timestamp: Date.now(),
                state: gameState
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;
            const saveData = JSON.parse(data);
            if (saveData.version !== 1) {
                console.warn('存档版本不兼容');
                return null;
            }
            return saveData.state;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    hasSave() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
};
