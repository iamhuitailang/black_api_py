(function(global) {
    'use strict';
    
    const STORAGE_KEY = 'mask_generator_state';
    
    const Storage = {
        save: function(state) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                return true;
            } catch (e) {
                console.error('保存失败:', e);
                return false;
            }
        },
        
        load: function() {
            try {
                const data = localStorage.getItem(STORAGE_KEY);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error('加载失败:', e);
                return null;
            }
        },
        
        clear: function() {
            try {
                localStorage.removeItem(STORAGE_KEY);
                return true;
            } catch (e) {
                console.error('清除失败:', e);
                return false;
            }
        }
    };
    
    global.Storage = Storage;
})(window);