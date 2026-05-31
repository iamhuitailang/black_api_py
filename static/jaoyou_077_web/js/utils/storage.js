const Storage = {
    getToken() {
        return localStorage.getItem('jaoyou_token');
    },
    setToken(token) {
        localStorage.setItem('jaoyou_token', token);
    },
    removeToken() {
        localStorage.removeItem('jaoyou_token');
    },
    getUser() {
        const user = localStorage.getItem('jaoyou_user');
        return user ? JSON.parse(user) : null;
    },
    setUser(user) {
        localStorage.setItem('jaoyou_user', JSON.stringify(user));
    },
    removeUser() {
        localStorage.removeItem('jaoyou_user');
    },
    clear() {
        this.removeToken();
        this.removeUser();
    }
};
