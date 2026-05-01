(function() {
    'use strict';

    window.Storage = {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Storage set error:', e);
            }
        },

        get: function(key, defaultValue) {
            try {
                var value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },

        remove: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Storage remove error:', e);
            }
        },

        clear: function() {
            try {
                localStorage.clear();
            } catch (e) {
                console.error('Storage clear error:', e);
            }
        },

        getToken: function() {
            return this.get('tielu_token', '');
        },

        setToken: function(token) {
            this.set('tielu_token', token);
        },

        removeToken: function() {
            this.remove('tielu_token');
        },

        getUser: function() {
            return this.get('tielu_user', null);
        },

        setUser: function(user) {
            this.set('tielu_user', user);
        },

        removeUser: function() {
            this.remove('tielu_user');
        }
    };
})();
