const Storage = {
    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
    },

    get(key) {
        const value = localStorage.getItem(key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    },

    getToken() {
        return this.get('dota_user_token');
    },

    setToken(token) {
        this.set('dota_user_token', token);
    },

    removeToken() {
        this.remove('dota_user_token');
    },

    getUser() {
        return this.get('dota_user');
    },

    setUser(user) {
        this.set('dota_user', user);
    },

    removeUser() {
        this.remove('dota_user');
    },

    getCurrentHero() {
        return this.get('dota_current_hero');
    },

    setCurrentHero(hero) {
        this.set('dota_current_hero', hero);
    },

    removeCurrentHero() {
        this.remove('dota_current_hero');
    }
};
