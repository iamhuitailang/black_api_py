const Storage = {
    STORAGE_KEY: 'chaijia_game_state',
    
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
        } catch (e) {
            console.error('加载游戏状态失败:', e);
        }
        return null;
    },
    
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },
    
    hasSavedGame() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
};