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
        return this.get('token');
    },
    
    setToken(token) {
        this.set('token', token);
    },
    
    removeToken() {
        this.remove('token');
    },
    
    getUser() {
        return this.get('user');
    },
    
    setUser(user) {
        this.set('user', user);
    },
    
    removeUser() {
        this.remove('user');
    }
};
