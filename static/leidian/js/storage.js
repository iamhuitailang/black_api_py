const Storage = (() => {
    const STORAGE_KEY = 'leidian_game_state';
    
    const save = (gameState) => {
        try {
            const serialized = JSON.stringify(gameState);
            localStorage.setItem(STORAGE_KEY, serialized);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    };
    
    const load = () => {
        try {
            const serialized = localStorage.getItem(STORAGE_KEY);
            if (!serialized) return null;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    };
    
    const clear = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    };
    
    const hasSavedGame = () => {
        return localStorage.getItem(STORAGE_KEY) !== null;
    };
    
    return {
        save,
        load,
        clear,
        hasSavedGame
    };
})();
