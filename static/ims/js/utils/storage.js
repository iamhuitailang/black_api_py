const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) {
                return defaultValue;
            }
            return JSON.parse(value);
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },
    
    setToken(token) {
        return this.set('ims_token', token);
    },
    
    getToken() {
        return this.get('ims_token', '');
    },
    
    removeToken() {
        return this.remove('ims_token');
    },
    
    setUser(user) {
        return this.set('ims_user', user);
    },
    
    getUser() {
        return this.get('ims_user', null);
    },
    
    removeUser() {
        return this.remove('ims_user');
    }
};
