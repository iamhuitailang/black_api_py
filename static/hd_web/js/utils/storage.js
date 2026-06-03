(function() {
const HdStorage = {
    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(`hd_${key}`, value);
    },

    get(key) {
        const value = localStorage.getItem(`hd_${key}`);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    remove(key) {
        localStorage.removeItem(`hd_${key}`);
    },

    clear() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('hd_')) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
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

    getBattleState() {
        return this.get('battle_state');
    },

    setBattleState(state) {
        this.set('battle_state', state);
    },

    removeBattleState() {
        this.remove('battle_state');
    }
};

window.HdStorage = HdStorage;
})();
