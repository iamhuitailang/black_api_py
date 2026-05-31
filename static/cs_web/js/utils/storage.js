const Storage = {
    TOKEN_KEY: 'cs_token',
    USER_KEY: 'cs_user',
    
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },
    
    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },
    
    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },
    
    getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    },
    
    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },
    
    removeUser() {
        localStorage.removeItem(this.USER_KEY);
    },
    
    get(key) {
        const value = localStorage.getItem(key);
        try {
            return value ? JSON.parse(value) : null;
        } catch (e) {
            return value;
        }
    },
    
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    remove(key) {
        localStorage.removeItem(key);
    },
    
    clear() {
        localStorage.clear();
    }
};

window.Storage = Storage;
