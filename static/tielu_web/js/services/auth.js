(function() {
    'use strict';

    window.Auth = {
        isLoggedIn: function() {
            var token = Storage.getToken();
            return !!token;
        },

        getUser: function() {
            return Storage.getUser();
        },

        setUser: function(user) {
            Storage.setUser(user);
        },

        getToken: function() {
            return Storage.getToken();
        },

        setToken: function(token) {
            Storage.setToken(token);
        },

        login: function(username, password) {
            Utils.showLoading();
            return API.auth.login(username, password)
                .then(function(result) {
                    Utils.hideLoading();
                    if (result.code === 0) {
                        var data = result.data;
                        Auth.setToken(data.token);
                        Auth.setUser(data.user);
                        return data;
                    } else {
                        throw new Error(result.msg);
                    }
                })
                .catch(function(error) {
                    Utils.hideLoading();
                    throw error;
                });
        },

        register: function(username, password) {
            Utils.showLoading();
            return API.auth.register(username, password)
                .then(function(result) {
                    Utils.hideLoading();
                    if (result.code === 0) {
                        var data = result.data;
                        Auth.setToken(data.token);
                        Auth.setUser(data.user);
                        return data;
                    } else {
                        throw new Error(result.msg);
                    }
                })
                .catch(function(error) {
                    Utils.hideLoading();
                    throw error;
                });
        },

        logout: function() {
            var token = Storage.getToken();
            if (token) {
                API.auth.logout().catch(function(e) {
                    console.error('Logout error:', e);
                });
            }
            Storage.removeToken();
            Storage.removeUser();
        },

        refreshUser: function() {
            if (!Auth.isLoggedIn()) {
                return Promise.resolve(null);
            }
            return API.auth.getCurrent()
                .then(function(result) {
                    if (result.code === 0) {
                        Auth.setUser(result.data);
                        return result.data;
                    }
                    return null;
                })
                .catch(function() {
                    return null;
                });
        },

        updateGold: function(gold) {
            var user = Auth.getUser();
            if (user) {
                user.gold = gold;
                Auth.setUser(user);
            }
        },

        updateLevel: function(level, exp) {
            var user = Auth.getUser();
            if (user) {
                user.level = level;
                user.exp = exp;
                Auth.setUser(user);
            }
        }
    };
})();
