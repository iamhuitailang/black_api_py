var Storage = {
    get: function(key) {
        var value = localStorage.getItem(key);
        if (value === null) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },
    
    set: function(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
    },
    
    remove: function(key) {
        localStorage.removeItem(key);
    },
    
    clear: function() {
        localStorage.clear();
    },
    
    getToken: function() {
        return this.get('ex_admin_token');
    },
    
    setToken: function(token) {
        this.set('ex_admin_token', token);
    },
    
    removeToken: function() {
        this.remove('ex_admin_token');
    },
    
    getUser: function() {
        return this.get('ex_admin_user');
    },
    
    setUser: function(user) {
        this.set('ex_admin_user', user);
    },
    
    removeUser: function() {
        this.remove('ex_admin_user');
    }
};
