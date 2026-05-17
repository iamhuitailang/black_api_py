const Storage = {
    STORAGE_KEY: 'potion_master_save',

    save: function(gameState) {
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

    load: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;
            
            const saveData = JSON.parse(data);
            
            if (!saveData.version || saveData.version !== 1) {
                console.warn('存档版本不兼容，丢弃旧存档');
                localStorage.removeItem(this.STORAGE_KEY);
                return null;
            }
            
            return saveData.state;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    },

    clear: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },

    hasSave: function() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
};
