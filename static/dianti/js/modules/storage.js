const Storage = (() => {
    const STORAGE_KEY = 'dianti_game_state';
    
    const save = (gameState) => {
        try {
            const data = JSON.stringify(gameState);
            localStorage.setItem(STORAGE_KEY, data);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    };
    
    const load = () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
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