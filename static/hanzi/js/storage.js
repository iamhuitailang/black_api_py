const StorageManager = {
    STORAGE_KEY: 'hanzi_duel_game_state',
    
    save(state) {
        try {
            const serialized = JSON.stringify(state);
            localStorage.setItem(this.STORAGE_KEY, serialized);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },
    
    load() {
        try {
            const serialized = localStorage.getItem(this.STORAGE_KEY);
            if (!serialized) return null;
            return JSON.parse(serialized);
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
    
    hasSavedState() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
};
