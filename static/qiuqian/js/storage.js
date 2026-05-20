const Storage = {
    save(data) {
        try {
            const saveData = JSON.stringify(data);
            localStorage.setItem(CONFIG.STORAGE_KEY, saveData);
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },
    
    load() {
        try {
            const saveData = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saveData) {
                return JSON.parse(saveData);
            }
        } catch (e) {
            console.error('加载游戏失败:', e);
        }
        return null;
    },
    
    clear() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },
    
    hasSave() {
        return localStorage.getItem(CONFIG.STORAGE_KEY) !== null;
    }
};
