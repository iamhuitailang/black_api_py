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
        return this.get('ex_web_token');
    },
    
    setToken: function(token) {
        this.set('ex_web_token', token);
    },
    
    removeToken: function() {
        this.remove('ex_web_token');
    },
    
    getUser: function() {
        return this.get('ex_web_user');
    },
    
    setUser: function(user) {
        this.set('ex_web_user', user);
    },
    
    removeUser: function() {
        this.remove('ex_web_user');
    },
    
    getSearchHistory: function() {
        return this.get('ex_web_search_history') || [];
    },
    
    addSearchHistory: function(keyword) {
        var history = this.getSearchHistory();
        var index = history.indexOf(keyword);
        if (index > -1) {
            history.splice(index, 1);
        }
        history.unshift(keyword);
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        this.set('ex_web_search_history', history);
    },
    
    clearSearchHistory: function() {
        this.remove('ex_web_search_history');
    }
};
