const Storage = {
    save(data) {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('保存游戏数据失败:', e);
        }
    },
    
    load() {
        try {
            const data = localStorage.getItem(CONFIG.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载游戏数据失败:', e);
            return null;
        }
    },
    
    clear() {
        try {
            localStorage.removeItem(CONFIG.storageKey);
        } catch (e) {
            console.error('清除游戏数据失败:', e);
        }
    }
};
