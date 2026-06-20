const Storage = {
    TOKEN_KEY: 'journal_token',
    USER_KEY: 'journal_user',
    ROLE_KEY: 'journal_role',

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || '';
    },
    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },
    getUser() {
        const data = localStorage.getItem(this.USER_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },
    removeUser() {
        localStorage.removeItem(this.USER_KEY);
    },

    setRoleInfo(info) {
        localStorage.setItem(this.ROLE_KEY, JSON.stringify(info));
    },
    getRoleInfo() {
        const data = localStorage.getItem(this.ROLE_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },
    removeRoleInfo() {
        localStorage.removeItem(this.ROLE_KEY);
    },

    clear() {
        this.removeToken();
        this.removeUser();
        this.removeRoleInfo();
    }
};
