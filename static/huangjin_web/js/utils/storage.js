const Storage = {
    TOKEN_KEY: 'huangjin_token',
    USER_KEY: 'huangjin_user',
    ROUTE_KEY: 'huangjin_route',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || '';
    },

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    getUser() {
        const data = localStorage.getItem(this.USER_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    removeUser() {
        localStorage.removeItem(this.USER_KEY);
    },

    getRoute() {
        return localStorage.getItem(this.ROUTE_KEY) || 'home';
    },

    setRoute(route) {
        localStorage.setItem(this.ROUTE_KEY, route);
    },

    clear() {
        this.removeToken();
        this.removeUser();
    }
};
