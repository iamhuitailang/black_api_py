export const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('存储错误:', e);
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('读取错误:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('删除错误:', e);
        }
    },

    clear() {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('清空错误:', e);
        }
    }
};

export const gameStorage = {
    getGameState() {
        return storage.get('gameState', {});
    },

    setGameState(state) {
        storage.set('gameState', state);
    },

    getUser() {
        return storage.get('user', null);
    },

    setUser(user) {
        storage.set('user', user);
    },

    clearUser() {
        storage.remove('user');
        storage.remove('token');
    }
};
