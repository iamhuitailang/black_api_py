const Storage = {
    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem('meng_' + key, value);
    },

    get(key) {
        const value = localStorage.getItem('meng_' + key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    remove(key) {
        localStorage.removeItem('meng_' + key);
    },

    clear() {
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('meng_')) {
                localStorage.removeItem(k);
            }
        });
    },

    getToken() {
        return this.get('user_token');
    },

    setToken(token) {
        this.set('user_token', token);
    },

    removeToken() {
        this.remove('user_token');
    },

    getUser() {
        return this.get('user');
    },

    setUser(user) {
        this.set('user', user);
    },

    removeUser() {
        this.remove('user');
    },

    getGameState() {
        return this.get('game_state');
    },

    setGameState(state) {
        this.set('game_state', state);
    },

    removeGameState() {
        this.remove('game_state');
    },

    getDreamInventory() {
        return this.get('dream_inventory') || [];
    },

    setDreamInventory(inventory) {
        this.set('dream_inventory', inventory);
    },

    getSettings() {
        return this.get('settings') || {};
    },

    setSettings(settings) {
        this.set('settings', settings);
    }
};

window.Storage = Storage;
