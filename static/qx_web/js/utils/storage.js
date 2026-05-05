const Storage = {
    setToken: function(token) {
        localStorage.setItem('qx_token', token);
    },
    getToken: function() {
        return localStorage.getItem('qx_token');
    },
    removeToken: function() {
        localStorage.removeItem('qx_token');
    },
    setUser: function(user) {
        localStorage.setItem('qx_user', JSON.stringify(user));
    },
    getUser: function() {
        const user = localStorage.getItem('qx_user');
        return user ? JSON.parse(user) : null;
    },
    removeUser: function() {
        localStorage.removeItem('qx_user');
    },
    clear: function() {
        this.removeToken();
        this.removeUser();
    }
};
