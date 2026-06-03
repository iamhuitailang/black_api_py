const DwAuth = {
    _listeners: [],

    saveToken(token) {
        localStorage.setItem('dw_token', token);
    },

    getToken() {
        return localStorage.getItem('dw_token');
    },

    removeToken() {
        localStorage.removeItem('dw_token');
    },

    saveUser(user) {
        localStorage.setItem('dw_user', JSON.stringify(user));
    },

    getUser() {
        const data = localStorage.getItem('dw_user');
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    },

    removeUser() {
        localStorage.removeItem('dw_user');
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    onAuthChange(callback) {
        this._listeners.push(callback);
    },

    notifyAuthChange(loggedIn) {
        this._listeners.forEach(cb => {
            try { cb(loggedIn); } catch (e) { console.error(e); }
        });
    },

    async login(username, password) {
        const result = await DwApi.auth.login({ username, password });
        if (result.code === 0) {
            this.saveToken(result.data.token);
            this.saveUser(result.data.user);
            this.notifyAuthChange(true);
        }
        return result;
    },

    async register(username, password, nickname) {
        const result = await DwApi.auth.register({ username, password, nickname });
        if (result.code === 0) {
            this.saveToken(result.data.token);
            this.saveUser(result.data.user);
            this.notifyAuthChange(true);
        }
        return result;
    },

    async logout() {
        try {
            await DwApi.auth.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        this.removeToken();
        this.removeUser();
        this.notifyAuthChange(false);
    }
};
