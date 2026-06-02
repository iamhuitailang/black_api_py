const Auth = {
    async login(username, password) {
        const result = await API.user.login({ username, password });
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data.user);
            Storage.setToken(result.data.token);
        }
        return result;
    },

    async register(username, password, nickname = '') {
        const result = await API.user.register({ username, password, nickname });
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data.user);
            Storage.setToken(result.data.token);
        }
        return result;
    },

    async logout() {
        await API.user.logout();
        Storage.removeUser();
        Storage.removeToken();
    },

    async adminLogin(username, password) {
        const result = await API.admin.login({ username, password });
        if (result.code === 0 && result.data) {
            Storage.setAdmin(result.data.admin);
            Storage.setAdminToken(result.data.token);
        }
        return result;
    },

    async adminLogout() {
        await API.admin.logout();
        Storage.removeAdmin();
        Storage.removeAdminToken();
    },

    getUser() {
        return Storage.getUser();
    },

    getAdmin() {
        return Storage.getAdmin();
    },

    isLoggedIn() {
        return !!Storage.getUser() && !!Storage.getToken();
    },

    isAdminLoggedIn() {
        return !!Storage.getAdmin() && !!Storage.getAdminToken();
    },

    async refreshUser() {
        const result = await API.user.getCurrent();
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
            return result.data;
        }
        return null;
    },

    async refreshAdmin() {
        const result = await API.admin.getCurrent();
        if (result.code === 0 && result.data) {
            Storage.setAdmin(result.data);
            return result.data;
        }
        return null;
    }
};
