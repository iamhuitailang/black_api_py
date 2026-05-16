const Storage = {
    saveState(state) {
        try {
            const stateToSave = {
                ...state,
                timestamp: Date.now()
            };
            localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(stateToSave));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },
    
    loadState() {
        try {
            const saved = localStorage.getItem(CONSTANTS.STORAGE_KEY);
            if (!saved) return null;
            
            const state = JSON.parse(saved);
            const now = Date.now();
            if (now - state.timestamp > 24 * 60 * 60 * 1000) {
                this.clearState();
                return null;
            }
            
            return state;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },
    
    clearState() {
        try {
            localStorage.removeItem(CONSTANTS.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },
    
    hasSavedState() {
        return localStorage.getItem(CONSTANTS.STORAGE_KEY) !== null;
    }
};