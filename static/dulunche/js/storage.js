const Storage = {
    saveState(state) {
        try {
            const stateData = JSON.stringify(state);
            localStorage.setItem(CONFIG.STORAGE_KEY, stateData);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    loadState() {
        try {
            const stateData = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (stateData) {
                return JSON.parse(stateData);
            }
        } catch (e) {
            console.error('加载游戏状态失败:', e);
        }
        return null;
    },

    hasSavedState() {
        return localStorage.getItem(CONFIG.STORAGE_KEY) !== null;
    },

    clearState() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
};
