const Storage = (function() {
    const STORAGE_KEY = 'kualan_game_state';
    
    function save(gameState) {
        try {
            const state = JSON.stringify(gameState);
            localStorage.setItem(STORAGE_KEY, state);
        } catch (e) {
            console.error('保存游戏状态失败:', e);
        }
    }
    
    function load() {
        try {
            const state = localStorage.getItem(STORAGE_KEY);
            return state ? JSON.parse(state) : null;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    }
    
    function clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('清除游戏状态失败:', e);
        }
    }
    
    function hasSavedGame() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }
    
    return {
        save,
        load,
        clear,
        hasSavedGame
    };
})();