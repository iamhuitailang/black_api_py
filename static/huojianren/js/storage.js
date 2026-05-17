const Storage = {
    save(data) {
        try {
            const saveData = JSON.stringify(data);
            localStorage.setItem(STORAGE_KEY, saveData);
            return true;
        } catch (e) {
            console.error('保存游戏数据失败:', e);
            return false;
        }
    },

    load() {
        try {
            const saveData = localStorage.getItem(STORAGE_KEY);
            if (saveData) {
                return JSON.parse(saveData);
            }
            return null;
        } catch (e) {
            console.error('加载游戏数据失败:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏数据失败:', e);
            return false;
        }
    },

    hasSave() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }
};
